'use client'
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import ReactECharts from 'echarts-for-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Pencil, Trash2, CheckCircle2, X, Inbox, AlertTriangle, Share2, Crown,
  Copy, Users, Filter, ChevronRight, Bell, MessageSquare, HandCoins, ListChecks,
  Brain, Mail, Send, Plus,
} from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import SeletorPeriodo from '../../../components/SeletorPeriodo'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { fBRL, FONTE_EXEC, optBarrasV, optVelocimetro, resolverPeriodo, type PeriodoPreset, type Periodo } from '../../../lib/cfoCore'
import { canaisCompartilhamento } from '../../../lib/cfoTextos'
import {
  type ClienteRow, type ContaRow, montarSnapshotsCarteira, type SnapshotCarteira,
  rankingScoreAxiomaCliente, scoreMedioCarteiraAxiomaCliente,
  type ScoreAxiomaCliente, calcularKpisRecebimento, agingCarteiraRecebiveis,
  nomeCriterioScoreCliente, type Idioma3,
} from '../../../lib/clienteIntelHelpers'
import {
  type CobrancaInteracao, type CobrancaCompromisso, type EtapaRegua, CANAIS_REGUA,
  listarInteracoes, criarInteracao, listarCompromissos, criarCompromisso, atualizarStatusCompromisso,
  listarEtapasRegua, salvarEtapaRegua, excluirEtapaRegua, etapasReguaPadrao, etapaAplicavelHoje,
  probabilidadeRecebimentoConta, detectarAlertasCobranca, type AlertaCobranca,
  filaCobrancaPriorizada, gerarParecerCobranca,
} from '../../../lib/cobrancaHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================================================
// TEMA — Esmeralda/Teal Executivo + acabamento dourado champagne (só em
// destaques finos: borda de card premium, ícone de score Elite). Verde/vermelho/
// azul/âmbar continuam com o significado padrão do Axioma (positivo/negativo/
// neutro/atenção) — o tema nunca substitui essas cores de significado.
// ============================================================================
const ESMERALDA = '#059669'
const TEAL = '#0d9488'
const OURO = '#d4af37'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AZUL = '#6ab0ff'
const AMBAR = '#f59e0b'
const CINZA = '#5a7a9a'
const BG_CARD = 'rgba(10,22,40,0.8)'

type CentroCusto = { id: string; nome: string }

const FORMAS_RECEBIMENTO = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Dinheiro', 'Transferência']
const CATEGORIAS = ['Vendas', 'Serviços', 'Mensalidade', 'Consultoria', 'Outros']
const PRIORIDADES = ['baixa', 'normal', 'alta', 'urgente'] as const

type Conta = {
  id: string
  descricao: string
  valor: number
  valor_recebido?: number | null
  valor_desconto?: number | null
  data_vencimento: string
  data_emissao?: string | null
  data_recebimento?: string | null
  competencia?: string | null
  status?: string | null
  cliente_id?: string | null
  forma_recebimento?: string | null
  numero_documento?: string | null
  categoria?: string | null
  parcelas?: number | null
  taxa_juros?: number | null
  taxa_multa?: number | null
  observacoes?: string | null
  centro_custo_id?: string | null
  responsavel?: string | null
  projeto?: string | null
  prioridade?: string | null
  recorrente?: boolean | null
  frequencia_recorrencia?: string | null
  user_id: string
  empresa_id?: string | null
  created_at: string
}

const contaVazia = {
  descricao: '', valor: '', valor_recebido: '', valor_desconto: '',
  data_vencimento: '', data_emissao: '', competencia: '',
  cliente_id: '', forma_recebimento: FORMAS_RECEBIMENTO[0], numero_documento: '',
  categoria: CATEGORIAS[0], parcelas: '1', taxa_juros: '', taxa_multa: '',
  centro_custo_id: '', responsavel: '', projeto: '', prioridade: 'normal',
  recorrente: false, frequencia_recorrencia: 'mensal', observacoes: '',
}

// Colunas novas que ainda podem não existir no Supabase (ver aviso ao Elias no
// relatório de entrega). Se o INSERT/UPDATE falhar com 42703 (coluna inexistente),
// removemos essas 3 chaves e tentamos salvar de novo — não é gambiarra, é
// degradação graciosa documentada até o ALTER TABLE rodar. O resto do cadastro
// nunca fica bloqueado por causa de 3 campos novos.
const COLUNAS_PENDENTES_SQL = ['responsavel', 'prioridade', 'projeto']

export default function ContasReceber() {
  const { idioma } = useLanguage()
  const lang = idioma as Idioma3
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt)

  const [contas, setContas] = useState<Conta[]>([])
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [avisoSchema, setAvisoSchema] = useState(false)

  const [preset, setPreset] = useState<PeriodoPreset>('ultimos_12_meses')
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo('mes_atual'))
  const periodo = resolverPeriodo(preset, personalizado)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)
  const [nc, setNc] = useState({ ...contaVazia })
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')

  const [modalReceber, setModalReceber] = useState(false)
  const [contaReceber, setContaReceber] = useState<Conta | null>(null)
  const [valorReceber, setValorReceber] = useState('')
  const [recebendo, setRecebendo] = useState(false)

  const [shareAberto, setShareAberto] = useState(false)
  const [drillKpi, setDrillKpi] = useState<string | null>(null)
  const [clienteScoreDrill, setClienteScoreDrill] = useState<string | null>(null)

  // ========== FASE 2 — COBRANÇA INTELIGENTE ==========
  const [compromissos, setCompromissos] = useState<CobrancaCompromisso[]>([])
  const [etapasRegua, setEtapasRegua] = useState<EtapaRegua[]>([])
  const [avisoTabelasCobranca, setAvisoTabelasCobranca] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [contaCobranca, setContaCobranca] = useState<Conta | null>(null)
  const [interacoesConta, setInteracoesConta] = useState<CobrancaInteracao[]>([])
  const [carregandoInteracoes, setCarregandoInteracoes] = useState(false)
  const [novoContato, setNovoContato] = useState({ tipo: 'contato' as CobrancaInteracao['tipo'], canal: 'telefone', descricao: '' })
  const [novoCompromisso, setNovoCompromisso] = useState({ tipo: 'promessa' as CobrancaCompromisso['tipo'], valor_compromissado: '', data_compromissada: '', condicoes: '' })
  const [salvandoCobranca, setSalvandoCobranca] = useState(false)

  const [editandoEtapa, setEditandoEtapa] = useState<Partial<EtapaRegua> | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)
    const { data: empresa } = await supabase.from('empresas').select('id').eq('user_id', user.id).maybeSingle()
    setEmpresaId(empresa?.id || null)
    const [{ data: cli }, { data: cc }, { data: ct }, compromissosData, etapasData] = await Promise.all([
      supabase.from('clientes').select('*').eq('user_id', user.id).order('nome'),
      supabase.from('centros_custo').select('id, nome').eq('user_id', user.id).order('nome'),
      supabase.from('contas_receber').select('*').eq('user_id', user.id).order('data_vencimento', { ascending: true }),
      listarCompromissos(),
      listarEtapasRegua(user.id),
    ])
    setClientes((cli as ClienteRow[]) || [])
    setCentrosCusto(cc || [])
    setContas((ct as Conta[]) || [])
    // As 3 tabelas novas da Fase 2 (cobranca_interacoes/compromissos/regua_etapas) só
    // existem depois do Elias rodar o SQL do relatório de entrega — checamos com uma
    // consulta direta (em vez de confiar só no retorno gracioso dos helpers) pra saber
    // se mostramos o aviso, sem quebrar nada do resto da tela enquanto isso.
    const { error: erroTabela } = await supabase.from('cobranca_interacoes').select('id').limit(1)
    setAvisoTabelasCobranca(!!erroTabela && erroTabela.code === '42P01')
    setCompromissos(compromissosData)
    setEtapasRegua(etapasData)
    setLoading(false)
  }

  // ========== MOTOR DE INTELIGÊNCIA — reaproveita 100% clienteIntelHelpers.ts ==========
  // montarSnapshotsCarteira aceita [] normalmente e ainda deriva o estágio "aberto" a
  // partir das contas vencidas. A régua/histórico/promessas de cobrança da Fase 2 vivem
  // aqui mesmo (por conta), diferente da Inadimplência (módulo separado, à parte,
  // registro manual em nível de cliente) — os dois não se sobrepõem.
  const carteira: SnapshotCarteira = useMemo(() => montarSnapshotsCarteira(clientes, contas as ContaRow[], []), [clientes, contas])
  const ranking = useMemo(() => rankingScoreAxiomaCliente(carteira), [carteira])
  const scoreCarteira = scoreMedioCarteiraAxiomaCliente(ranking)
  // KPIs/aging/score refletem o estado ATUAL da carteira (vencido é vencido hoje,
  // independente do período escolhido) — só a grade abaixo é filtrada por período.
  const kpis = useMemo(() => calcularKpisRecebimento(contas as ContaRow[], carteira, ranking), [contas, carteira, ranking])
  const aging = useMemo(() => agingCarteiraRecebiveis(contas as ContaRow[]), [contas])

  const hoje = new Date().toISOString().split('T')[0]

  function calcStatus(total: number, recebido: number, venc?: string) {
    if (recebido >= total && total > 0) return 'recebido'
    if (recebido > 0 && recebido < total) return 'parcial'
    if (venc && venc < hoje) return 'vencido'
    return 'pendente'
  }

  function diasAtraso(venc?: string, status?: string | null) {
    if (!venc || status === 'recebido' || venc >= hoje) return 0
    return Math.floor((new Date(hoje + 'T00:00:00').getTime() - new Date(venc + 'T00:00:00').getTime()) / 86400000)
  }

  function calcularLinha(c: Conta) {
    const dias = diasAtraso(c.data_vencimento, c.status)
    const desconto = Number(c.valor_desconto) || 0
    const saldoBase = Math.max(0, (c.valor || 0) - (c.valor_recebido || 0))
    const multa = dias > 0 && saldoBase > 0 ? saldoBase * ((c.taxa_multa || 0) / 100) : 0
    const juros = dias > 0 && saldoBase > 0 ? saldoBase * ((c.taxa_juros || 0) / 100) * (dias / 30) : 0
    const valorAtualizado = Math.max(0, (c.valor || 0) - desconto + juros + multa)
    const saldo = Math.max(0, valorAtualizado - (c.valor_recebido || 0))
    return { dias, desconto, multa, juros, valorAtualizado, saldo }
  }

  function statusLabel(s?: string | null) {
    if (s === 'recebido') return L('Recebido', 'Received', 'Recibido')
    if (s === 'parcial') return L('Parcial', 'Partial', 'Parcial')
    if (s === 'vencido') return L('Vencido', 'Overdue', 'Vencido')
    return L('A Receber', 'Pending', 'Por Cobrar')
  }
  function statusCor(s?: string | null) {
    if (s === 'recebido') return VERDE
    if (s === 'parcial') return AZUL
    if (s === 'vencido') return VERMELHO
    return AMBAR
  }
  function prioridadeLabel(p?: string | null) {
    return { baixa: L('Baixa', 'Low', 'Baja'), normal: L('Normal', 'Normal', 'Normal'), alta: L('Alta', 'High', 'Alta'), urgente: L('Urgente', 'Urgent', 'Urgente') }[p || 'normal'] || '—'
  }
  function prioridadeCor(p?: string | null) {
    return { baixa: AZUL, normal: CINZA, alta: AMBAR, urgente: VERMELHO }[p || 'normal'] || CINZA
  }
  function nivelScoreLabel(n: ScoreAxiomaCliente['nivel']) {
    return {
      critico: L('Crítico', 'Critical', 'Crítico'), atencao: L('Atenção', 'Attention', 'Atención'),
      bom: L('Bom', 'Good', 'Bueno'), excelente: L('Excelente', 'Excellent', 'Excelente'), elite: 'Elite',
    }[n]
  }
  function nivelScoreCor(n: ScoreAxiomaCliente['nivel']) {
    return { critico: VERMELHO, atencao: AMBAR, bom: VERDE, excelente: VERDE, elite: OURO }[n]
  }
  function nivelPorTotal(total: number): ScoreAxiomaCliente['nivel'] {
    return total < 400 ? 'critico' : total < 600 ? 'atencao' : total < 750 ? 'bom' : total < 900 ? 'excelente' : 'elite'
  }

  const cliente = (id?: string | null) => clientes.find((c) => c.id === id) || null
  const scoreDe = (clienteId?: string | null) => ranking.find((r) => r.s.cliente.id === clienteId)?.score || null

  // ========== CRUD ==========
  function abrirNovo() { setEditando(null); setNc({ ...contaVazia }); setErroSalvar(''); setModalAberto(true) }
  function abrirEdicao(c: Conta) {
    setEditando(c)
    setNc({
      descricao: c.descricao || '', valor: String(c.valor || ''), valor_recebido: String(c.valor_recebido || ''),
      valor_desconto: String(c.valor_desconto || ''), data_vencimento: c.data_vencimento || '',
      data_emissao: c.data_emissao || '', competencia: c.competencia || '',
      cliente_id: c.cliente_id || '', forma_recebimento: c.forma_recebimento || FORMAS_RECEBIMENTO[0],
      numero_documento: c.numero_documento || '', categoria: c.categoria || CATEGORIAS[0],
      parcelas: String(c.parcelas || '1'), taxa_juros: String(c.taxa_juros || ''), taxa_multa: String(c.taxa_multa || ''),
      centro_custo_id: c.centro_custo_id || '', responsavel: c.responsavel || '', projeto: c.projeto || '',
      prioridade: c.prioridade || 'normal', recorrente: !!c.recorrente, frequencia_recorrencia: c.frequencia_recorrencia || 'mensal',
      observacoes: c.observacoes || '',
    })
    setErroSalvar(''); setModalAberto(true)
  }
  function fecharModal() { setModalAberto(false); setEditando(null); setNc({ ...contaVazia }); setErroSalvar('') }

  async function salvar() {
    if (!nc.descricao || !nc.valor || !nc.data_vencimento) return
    setSalvando(true); setErroSalvar('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const userId = user.id
    const total = parseFloat(nc.valor || '0')
    const recebido = parseFloat(nc.valor_recebido || '0')
    const status = calcStatus(total, recebido, nc.data_vencimento)
    const payloadCompleto: any = {
      descricao: nc.descricao, valor: total, valor_recebido: recebido, valor_desconto: parseFloat(nc.valor_desconto || '0'),
      data_vencimento: nc.data_vencimento, data_emissao: nc.data_emissao || null, competencia: nc.competencia || null,
      cliente_id: nc.cliente_id || null, forma_recebimento: nc.forma_recebimento, numero_documento: nc.numero_documento,
      categoria: nc.categoria, parcelas: parseInt(nc.parcelas || '1'), taxa_juros: parseFloat(nc.taxa_juros || '0'),
      taxa_multa: parseFloat(nc.taxa_multa || '0'), centro_custo_id: nc.centro_custo_id || null,
      responsavel: nc.responsavel || null, projeto: nc.projeto || null, prioridade: nc.prioridade,
      recorrente: nc.recorrente, frequencia_recorrencia: nc.recorrente ? nc.frequencia_recorrencia : null,
      observacoes: nc.observacoes, data_recebimento: status === 'recebido' ? new Date().toISOString().split('T')[0] : null,
      status, empresa_id: empresaId,
    }

    async function tentarSalvar(payload: any): Promise<{ error: any }> {
      if (editando) return supabase.from('contas_receber').update(payload).eq('id', editando.id)
      return supabase.from('contas_receber').insert({ ...payload, user_id: userId })
    }

    let { error } = await tentarSalvar(payloadCompleto)
    if (error && error.code === '42703') {
      const payloadReduzido = { ...payloadCompleto }
      COLUNAS_PENDENTES_SQL.forEach((k) => delete payloadReduzido[k])
      const retry = await tentarSalvar(payloadReduzido)
      error = retry.error
      if (!error) setAvisoSchema(true)
    }

    if (error) { setErroSalvar(error.message); setSalvando(false); return }
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('contas_receber').delete().eq('id', id)
    setContas(contas.filter((c) => c.id !== id))
  }

  function abrirReceber(c: Conta) {
    setContaReceber(c)
    const { saldo } = calcularLinha(c)
    setValorReceber(saldo.toFixed(2))
    setModalReceber(true)
  }
  async function confirmarRecebimento() {
    if (!contaReceber) return
    setRecebendo(true)
    const novoRecebido = (contaReceber.valor_recebido || 0) + parseFloat(valorReceber || '0')
    const status = calcStatus(contaReceber.valor, novoRecebido, contaReceber.data_vencimento)
    await supabase.from('contas_receber').update({
      valor_recebido: novoRecebido, status,
      data_recebimento: status === 'recebido' ? new Date().toISOString().split('T')[0] : contaReceber.data_recebimento || null,
    }).eq('id', contaReceber.id)
    setModalReceber(false); setContaReceber(null); setValorReceber(''); setRecebendo(false); carregar()
  }

  // ========== FILTROS DA GRADE (busca + status + período por vencimento) ==========
  const contasFiltradas = useMemo(() => {
    return contas.filter((c) => {
      if (c.data_vencimento < periodo.inicio || c.data_vencimento > periodo.fim) return false
      if (filtroStatus !== 'todos' && (c.status || 'pendente') !== filtroStatus) return false
      if (!busca) return true
      const cliNome = cliente(c.cliente_id)?.nome || ''
      const alvo = `${c.descricao} ${cliNome} ${c.numero_documento || ''} ${c.responsavel || ''} ${c.projeto || ''}`.toLowerCase()
      return alvo.includes(busca.toLowerCase())
    }).sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
  }, [contas, busca, filtroStatus, periodo, clientes])

  // ========== PDF ==========
  const exportarPDF = async () => {
    setExportando(true)
    try {
      gerarPdfTabela({
        titulo: L('Contas a Receber', 'Accounts Receivable', 'Cuentas por Cobrar'),
        subtitulo: L('Central de Recebimentos', 'Receivables Center', 'Centro de Cobros'),
        colunas: [
          { header: L('Cliente', 'Client', 'Cliente'), key: 'cli', width: 3 },
          { header: L('Documento', 'Document', 'Documento'), key: 'doc', width: 2 },
          { header: L('Vencimento', 'Due', 'Vencimiento'), key: 'venc', width: 2 },
          { header: L('Status', 'Status', 'Estado'), key: 'status', width: 2 },
          { header: L('Valor Atualizado', 'Updated Value', 'Valor Actualizado'), key: 'atual', width: 2, align: 'right' },
          { header: L('Recebido', 'Received', 'Recibido'), key: 'rec', width: 2, align: 'right' },
          { header: L('Saldo', 'Balance', 'Saldo'), key: 'saldo', width: 2, align: 'right' },
        ],
        linhas: contasFiltradas.map((c) => {
          const { valorAtualizado, saldo } = calcularLinha(c)
          return {
            cli: cliente(c.cliente_id)?.nome || '-', doc: c.numero_documento || '-',
            venc: c.data_vencimento ? new Date(c.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
            status: statusLabel(c.status), atual: fBRL(valorAtualizado), rec: fBRL(c.valor_recebido || 0), saldo: fBRL(saldo),
          }
        }),
        resumo: [
          { label: L('Total a Receber', 'Total Receivable', 'Total por Cobrar'), valor: fBRL(kpis.valorTotalAReceber) },
          { label: L('Vencido', 'Overdue', 'Vencido'), valor: fBRL(kpis.valorVencido) },
          { label: L('Recebido no Mês', 'Received this Month', 'Recibido este Mes'), valor: fBRL(kpis.recebidoNoMes) },
          { label: L('Score Médio da Carteira', 'Avg. Portfolio Score', 'Score Promedio de Cartera'), valor: kpis.scoreMedioCarteira != null ? `${kpis.scoreMedioCarteira}/1000` : '—' },
        ],
        nomeArquivo: `axioma-contas-receber-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const textoCompartilhar = `${L('Central de Recebimentos Axioma', 'Axioma Receivables Center', 'Centro de Cobros Axioma')}: ${L('a receber', 'receivable', 'por cobrar')} ${fBRL(kpis.valorTotalAReceber)}, ${L('vencido', 'overdue', 'vencido')} ${fBRL(kpis.valorVencido)}.`
  const canais = canaisCompartilhamento(textoCompartilhar, L('Contas a Receber — Axioma', 'Accounts Receivable — Axioma', 'Cuentas por Cobrar — Axioma'))

  // ========== KPIs (17, com estado vazio honesto) ==========
  type KpiTile = { key: string; label: string; valor: string; cor: string; vazio: boolean; drillable: boolean }
  const semContas = contas.length === 0
  const kpiTiles: KpiTile[] = [
    { key: 'totalAReceber', label: L('Valor Total a Receber', 'Total Receivable', 'Total por Cobrar'), valor: fBRL(kpis.valorTotalAReceber), cor: ESMERALDA, vazio: semContas, drillable: true },
    { key: 'recebidoMes', label: L('Recebido no Mês', 'Received this Month', 'Recibido este Mes'), valor: fBRL(kpis.recebidoNoMes), cor: VERDE, vazio: semContas, drillable: true },
    { key: 'recebidoAno', label: L('Recebido no Ano', 'Received this Year', 'Recibido este Año'), valor: fBRL(kpis.recebidoNoAno), cor: VERDE, vazio: semContas, drillable: true },
    { key: 'vencido', label: L('Vencido', 'Overdue', 'Vencido'), valor: fBRL(kpis.valorVencido), cor: VERMELHO, vazio: semContas, drillable: true },
    { key: 'aVencer', label: L('A Vencer', 'Not Due Yet', 'Por Vencer'), valor: fBRL(kpis.valorAVencer), cor: AZUL, vazio: semContas, drillable: true },
    { key: 'indiceInadimplencia', label: L('Índice de Inadimplência', 'Default Rate', 'Índice de Morosidad'), valor: kpis.indiceInadimplencia != null ? `${kpis.indiceInadimplencia}%` : '—', cor: kpis.indiceInadimplencia == null ? CINZA : kpis.indiceInadimplencia > 15 ? VERMELHO : kpis.indiceInadimplencia > 5 ? AMBAR : VERDE, vazio: kpis.indiceInadimplencia == null, drillable: false },
    { key: 'indicePontualidade', label: L('Índice de Pontualidade', 'On-time Rate', 'Índice de Puntualidad'), valor: kpis.indicePontualidade != null ? `${kpis.indicePontualidade}%` : '—', cor: kpis.indicePontualidade == null ? CINZA : kpis.indicePontualidade >= 80 ? VERDE : kpis.indicePontualidade >= 50 ? AMBAR : VERMELHO, vazio: kpis.indicePontualidade == null, drillable: false },
    { key: 'dso', label: L('Prazo Médio de Recebimento (DSO)', 'Days Sales Outstanding (DSO)', 'Plazo Promedio de Cobro (DSO)'), valor: kpis.dso != null ? `${kpis.dso} ${L('dias', 'days', 'días')}` : '—', cor: TEAL, vazio: kpis.dso == null, drillable: false },
    { key: 'receitaPrevista', label: L('Receita Prevista', 'Forecast Revenue', 'Ingreso Previsto'), valor: fBRL(kpis.receitaPrevista), cor: AZUL, vazio: semContas, drillable: false },
    { key: 'receitaConfirmada', label: L('Receita Confirmada', 'Confirmed Revenue', 'Ingreso Confirmado'), valor: fBRL(kpis.receitaConfirmada), cor: VERDE, vazio: semContas, drillable: false },
    { key: 'receitaRisco', label: L('Receita em Risco', 'Revenue at Risk', 'Ingreso en Riesgo'), valor: fBRL(kpis.receitaEmRisco), cor: VERMELHO, vazio: semContas, drillable: false },
    { key: 'clientesAtraso', label: L('Clientes em Atraso', 'Overdue Clients', 'Clientes en Atraso'), valor: `${kpis.clientesEmAtraso}`, cor: kpis.clientesEmAtraso > 0 ? VERMELHO : VERDE, vazio: clientes.length === 0, drillable: true },
    { key: 'clientesCriticos', label: L('Clientes Críticos', 'Critical Clients', 'Clientes Críticos'), valor: `${kpis.clientesCriticos}`, cor: kpis.clientesCriticos > 0 ? VERMELHO : VERDE, vazio: clientes.length === 0, drillable: true },
    { key: 'ticketMedio', label: L('Ticket Médio', 'Avg. Ticket', 'Ticket Promedio'), valor: kpis.ticketMedio != null ? fBRL(kpis.ticketMedio) : '—', cor: TEAL, vazio: kpis.ticketMedio == null, drillable: false },
    { key: 'receitaRecorrente', label: L('Receita Recorrente', 'Recurring Revenue', 'Ingreso Recurrente'), valor: fBRL(kpis.receitaRecorrente), cor: ESMERALDA, vazio: semContas, drillable: false },
    { key: 'receitaNaoRecorrente', label: L('Receita Não Recorrente', 'Non-recurring Revenue', 'Ingreso No Recurrente'), valor: fBRL(kpis.receitaNaoRecorrente), cor: CINZA, vazio: semContas, drillable: false },
    { key: 'scoreMedio', label: L('Score Médio da Carteira', 'Avg. Portfolio Score', 'Score Promedio de Cartera'), valor: kpis.scoreMedioCarteira != null ? `${kpis.scoreMedioCarteira}/1000` : '—', cor: kpis.scoreMedioCarteira == null ? CINZA : OURO, vazio: kpis.scoreMedioCarteira == null, drillable: false },
  ]

  function drillLinhas(key: string): { label: string; valor: string }[] {
    if (key === 'vencido' || key === 'totalAReceber' || key === 'aVencer') {
      const filtro = key === 'vencido' ? (c: Conta) => (c.status || '') !== 'recebido' && c.data_vencimento < hoje
        : key === 'aVencer' ? (c: Conta) => (c.status || '') !== 'recebido' && c.data_vencimento >= hoje
        : (c: Conta) => (c.status || '') !== 'recebido'
      return contas.filter(filtro).sort((a, b) => calcularLinha(b).saldo - calcularLinha(a).saldo).slice(0, 10)
        .map((c) => ({ label: `${cliente(c.cliente_id)?.nome || c.descricao} · ${new Date(c.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}`, valor: fBRL(calcularLinha(c).saldo) }))
    }
    if (key === 'recebidoMes' || key === 'recebidoAno') {
      const inicio = key === 'recebidoMes' ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10) : new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
      return contas.filter((c) => c.status === 'recebido' && c.data_recebimento && c.data_recebimento >= inicio)
        .sort((a, b) => (b.valor_recebido || 0) - (a.valor_recebido || 0)).slice(0, 10)
        .map((c) => ({ label: `${cliente(c.cliente_id)?.nome || c.descricao} · ${new Date((c.data_recebimento as string) + 'T00:00:00').toLocaleDateString('pt-BR')}`, valor: fBRL(c.valor_recebido || 0) }))
    }
    if (key === 'clientesAtraso') {
      return carteira.clientesSnapshot.filter((s) => s.diasAtrasoAtual > 0).sort((a, b) => b.valorEmAtrasoAtual - a.valorEmAtrasoAtual).slice(0, 10)
        .map((s) => ({ label: `${s.cliente.nome} · ${s.diasAtrasoAtual} ${L('dias', 'days', 'días')}`, valor: fBRL(s.valorEmAtrasoAtual) }))
    }
    if (key === 'clientesCriticos') {
      return ranking.filter((r) => r.score.nivel === 'critico').slice(0, 10)
        .map((r) => ({ label: r.s.cliente.nome, valor: `${r.score.total}/1000` }))
    }
    return []
  }

  const kpiAtivo = kpiTiles.find((k) => k.key === drillKpi) || null

  // ========== AGING (ECharts) ==========
  const agingLabels = [
    L('0-30 dias', '0-30 days', '0-30 días'), L('31-60 dias', '31-60 days', '31-60 días'),
    L('61-90 dias', '61-90 days', '61-90 días'), L('90+ dias', '90+ days', '90+ días'),
  ]
  const agingOption = aging.some((f) => f.valor > 0) ? optBarrasV(
    aging.map((f) => f.valor), agingLabels, VERMELHO, '#fca5a5',
    aging.map((f) => f.chave === 'd30' ? AMBAR : f.chave === 'd60' ? '#f59e0b' : f.chave === 'd90' ? '#ef4444' : '#dc2626'),
  ) : null

  // ========== SCORE AXIOMA — gauge da carteira + ranking ==========
  const gaugeOption = optVelocimetro(scoreCarteira.amostraSuficiente ? scoreCarteira.media : 0, 1000, [
    { ate: 400, cor: VERMELHO }, { ate: 600, cor: AMBAR }, { ate: 750, cor: VERDE }, { ate: 900, cor: VERDE }, { ate: 1000, cor: OURO },
  ])
  const rankingTop = ranking.slice(0, 8)
  const scoreDrill = ranking.find((r) => r.s.cliente.id === clienteScoreDrill) || null

  // ========== FASE 2 — COBRANÇA INTELIGENTE ==========
  const alertas = useMemo(() => detectarAlertasCobranca(lang, carteira, contas as ContaRow[], ranking, compromissos), [lang, carteira, contas, ranking, compromissos])
  const alertasCriticos = alertas.filter((a) => a.severidade === 'critico').length
  const alertasAtencao = alertas.filter((a) => a.severidade === 'atencao').length
  const filaCobranca = useMemo(() => filaCobrancaPriorizada(ranking), [ranking])
  const pareceresCobranca = useMemo(() => gerarParecerCobranca(lang, carteira, contas as ContaRow[], ranking), [lang, carteira, contas, ranking])

  function severidadeCor(s: AlertaCobranca['severidade']) {
    return s === 'critico' ? VERMELHO : s === 'atencao' ? AMBAR : VERDE
  }

  async function abrirCobranca(c: Conta) {
    setContaCobranca(c)
    setNovoContato({ tipo: 'contato', canal: 'telefone', descricao: '' })
    setNovoCompromisso({ tipo: 'promessa', valor_compromissado: '', data_compromissada: '', condicoes: '' })
    setCarregandoInteracoes(true)
    setInteracoesConta(await listarInteracoes(c.id))
    setCarregandoInteracoes(false)
  }
  function fecharCobranca() { setContaCobranca(null); setInteracoesConta([]) }

  async function salvarContato() {
    if (!contaCobranca || !userId || !novoContato.descricao.trim()) return
    setSalvandoCobranca(true)
    await criarInteracao(userId, {
      conta_id: contaCobranca.id, cliente_id: contaCobranca.cliente_id || null,
      tipo: novoContato.tipo, canal: novoContato.canal, descricao: novoContato.descricao, data: hoje,
    })
    setInteracoesConta(await listarInteracoes(contaCobranca.id))
    setNovoContato({ tipo: 'contato', canal: 'telefone', descricao: '' })
    setSalvandoCobranca(false)
  }

  async function salvarCompromisso() {
    if (!contaCobranca || !userId || !novoCompromisso.valor_compromissado || !novoCompromisso.data_compromissada) return
    setSalvandoCobranca(true)
    await criarCompromisso(userId, {
      conta_id: contaCobranca.id, cliente_id: contaCobranca.cliente_id || null,
      tipo: novoCompromisso.tipo, valor_original: contaCobranca.valor,
      valor_compromissado: parseFloat(novoCompromisso.valor_compromissado), data_compromissada: novoCompromisso.data_compromissada,
      condicoes: novoCompromisso.condicoes || null,
    })
    setCompromissos(await listarCompromissos())
    setNovoCompromisso({ tipo: 'promessa', valor_compromissado: '', data_compromissada: '', condicoes: '' })
    setSalvandoCobranca(false)
  }

  async function marcarCompromisso(id: string, status: CobrancaCompromisso['status']) {
    await atualizarStatusCompromisso(id, status)
    setCompromissos(await listarCompromissos())
  }

  function compromissosDaConta(contaId: string) { return compromissos.filter((c) => c.conta_id === contaId) }

  function abrirNovaEtapa() { setEditandoEtapa({ dias_relativos: 0, canal: 'email', mensagem_modelo: '', ativo: true, ordem: etapasRegua.length }) }
  async function salvarEtapa() {
    if (!editandoEtapa || !userId || !editandoEtapa.mensagem_modelo?.trim()) return
    await salvarEtapaRegua(userId, editandoEtapa)
    setEtapasRegua(await listarEtapasRegua(userId))
    setEditandoEtapa(null)
  }
  async function excluirEtapa(id: string) {
    await excluirEtapaRegua(id)
    if (userId) setEtapasRegua(await listarEtapasRegua(userId))
  }
  async function usarReguaPadrao() {
    if (!userId) return
    for (const e of etapasReguaPadrao()) await salvarEtapaRegua(userId, e)
    setEtapasRegua(await listarEtapasRegua(userId))
  }

  const labelInput = 'text-xs font-semibold tracking-wider uppercase mb-2 block'
  const inputCls = 'w-full px-4 py-3 rounded-xl focus:outline-none text-sm'
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: `1px solid ${TEAL}40`, color: '#c8d8f0' }
  const selectStyle = { background: 'rgba(10,22,40,0.95)', border: `1px solid ${TEAL}40`, color: '#c8d8f0' }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#020810' }}>
      <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: ESMERALDA, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <ModuloLayout
      titulo={L('Contas a Receber', 'Accounts Receivable', 'Cuentas por Cobrar')}
      subtitulo={L('Central de Inteligência Financeira de Recebimentos', 'Receivables Financial Intelligence Center', 'Centro de Inteligencia Financiera de Cobros')}
      onExportarPDF={exportarPDF} exportando={exportando} onNovo={abrirNovo}
      labelBotao={L('Nova Conta', 'New Account', 'Nueva Cuenta')}
      botaoExtra={
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, ${ESMERALDA}, ${TEAL})`, color: '#fff' }}>
          <Share2 size={16} /> {L('Compartilhar', 'Share', 'Compartir')}
        </motion.button>
      }
    >
      <div className="space-y-6">

        {avisoSchema && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs" style={{ background: `${AMBAR}12`, border: `1px solid ${AMBAR}40`, color: AMBAR }}>
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{L('Responsável, Prioridade e Projeto ainda não foram salvos — peça para rodar o SQL de atualização no Supabase (ver relatório técnico). O resto da conta foi salvo normalmente.', 'Responsible, Priority and Project were not saved yet — run the Supabase schema update SQL first (see technical report). The rest of the record saved normally.', 'Responsable, Prioridad y Proyecto aún no se guardaron — ejecute el SQL de actualización en Supabase (ver informe técnico). El resto del registro se guardó normalmente.')}</span>
          </div>
        )}

        {avisoTabelasCobranca && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs" style={{ background: `${AMBAR}12`, border: `1px solid ${AMBAR}40`, color: AMBAR }}>
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{L('A Cobrança Inteligente (histórico de contato, promessas/acordos e régua) precisa das tabelas novas no Supabase — peça para rodar o SQL do relatório técnico. O resto do módulo continua funcionando normalmente.', 'Smart Collection (contact history, promises/agreements and the reminder ladder) needs the new Supabase tables — run the SQL from the technical report. The rest of the module keeps working normally.', 'La Cobranza Inteligente (historial de contacto, promesas/acuerdos y regla de cobro) necesita las tablas nuevas en Supabase — ejecute el SQL del informe técnico. El resto del módulo sigue funcionando normalmente.')}</span>
          </div>
        )}

        {/* ================= DASHBOARD EXECUTIVO ================= */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-black tracking-[0.2em] uppercase" style={{ ...FONTE_EXEC, color: TEAL }}>
            {L('Dashboard Executivo', 'Executive Dashboard', 'Panel Ejecutivo')}
          </h3>
          <SeletorPeriodo preset={preset} onChangePreset={setPreset} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={ESMERALDA} lang={lang} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {kpiTiles.map((k) => (
            <motion.button key={k.key} whileHover={k.drillable ? { scale: 1.02 } : undefined}
              onClick={() => k.drillable && setDrillKpi(k.key)}
              disabled={!k.drillable}
              className="text-left rounded-2xl p-4 relative overflow-hidden"
              style={{ background: BG_CARD, border: `1px solid ${k.cor}30`, cursor: k.drillable ? 'pointer' : 'default' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${k.cor}80, transparent)` }} />
              <p className="text-[10px] font-semibold tracking-wider uppercase mb-2" style={{ color: CINZA }}>{k.label}</p>
              {k.vazio ? (
                <p className="text-xs italic" style={{ color: CINZA }}>{L('Sem dados suficientes', 'Not enough data', 'Sin datos suficientes')}</p>
              ) : (
                <p className="text-lg md:text-xl font-black" style={{ ...FONTE_EXEC, color: k.cor }}>{k.valor}</p>
              )}
              {k.drillable && !k.vazio && <ChevronRight size={13} className="absolute bottom-3 right-3" style={{ color: `${k.cor}80` }} />}
            </motion.button>
          ))}
        </div>

        {/* ================= PAINEL DE ALERTAS INTELIGENTES ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${alertasCriticos > 0 ? VERMELHO : alertasAtencao > 0 ? AMBAR : TEAL}30` }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: alertasCriticos > 0 ? VERMELHO : TEAL }}>
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
                  onClick={() => a.clienteId && setClienteScoreDrill(a.clienteId)}
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

        {/* ================= AGING ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${VERMELHO}25` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: VERMELHO }}>
            {L('Envelhecimento da Carteira (Aging)', 'Portfolio Aging', 'Envejecimiento de Cartera')}
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
                  <div key={f.chave} className="rounded-xl p-3 text-center" style={{ background: `${[AMBAR, '#f59e0b', '#ef4444', '#dc2626'][i]}12`, border: `1px solid ${[AMBAR, '#f59e0b', '#ef4444', '#dc2626'][i]}35` }}>
                    <p className="text-base font-black" style={{ color: [AMBAR, '#f59e0b', '#ef4444', '#dc2626'][i] }}>{fBRL(f.valor)}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: CINZA }}>{agingLabels[i]} · {f.qtdContas} {L('contas', 'accounts', 'cuentas')}</p>
                  </div>
                ))}
              </div>
              {agingOption && <ReactECharts option={agingOption} style={{ height: 220 }} notMerge lazyUpdate />}
            </div>
          )}
        </div>

        {/* ================= SCORE AXIOMA DO CLIENTE ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${OURO}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4 flex items-center gap-2" style={{ color: OURO }}>
            <Crown size={14} /> {L('Score Axioma do Cliente', 'Axioma Client Score', 'Score Axioma del Cliente')}
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
                <p className="text-sm font-black" style={{ ...FONTE_EXEC, color: scoreCarteira.amostraSuficiente ? nivelScoreCor(nivelPorTotal(scoreCarteira.media)) : CINZA }}>
                  {L('Média da Carteira', 'Portfolio Average', 'Promedio de Cartera')}
                </p>
              </div>
              <div className="space-y-1.5">
                {rankingTop.map((r, i) => (
                  <motion.button key={r.s.cliente.id} whileHover={{ scale: 1.01 }} onClick={() => setClienteScoreDrill(r.s.cliente.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${nivelScoreCor(r.score.nivel)}25` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold w-4 flex-shrink-0" style={{ color: CINZA }}>{i + 1}</span>
                      {r.score.nivel === 'elite' && <Crown size={12} style={{ color: OURO }} className="flex-shrink-0" />}
                      <span className="text-xs font-semibold truncate" style={{ color: '#c8d8f0' }}>{r.s.cliente.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold" style={{ color: nivelScoreCor(r.score.nivel) }}>{nivelScoreLabel(r.score.nivel)}</span>
                      <span className="text-xs font-black w-10 text-right" style={{ color: nivelScoreCor(r.score.nivel) }}>{r.score.total}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= IA FINANCEIRA EXPLICATIVA ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${TEAL}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2" style={{ color: TEAL }}>
            <Brain size={14} /> {L('IA Financeira Explicativa', 'Explanatory Financial AI', 'IA Financiera Explicativa')}
          </p>
          <p className="text-[10px] mb-4 italic" style={{ color: CINZA }}>
            {L('Modo por regras — nenhum texto aqui foi gerado por um modelo de linguagem.', 'Rule-based mode — no text here was generated by a language model.', 'Modo por reglas — ningún texto aquí fue generado por un modelo de lenguaje.')}
          </p>
          {pareceresCobranca.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L('Sem dados suficientes para gerar análise ainda.', 'Not enough data to generate analysis yet.', 'Sin datos suficientes para generar análisis aún.')}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {pareceresCobranca.map((c, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${TEAL}20` }}>
                  <p className="text-xs font-black mb-2" style={{ color: TEAL }}>{c.tema}</p>
                  <p className="text-xs mb-1.5" style={{ color: '#c8d8f0' }}><span style={{ color: CINZA }}>{L('O que aconteceu', 'What happened', 'Qué pasó')}:</span> {c.oQueAconteceu}</p>
                  <p className="text-xs mb-1.5" style={{ color: '#c8d8f0' }}><span style={{ color: CINZA }}>{L('Por quê', 'Why', 'Por qué')}:</span> {c.porQue}</p>
                  <p className="text-xs mb-1.5" style={{ color: '#c8d8f0' }}><span style={{ color: CINZA }}>{L('Impacto', 'Impact', 'Impacto')}:</span> {c.impacto}</p>
                  <p className="text-xs font-semibold" style={{ color: VERDE }}><span style={{ color: CINZA, fontWeight: 400 }}>{L('Ação', 'Action', 'Acción')}:</span> {c.acao}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= FILA DE COBRANÇA PRIORIZADA ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${VERMELHO}25` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2" style={{ color: VERMELHO }}>
            <ListChecks size={14} /> {L('Fila de Cobrança Priorizada', 'Prioritized Collection Queue', 'Cola de Cobro Priorizada')}
          </p>
          <p className="text-[10px] mb-4" style={{ color: CINZA }}>{L('Ordenada pelo Score Axioma — pior nota e maior saldo vencido primeiro.', 'Ordered by Axioma Score — worst score and highest overdue balance first.', 'Ordenada por Score Axioma — peor nota y mayor saldo vencido primero.')}</p>
          {filaCobranca.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 size={28} style={{ color: VERDE }} className="mb-2" />
              <p className="text-sm" style={{ color: CINZA }}>{L('Nenhum cliente com saldo vencido.', 'No clients with overdue balance.', 'Ningún cliente con saldo vencido.')}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filaCobranca.slice(0, 10).map((item, i) => {
                const contaMaisAntiga = [...item.s.contas].filter((c) => c.status !== 'recebido' && c.data_vencimento < hoje).sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))[0]
                return (
                  <motion.button key={item.s.cliente.id} whileHover={{ scale: 1.005 }}
                    onClick={() => contaMaisAntiga && abrirCobranca(contas.find((c) => c.id === contaMaisAntiga.id) as Conta)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${nivelScoreCor(item.score.nivel)}25` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold w-5 flex-shrink-0" style={{ color: CINZA }}>{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#c8d8f0' }}>{item.s.cliente.nome}</p>
                        <p className="text-[10px]" style={{ color: CINZA }}>{L('Score', 'Score', 'Score')} {item.score.total} · {item.s.diasAtrasoAtual} {L('dias em atraso', 'days overdue', 'días de atraso')}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black flex-shrink-0" style={{ color: VERMELHO }}>{fBRL(item.s.valorVencido)}</span>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        {/* ================= RÉGUA DE COBRANÇA CONFIGURÁVEL ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${OURO}30` }}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: OURO }}>
              <MessageSquare size={14} /> {L('Régua de Cobrança', 'Collection Ladder', 'Regla de Cobro')}
            </p>
            <div className="flex items-center gap-2">
              {etapasRegua.length === 0 && (
                <button onClick={usarReguaPadrao} className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `${OURO}15`, color: OURO, border: `1px solid ${OURO}30` }}>
                  {L('Usar régua padrão', 'Use default ladder', 'Usar regla predeterminada')}
                </button>
              )}
              <button onClick={abrirNovaEtapa} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `${ESMERALDA}20`, color: ESMERALDA, border: `1px solid ${ESMERALDA}30` }}>
                <Plus size={12} /> {L('Nova Etapa', 'New Step', 'Nueva Etapa')}
              </button>
            </div>
          </div>
          <p className="text-[10px] mb-4" style={{ color: CINZA }}>{L('Só organiza os passos e mensagens — nenhum envio real acontece nesta fase.', 'Only organizes the steps and messages — no real sending happens in this phase.', 'Solo organiza los pasos y mensajes — ningún envío real ocurre en esta fase.')}</p>
          {etapasRegua.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L('Nenhuma etapa configurada ainda.', 'No steps configured yet.', 'Ninguna etapa configurada aún.')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...etapasRegua].sort((a, b) => a.dias_relativos - b.dias_relativos).map((e) => (
                <div key={e.id} className="rounded-xl p-3 min-w-[180px] flex-1" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${e.ativo ? OURO + '35' : 'rgba(255,255,255,0.08)'}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black" style={{ color: e.ativo ? OURO : CINZA }}>
                      {e.dias_relativos === 0 ? L('No vencimento', 'On due date', 'En el vencimiento') : e.dias_relativos < 0 ? `D${e.dias_relativos}` : `D+${e.dias_relativos}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditandoEtapa(e)}><Pencil size={11} style={{ color: AZUL }} /></button>
                      <button onClick={() => excluirEtapa(e.id)}><Trash2 size={11} style={{ color: VERMELHO }} /></button>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md inline-block mb-1.5" style={{ background: 'rgba(255,255,255,0.06)', color: CINZA }}>
                    {e.canal === 'email' ? <Mail size={9} className="inline mr-1" /> : e.canal === 'whatsapp' ? <MessageSquare size={9} className="inline mr-1" /> : <Send size={9} className="inline mr-1" />}
                    {e.canal}
                  </span>
                  <p className="text-[10px] line-clamp-2" style={{ color: '#c8d8f0' }}>{e.mensagem_modelo}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= CENTRAL DE RECEBIMENTOS ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${ESMERALDA}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: ESMERALDA }}>
            {L('Central de Recebimentos', 'Receivables Center', 'Centro de Cobros')}
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${ESMERALDA}25` }}>
              <Search size={15} style={{ color: CINZA }} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={L('Buscar por cliente, documento, responsável...', 'Search by client, document, owner...', 'Buscar por cliente, documento, responsable...')} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: '#c8d8f0' }} />
            </div>
            <div className="flex items-center gap-1.5 px-2" style={{ color: CINZA }}><Filter size={14} /></div>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer" style={{ background: 'rgba(10,22,40,0.9)', border: `1px solid ${ESMERALDA}40`, color: ESMERALDA }}>
              <option value="todos">{L('Todos os Status', 'All Statuses', 'Todos los Estados')}</option>
              <option value="pendente">{statusLabel('pendente')}</option>
              <option value="parcial">{statusLabel('parcial')}</option>
              <option value="vencido">{statusLabel('vencido')}</option>
              <option value="recebido">{statusLabel('recebido')}</option>
            </select>
          </div>

          {contasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
              <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma conta encontrada para o período/filtro atual.', 'No accounts found for the current period/filter.', 'Ninguna cuenta encontrada para el período/filtro actual.')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs border-separate" style={{ borderSpacing: '0 6px', minWidth: 1600 }}>
                <thead>
                  <tr>
                    {[
                      L('Cliente', 'Client', 'Cliente'), L('Documento', 'Document', 'Documento'), L('Competência', 'Period', 'Competencia'),
                      L('Emissão', 'Issue', 'Emisión'), L('Vencimento', 'Due', 'Vencimiento'), L('Dias Atraso', 'Days Late', 'Días Atraso'),
                      L('Vlr. Original', 'Original', 'Vlr. Original'), L('Desconto', 'Discount', 'Descuento'), L('Juros', 'Interest', 'Interés'),
                      L('Multa', 'Fine', 'Multa'), L('Vlr. Atualizado', 'Updated', 'Vlr. Actualizado'), L('Recebido', 'Received', 'Recibido'),
                      L('Saldo', 'Balance', 'Saldo'), L('Status', 'Status', 'Estado'), L('Responsável', 'Owner', 'Responsable'),
                      L('Centro Custo', 'Cost Center', 'Centro Costo'), L('Projeto', 'Project', 'Proyecto'), L('Categoria', 'Category', 'Categoría'),
                      L('Forma Receb.', 'Payment', 'Forma Pago'), L('Prioridade', 'Priority', 'Prioridad'), L('Score Cliente', 'Client Score', 'Score Cliente'),
                      L('Risco', 'Risk', 'Riesgo'), '',
                    ].map((h) => (
                      <th key={h} className="text-left px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: CINZA }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contasFiltradas.map((c, i) => {
                    const { dias, desconto, multa, juros, valorAtualizado, saldo } = calcularLinha(c)
                    const cli = cliente(c.cliente_id)
                    const cc = centrosCusto.find((x) => x.id === c.centro_custo_id)
                    const score = scoreDe(c.cliente_id)
                    const cor = statusCor(c.status)
                    return (
                      <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.02 }}
                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <td className="px-2 py-2.5 rounded-l-xl whitespace-nowrap font-semibold" style={{ color: '#c8d8f0' }}>{cli?.nome || '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{c.numero_documento || '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{c.competencia ? new Date(c.competencia + 'T00:00:00').toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{c.data_emissao ? new Date(c.data_emissao + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: '#c8d8f0' }}>{new Date(c.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap font-bold" style={{ color: dias > 0 ? VERMELHO : CINZA }}>{dias > 0 ? dias : '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: '#c8d8f0' }}>{fBRL(c.valor || 0)}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: desconto > 0 ? AZUL : CINZA }}>{desconto > 0 ? fBRL(desconto) : '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: juros > 0 ? AMBAR : CINZA }}>{juros > 0 ? fBRL(juros) : '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: multa > 0 ? VERMELHO : CINZA }}>{multa > 0 ? fBRL(multa) : '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap font-bold" style={{ color: '#c8d8f0' }}>{fBRL(valorAtualizado)}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: VERDE }}>{fBRL(c.valor_recebido || 0)}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap font-black" style={{ color: cor }}>{fBRL(saldo)}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap"><span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: `${cor}15`, color: cor }}>{statusLabel(c.status)}</span></td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{c.responsavel || '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{cc?.nome || '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{c.projeto || '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{c.categoria || '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{c.forma_recebimento || '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap"><span className="text-[10px] font-bold" style={{ color: prioridadeCor(c.prioridade) }}>{prioridadeLabel(c.prioridade)}</span></td>
                        <td className="px-2 py-2.5 whitespace-nowrap font-bold" style={{ color: score ? nivelScoreCor(score.nivel) : CINZA }}>{score ? score.total : '—'}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap"><span className="text-[10px] font-bold" style={{ color: score ? nivelScoreCor(score.nivel) : CINZA }}>{score ? nivelScoreLabel(score.nivel) : '—'}</span></td>
                        <td className="px-2 py-2.5 rounded-r-xl whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {c.status !== 'recebido' && (
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirReceber(c)} title={L('Receber', 'Receive', 'Cobrar')}>
                                <CheckCircle2 size={14} style={{ color: VERDE }} />
                              </motion.button>
                            )}
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirCobranca(c)} title={L('Cobrança', 'Collection', 'Cobranza')}><HandCoins size={14} style={{ color: OURO }} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(c)}><Pencil size={14} style={{ color: AZUL }} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(c.id)}><Trash2 size={14} style={{ color: VERMELHO }} /></motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ================= MODAL: NOVA/EDITAR CONTA ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {modalAberto && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={fecharModal}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${OURO}35`, boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }}>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: OURO }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{editando ? L('Editar Conta', 'Edit Account', 'Editar Cuenta') : L('Nova Conta', 'New Account', 'Nueva Cuenta')}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>

                  {erroSalvar && <div className="mb-4 px-3 py-2 rounded-lg text-xs" style={{ background: `${VERMELHO}15`, color: VERMELHO }}>{erroSalvar}</div>}

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    <div>
                      <label className={labelInput} style={{ color: TEAL }}>{L('Descrição', 'Description', 'Descripción')} *</label>
                      <input value={nc.descricao} onChange={(e) => setNc({ ...nc, descricao: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Cliente', 'Client', 'Cliente')}</label>
                        <select value={nc.cliente_id} onChange={(e) => setNc({ ...nc, cliente_id: e.target.value })} className={inputCls} style={selectStyle}>
                          <option value="">-- {L('Selecione', 'Select', 'Seleccione')} --</option>
                          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Nº Documento', 'Doc No.', 'Nº Documento')}</label>
                        <input value={nc.numero_documento} onChange={(e) => setNc({ ...nc, numero_documento: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Valor Total (R$)', 'Total (R$)', 'Total (R$)')} *</label>
                        <input type="number" value={nc.valor} onChange={(e) => setNc({ ...nc, valor: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Já Recebido (R$)', 'Received (R$)', 'Recibido (R$)')}</label>
                        <input type="number" value={nc.valor_recebido} onChange={(e) => setNc({ ...nc, valor_recebido: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Desconto (R$)', 'Discount (R$)', 'Descuento (R$)')}</label>
                        <input type="number" value={nc.valor_desconto} onChange={(e) => setNc({ ...nc, valor_desconto: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Competência', 'Period', 'Competencia')}</label>
                        <input type="date" value={nc.competencia} onChange={(e) => setNc({ ...nc, competencia: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Emissão', 'Issue Date', 'Emisión')}</label>
                        <input type="date" value={nc.data_emissao} onChange={(e) => setNc({ ...nc, data_emissao: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Vencimento', 'Due Date', 'Vencimiento')} *</label>
                        <input type="date" value={nc.data_vencimento} onChange={(e) => setNc({ ...nc, data_vencimento: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Juros % a.m.', 'Interest % /mo', 'Interés % /mes')}</label>
                        <input type="number" value={nc.taxa_juros} onChange={(e) => setNc({ ...nc, taxa_juros: e.target.value })} placeholder="ex: 2" className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Multa %', 'Fine %', 'Multa %')}</label>
                        <input type="number" value={nc.taxa_multa} onChange={(e) => setNc({ ...nc, taxa_multa: e.target.value })} placeholder="ex: 10" className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Forma de Recebimento', 'Payment Method', 'Forma de Pago')}</label>
                        <select value={nc.forma_recebimento} onChange={(e) => setNc({ ...nc, forma_recebimento: e.target.value })} className={inputCls} style={selectStyle}>
                          {FORMAS_RECEBIMENTO.map((f) => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Categoria', 'Category', 'Categoría')}</label>
                        <select value={nc.categoria} onChange={(e) => setNc({ ...nc, categoria: e.target.value })} className={inputCls} style={selectStyle}>
                          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Parcelas', 'Installments', 'Cuotas')}</label>
                        <input type="number" value={nc.parcelas} onChange={(e) => setNc({ ...nc, parcelas: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Centro de Custo', 'Cost Center', 'Centro de Costo')}</label>
                        <select value={nc.centro_custo_id} onChange={(e) => setNc({ ...nc, centro_custo_id: e.target.value })} className={inputCls} style={selectStyle}>
                          <option value="">-- {L('Nenhum', 'None', 'Ninguno')} --</option>
                          {centrosCusto.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Prioridade', 'Priority', 'Prioridad')}</label>
                        <select value={nc.prioridade} onChange={(e) => setNc({ ...nc, prioridade: e.target.value })} className={inputCls} style={selectStyle}>
                          {PRIORIDADES.map((p) => <option key={p} value={p}>{prioridadeLabel(p)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Responsável', 'Owner', 'Responsable')}</label>
                        <input value={nc.responsavel} onChange={(e) => setNc({ ...nc, responsavel: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: TEAL }}>{L('Projeto', 'Project', 'Proyecto')}</label>
                        <input value={nc.projeto} onChange={(e) => setNc({ ...nc, projeto: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-1">
                      <input type="checkbox" id="recorrente" checked={nc.recorrente} onChange={(e) => setNc({ ...nc, recorrente: e.target.checked })} className="w-4 h-4" />
                      <label htmlFor="recorrente" className="text-xs font-semibold" style={{ color: '#c8d8f0' }}>{L('Cobrança recorrente', 'Recurring billing', 'Cobro recurrente')}</label>
                      {nc.recorrente && (
                        <select value={nc.frequencia_recorrencia} onChange={(e) => setNc({ ...nc, frequencia_recorrencia: e.target.value })} className="px-3 py-1.5 rounded-lg text-xs" style={selectStyle}>
                          <option value="mensal">{L('Mensal', 'Monthly', 'Mensual')}</option>
                          <option value="trimestral">{L('Trimestral', 'Quarterly', 'Trimestral')}</option>
                          <option value="anual">{L('Anual', 'Yearly', 'Anual')}</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className={labelInput} style={{ color: TEAL }}>{L('Observações', 'Notes', 'Observaciones')}</label>
                      <textarea value={nc.observacoes} onChange={(e) => setNc({ ...nc, observacoes: e.target.value })} rows={2} className={inputCls} style={inputStyle} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: CINZA }}>{L('Cancelar', 'Cancel', 'Cancelar')}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvar} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, ${ESMERALDA}, ${TEAL})`, color: '#fff' }}>
                      {salvando ? '...' : L('Salvar Conta', 'Save', 'Guardar')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}

      {/* ================= MODAL: RECEBER ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {modalReceber && contaReceber && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setModalReceber(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${VERDE}35` }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{L('Registrar Recebimento', 'Register Payment', 'Registrar Cobro')}</h3>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalReceber(false)} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>
                  <p className="text-sm mb-1" style={{ color: '#c8d8f0' }}>{contaReceber.descricao}</p>
                  <p className="text-xs mb-4" style={{ color: CINZA }}>
                    {L('Saldo em aberto', 'Open balance', 'Saldo abierto')}: <span style={{ color: AMBAR, fontWeight: 700 }}>{fBRL(calcularLinha(contaReceber).saldo)}</span>
                  </p>
                  <label className={labelInput} style={{ color: TEAL }}>{L('Valor a receber agora (R$)', 'Amount to receive (R$)', 'Monto a cobrar ahora (R$)')}</label>
                  <input type="number" value={valorReceber} onChange={(e) => setValorReceber(e.target.value)} className={inputCls} style={inputStyle} />
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setModalReceber(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: CINZA }}>{L('Cancelar', 'Cancel', 'Cancelar')}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarRecebimento} disabled={recebendo}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, ${VERDE}, #059669)`, color: '#fff' }}>
                      {recebendo ? '...' : L('Confirmar', 'Confirm', 'Confirmar')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}

      {/* ================= MODAL: DRILL-DOWN DE KPI ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {kpiAtivo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setDrillKpi(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${kpiAtivo.cor}40` }}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: CINZA }}>{kpiAtivo.label}</p>
                      <h3 className="text-2xl font-black" style={{ ...FONTE_EXEC, color: kpiAtivo.cor }}>{kpiAtivo.valor}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setDrillKpi(null)} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {drillLinhas(kpiAtivo.key).length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: CINZA }}>{L('Sem itens para detalhar.', 'No items to break down.', 'Sin elementos para detallar.')}</p>
                    ) : drillLinhas(kpiAtivo.key).map((l, i) => (
                      <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ color: '#c8d8f0' }}>{l.label}</span>
                        <span className="font-bold" style={{ color: kpiAtivo.cor }}>{l.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}

      {/* ================= MODAL: DETALHE DO SCORE DO CLIENTE ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {scoreDrill && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setClienteScoreDrill(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${nivelScoreCor(scoreDrill.score.nivel)}40` }}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      {scoreDrill.score.nivel === 'elite' && <Crown size={16} style={{ color: OURO }} />}
                      <div>
                        <h3 className="text-base font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{scoreDrill.s.cliente.nome}</h3>
                        <p className="text-xl font-black" style={{ color: nivelScoreCor(scoreDrill.score.nivel) }}>{scoreDrill.score.total}/1000 · {nivelScoreLabel(scoreDrill.score.nivel)}</p>
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setClienteScoreDrill(null)} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>
                  <div className="space-y-1.5 max-h-[45vh] overflow-y-auto">
                    {[...scoreDrill.score.criterios].sort((a, b) => b.peso - a.peso).map((c) => (
                      <div key={c.chave} className="flex justify-between items-center px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ color: '#c8d8f0' }}>{nomeCriterioScoreCliente(lang, c.chave)} <span style={{ color: CINZA }}>({c.peso}%)</span></span>
                        <span className="font-bold" style={{ color: c.semDados ? CINZA : '#c8d8f0' }}>{c.semDados ? L('sem dados', 'no data', 'sin datos') : `${Math.round(c.valor as number)}/100`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}

      {/* ================= MODAL: CENTRAL DE COBRANÇA DA CONTA ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {contaCobranca && (() => {
            const s = carteira.clientesSnapshot.find((x) => x.cliente.id === contaCobranca.cliente_id) || null
            const prob = probabilidadeRecebimentoConta(contaCobranca as ContaRow, s)
            const proximaEtapa = etapaAplicavelHoje(etapasRegua, contaCobranca.data_vencimento)
            const compsConta = compromissosDaConta(contaCobranca.id)
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={fecharCobranca}>
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${OURO}35` }}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: OURO }}>{L('Central de Cobrança', 'Collection Center', 'Centro de Cobranza')}</p>
                        <h3 className="text-base font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{cliente(contaCobranca.cliente_id)?.nome || contaCobranca.descricao}</h3>
                        <p className="text-xs" style={{ color: CINZA }}>{contaCobranca.descricao} · {L('Saldo', 'Balance', 'Saldo')}: <span style={{ color: VERMELHO, fontWeight: 700 }}>{fBRL(calcularLinha(contaCobranca).saldo)}</span></p>
                      </div>
                      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharCobranca} style={{ color: CINZA }}><X size={20} /></motion.button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: CINZA }}>{L('Chance de receber no prazo', 'Chance of on-time payment', 'Probabilidad de cobro a tiempo')}</p>
                        <p className="text-xl font-black" style={{ color: prob == null ? CINZA : prob >= 70 ? VERDE : prob >= 40 ? AMBAR : VERMELHO }}>{prob != null ? `${prob}%` : L('sem dados', 'no data', 'sin datos')}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: CINZA }}>{L('Próxima ação da régua', 'Next ladder step', 'Próxima acción de la regla')}</p>
                        <p className="text-xs font-bold" style={{ color: proximaEtapa ? OURO : CINZA }}>{proximaEtapa ? `${proximaEtapa.canal} — ${proximaEtapa.dias_relativos === 0 ? L('hoje', 'today', 'hoy') : proximaEtapa.dias_relativos < 0 ? `D${proximaEtapa.dias_relativos}` : `D+${proximaEtapa.dias_relativos}`}` : L('nenhuma configurada', 'none configured', 'ninguna configurada')}</p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: TEAL }}>{L('Registrar Contato', 'Log Contact', 'Registrar Contacto')}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <select value={novoContato.tipo} onChange={(e) => setNovoContato({ ...novoContato, tipo: e.target.value as CobrancaInteracao['tipo'] })} className="px-2 py-1.5 rounded-lg text-xs" style={selectStyle}>
                          <option value="contato">{L('Contato', 'Contact', 'Contacto')}</option>
                          <option value="negociacao">{L('Negociação', 'Negotiation', 'Negociación')}</option>
                          <option value="nota">{L('Nota', 'Note', 'Nota')}</option>
                        </select>
                        <select value={novoContato.canal} onChange={(e) => setNovoContato({ ...novoContato, canal: e.target.value })} className="px-2 py-1.5 rounded-lg text-xs" style={selectStyle}>
                          <option value="telefone">{L('Telefone', 'Phone', 'Teléfono')}</option>
                          <option value="email">E-mail</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="presencial">{L('Presencial', 'In person', 'Presencial')}</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input value={novoContato.descricao} onChange={(e) => setNovoContato({ ...novoContato, descricao: e.target.value })} placeholder={L('O que foi conversado...', 'What was discussed...', 'Qué se conversó...')} className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} />
                        <button onClick={salvarContato} disabled={salvandoCobranca || !novoContato.descricao.trim()} className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50" style={{ background: TEAL, color: '#fff' }}>{L('Salvar', 'Save', 'Guardar')}</button>
                      </div>
                      <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                        {carregandoInteracoes ? <p className="text-xs" style={{ color: CINZA }}>...</p> : interacoesConta.length === 0 ? (
                          <p className="text-xs italic" style={{ color: CINZA }}>{L('Nenhum contato registrado ainda.', 'No contact logged yet.', 'Ningún contacto registrado aún.')}</p>
                        ) : interacoesConta.map((it) => (
                          <div key={it.id} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: '#c8d8f0' }}>
                            <span style={{ color: CINZA }}>{new Date(it.data + 'T00:00:00').toLocaleDateString('pt-BR')} · {it.canal}</span> — {it.descricao}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: OURO }}>{L('Promessas e Acordos', 'Promises & Agreements', 'Promesas y Acuerdos')}</p>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <select value={novoCompromisso.tipo} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, tipo: e.target.value as CobrancaCompromisso['tipo'] })} className="px-2 py-1.5 rounded-lg text-xs" style={selectStyle}>
                          <option value="promessa">{L('Promessa', 'Promise', 'Promesa')}</option>
                          <option value="acordo">{L('Acordo', 'Agreement', 'Acuerdo')}</option>
                        </select>
                        <input type="number" value={novoCompromisso.valor_compromissado} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, valor_compromissado: e.target.value })} placeholder={L('Valor', 'Amount', 'Monto')} className="px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={inputStyle} />
                        <input type="date" value={novoCompromisso.data_compromissada} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, data_compromissada: e.target.value })} className="px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={inputStyle} />
                      </div>
                      <div className="flex gap-2">
                        <input value={novoCompromisso.condicoes} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, condicoes: e.target.value })} placeholder={L('Condições (opcional)', 'Conditions (optional)', 'Condiciones (opcional)')} className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} />
                        <button onClick={salvarCompromisso} disabled={salvandoCobranca || !novoCompromisso.valor_compromissado || !novoCompromisso.data_compromissada} className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50" style={{ background: OURO, color: '#1a1400' }}>{L('Salvar', 'Save', 'Guardar')}</button>
                      </div>
                      <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                        {compsConta.length === 0 ? (
                          <p className="text-xs italic" style={{ color: CINZA }}>{L('Nenhuma promessa ou acordo ainda.', 'No promise or agreement yet.', 'Ninguna promesa o acuerdo aún.')}</p>
                        ) : compsConta.map((c) => {
                          const quebrado = c.status === 'pendente' && c.data_compromissada < hoje
                          const cor = c.status === 'cumprido' ? VERDE : quebrado || c.status === 'quebrado' ? VERMELHO : AMBAR
                          return (
                            <div key={c.id} className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: `${cor}0c`, border: `1px solid ${cor}25` }}>
                              <span style={{ color: '#c8d8f0' }}>{c.tipo === 'acordo' ? L('Acordo', 'Agreement', 'Acuerdo') : L('Promessa', 'Promise', 'Promesa')}: {fBRL(c.valor_compromissado)} até {new Date(c.data_compromissada + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                              {c.status === 'pendente' ? (
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <button onClick={() => marcarCompromisso(c.id, 'cumprido')} title={L('Cumprido', 'Fulfilled', 'Cumplido')}><CheckCircle2 size={13} style={{ color: VERDE }} /></button>
                                  <button onClick={() => marcarCompromisso(c.id, 'quebrado')} title={L('Quebrado', 'Broken', 'Incumplido')}><X size={13} style={{ color: VERMELHO }} /></button>
                                </div>
                              ) : <span className="font-bold flex-shrink-0" style={{ color: cor }}>{c.status === 'cumprido' ? L('Cumprido', 'Fulfilled', 'Cumplido') : L('Quebrado', 'Broken', 'Incumplido')}</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
        </AnimatePresence>, document.body,
      )}

      {/* ================= MODAL: EDITOR DE ETAPA DA RÉGUA ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {editandoEtapa && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setEditandoEtapa(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${OURO}35` }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{L('Etapa da Régua', 'Ladder Step', 'Etapa de la Regla')}</h3>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setEditandoEtapa(null)} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={labelInput} style={{ color: OURO }}>{L('Dias em relação ao vencimento (negativo = antes)', 'Days relative to due date (negative = before)', 'Días respecto al vencimiento (negativo = antes)')}</label>
                      <input type="number" value={editandoEtapa.dias_relativos ?? 0} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, dias_relativos: parseInt(e.target.value || '0') })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: OURO }}>{L('Canal', 'Channel', 'Canal')}</label>
                      <select value={editandoEtapa.canal || 'email'} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, canal: e.target.value as EtapaRegua['canal'] })} className={inputCls} style={selectStyle}>
                        {CANAIS_REGUA.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: OURO }}>{L('Mensagem-modelo', 'Message template', 'Mensaje-modelo')}</label>
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
                      style={{ background: `linear-gradient(135deg, ${OURO}, #b8942c)`, color: '#1a1400' }}>
                      {L('Salvar Etapa', 'Save Step', 'Guardar Etapa')}
                    </motion.button>
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
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${ESMERALDA}35` }}>
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

// ============================================================================
// ARQUITETURA FUTURA — CONCILIAÇÃO OPEN FINANCE/PLUGGY (não implementado agora,
// Fase 1 é só leitura de clientes + CRUD de contas_receber. Deixado comentado
// como referência de próxima fase, a pedido do Elias):
//
// 1. Pluggy já persiste transações bancárias reais em `of_transacoes` (usado hoje
//    só como leitura em Fluxo de Caixa). Uma Fase futura de conciliação cruzaria
//    `of_transacoes` (entradas de PIX/TED/boleto) com `contas_receber` pendentes,
//    por valor aproximado + janela de data + nome do pagador, sugerindo "baixa
//    automática" (nunca automática de verdade sem confirmação do usuário — risco
//    de casar pagamento errado com conta errada é alto demais pra fazer sem revisão).
// 2. Tela de conciliação mostraria pares sugeridos (transação bancária × conta em
//    aberto) com um score de confiança (mesmo princípio do Score Axioma: nunca
//    inventa certeza que não tem), usuário aprova ou rejeita cada par.
// 3. Ao aprovar, roda o mesmo fluxo de `confirmarRecebimento()` já existente nesta
//    página — não duplica lógica de baixa, só automatiza a origem do valor.
// 4. Prioridade real: baixa. Pluggy segue em modo de teste por decisão do Elias
//    (ver STATUS-AXIOMA.md seção 1) — só faz sentido depois de produção real.
// ============================================================================
