'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { Inbox, Trash2, CheckCircle2, Pencil, X, Search, AlertTriangle } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const formasRecebimento = ['PIX', 'Crédito', 'Débito', 'Boleto', 'Dinheiro', 'Transferência']
const categorias = ['Vendas', 'Serviços', 'Mensalidade', 'Consultoria', 'Outros']

type Cliente = { id: string; nome: string }

type Conta = {
  id: string
  descricao: string
  valor: number
  valor_recebido?: number
  data_vencimento: string
  data_emissao?: string
  data_recebimento?: string | null
  status?: string
  cliente_id?: string | null
  forma_recebimento?: string
  numero_documento?: string
  categoria?: string
  parcelas?: number
  taxa_juros?: number
  taxa_multa?: number
  observacoes?: string
}

const contaVazia = {
  descricao: '', valor: '', valor_recebido: '', data_vencimento: '', data_emissao: '',
  cliente_id: '', forma_recebimento: formasRecebimento[0], numero_documento: '',
  categoria: categorias[0], parcelas: '1', taxa_juros: '', taxa_multa: '', observacoes: '',
}

export default function ContasReceber() {
  const { idioma } = useLanguage()
  const [contas, setContas] = useState<Conta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)
  const [nc, setNc] = useState({ ...contaVazia })
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const [modalReceber, setModalReceber] = useState(false)
  const [contaReceber, setContaReceber] = useState<Conta | null>(null)
  const [valorReceber, setValorReceber] = useState('')
  const [recebendo, setRecebendo] = useState(false)

  const txt = {
    titulo: idioma === 'pt' ? 'Contas a Receber' : idioma === 'en' ? 'Accounts Receivable' : 'Cuentas por Cobrar',
    subtitulo: idioma === 'pt' ? 'Gerencie os valores que seus clientes devem pagar' : idioma === 'en' ? 'Manage amounts your clients owe' : 'Gestiona los montos que deben pagar',
    novo: idioma === 'pt' ? 'Nova Conta' : idioma === 'en' ? 'New Account' : 'Nueva Cuenta',
    editar: idioma === 'pt' ? 'Editar Conta' : idioma === 'en' ? 'Edit Account' : 'Editar Cuenta',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    semContas: idioma === 'pt' ? 'Nenhuma conta cadastrada.' : idioma === 'en' ? 'No accounts yet.' : 'Sin cuentas aún.',
    vence: idioma === 'pt' ? 'Vence' : idioma === 'en' ? 'Due' : 'Vence',
  }

  function statusLabel(s?: string) {
    if (s === 'recebido') return idioma === 'pt' ? 'Recebido' : 'Received'
    if (s === 'parcial') return idioma === 'pt' ? 'Parcial' : 'Partial'
    if (s === 'vencido') return idioma === 'pt' ? 'Vencido' : 'Overdue'
    return idioma === 'pt' ? 'A Receber' : 'Pending'
  }
  function statusCor(s?: string) {
    if (s === 'recebido') return '#34d399'
    if (s === 'parcial') return '#6ab0ff'
    if (s === 'vencido') return '#f87171'
    return '#fbbf24'
  }

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: empresa } = await supabase.from('empresas').select('id').eq('user_id', user.id).maybeSingle()
    setEmpresaId(empresa?.id || null)
    const { data: cli } = await supabase.from('clientes').select('id, nome').eq('user_id', user.id).order('nome')
    const { data } = await supabase.from('contas_receber').select('*').eq('user_id', user.id).order('data_vencimento', { ascending: true })
    setClientes(cli || [])
    setContas(data || [])
    setLoading(false)
  }

  const hoje = new Date().toISOString().split('T')[0]

  function calcStatus(total: number, recebido: number, venc?: string) {
    if (recebido >= total && total > 0) return 'recebido'
    if (recebido > 0 && recebido < total) return 'parcial'
    if (venc && venc < hoje) return 'vencido'
    return 'pendente'
  }

  function diasAtraso(venc?: string) {
    if (!venc || venc >= hoje) return 0
    const d1 = new Date(venc + 'T00:00:00').getTime()
    const d2 = new Date(hoje + 'T00:00:00').getTime()
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
  }

  function encargos(conta: Conta) {
    const saldo = Math.max(0, (conta.valor || 0) - (conta.valor_recebido || 0))
    const dias = diasAtraso(conta.data_vencimento)
    if (dias <= 0 || saldo <= 0) return { multa: 0, juros: 0, total: 0 }
    const multa = saldo * ((conta.taxa_multa || 0) / 100)
    const juros = saldo * ((conta.taxa_juros || 0) / 100) * (dias / 30)
    return { multa, juros, total: multa + juros }
  }

  function abrirNovo() {
    setEditando(null); setNc({ ...contaVazia }); setModalAberto(true)
  }

  function abrirEdicao(c: Conta) {
    setEditando(c)
    setNc({
      descricao: c.descricao || '', valor: String(c.valor || ''), valor_recebido: String(c.valor_recebido || ''),
      data_vencimento: c.data_vencimento || '', data_emissao: c.data_emissao || '',
      cliente_id: c.cliente_id || '', forma_recebimento: c.forma_recebimento || formasRecebimento[0],
      numero_documento: c.numero_documento || '', categoria: c.categoria || categorias[0],
      parcelas: String(c.parcelas || '1'), taxa_juros: String(c.taxa_juros || ''),
      taxa_multa: String(c.taxa_multa || ''), observacoes: c.observacoes || '',
    })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null); setNc({ ...contaVazia })
  }

  async function salvar() {
    if (!nc.descricao || !nc.valor || !nc.data_vencimento) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const total = parseFloat(nc.valor || '0')
    const recebido = parseFloat(nc.valor_recebido || '0')
    const status = calcStatus(total, recebido, nc.data_vencimento)
    const payload: any = {
      descricao: nc.descricao, valor: total, valor_recebido: recebido,
      data_vencimento: nc.data_vencimento, data_emissao: nc.data_emissao || null,
      cliente_id: nc.cliente_id || null, forma_recebimento: nc.forma_recebimento,
      numero_documento: nc.numero_documento, categoria: nc.categoria,
      parcelas: parseInt(nc.parcelas || '1'), taxa_juros: parseFloat(nc.taxa_juros || '0'),
      taxa_multa: parseFloat(nc.taxa_multa || '0'), observacoes: nc.observacoes,
      data_recebimento: status === 'recebido' ? new Date().toISOString().split('T')[0] : null,
      status, empresa_id: empresaId,
    }
    if (editando) {
      await supabase.from('contas_receber').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('contas_receber').insert({ ...payload, user_id: user.id })
    }
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('contas_receber').delete().eq('id', id)
    setContas(contas.filter(c => c.id !== id))
  }

  function abrirReceber(c: Conta) {
    setContaReceber(c)
    const saldo = Math.max(0, (c.valor || 0) - (c.valor_recebido || 0))
    setValorReceber(String(saldo.toFixed(2)))
    setModalReceber(true)
  }

  async function confirmarRecebimento() {
    if (!contaReceber) return
    setRecebendo(true)
    const novoRecebido = (contaReceber.valor_recebido || 0) + parseFloat(valorReceber || '0')
    const status = calcStatus(contaReceber.valor, novoRecebido, contaReceber.data_vencimento)
    await supabase.from('contas_receber').update({
      valor_recebido: novoRecebido,
      status,
      data_recebimento: status === 'recebido' ? new Date().toISOString().split('T')[0] : contaReceber.data_recebimento || null,
    }).eq('id', contaReceber.id)
    setModalReceber(false); setContaReceber(null); setValorReceber('')
    setRecebendo(false); carregar()
  }

  const exportarPDF = async () => {
    setExportando(true)
    try {
      const fmtN = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      gerarPdfTabela({
        titulo: txt.titulo,
        subtitulo: txt.subtitulo,
        colunas: [
          { header: 'Descrição', key: 'desc', width: 3 },
          { header: 'Cliente', key: 'cli', width: 3 },
          { header: 'Vencimento', key: 'venc', width: 2 },
          { header: 'Status', key: 'status', width: 2 },
          { header: 'Total (R$)', key: 'total', width: 2, align: 'right' },
          { header: 'Recebido (R$)', key: 'rec', width: 2, align: 'right' },
          { header: 'Saldo (R$)', key: 'saldo', width: 2, align: 'right' },
        ],
        linhas: contasFiltradas.map((c) => ({
          desc: c.descricao,
          cli: clientes.find(x => x.id === c.cliente_id)?.nome || '-',
          venc: c.data_vencimento ? new Date(c.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
          status: statusLabel(c.status),
          total: fmtN(c.valor || 0),
          rec: fmtN(c.valor_recebido || 0),
          saldo: fmtN(Math.max(0, (c.valor || 0) - (c.valor_recebido || 0))),
        })),
        resumo: [
          { label: 'Total a Receber', valor: `R$ ${fmtN(totalAReceber)}` },
          { label: 'Total Recebido', valor: `R$ ${fmtN(totalRecebido)}` },
          { label: 'Vencido', valor: `R$ ${fmtN(totalVencido)}` },
          { label: 'Juros + Multa (estim.)', valor: `R$ ${fmtN(totalEncargos)}` },
        ],
        nomeArquivo: `axioma-contas-receber-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const contasFiltradas = contas.filter(c => {
    const cliNome = clientes.find(x => x.id === c.cliente_id)?.nome || ''
    return c.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      cliNome.toLowerCase().includes(busca.toLowerCase())
  })

  const totalAReceber = contas.reduce((s, c) => s + Math.max(0, (c.valor || 0) - (c.valor_recebido || 0)), 0)
  const totalRecebido = contas.reduce((s, c) => s + (c.valor_recebido || 0), 0)
  const totalVencido = contas.filter(c => c.status !== 'recebido' && c.data_vencimento < hoje)
    .reduce((s, c) => s + Math.max(0, (c.valor || 0) - (c.valor_recebido || 0)), 0)
  const totalEncargos = contas.reduce((s, c) => s + encargos(c).total, 0)

  const aging = { aVencer: 0, d30: 0, d60: 0, mais60: 0 }
  contas.forEach(c => {
    if (c.status === 'recebido') return
    const saldo = Math.max(0, (c.valor || 0) - (c.valor_recebido || 0))
    const dias = diasAtraso(c.data_vencimento)
    if (dias <= 0) aging.aVencer += saldo
    else if (dias <= 30) aging.d30 += saldo
    else if (dias <= 60) aging.d60 += saldo
    else aging.mais60 += saldo
  })

  const labelInput = 'text-xs font-semibold tracking-wider uppercase mb-2 block'
  const inputCls = 'w-full px-4 py-3 rounded-xl focus:outline-none text-sm'
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }
  const selectStyle = { background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#020810' }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo} onExportarPDF={exportarPDF} exportando={exportando} onNovo={abrirNovo} labelBotao={txt.novo}>
      <div className="space-y-4">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: idioma === 'pt' ? 'A Receber' : 'Receivable', value: fmt(totalAReceber), cor: '#fbbf24' },
            { label: idioma === 'pt' ? 'Recebido' : 'Received', value: fmt(totalRecebido), cor: '#34d399' },
            { label: idioma === 'pt' ? 'Vencido' : 'Overdue', value: fmt(totalVencido), cor: '#f87171' },
            { label: idioma === 'pt' ? 'Juros + Multa' : 'Interest + Fine', value: fmt(totalEncargos), cor: '#a78bfa' },
          ].map((card) => (
            <CanvasBox key={card.label} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-lg md:text-2xl font-black" style={{ color: card.cor }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        <CanvasBox cor="#6ab0ff">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#6ab0ff' }}>
            {idioma === 'pt' ? 'Envelhecimento (Aging)' : 'Aging'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: idioma === 'pt' ? 'A vencer' : 'Not due', val: aging.aVencer, cor: '#34d399' },
              { label: idioma === 'pt' ? 'Vencido 1-30d' : 'Overdue 1-30d', val: aging.d30, cor: '#fbbf24' },
              { label: idioma === 'pt' ? 'Vencido 31-60d' : 'Overdue 31-60d', val: aging.d60, cor: '#f59e0b' },
              { label: idioma === 'pt' ? 'Vencido +60d' : 'Overdue +60d', val: aging.mais60, cor: '#f87171' },
            ].map((b) => (
              <div key={b.label} className="rounded-xl p-3 text-center" style={{ background: `${b.cor}10`, border: `1px solid ${b.cor}30` }}>
                <p className="text-sm font-black" style={{ color: b.cor }}>{fmt(b.val)}</p>
                <p className="text-xs mt-0.5" style={{ color: '#5a7a9a' }}>{b.label}</p>
              </div>
            ))}
          </div>
        </CanvasBox>

        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2">
            <Search size={16} style={{ color: '#5a7a9a' }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={idioma === 'pt' ? 'Buscar por descrição ou cliente...' : 'Search...'} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: '#c8d8f0' }} />
          </div>
        </CanvasBox>

        {contasFiltradas.length === 0 ? (
          <CanvasBox cor="#6ab0ff">
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
              <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semContas}</p>
            </div>
          </CanvasBox>
        ) : (
          <div className="space-y-3">
            {contasFiltradas.map((conta, i) => {
              const cliNome = clientes.find(x => x.id === conta.cliente_id)?.nome
              const saldo = Math.max(0, (conta.valor || 0) - (conta.valor_recebido || 0))
              const prog = conta.valor > 0 ? ((conta.valor_recebido || 0) / conta.valor) * 100 : 0
              const cor = statusCor(conta.status)
              const dias = diasAtraso(conta.data_vencimento)
              const enc = encargos(conta)
              return (
                <motion.div key={conta.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap" style={{ opacity: conta.status === 'recebido' ? 0.8 : 1 }}>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm" style={{ color: '#c8d8f0' }}>{conta.descricao}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {cliNome && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(106,176,255,0.1)', color: '#6ab0ff' }}>👤 {cliNome}</span>}
                          {conta.forma_recebimento && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{conta.forma_recebimento}</span>}
                          {conta.numero_documento && <span className="text-xs" style={{ color: '#5a7a9a' }}>Doc: {conta.numero_documento}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: `${cor}15`, color: cor }}>{statusLabel(conta.status)}</span>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(conta)}><Pencil size={15} style={{ color: '#6ab0ff' }} /></motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(conta.id)}><Trash2 size={15} style={{ color: '#f87171' }} /></motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: idioma === 'pt' ? 'Total' : 'Total', val: fmt(conta.valor), cor: '#c8d8f0' },
                        { label: idioma === 'pt' ? 'Recebido' : 'Received', val: fmt(conta.valor_recebido || 0), cor: '#34d399' },
                        { label: idioma === 'pt' ? 'Saldo' : 'Balance', val: fmt(saldo), cor: '#fbbf24' },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-xs mb-0.5" style={{ color: '#5a7a9a' }}>{s.label}</p>
                          <p className="text-sm font-black" style={{ color: s.cor }}>{s.val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="w-full h-2 rounded-full mb-2" style={{ background: 'rgba(59,111,212,0.1)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(prog, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, #1a3a8f, ${cor})` }} />
                    </div>

                    {dias > 0 && conta.status !== 'recebido' && (
                      <div className="flex items-center gap-2 mb-2 text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171' }}>
                        <AlertTriangle size={13} />
                        <span>
                          {idioma === 'pt' ? `Vencido há ${dias} dia(s)` : `${dias} day(s) overdue`}
                          {enc.total > 0 && ` · ${idioma === 'pt' ? 'Juros+Multa' : 'Interest+Fine'}: ${fmt(enc.total)}`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs" style={{ color: '#5a7a9a' }}>
                        {txt.vence}: {new Date((conta.data_vencimento || '') + 'T00:00:00').toLocaleDateString('pt-BR')}
                        {conta.parcelas && conta.parcelas > 1 ? ` · ${conta.parcelas}x` : ''}
                      </span>
                      {conta.status !== 'recebido' && (
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => abrirReceber(conta)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                          <CheckCircle2 size={13} /> {idioma === 'pt' ? 'Receber' : 'Receive'}
                        </motion.button>
                      )}
                    </div>
                  </CanvasBox>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-lg">
              <CanvasBox cor="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: '#6ab0ff' }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: '#5a7a9a' }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Descrição' : 'Description'} *</label>
                    <input value={nc.descricao} onChange={(e) => setNc({ ...nc, descricao: e.target.value })} className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Cliente' : 'Client'}</label>
                    <select value={nc.cliente_id} onChange={(e) => setNc({ ...nc, cliente_id: e.target.value })} className={inputCls} style={selectStyle}>
                      <option value="">-- {idioma === 'pt' ? 'Selecione' : 'Select'} --</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Valor Total (R$)' : 'Total (R$)'} *</label>
                      <input type="number" value={nc.valor} onChange={(e) => setNc({ ...nc, valor: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Já Recebido (R$)' : 'Received (R$)'}</label>
                      <input type="number" value={nc.valor_recebido} onChange={(e) => setNc({ ...nc, valor_recebido: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Emissão' : 'Issue Date'}</label>
                      <input type="date" value={nc.data_emissao} onChange={(e) => setNc({ ...nc, data_emissao: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Vencimento' : 'Due Date'} *</label>
                      <input type="date" value={nc.data_vencimento} onChange={(e) => setNc({ ...nc, data_vencimento: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Forma de Recebimento' : 'Payment Method'}</label>
                      <select value={nc.forma_recebimento} onChange={(e) => setNc({ ...nc, forma_recebimento: e.target.value })} className={inputCls} style={selectStyle}>
                        {formasRecebimento.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Categoria' : 'Category'}</label>
                      <select value={nc.categoria} onChange={(e) => setNc({ ...nc, categoria: e.target.value })} className={inputCls} style={selectStyle}>
                        {categorias.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Nº Documento' : 'Doc No.'}</label>
                      <input value={nc.numero_documento} onChange={(e) => setNc({ ...nc, numero_documento: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Parcelas' : 'Installments'}</label>
                      <input type="number" value={nc.parcelas} onChange={(e) => setNc({ ...nc, parcelas: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Juros % ao mês' : 'Interest % /mo'}</label>
                      <input type="number" value={nc.taxa_juros} onChange={(e) => setNc({ ...nc, taxa_juros: e.target.value })} placeholder="ex: 2" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Multa %' : 'Fine %'}</label>
                      <input type="number" value={nc.taxa_multa} onChange={(e) => setNc({ ...nc, taxa_multa: e.target.value })} placeholder="ex: 10" className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Observações' : 'Notes'}</label>
                    <textarea value={nc.observacoes} onChange={(e) => setNc({ ...nc, observacoes: e.target.value })} rows={2} className={inputCls} style={inputStyle} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#5a7a9a' }}>{txt.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvar} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff' }}>
                      {salvando ? '...' : (idioma === 'pt' ? 'Salvar Conta' : 'Save')}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalReceber && contaReceber && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-sm">
              <CanvasBox cor="#34d399">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{idioma === 'pt' ? 'Registrar Recebimento' : 'Register Payment'}</h3>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalReceber(false)} style={{ color: '#5a7a9a' }}><X size={20} /></motion.button>
                </div>
                <p className="text-sm mb-1" style={{ color: '#c8d8f0' }}>{contaReceber.descricao}</p>
                <p className="text-xs mb-4" style={{ color: '#5a7a9a' }}>
                  {idioma === 'pt' ? 'Saldo em aberto' : 'Open balance'}: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{fmt(Math.max(0, contaReceber.valor - (contaReceber.valor_recebido || 0)))}</span>
                </p>
                <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Valor a receber agora (R$)' : 'Amount to receive (R$)'}</label>
                <input type="number" value={valorReceber} onChange={(e) => setValorReceber(e.target.value)} className={inputCls} style={inputStyle} />
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setModalReceber(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#5a7a9a' }}>{txt.cancelar}</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarRecebimento} disabled={recebendo}
                    className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #064e3b, #059669)', color: '#fff' }}>
                    {recebendo ? '...' : (idioma === 'pt' ? 'Confirmar' : 'Confirm')}
                  </motion.button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  )
}