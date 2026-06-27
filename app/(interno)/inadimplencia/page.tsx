'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { AlertTriangle, Trash2, Pencil, X, Search, Phone, HandCoins } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const formasContato = ['Telefone', 'E-mail', 'WhatsApp', 'Presencial', 'Carta']

type Cliente = { id: string; nome: string }

type Registro = {
  id: string
  cliente: string
  cliente_id?: string | null
  valor: number
  valor_recuperado?: number
  vencimento: string
  descricao?: string
  dias_atraso?: number
  status?: string
  estagio?: string
  taxa_juros?: number
  taxa_multa?: number
  numero_documento?: string
  forma_contato?: string
  data_ultimo_contato?: string
  observacoes?: string
}

const estagios = [
  { key: 'aberto', label: 'Em Aberto', labelEn: 'Open', cor: '#f87171' },
  { key: 'aviso', label: '1º Aviso', labelEn: '1st Notice', cor: '#fbbf24' },
  { key: 'negociacao', label: 'Negociação', labelEn: 'Negotiation', cor: '#6ab0ff' },
  { key: 'acordo', label: 'Acordo', labelEn: 'Agreement', cor: '#a78bfa' },
  { key: 'juridico', label: 'Jurídico', labelEn: 'Legal', cor: '#f472b6' },
  { key: 'perda', label: 'Perda', labelEn: 'Loss', cor: '#6b7280' },
]

const regVazio = {
  cliente: '', cliente_id: '', valor: '', valor_recuperado: '', vencimento: '', descricao: '',
  estagio: 'aberto', taxa_juros: '', taxa_multa: '', numero_documento: '',
  forma_contato: formasContato[0], data_ultimo_contato: '', observacoes: '',
}

export default function Inadimplencia() {
  const { idioma } = useLanguage()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Registro | null>(null)
  const [nr, setNr] = useState({ ...regVazio })
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const [modalAcordo, setModalAcordo] = useState(false)
  const [regAcordo, setRegAcordo] = useState<Registro | null>(null)
  const [valorAcordo, setValorAcordo] = useState('')
  const [processandoAcordo, setProcessandoAcordo] = useState(false)

  const txt = {
    titulo: idioma === 'pt' ? 'Inadimplência' : idioma === 'en' ? 'Delinquency' : 'Morosidad',
    subtitulo: idioma === 'pt' ? 'Régua de cobrança e recuperação de clientes em atraso' : idioma === 'en' ? 'Collection workflow and recovery' : 'Cobranza y recuperación',
    novo: idioma === 'pt' ? 'Novo Registro' : idioma === 'en' ? 'New Record' : 'Nuevo Registro',
    editar: idioma === 'pt' ? 'Editar Registro' : idioma === 'en' ? 'Edit Record' : 'Editar Registro',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    semReg: idioma === 'pt' ? 'Nenhum registro de inadimplência.' : idioma === 'en' ? 'No records.' : 'Sin registros.',
    diasAtrasoTxt: idioma === 'pt' ? 'dias em atraso' : idioma === 'en' ? 'days overdue' : 'días de atraso',
  }

  function estagioInfo(key?: string) {
    return estagios.find(e => e.key === key) || estagios[0]
  }

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: empresa } = await supabase.from('empresas').select('id').eq('user_id', user.id).maybeSingle()
    setEmpresaId(empresa?.id || null)
    const { data: cli } = await supabase.from('clientes').select('id, nome').eq('user_id', user.id).order('nome')
    const { data } = await supabase.from('inadimplencia').select('*').eq('user_id', user.id).order('vencimento', { ascending: true })
    setClientes(cli || [])
    setRegistros(data || [])
    setLoading(false)
  }

  const hoje = new Date().toISOString().split('T')[0]

  function diasAtraso(venc?: string) {
    if (!venc || venc >= hoje) return 0
    const d1 = new Date(venc + 'T00:00:00').getTime()
    const d2 = new Date(hoje + 'T00:00:00').getTime()
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
  }

  function encargos(r: Registro) {
    const saldo = Math.max(0, (r.valor || 0) - (r.valor_recuperado || 0))
    const dias = diasAtraso(r.vencimento)
    if (dias <= 0 || saldo <= 0) return 0
    const multa = saldo * ((r.taxa_multa || 0) / 100)
    const juros = saldo * ((r.taxa_juros || 0) / 100) * (dias / 30)
    return multa + juros
  }

  function abrirNovo() {
    setEditando(null); setNr({ ...regVazio }); setModalAberto(true)
  }

  function abrirEdicao(r: Registro) {
    setEditando(r)
    setNr({
      cliente: r.cliente || '', cliente_id: r.cliente_id || '', valor: String(r.valor || ''),
      valor_recuperado: String(r.valor_recuperado || ''), vencimento: r.vencimento || '',
      descricao: r.descricao || '', estagio: r.estagio || 'aberto', taxa_juros: String(r.taxa_juros || ''),
      taxa_multa: String(r.taxa_multa || ''), numero_documento: r.numero_documento || '',
      forma_contato: r.forma_contato || formasContato[0], data_ultimo_contato: r.data_ultimo_contato || '',
      observacoes: r.observacoes || '',
    })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null); setNr({ ...regVazio })
  }

  async function salvar() {
    if (!nr.cliente || !nr.valor || !nr.vencimento) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const venc = new Date(nr.vencimento)
    const dias = Math.max(0, Math.floor((new Date().getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)))
    const total = parseFloat(nr.valor || '0')
    const recuperado = parseFloat(nr.valor_recuperado || '0')
    const status = recuperado >= total && total > 0 ? 'regularizado' : 'pendente'
    const payload: any = {
      cliente: nr.cliente, cliente_id: nr.cliente_id || null, valor: total, valor_recuperado: recuperado,
      vencimento: nr.vencimento, descricao: nr.descricao, dias_atraso: dias,
      estagio: nr.estagio, taxa_juros: parseFloat(nr.taxa_juros || '0'), taxa_multa: parseFloat(nr.taxa_multa || '0'),
      numero_documento: nr.numero_documento, forma_contato: nr.forma_contato,
      data_ultimo_contato: nr.data_ultimo_contato || null, observacoes: nr.observacoes,
      status, empresa_id: empresaId,
    }
    if (editando) {
      await supabase.from('inadimplencia').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('inadimplencia').insert({ ...payload, user_id: user.id })
    }
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('inadimplencia').delete().eq('id', id)
    setRegistros(registros.filter(r => r.id !== id))
  }

  // mudar estágio rápido (avança na régua)
  async function mudarEstagio(r: Registro, novoEstagio: string) {
    await supabase.from('inadimplencia').update({ estagio: novoEstagio }).eq('id', r.id)
    carregar()
  }

  function abrirAcordo(r: Registro) {
    setRegAcordo(r)
    const saldo = Math.max(0, (r.valor || 0) - (r.valor_recuperado || 0))
    setValorAcordo(String(saldo.toFixed(2)))
    setModalAcordo(true)
  }

  async function confirmarAcordo() {
    if (!regAcordo) return
    setProcessandoAcordo(true)
    const novoRecuperado = (regAcordo.valor_recuperado || 0) + parseFloat(valorAcordo || '0')
    const status = novoRecuperado >= regAcordo.valor ? 'regularizado' : 'pendente'
    const estagio = novoRecuperado >= regAcordo.valor ? 'acordo' : regAcordo.estagio || 'negociacao'
    await supabase.from('inadimplencia').update({
      valor_recuperado: novoRecuperado, status, estagio,
    }).eq('id', regAcordo.id)
    setModalAcordo(false); setRegAcordo(null); setValorAcordo('')
    setProcessandoAcordo(false); carregar()
  }

  const exportarPDF = async () => {
    setExportando(true)
    try {
      const fmtN = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      gerarPdfTabela({
        titulo: txt.titulo,
        subtitulo: txt.subtitulo,
        colunas: [
          { header: 'Cliente', key: 'cliente', width: 3 },
          { header: 'Vencimento', key: 'venc', width: 2 },
          { header: 'Atraso', key: 'atraso', width: 2 },
          { header: 'Estágio', key: 'estagio', width: 2 },
          { header: 'Valor (R$)', key: 'valor', width: 2, align: 'right' },
          { header: 'Recuperado (R$)', key: 'rec', width: 2, align: 'right' },
          { header: 'Saldo (R$)', key: 'saldo', width: 2, align: 'right' },
        ],
        linhas: registrosFiltrados.map((r) => ({
          cliente: r.cliente,
          venc: r.vencimento ? new Date(r.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
          atraso: r.status === 'regularizado' ? '-' : `${diasAtraso(r.vencimento)} dias`,
          estagio: estagioInfo(r.estagio).label,
          valor: fmtN(r.valor || 0),
          rec: fmtN(r.valor_recuperado || 0),
          saldo: fmtN(Math.max(0, (r.valor || 0) - (r.valor_recuperado || 0))),
        })),
        resumo: [
          { label: 'Total Inadimplente', valor: `R$ ${fmtN(totalInadimplente)}` },
          { label: 'Total Recuperado', valor: `R$ ${fmtN(totalRecuperado)}` },
          { label: 'Em Risco (Jurídico+Perda)', valor: `R$ ${fmtN(totalRisco)}` },
          { label: 'Taxa de Inadimplência', valor: `${taxaInadimplencia.toFixed(1)}%` },
        ],
        nomeArquivo: `axioma-inadimplencia-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const registrosFiltrados = registros.filter(r =>
    r.cliente.toLowerCase().includes(busca.toLowerCase()) ||
    (r.descricao || '').toLowerCase().includes(busca.toLowerCase())
  )

  const totalInadimplente = registros.filter(r => r.status !== 'regularizado')
    .reduce((s, r) => s + Math.max(0, (r.valor || 0) - (r.valor_recuperado || 0)), 0)
  const totalRecuperado = registros.reduce((s, r) => s + (r.valor_recuperado || 0), 0)
  const totalRisco = registros.filter(r => (r.estagio === 'juridico' || r.estagio === 'perda') && r.status !== 'regularizado')
    .reduce((s, r) => s + Math.max(0, (r.valor || 0) - (r.valor_recuperado || 0)), 0)
  const totalGeral = registros.reduce((s, r) => s + (r.valor || 0), 0)
  const taxaInadimplencia = totalGeral > 0 ? (totalInadimplente / totalGeral) * 100 : 0

  // distribuição por estágio (régua)
  const porEstagio = estagios.map(e => ({
    ...e,
    qtd: registros.filter(r => (r.estagio || 'aberto') === e.key && r.status !== 'regularizado').length,
    valor: registros.filter(r => (r.estagio || 'aberto') === e.key && r.status !== 'regularizado')
      .reduce((s, r) => s + Math.max(0, (r.valor || 0) - (r.valor_recuperado || 0)), 0),
  }))

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

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: idioma === 'pt' ? 'Inadimplente' : 'Delinquent', value: fmt(totalInadimplente), cor: '#f87171' },
            { label: idioma === 'pt' ? 'Recuperado' : 'Recovered', value: fmt(totalRecuperado), cor: '#34d399' },
            { label: idioma === 'pt' ? 'Em Risco' : 'At Risk', value: fmt(totalRisco), cor: '#f472b6' },
            { label: idioma === 'pt' ? 'Taxa Inadimpl.' : 'Default Rate', value: `${taxaInadimplencia.toFixed(1)}%`, cor: '#fbbf24' },
          ].map((card) => (
            <CanvasBox key={card.label} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-lg md:text-2xl font-black" style={{ color: card.cor }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Régua de cobrança (distribuição por estágio) */}
        <CanvasBox cor="#6ab0ff">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#6ab0ff' }}>
            {idioma === 'pt' ? 'Régua de Cobrança' : 'Collection Pipeline'}
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {porEstagio.map((e) => (
              <div key={e.key} className="rounded-xl p-3 text-center" style={{ background: `${e.cor}10`, border: `1px solid ${e.cor}30` }}>
                <p className="text-sm font-black" style={{ color: e.cor }}>{e.qtd}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#5a7a9a' }}>{idioma === 'pt' ? e.label : e.labelEn}</p>
                <p className="text-xs font-bold mt-1" style={{ color: e.cor }}>{fmt(e.valor)}</p>
              </div>
            ))}
          </div>
        </CanvasBox>

        {/* Busca */}
        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2">
            <Search size={16} style={{ color: '#5a7a9a' }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={idioma === 'pt' ? 'Buscar por cliente...' : 'Search...'} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: '#c8d8f0' }} />
          </div>
        </CanvasBox>

        {/* Lista */}
        {registrosFiltrados.length === 0 ? (
          <CanvasBox cor="#f87171">
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
              <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semReg}</p>
            </div>
          </CanvasBox>
        ) : (
          <div className="space-y-3">
            {registrosFiltrados.map((r, i) => {
              const isReg = r.status === 'regularizado'
              const est = estagioInfo(r.estagio)
              const cor = isReg ? '#34d399' : est.cor
              const saldo = Math.max(0, (r.valor || 0) - (r.valor_recuperado || 0))
              const prog = r.valor > 0 ? ((r.valor_recuperado || 0) / r.valor) * 100 : 0
              const dias = diasAtraso(r.vencimento)
              const enc = encargos(r)
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap" style={{ opacity: isReg ? 0.8 : 1 }}>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm" style={{ color: '#c8d8f0' }}>{r.cliente}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {r.descricao && <span className="text-xs" style={{ color: '#5a7a9a' }}>{r.descricao}</span>}
                          {r.numero_documento && <span className="text-xs" style={{ color: '#5a7a9a' }}>· Doc: {r.numero_documento}</span>}
                        </div>
                        <p className="text-xs mt-1" style={{ color: isReg ? '#34d399' : '#f87171' }}>
                          {isReg ? `✅ ${idioma === 'pt' ? 'Regularizado' : 'Regularized'}` : `⚠️ ${dias} ${txt.diasAtrasoTxt}`}
                          {!isReg && enc > 0 && ` · ${idioma === 'pt' ? 'Juros+Multa' : 'Interest+Fine'}: ${fmt(enc)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: `${est.cor}15`, color: est.cor }}>{idioma === 'pt' ? est.label : est.labelEn}</span>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(r)}><Pencil size={15} style={{ color: '#6ab0ff' }} /></motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(r.id)}><Trash2 size={15} style={{ color: '#f87171' }} /></motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: idioma === 'pt' ? 'Total' : 'Total', val: fmt(r.valor), cor: '#c8d8f0' },
                        { label: idioma === 'pt' ? 'Recuperado' : 'Recovered', val: fmt(r.valor_recuperado || 0), cor: '#34d399' },
                        { label: idioma === 'pt' ? 'Saldo' : 'Balance', val: fmt(saldo), cor: '#fbbf24' },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-xs mb-0.5" style={{ color: '#5a7a9a' }}>{s.label}</p>
                          <p className="text-sm font-black" style={{ color: s.cor }}>{s.val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="w-full h-2 rounded-full mb-3" style={{ background: 'rgba(59,111,212,0.1)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(prog, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, #1a3a8f, ${cor})` }} />
                    </div>

                    {/* ações: avançar estágio + acordo */}
                    {!isReg && (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <select value={r.estagio || 'aberto'} onChange={(e) => mudarEstagio(r, e.target.value)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={selectStyle}>
                          {estagios.map(e => <option key={e.key} value={e.key}>{idioma === 'pt' ? e.label : e.labelEn}</option>)}
                        </select>
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => abrirAcordo(r)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                          <HandCoins size={13} /> {idioma === 'pt' ? 'Registrar Acordo' : 'Register Payment'}
                        </motion.button>
                      </div>
                    )}
                  </CanvasBox>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== MODAL NOVO/EDITAR ===== */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-lg">
              <CanvasBox cor="#f87171">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: '#f87171' }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: '#5a7a9a' }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Cliente (vincular)' : 'Client (link)'}</label>
                    <select value={nr.cliente_id} onChange={(e) => {
                      const cli = clientes.find(c => c.id === e.target.value)
                      setNr({ ...nr, cliente_id: e.target.value, cliente: cli ? cli.nome : nr.cliente })
                    }} className={inputCls} style={selectStyle}>
                      <option value="">-- {idioma === 'pt' ? 'Selecione ou digite abaixo' : 'Select or type below'} --</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Nome do Cliente' : 'Client Name'} *</label>
                    <input value={nr.cliente} onChange={(e) => setNr({ ...nr, cliente: e.target.value })} className={inputCls} style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Valor em Atraso (R$)' : 'Overdue (R$)'} *</label>
                      <input type="number" value={nr.valor} onChange={(e) => setNr({ ...nr, valor: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Já Recuperado (R$)' : 'Recovered (R$)'}</label>
                      <input type="number" value={nr.valor_recuperado} onChange={(e) => setNr({ ...nr, valor_recuperado: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Vencimento' : 'Due Date'} *</label>
                      <input type="date" value={nr.vencimento} onChange={(e) => setNr({ ...nr, vencimento: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Estágio' : 'Stage'}</label>
                      <select value={nr.estagio} onChange={(e) => setNr({ ...nr, estagio: e.target.value })} className={inputCls} style={selectStyle}>
                        {estagios.map(e => <option key={e.key} value={e.key}>{idioma === 'pt' ? e.label : e.labelEn}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Juros % ao mês' : 'Interest % /mo'}</label>
                      <input type="number" value={nr.taxa_juros} onChange={(e) => setNr({ ...nr, taxa_juros: e.target.value })} placeholder="ex: 2" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Multa %' : 'Fine %'}</label>
                      <input type="number" value={nr.taxa_multa} onChange={(e) => setNr({ ...nr, taxa_multa: e.target.value })} placeholder="ex: 10" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Nº Documento' : 'Doc No.'}</label>
                      <input value={nr.numero_documento} onChange={(e) => setNr({ ...nr, numero_documento: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Forma de Contato' : 'Contact'}</label>
                      <select value={nr.forma_contato} onChange={(e) => setNr({ ...nr, forma_contato: e.target.value })} className={inputCls} style={selectStyle}>
                        {formasContato.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Último Contato' : 'Last Contact'}</label>
                      <input type="date" value={nr.data_ultimo_contato} onChange={(e) => setNr({ ...nr, data_ultimo_contato: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Descrição' : 'Description'}</label>
                      <input value={nr.descricao} onChange={(e) => setNr({ ...nr, descricao: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Observações / Histórico de Cobrança' : 'Notes'}</label>
                    <textarea value={nr.observacoes} onChange={(e) => setNr({ ...nr, observacoes: e.target.value })} rows={2} className={inputCls} style={inputStyle} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#5a7a9a' }}>{txt.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvar} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)', color: '#fff' }}>
                      {salvando ? '...' : (idioma === 'pt' ? 'Salvar' : 'Save')}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODAL ACORDO/RECUPERAÇÃO ===== */}
      <AnimatePresence>
        {modalAcordo && regAcordo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-sm">
              <CanvasBox cor="#34d399">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{idioma === 'pt' ? 'Registrar Acordo' : 'Register Payment'}</h3>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalAcordo(false)} style={{ color: '#5a7a9a' }}><X size={20} /></motion.button>
                </div>
                <p className="text-sm mb-1" style={{ color: '#c8d8f0' }}>{regAcordo.cliente}</p>
                <p className="text-xs mb-4" style={{ color: '#5a7a9a' }}>
                  {idioma === 'pt' ? 'Saldo devedor' : 'Open balance'}: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{fmt(Math.max(0, regAcordo.valor - (regAcordo.valor_recuperado || 0)))}</span>
                </p>
                <label className={labelInput} style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Valor recuperado agora (R$)' : 'Amount recovered (R$)'}</label>
                <input type="number" value={valorAcordo} onChange={(e) => setValorAcordo(e.target.value)} className={inputCls} style={inputStyle} />
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setModalAcordo(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#5a7a9a' }}>{txt.cancelar}</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarAcordo} disabled={processandoAcordo}
                    className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #064e3b, #059669)', color: '#fff' }}>
                    {processandoAcordo ? '...' : (idioma === 'pt' ? 'Confirmar' : 'Confirm')}
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