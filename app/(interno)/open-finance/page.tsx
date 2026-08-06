'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { LetreiroExecutivo, type ItemLetreiro } from '../../../components/LetreiroExecutivo'
import { CentroCompartilhamento } from '../../../components/CentroCompartilhamento'
import SeletorPeriodo from '../../../components/SeletorPeriodo'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, RefreshCw, CheckCircle, AlertCircle, Search, Pencil, Trash2,
  ArrowRight, X, FlaskConical, Landmark, Share2,
} from 'lucide-react'
import {
  fBRL, fBRL2, fPct, normalizarTexto, resolverPeriodo, FONTE_EXEC,
  type Periodo, type PeriodoPreset,
} from '../../../lib/cfoCore'
import { cfoT } from '../../../lib/cfoTextos'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import {
  classificarTransacoes, calcularSaldoSistema, calcularKPIsOpenFinance,
  type TransacaoOF, type LancamentoConciliavel, type TransacaoClassificada,
  type BaldeConciliacao, type CandidatoLancamento,
} from '../../../lib/conciliacaoHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ⚠️ TESTE: deixe true para testar com o "banco sandbox" do Pluggy (sem banco real).
// Antes de ir para produção (clientes pagantes), troque para false.
const INCLUIR_SANDBOX = true

type Idioma = 'pt' | 'en' | 'es'

const JADE = '#047857'
const BRONZE = '#065f46'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AMBAR = '#f59e0b'
const AZUL = '#6ab0ff'

const CATEGORIAS_RECEITA = ['Vendas de produtos', 'Prestação de serviços', 'Recorrentes', 'Eventuais', 'Outras']
const CATEGORIAS_CUSTO = ['Marketing', 'Logística', 'Matéria-prima', 'Comissões', 'Embalagens', 'Outros']

// Bancos mais usados no Brasil — só ordenação (prioridade no topo), nunca filtro.
const BANCOS_PRIORITARIOS = [
  'nubank', 'itau', 'bradesco', 'santander', 'banco do brasil', 'caixa',
  'inter', 'c6 bank', 'sicoob', 'sicredi', 'picpay', 'next', 'neon', 'mercado pago', 'pagbank',
]

const textos = {
  pt: {
    titulo: 'Open Finance — Conciliação', sub: 'Conecte seu banco: nós conciliamos com o que já está no seu CFO e avisamos o que está estranho.',
    conectar: 'Conectar Banco', conectado: 'Banco Conectado', semConexao: 'Nenhum banco conectado ainda',
    conecteSeu: 'Conecte sua conta bancária para importar e conciliar transações automaticamente',
    carregando: 'Carregando...', sucesso: 'Banco conectado com sucesso!', erro: 'Erro ao conectar banco',
    bancos: 'Escolha seu banco', sincronizar: 'Sincronizar', sincronizando: 'Sincronizando...',
    importadas: 'transações importadas', cliqueBanco: 'Clique no seu banco para conectar',
    buscarBanco: 'Buscar banco pelo nome...', semResultadoBusca: 'Nenhum banco encontrado com esse nome',
    ambienteTeste: 'Ambiente de teste', ambienteTesteDesc: 'Conectores de simulação da Pluggy — não é o seu banco real.',
    conexoesAtivas: 'Bancos conectados', desconectar: 'Desconectar', confirmarDesconectar: 'Confirmar?',
    cancelar: 'Cancelar',
    kpiSaldoBanco: 'Saldo do Banco', kpiSaldoSistema: 'Saldo do Sistema', kpiDivergencia: 'Divergência',
    kpiNaoExplicado: 'Dinheiro não explicado', kpiPctConciliado: '% Conciliado',
    saldoSistemaExplicacao: 'Considera receitas recebidas e custos variáveis lançados no Axioma. Custo fixo entra quando o pagamento aparece no extrato e é conciliado.',
    divergenciaOk: 'Seu sistema bate com o banco.',
    divergenciaConvite: 'transação(ões) pendente(s) pode(m) explicar essa diferença.',
    verPendentes: 'Ver pendentes',
    abaConciliado: 'Conciliado', abaPendente: 'Pendente', abaAtipico: 'Atípico',
    semTransacoesConciliadas: 'Nenhuma transação conciliada neste período ainda.',
    semTransacoesPendentes: 'Nada pendente neste período — tudo em dia.',
    semTransacoesAtipicas: 'Nenhuma transação atípica neste período.',
    casadoCom: 'Casado com', criarLancamento: 'Criar lançamento', criando: 'Criando...',
    categoriaSugerida: 'Categoria sugerida', semSugestao: 'Escolha uma categoria',
    multiplosCandidatos: 'Mais de um lançamento parecido — escolha qual é',
    candidatoContestado: 'Esse lançamento também combina com outra transação — confirme se é este',
    escolherLancamento: 'Escolher lançamento', confirmarEscolha: 'Usar este',
    motivoDuplicidade: 'Possível cobrança duplicada', motivoForaPadrao: 'Valor fora do padrão histórico',
    motivoDebitoNovo: 'Débito novo, nunca visto antes',
    entrada: 'Entrada', saida: 'Saída', data: 'Data', descricao: 'Descrição', valor: 'Valor', categoria: 'Categoria',
    sucessoLancamentoCriado: 'Lançamento criado e conciliado!', erroCriarLancamento: 'Erro ao criar lançamento',
    sucessoVinculado: 'Transação conciliada!', erroVincularCandidato: 'Erro ao conciliar',
    sucessoDesconectado: 'Banco desconectado.', letreiroAtipicos: 'transação(ões) atípica(s) — merece(m) uma olhada',
  },
  en: {
    titulo: 'Open Finance — Reconciliation', sub: 'Connect your bank: we reconcile it against what is already in your CFO and flag what looks off.',
    conectar: 'Connect Bank', conectado: 'Bank Connected', semConexao: 'No bank connected yet',
    conecteSeu: 'Connect your bank account to automatically import and reconcile transactions',
    carregando: 'Loading...', sucesso: 'Bank connected successfully!', erro: 'Error connecting bank',
    bancos: 'Choose your bank', sincronizar: 'Sync', sincronizando: 'Syncing...',
    importadas: 'transactions imported', cliqueBanco: 'Click your bank to connect',
    buscarBanco: 'Search bank by name...', semResultadoBusca: 'No bank found with that name',
    ambienteTeste: 'Test environment', ambienteTesteDesc: "Pluggy's simulation connectors — not your real bank.",
    conexoesAtivas: 'Connected banks', desconectar: 'Disconnect', confirmarDesconectar: 'Confirm?',
    cancelar: 'Cancel',
    kpiSaldoBanco: 'Bank Balance', kpiSaldoSistema: 'System Balance', kpiDivergencia: 'Divergence',
    kpiNaoExplicado: 'Unexplained money', kpiPctConciliado: '% Reconciled',
    saldoSistemaExplicacao: "Considers revenue received and variable costs entered in Axioma. Fixed costs count in once the payment shows up in the statement and is reconciled.",
    divergenciaOk: 'Your system matches the bank.',
    divergenciaConvite: 'pending transaction(s) may explain this difference.',
    verPendentes: 'See pending',
    abaConciliado: 'Reconciled', abaPendente: 'Pending', abaAtipico: 'Unusual',
    semTransacoesConciliadas: 'No reconciled transaction in this period yet.',
    semTransacoesPendentes: 'Nothing pending in this period — all caught up.',
    semTransacoesAtipicas: 'No unusual transaction in this period.',
    casadoCom: 'Matched with', criarLancamento: 'Create entry', criando: 'Creating...',
    categoriaSugerida: 'Suggested category', semSugestao: 'Choose a category',
    multiplosCandidatos: 'More than one similar entry — pick which one',
    candidatoContestado: 'This entry also matches another transaction — confirm this is the right one',
    escolherLancamento: 'Choose entry', confirmarEscolha: 'Use this one',
    motivoDuplicidade: 'Possible duplicate charge', motivoForaPadrao: 'Amount outside historical pattern',
    motivoDebitoNovo: 'New debit, never seen before',
    entrada: 'Income', saida: 'Expense', data: 'Date', descricao: 'Description', valor: 'Amount', categoria: 'Category',
    sucessoLancamentoCriado: 'Entry created and reconciled!', erroCriarLancamento: 'Error creating entry',
    sucessoVinculado: 'Transaction reconciled!', erroVincularCandidato: 'Error reconciling',
    sucessoDesconectado: 'Bank disconnected.', letreiroAtipicos: 'unusual transaction(s) — worth a look',
  },
  es: {
    titulo: 'Open Finance — Conciliación', sub: 'Conecte su banco: conciliamos con lo que ya está en su CFO y avisamos lo que parece extraño.',
    conectar: 'Conectar Banco', conectado: 'Banco Conectado', semConexao: 'Ningún banco conectado aún',
    conecteSeu: 'Conecte su cuenta bancaria para importar y conciliar transacciones automáticamente',
    carregando: 'Cargando...', sucesso: '¡Banco conectado con éxito!', erro: 'Error al conectar banco',
    bancos: 'Elija su banco', sincronizar: 'Sincronizar', sincronizando: 'Sincronizando...',
    importadas: 'transacciones importadas', cliqueBanco: 'Haga clic en su banco para conectar',
    buscarBanco: 'Buscar banco por nombre...', semResultadoBusca: 'Ningún banco encontrado con ese nombre',
    ambienteTeste: 'Ambiente de prueba', ambienteTesteDesc: 'Conectores de simulación de Pluggy — no es su banco real.',
    conexoesAtivas: 'Bancos conectados', desconectar: 'Desconectar', confirmarDesconectar: '¿Confirmar?',
    cancelar: 'Cancelar',
    kpiSaldoBanco: 'Saldo del Banco', kpiSaldoSistema: 'Saldo del Sistema', kpiDivergencia: 'Divergencia',
    kpiNaoExplicado: 'Dinero no explicado', kpiPctConciliado: '% Conciliado',
    saldoSistemaExplicacao: 'Considera ingresos recibidos y costos variables registrados en Axioma. El costo fijo entra cuando el pago aparece en el extracto y es conciliado.',
    divergenciaOk: 'Su sistema coincide con el banco.',
    divergenciaConvite: 'transacción(es) pendiente(s) puede(n) explicar esta diferencia.',
    verPendentes: 'Ver pendientes',
    abaConciliado: 'Conciliado', abaPendente: 'Pendiente', abaAtipico: 'Atípico',
    semTransacoesConciliadas: 'Ninguna transacción conciliada en este período todavía.',
    semTransacoesPendentes: 'Nada pendiente en este período — todo al día.',
    semTransacoesAtipicas: 'Ninguna transacción atípica en este período.',
    casadoCom: 'Emparejado con', criarLancamento: 'Crear registro', criando: 'Creando...',
    categoriaSugerida: 'Categoría sugerida', semSugestao: 'Elija una categoría',
    multiplosCandidatos: 'Más de un registro parecido — elija cuál es',
    candidatoContestado: 'Ese registro también coincide con otra transacción — confirme si es este',
    escolherLancamento: 'Elegir registro', confirmarEscolha: 'Usar este',
    motivoDuplicidade: 'Posible cobro duplicado', motivoForaPadrao: 'Valor fuera del patrón histórico',
    motivoDebitoNovo: 'Débito nuevo, nunca visto antes',
    entrada: 'Ingreso', saida: 'Salida', data: 'Fecha', descricao: 'Descripción', valor: 'Valor', categoria: 'Categoría',
    sucessoLancamentoCriado: '¡Registro creado y conciliado!', erroCriarLancamento: 'Error al crear el registro',
    sucessoVinculado: '¡Transacción conciliada!', erroVincularCandidato: 'Error al conciliar',
    sucessoDesconectado: 'Banco desconectado.', letreiroAtipicos: 'transacción(es) atípica(s) — merece(n) una mirada',
  },
}

// Lista de reserva (caso a busca ao Pluggy falhe) — só visual
const BANCOS_FALLBACK = [
  { id: 0, name: 'Nubank', primaryColor: '#a855f7', imageUrl: '', isSandbox: false },
  { id: 0, name: 'Itaú', primaryColor: '#FF8C00', imageUrl: '', isSandbox: false },
  { id: 0, name: 'Bradesco', primaryColor: '#f87171', imageUrl: '', isSandbox: false },
  { id: 0, name: 'Santander', primaryColor: '#f87171', imageUrl: '', isSandbox: false },
  { id: 0, name: 'Banco do Brasil', primaryColor: '#fbbf24', imageUrl: '', isSandbox: false },
  { id: 0, name: 'Caixa', primaryColor: '#38bdf8', imageUrl: '', isSandbox: false },
  { id: 0, name: 'Inter', primaryColor: '#FF8C00', imageUrl: '', isSandbox: false },
  { id: 0, name: 'C6 Bank', primaryColor: '#94a3b8', imageUrl: '', isSandbox: false },
]

function carregarPluggySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Sem janela'))
    if (typeof (window as any).PluggyConnect !== 'undefined') return resolve()

    const existente = document.querySelector('script[data-pluggy="1"]') as HTMLScriptElement | null
    if (existente) {
      existente.addEventListener('load', () => resolve())
      existente.addEventListener('error', () => reject(new Error('Falha ao carregar o Pluggy')))
      if (typeof (window as any).PluggyConnect !== 'undefined') resolve()
      return
    }

    const s = document.createElement('script')
    s.src = 'https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js'
    s.async = true
    s.setAttribute('data-pluggy', '1')
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Falha ao carregar o Pluggy'))
    document.body.appendChild(s)
  })
}

export default function OpenFinancePage() {
  const { idioma } = useLanguage()
  const lang = (idioma as Idioma) || 'pt'
  const t = textos[lang] || textos.pt
  const cx = cfoT(lang)
  const fmt = (v: number) => fBRL(v)

  const [empresaIdAtual, setEmpresaIdAtual] = useState<string | null>(null)
  const [conexoes, setConexoes] = useState<any[]>([])
  const [transacoesPeriodo, setTransacoesPeriodo] = useState<TransacaoOF[]>([])
  const [receitas, setReceitas] = useState<(LancamentoConciliavel & { status: string })[]>([])
  const [custos, setCustos] = useState<LancamentoConciliavel[]>([])
  const [descricoesHistoricas, setDescricoesHistoricas] = useState<Set<string>>(new Set())
  const [totalHistoricoSaidas, setTotalHistoricoSaidas] = useState(0)
  const [conectores, setConectores] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [conectando, setConectando] = useState(false)
  const [conectandoId, setConectandoId] = useState<number | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [tipoMsg, setTipoMsg] = useState<'sucesso' | 'erro' | ''>('')
  const [buscaBanco, setBuscaBanco] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<BaldeConciliacao>('pendente')
  const [criandoId, setCriandoId] = useState<string | null>(null)
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<string | null>(null)
  const [categoriaEscolhida, setCategoriaEscolhida] = useState<Record<string, string>>({})
  const [expandidoCandidatosId, setExpandidoCandidatosId] = useState<string | null>(null)
  const [confirmandoRemocaoId, setConfirmandoRemocaoId] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)
  const abasRef = useRef<HTMLDivElement>(null)

  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>('mes_atual')
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo('mes_atual'))
  const periodo = resolverPeriodo(presetPeriodo, personalizado)

  useEffect(() => { carregarTudo(); carregarConectores(); carregarPluggySDK().catch(() => {}) }, [presetPeriodo, personalizado.inicio, personalizado.fim])

  function avisar(tipo: 'sucesso' | 'erro', msg: string, ms = 5000) {
    setTipoMsg(tipo); setMensagem(msg)
    setTimeout(() => setMensagem(''), ms)
  }

  async function carregarTudo() {
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCarregando(false); return }
    const empresaId = await obterEmpresaAtiva()
    if (!empresaId) { setCarregando(false); return }
    setEmpresaIdAtual(empresaId)

    const [conexRes, txRes, receitasRes, custosRes, historicoRes] = await Promise.all([
      supabase.from('open_finance').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
      supabase.from('of_transacoes')
        .select('id, item_id, account_id, descricao, valor, tipo, categoria, data, pluggy_transaction_id, lancamento_id, lancamento_tabela')
        .eq('empresa_id', empresaId).gte('data', periodo.inicio).lte('data', periodo.fim).order('data', { ascending: false }),
      supabase.from('receitas').select('id, descricao, valor, data, categoria, status').eq('empresa_id', empresaId),
      supabase.from('custos_variaveis').select('id, descricao, valor, data, categoria').eq('empresa_id', empresaId),
      supabase.from('of_transacoes').select('descricao').eq('empresa_id', empresaId).eq('tipo', 'saida').lt('data', periodo.inicio).limit(1000),
    ])

    setConexoes(conexRes.data || [])
    setTransacoesPeriodo((txRes.data || []) as TransacaoOF[])
    setReceitas(receitasRes.data || [])
    setCustos(custosRes.data || [])
    const historico = historicoRes.data || []
    setDescricoesHistoricas(new Set(historico.map((h: any) => normalizarTexto(h.descricao || ''))))
    setTotalHistoricoSaidas(historico.length)
    setCarregando(false)
  }

  async function carregarConectores() {
    try {
      const res = await fetch('/api/pluggy/connectors')
      const data = await res.json()
      if (Array.isArray(data?.connectors) && data.connectors.length > 0) {
        const vistos = new Set<string>()
        const lista = data.connectors.filter((c: any) => {
          const chave = (c.name || '').toLowerCase()
          if (vistos.has(chave)) return false
          vistos.add(chave); return true
        })
        setConectores(lista)
      }
    } catch { /* usa fallback */ }
  }

  async function sincronizar(itemId?: string) {
    setSincronizando(true)
    try {
      const res = await fetch('/api/pluggy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemId ? { itemId } : {}),
      })
      const dados = await res.json()
      if (!res.ok || dados.error) throw new Error(dados.error || 'Erro ao sincronizar')
      await carregarTudo()
      avisar('sucesso', `${dados.total ?? 0} ${t.importadas}`)
    } catch (err: any) {
      avisar('erro', err.message || t.erro)
    } finally {
      setSincronizando(false)
    }
  }

  async function abrirWidget(connectorId?: number) {
    setConectando(true)
    if (connectorId) setConectandoId(connectorId)
    try {
      await carregarPluggySDK()
      const res = await fetch('/api/pluggy/connect-token', { method: 'POST' })
      const { accessToken, error } = await res.json()
      if (error) throw new Error(error)
      if (!accessToken) throw new Error('Token não recebido')

      const { data: { user } } = await supabase.auth.getUser()
      const PluggyConnect = (window as any).PluggyConnect
      if (!PluggyConnect) throw new Error('Widget Pluggy não carregou')

      const config: any = {
        connectToken: accessToken,
        includeSandbox: INCLUIR_SANDBOX,
        onSuccess: async (itemData: any) => {
          const itemId = itemData?.item?.id
          if (user && itemId) {
            const empresaId = await obterEmpresaAtiva()
            await supabase.from('open_finance').upsert({
              user_id: user.id, empresa_id: empresaId, item_id: itemId,
              conector_nome: itemData.item.connector?.name || '',
              conector_tipo: itemData.item.connector?.type || '',
              status: itemData.item.status || 'UPDATED',
            }, { onConflict: 'item_id' })
          }
          avisar('sucesso', t.sucesso)
          await carregarTudo()
          if (itemId) sincronizar(itemId)
        },
        onError: (err: any) => {
          avisar('erro', (err && (err.message || err.code)) ? `${t.erro}: ${err.message || err.code}` : t.erro)
        },
        onClose: () => { setConectando(false); setConectandoId(null) },
      }
      if (connectorId) config.connectorIds = [connectorId]

      const pluggyConnect = new PluggyConnect(config)
      pluggyConnect.init()
    } catch (err: any) {
      avisar('erro', err.message || t.erro)
      setConectando(false)
      setConectandoId(null)
    }
  }

  async function desconectarBanco(itemId: string) {
    if (!empresaIdAtual) return
    await supabase.from('open_finance').delete().eq('item_id', itemId).eq('empresa_id', empresaIdAtual)
    setConfirmandoRemocaoId(null)
    avisar('sucesso', t.sucessoDesconectado)
    await carregarTudo()
  }

  async function criarLancamento(tx: TransacaoClassificada) {
    if (!empresaIdAtual) return
    const categoria = categoriaEscolhida[tx.id] || tx.categoriaSugerida || (tx.tipo === 'entrada' ? CATEGORIAS_RECEITA[0] : CATEGORIAS_CUSTO[0])
    setCriandoId(tx.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: atual } = await supabase.from('of_transacoes').select('lancamento_id').eq('id', tx.id).maybeSingle()
      if (atual?.lancamento_id) { await carregarTudo(); return }

      const tabela = tx.tipo === 'entrada' ? 'receitas' : 'custos_variaveis'
      const payload: any = { descricao: tx.descricao, valor: tx.valor, data: tx.data, categoria, user_id: user.id, empresa_id: empresaIdAtual }
      if (tabela === 'receitas') payload.status = 'recebido'

      const { data: novoLancamento, error: errLanc } = await supabase.from(tabela).insert(payload).select('id').single()
      if (errLanc || !novoLancamento) { avisar('erro', t.erroCriarLancamento); return }

      const { error: errVinculo } = await supabase.from('of_transacoes')
        .update({ lancamento_id: novoLancamento.id, lancamento_tabela: tabela })
        .eq('id', tx.id)
      if (errVinculo) { avisar('erro', t.erroCriarLancamento); return }

      avisar('sucesso', t.sucessoLancamentoCriado)
      setEditandoCategoriaId(null)
      await carregarTudo()
    } finally {
      setCriandoId(null)
    }
  }

  async function escolherCandidato(tx: TransacaoClassificada, candidato: CandidatoLancamento) {
    setCriandoId(tx.id)
    try {
      const tabela = tx.tipo === 'entrada' ? 'receitas' : 'custos_variaveis'
      const { error } = await supabase.from('of_transacoes')
        .update({ lancamento_id: candidato.id, lancamento_tabela: tabela })
        .eq('id', tx.id)
      if (error) { avisar('erro', t.erroVincularCandidato); return }
      avisar('sucesso', t.sucessoVinculado)
      setExpandidoCandidatosId(null)
      await carregarTudo()
    } finally {
      setCriandoId(null)
    }
  }

  // ---- Classificação (calculada na hora, nunca guardada) ----
  const resultado = useMemo(() => classificarTransacoes({
    transacoes: transacoesPeriodo,
    receitas: receitas.map((r) => ({ id: r.id, descricao: r.descricao, valor: r.valor, data: r.data, categoria: r.categoria })),
    custosVariaveis: custos,
    descricoesHistoricasSaidas: descricoesHistoricas,
    totalHistoricoSaidas,
  }), [transacoesPeriodo, receitas, custos, descricoesHistoricas, totalHistoricoSaidas])

  // ---- Saldo do Sistema — fonte única, mesmo critério em KPI/letreiro/PDF ----
  const receitasRecebidas = useMemo(() => receitas.filter((r) => r.status === 'recebido'), [receitas])
  const saldoSistema = useMemo(() => calcularSaldoSistema(receitasRecebidas, custos), [receitasRecebidas, custos])
  const saldoBanco = useMemo(() => conexoes.reduce((s, c) => s + (Number(c.saldo_atual) || 0), 0), [conexoes])
  const kpis = useMemo(() => calcularKPIsOpenFinance({ saldoBanco, saldoSistema, resultado }), [saldoBanco, saldoSistema, resultado])

  const temBanco = conexoes.length > 0
  const divergenciaRelevante = Math.abs(kpis.divergencia) >= 1
  const corDivergencia = divergenciaRelevante ? VERMELHO : VERDE
  const corPctConciliado = kpis.percentualConciliado >= 90 ? VERDE : kpis.percentualConciliado >= 60 ? AMBAR : VERMELHO

  function irParaAba(aba: BaldeConciliacao) {
    setAbaAtiva(aba)
    abasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ---- Letreiro executivo — dados reais, prioriza risco > neutro > positivo, máx. 4 ----
  const itensLetreiro: ItemLetreiro[] = useMemo(() => {
    if (!temBanco) return []
    const itens: ItemLetreiro[] = []
    if (divergenciaRelevante) {
      itens.push({
        texto: `${t.kpiDivergencia}: ${fmt(kpis.divergencia)} — ${resultado.pendentes.length + resultado.atipicas.length} ${t.divergenciaConvite}`,
        cor: VERMELHO, destaque: true, onClick: () => irParaAba('pendente'),
      })
    }
    if (resultado.atipicas.length > 0) {
      itens.push({
        texto: `${resultado.atipicas.length} ${t.letreiroAtipicos}`,
        cor: VERMELHO, destaque: true, onClick: () => irParaAba('atipico'),
      })
    }
    if (kpis.dinheiroNaoExplicado > 0) {
      itens.push({
        texto: `${t.kpiNaoExplicado}: ${fmt(kpis.dinheiroNaoExplicado)}`,
        cor: AMBAR, destaque: true, onClick: () => irParaAba('pendente'),
      })
    }
    if (resultado.pendentes.length > 0) {
      itens.push({
        texto: `${resultado.pendentes.length} ${t.abaPendente.toLowerCase()}`,
        cor: AZUL, destaque: true, onClick: () => irParaAba('pendente'),
      })
    }
    if (itens.length === 0) {
      itens.push({ texto: t.divergenciaOk, cor: VERDE, destaque: true })
    }
    return itens.slice(0, 4)
  }, [temBanco, divergenciaRelevante, resultado, kpis, lang])

  const corLetreiro = itensLetreiro.some((i) => i.cor === VERMELHO) ? VERMELHO
    : itensLetreiro.some((i) => i.cor === AMBAR || i.cor === AZUL) ? AZUL : VERDE

  // ---- Bancos: busca + prioridade + separação sandbox ----
  const bancosBase = conectores.length > 0 ? conectores : BANCOS_FALLBACK
  const buscaNorm = normalizarTexto(buscaBanco)
  const bancosFiltrados = buscaNorm ? bancosBase.filter((b) => normalizarTexto(b.name || '').includes(buscaNorm)) : bancosBase
  const prioridade = (nome: string) => {
    const n = normalizarTexto(nome || '')
    const idx = BANCOS_PRIORITARIOS.findIndex((p) => n.includes(p))
    return idx === -1 ? 999 : idx
  }
  const bancosReais = bancosFiltrados.filter((b) => !b.isSandbox).sort((a, b) => prioridade(a.name) - prioridade(b.name))
  const bancosSandbox = bancosFiltrados.filter((b) => b.isSandbox)

  // ---- PDF / Compartilhar (mesmo critério de Saldo do Sistema do KPI) ----
  const linhasPdf = useMemo(() => {
    const todas = [...resultado.conciliadas, ...resultado.pendentes, ...resultado.atipicas]
    return todas.sort((a, b) => (b.data || '').localeCompare(a.data || ''))
  }, [resultado])

  const exportarPDF = async () => {
    setExportando(true)
    try {
      gerarPdfTabela({
        titulo: t.titulo, subtitulo: t.sub,
        colunas: [
          { header: t.data, key: 'data', width: 2 },
          { header: t.descricao, key: 'descricao', width: 4 },
          { header: t.categoria, key: 'categoria', width: 3 },
          { header: 'Status', key: 'status', width: 2 },
          { header: t.valor, key: 'valor', width: 2, align: 'right' },
        ],
        linhas: linhasPdf.map((tx) => ({
          data: tx.data ? new Date(tx.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
          descricao: tx.descricao,
          categoria: tx.categoria || '-',
          status: tx.balde === 'conciliado' ? t.abaConciliado : tx.balde === 'atipico' ? t.abaAtipico : t.abaPendente,
          valor: `${tx.tipo === 'saida' ? '-' : '+'} R$ ${fBRL2(tx.valor)}`,
        })),
        resumo: [
          { label: t.kpiSaldoBanco, valor: `R$ ${fBRL2(kpis.saldoBanco)}` },
          { label: t.kpiSaldoSistema, valor: `R$ ${fBRL2(kpis.saldoSistema)}` },
          { label: t.kpiDivergencia, valor: `R$ ${fBRL2(kpis.divergencia)}` },
          { label: t.kpiNaoExplicado, valor: `R$ ${fBRL2(kpis.dinheiroNaoExplicado)}` },
          { label: t.kpiPctConciliado, valor: fPct(kpis.percentualConciliado) },
        ],
        nomeArquivo: `axioma-open-finance-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${t.titulo}`,
    `🏦 ${t.kpiSaldoBanco}: R$ ${fBRL2(kpis.saldoBanco)}`,
    `📒 ${t.kpiSaldoSistema}: R$ ${fBRL2(kpis.saldoSistema)}`,
    `⚖️ ${t.kpiDivergencia}: R$ ${fBRL2(kpis.divergencia)}`,
    `✅ ${t.kpiPctConciliado}: ${fPct(kpis.percentualConciliado)}`,
    `_axiomaai.com.br_`,
  ].join('\n')
  const textoDetalhado = linhasPdf.map((tx) =>
    `${tx.data} | ${tx.descricao} | ${tx.categoria || '-'} | R$ ${fBRL2(tx.valor)}`
  ).join('\n')

  const motivoLabel = (motivo: string | null | undefined) =>
    motivo === 'duplicidade' ? t.motivoDuplicidade : motivo === 'fora_padrao' ? t.motivoForaPadrao : motivo === 'debito_novo' ? t.motivoDebitoNovo : ''

  const listaAtiva = abaAtiva === 'conciliado' ? resultado.conciliadas : abaAtiva === 'pendente' ? resultado.pendentes : resultado.atipicas
  const corAba = (aba: BaldeConciliacao) => aba === 'conciliado' ? VERDE : aba === 'pendente' ? AZUL : VERMELHO

  return (
    <ModuloLayout titulo={t.titulo} subtitulo={t.sub} onExportarPDF={exportarPDF} exportando={exportando}>
      <div className="space-y-4">

        {temBanco && <LetreiroExecutivo itens={itensLetreiro} cor={corLetreiro} />}

        <div className="flex justify-end">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        <AnimatePresence>
          {mensagem && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)', border: `1px solid ${tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.4)' : 'rgba(220,38,38,0.4)'}` }}>
              {tipoMsg === 'sucesso' ? <CheckCircle size={18} color={VERDE} /> : <AlertCircle size={18} color={VERMELHO} />}
              <p className="text-sm font-semibold" style={{ color: tipoMsg === 'sucesso' ? VERDE : VERMELHO }}>{mensagem}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- KPIs executivos: Saldo do Banco vs Sistema vs Divergência ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <CanvasBox cor={JADE}>
            <p className="text-[10px] font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{t.kpiSaldoBanco}</p>
            <p className="text-lg md:text-2xl font-black" style={{ ...FONTE_EXEC, color: JADE }}>{fmt(saldoBanco)}</p>
          </CanvasBox>
          <CanvasBox cor={BRONZE}>
            <p className="text-[10px] font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{t.kpiSaldoSistema}</p>
            <p className="text-lg md:text-2xl font-black mb-1" style={{ ...FONTE_EXEC, color: BRONZE }}>{fmt(saldoSistema)}</p>
            <p className="text-[10px] leading-snug" style={{ color: '#3a5a8a' }}>{t.saldoSistemaExplicacao}</p>
          </CanvasBox>
          <CanvasBox cor={corDivergencia}>
            <p className="text-[10px] font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{t.kpiDivergencia}</p>
            <p className="text-lg md:text-2xl font-black mb-1" style={{ ...FONTE_EXEC, color: corDivergencia }}>{fmt(kpis.divergencia)}</p>
            {divergenciaRelevante ? (
              <button onClick={() => irParaAba('pendente')} className="text-[11px] font-semibold underline text-left" style={{ color: corDivergencia }}>
                {resultado.pendentes.length + resultado.atipicas.length} {t.divergenciaConvite}
              </button>
            ) : (
              <p className="text-[11px] font-semibold" style={{ color: VERDE }}>{t.divergenciaOk}</p>
            )}
          </CanvasBox>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <CanvasBox cor={AMBAR}>
            <p className="text-[10px] font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{t.kpiNaoExplicado}</p>
            <p className="text-lg md:text-2xl font-black" style={{ ...FONTE_EXEC, color: kpis.dinheiroNaoExplicado > 0 ? AMBAR : VERDE }}>{fmt(kpis.dinheiroNaoExplicado)}</p>
          </CanvasBox>
          <CanvasBox cor={corPctConciliado}>
            <p className="text-[10px] font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{t.kpiPctConciliado}</p>
            <p className="text-lg md:text-2xl font-black" style={{ ...FONTE_EXEC, color: corPctConciliado }}>{fPct(kpis.percentualConciliado)}</p>
          </CanvasBox>
        </div>

        {/* ---- Período ---- */}
        <SeletorPeriodo preset={presetPeriodo} onChangePreset={setPresetPeriodo} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={AZUL} lang={lang} />

        {/* ---- Ação: sincronizar / conectar ---- */}
        <CanvasBox cor={AZUL}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(106,176,255,0.1)' }}>
                <Building2 size={28} style={{ color: AZUL }} />
              </div>
              <div>
                <h3 className="font-black text-lg" style={{ color: '#c8d8f0' }}>{temBanco ? t.conectado : t.semConexao}</h3>
                <p className="text-sm" style={{ color: '#3a6090' }}>{t.conecteSeu}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {temBanco && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => sincronizar()} disabled={sincronizando}
                  className="px-4 py-3 rounded-xl font-black text-sm tracking-widest uppercase flex items-center gap-2"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: VERDE, opacity: sincronizando ? 0.7 : 1 }}>
                  <RefreshCw size={16} className={sincronizando ? 'animate-spin' : ''} />
                  {sincronizando ? t.sincronizando : t.sincronizar}
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => abrirWidget()} disabled={conectando}
                className="px-6 py-3 rounded-xl font-black text-sm tracking-widest uppercase flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', opacity: conectando ? 0.7 : 1 }}>
                {conectando && !conectandoId ? <RefreshCw size={16} className="animate-spin" /> : <Building2 size={16} />}
                {conectando && !conectandoId ? t.carregando : t.conectar}
              </motion.button>
            </div>
          </div>
        </CanvasBox>

        {/* ---- Bancos: busca + prioridade + separação sandbox ---- */}
        <CanvasBox cor="#a78bfa">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#a78bfa' }}>{t.bancos}</p>
            <p className="text-xs" style={{ color: '#3a5a8a' }}>{t.cliqueBanco}</p>
          </div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3a5a8a' }} />
            <input
              value={buscaBanco} onChange={(e) => setBuscaBanco(e.target.value)} placeholder={t.buscarBanco}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(167,139,250,0.25)', color: '#e2ecf7' }}
            />
          </div>

          {bancosFiltrados.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#3a5a8a' }}>{t.semResultadoBusca}</p>
          ) : (
            <>
              {bancosReais.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-2">
                  {bancosReais.map((banco, i) => (
                    <CartaoBanco key={`${banco.name}-${i}`} banco={banco} i={i} conectando={conectando} conectandoId={conectandoId} carregando={t.carregando} onClick={abrirWidget} />
                  ))}
                </div>
              )}

              {bancosSandbox.length > 0 && (
                <div className="mt-5 pt-4" style={{ borderTop: '1px dashed rgba(167,139,250,0.25)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical size={14} style={{ color: '#94a3b8' }} />
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#94a3b8' }}>{t.ambienteTeste}</p>
                    <span className="text-[11px]" style={{ color: '#5a7a9a' }}>— {t.ambienteTesteDesc}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 opacity-70">
                    {bancosSandbox.map((banco, i) => (
                      <CartaoBanco key={`${banco.name}-sb-${i}`} banco={banco} i={i} conectando={conectando} conectandoId={conectandoId} carregando={t.carregando} onClick={abrirWidget} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CanvasBox>

        {/* ---- Conexões ativas — lápis/lixeira ---- */}
        {temBanco && (
          <CanvasBox cor={VERDE}>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: VERDE }}>{t.conexoesAtivas} ({conexoes.length})</p>
            <div className="space-y-3">
              {conexoes.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl flex-wrap"
                  style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Landmark size={20} style={{ color: VERDE }} />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#c8d8f0' }}>{c.conector_nome || 'Banco'}</p>
                      <p className="text-xs" style={{ color: '#3a6090' }}>{fmt(Number(c.saldo_atual) || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: VERDE, border: '1px solid rgba(52,211,153,0.3)' }}>{c.status}</span>
                    {confirmandoRemocaoId === c.item_id ? (
                      <>
                        <button onClick={() => desconectarBanco(c.item_id)} className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.2)', color: VERMELHO, border: `1px solid ${VERMELHO}50` }}>{t.confirmarDesconectar}</button>
                        <button onClick={() => setConfirmandoRemocaoId(null)} className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#5a7a9a' }}>{t.cancelar}</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmandoRemocaoId(c.item_id)} title={t.desconectar} className="p-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.08)', color: VERMELHO }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CanvasBox>
        )}

        {/* ---- Abas de conciliação ---- */}
        <div ref={abasRef} className="scroll-mt-20">
          <CanvasBox cor={corAba(abaAtiva)}>
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              {(['pendente', 'conciliado', 'atipico'] as BaldeConciliacao[]).map((aba) => {
                const cor = corAba(aba)
                const contagem = aba === 'conciliado' ? resultado.conciliadas.length : aba === 'pendente' ? resultado.pendentes.length : resultado.atipicas.length
                const label = aba === 'conciliado' ? t.abaConciliado : aba === 'pendente' ? t.abaPendente : t.abaAtipico
                const ativa = abaAtiva === aba
                return (
                  <button key={aba} onClick={() => setAbaAtiva(aba)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap flex-shrink-0"
                    style={{ background: ativa ? `${cor}22` : 'transparent', border: `1px solid ${ativa ? cor : 'transparent'}`, color: ativa ? cor : '#5a7a9a' }}>
                    {label} ({contagem})
                  </button>
                )
              })}
            </div>

            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${AZUL} transparent transparent transparent` }} />
              </div>
            ) : !temBanco ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🏦</p>
                <p className="text-sm font-semibold" style={{ color: '#3a5a8a' }}>{t.semConexao}</p>
                <p className="text-xs mt-1" style={{ color: '#3a5a8a' }}>{t.conecteSeu}</p>
              </div>
            ) : listaAtiva.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">{abaAtiva === 'conciliado' ? '🔗' : abaAtiva === 'pendente' ? '📭' : '✅'}</p>
                <p className="text-sm font-semibold" style={{ color: '#3a5a8a' }}>
                  {abaAtiva === 'conciliado' ? t.semTransacoesConciliadas : abaAtiva === 'pendente' ? t.semTransacoesPendentes : t.semTransacoesAtipicas}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {listaAtiva.map((tx) => (
                  <LinhaTransacao
                    key={tx.id} tx={tx} t={t} fmt={fmt}
                    criandoId={criandoId} editandoCategoriaId={editandoCategoriaId} setEditandoCategoriaId={setEditandoCategoriaId}
                    categoriaEscolhida={categoriaEscolhida} setCategoriaEscolhida={setCategoriaEscolhida}
                    expandidoCandidatosId={expandidoCandidatosId} setExpandidoCandidatosId={setExpandidoCandidatosId}
                    onCriarLancamento={criarLancamento} onEscolherCandidato={escolherCandidato}
                    motivoLabel={motivoLabel}
                  />
                ))}
              </div>
            )}
          </CanvasBox>
        </div>

      </div>

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={lang}
        textoResumo={textoShare}
        textoDetalhado={textoDetalhado}
        assunto={`${t.titulo} — Axioma`}
        onExportarPDF={exportarPDF}
        cor={JADE}
      />
    </ModuloLayout>
  )
}

function CartaoBanco({ banco, i, conectando, conectandoId, carregando, onClick }: {
  banco: any; i: number; conectando: boolean; conectandoId: number | null; carregando: string; onClick: (id?: number) => void
}) {
  const cor = banco.primaryColor || '#6ab0ff'
  const clicavel = banco.id > 0
  const carregandoEste = conectandoId === banco.id && banco.id > 0
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}
      whileHover={clicavel ? { scale: 1.04, y: -2 } : {}} whileTap={clicavel ? { scale: 0.97 } : {}}
      onClick={() => clicavel && onClick(banco.id)} disabled={conectando || !clicavel}
      className="relative flex items-center gap-3 p-3 rounded-2xl text-left overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${cor}18, rgba(4,10,22,0.6))`, border: `1px solid ${cor}45`, cursor: clicavel ? 'pointer' : 'default', opacity: conectando && !carregandoEste ? 0.6 : 1 }}
    >
      <div className="flex items-center justify-center rounded-xl shrink-0 overflow-hidden" style={{ width: 40, height: 40, background: '#fff' }}>
        {banco.imageUrl
          ? <img src={banco.imageUrl} alt={banco.name} width={40} height={40} style={{ objectFit: 'contain', width: 40, height: 40 }} />
          : <span className="font-black text-lg" style={{ color: cor }}>{(banco.name || '?').charAt(0)}</span>}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: '#e2ecf7' }}>{banco.name}</p>
        {carregandoEste && <span className="text-xs flex items-center gap-1" style={{ color: cor }}><RefreshCw size={11} className="animate-spin" /> {carregando}</span>}
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: cor }} />
    </motion.button>
  )
}

function LinhaTransacao({
  tx, t, fmt, criandoId, editandoCategoriaId, setEditandoCategoriaId,
  categoriaEscolhida, setCategoriaEscolhida, expandidoCandidatosId, setExpandidoCandidatosId,
  onCriarLancamento, onEscolherCandidato, motivoLabel,
}: {
  tx: TransacaoClassificada; t: typeof textos.pt; fmt: (v: number) => string
  criandoId: string | null
  editandoCategoriaId: string | null; setEditandoCategoriaId: (id: string | null) => void
  categoriaEscolhida: Record<string, string>; setCategoriaEscolhida: (fn: any) => void
  expandidoCandidatosId: string | null; setExpandidoCandidatosId: (id: string | null) => void
  onCriarLancamento: (tx: TransacaoClassificada) => void
  onEscolherCandidato: (tx: TransacaoClassificada, c: CandidatoLancamento) => void
  motivoLabel: (m: string | null | undefined) => string
}) {
  const corValor = tx.tipo === 'entrada' ? VERDE : VERMELHO
  const categorias = tx.tipo === 'entrada' ? CATEGORIAS_RECEITA : CATEGORIAS_CUSTO
  const categoriaAtual = categoriaEscolhida[tx.id] || tx.categoriaSugerida || categorias[0]
  const editando = editandoCategoriaId === tx.id
  const criando = criandoId === tx.id

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(106,176,255,0.08)' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: '#c8d8f0' }}>{tx.descricao}</p>
          <p className="text-xs" style={{ color: '#5a7a9a' }}>
            {tx.data ? new Date(tx.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'} · {tx.tipo === 'entrada' ? t.entrada : t.saida}
          </p>
        </div>
        <p className="text-sm font-black flex-shrink-0" style={{ color: corValor }}>{tx.tipo === 'saida' ? '- ' : '+ '}{fmt(tx.valor)}</p>
      </div>

      {tx.balde === 'conciliado' && tx.lancamentoCasado && (
        <p className="text-xs mt-2" style={{ color: VERDE }}>
          {t.casadoCom}: {tx.lancamentoCasado.descricao} ({new Date(tx.lancamentoCasado.data + 'T00:00:00').toLocaleDateString('pt-BR')})
        </p>
      )}

      {tx.balde === 'atipico' && (
        <p className="text-xs mt-2 font-semibold" style={{ color: VERMELHO }}>⚠️ {motivoLabel(tx.motivoAtipico)}</p>
      )}

      {tx.balde === 'pendente' && tx.candidatos && tx.candidatos.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold mb-2" style={{ color: AMBAR }}>⚠️ {tx.candidatos.length > 1 ? t.multiplosCandidatos : t.candidatoContestado}</p>
          {expandidoCandidatosId === tx.id ? (
            <div className="space-y-1.5">
              {tx.candidatos.map((c) => (
                <button key={c.id} onClick={() => onEscolherCandidato(tx, c)} disabled={criando}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#c8d8f0' }}>
                  <span className="truncate">{c.descricao} — {new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  <span className="font-bold flex-shrink-0" style={{ color: AMBAR }}>{t.confirmarEscolha}</span>
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setExpandidoCandidatosId(tx.id)}
              className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: AMBAR }}>
              {t.escolherLancamento}
            </button>
          )}
        </div>
      )}

      {tx.balde === 'pendente' && (!tx.candidatos || tx.candidatos.length === 0) && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {editando ? (
            <>
              <select
                value={categoriaAtual}
                onChange={(e) => setCategoriaEscolhida((prev: Record<string, string>) => ({ ...prev, [tx.id]: e.target.value }))}
                className="px-2 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(106,176,255,0.25)', color: '#c8d8f0' }}
              >
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => setEditandoCategoriaId(null)} className="p-1.5 rounded-lg" style={{ color: '#5a7a9a' }}><X size={14} /></button>
            </>
          ) : (
            <button onClick={() => setEditandoCategoriaId(tx.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(106,176,255,0.08)', border: '1px solid rgba(106,176,255,0.2)', color: AZUL }}>
              <Pencil size={11} /> {tx.categoriaSugerida ? `${t.categoriaSugerida}: ${categoriaAtual}` : t.semSugestao}
            </button>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onCriarLancamento(tx)} disabled={criando}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: VERDE, opacity: criando ? 0.7 : 1 }}>
            {criando ? <RefreshCw size={12} className="animate-spin" /> : <ArrowRight size={12} />}
            {criando ? t.criando : t.criarLancamento}
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
