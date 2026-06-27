'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { Inbox, Trash2, CheckCircle2, Pencil, X } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ContasReceber() {
  const { idioma } = useLanguage()
  const [contas, setContas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const txt = {
    titulo: idioma === 'pt' ? 'Contas a Receber' : idioma === 'en' ? 'Accounts Receivable' : 'Cuentas por Cobrar',
    subtitulo: idioma === 'pt' ? 'Gerencie os valores que seus clientes devem pagar' : idioma === 'en' ? 'Manage amounts your clients owe' : 'Gestiona los montos que deben pagar',
    novo: idioma === 'pt' ? 'Nova Conta' : idioma === 'en' ? 'New Account' : 'Nueva Cuenta',
    editar: idioma === 'pt' ? 'Editar Conta' : idioma === 'en' ? 'Edit Account' : 'Editar Cuenta',
    salvar: idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    pendente: idioma === 'pt' ? 'Total Pendente' : idioma === 'en' ? 'Total Pending' : 'Total Pendiente',
    recebidoL: idioma === 'pt' ? 'Total Recebido' : idioma === 'en' ? 'Total Received' : 'Total Recibido',
    semContas: idioma === 'pt' ? 'Nenhuma conta cadastrada.' : idioma === 'en' ? 'No accounts yet.' : 'Sin cuentas aún.',
    vence: idioma === 'pt' ? 'Vence: ' : idioma === 'en' ? 'Due: ' : 'Vence: ',
    vencido: idioma === 'pt' ? 'Vencido' : idioma === 'en' ? 'Overdue' : 'Vencido',
    recebido: idioma === 'pt' ? 'Recebido' : idioma === 'en' ? 'Received' : 'Recibido',
    descricaoL: idioma === 'pt' ? 'Descrição / Cliente' : idioma === 'en' ? 'Description / Client' : 'Descripción / Cliente',
    valorL: idioma === 'pt' ? 'Valor (R$)' : idioma === 'en' ? 'Value ($)' : 'Valor ($)',
    vencimentoL: idioma === 'pt' ? 'Data de Vencimento' : idioma === 'en' ? 'Due Date' : 'Fecha de Vencimiento',
  }

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('contas_receber').select('*').eq('user_id', user.id).order('data_vencimento', { ascending: true })
    setContas(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditando(null); setDescricao(''); setValor(''); setDataVencimento('')
    setModalAberto(true)
  }

  function abrirEdicao(conta: any) {
    setEditando(conta)
    setDescricao(conta.descricao || '')
    setValor(String(conta.valor || ''))
    setDataVencimento(conta.data_vencimento || '')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null)
    setDescricao(''); setValor(''); setDataVencimento('')
  }

  async function salvar() {
    if (!descricao || !valor || !dataVencimento) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const payload = {
      descricao,
      valor: parseFloat(valor),
      data_vencimento: dataVencimento,
      status: 'pendente',
    }
    if (editando) {
      await supabase.from('contas_receber').update({ descricao, valor: parseFloat(valor), data_vencimento: dataVencimento }).eq('id', editando.id)
    } else {
      await supabase.from('contas_receber').insert({ ...payload, user_id: user.id })
    }
    fecharModal(); setSalvando(false); carregar()
  }

  async function marcarRecebido(id: string, statusAtual: string) {
    const novoStatus = statusAtual === 'recebido' ? 'pendente' : 'recebido'
    await supabase.from('contas_receber').update({
      status: novoStatus,
      data_recebimento: novoStatus === 'recebido' ? new Date().toISOString().split('T')[0] : null
    }).eq('id', id)
    carregar()
  }

  async function excluir(id: string) {
    await supabase.from('contas_receber').delete().eq('id', id)
    carregar()
  }

  // PDF preto e branco (relatório/auditoria)
  const exportarPDF = async () => {
    setExportando(true)
    try {
      const fmtN = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      gerarPdfTabela({
        titulo: txt.titulo,
        subtitulo: txt.subtitulo,
        colunas: [
          { header: 'Descrição / Cliente', key: 'descricao', width: 5 },
          { header: 'Vencimento', key: 'venc', width: 2 },
          { header: 'Status', key: 'status', width: 2 },
          { header: 'Valor (R$)', key: 'valor', width: 2, align: 'right' },
        ],
        linhas: contas.map((c) => {
          const vencido = isVencido(c.data_vencimento || '', c.status || 'pendente')
          const st = c.status === 'recebido' ? txt.recebido : (vencido ? txt.vencido : 'Pendente')
          return {
            descricao: c.descricao,
            venc: c.data_vencimento ? new Date(c.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
            status: st,
            valor: fmtN(c.valor || 0),
          }
        }),
        resumo: [
          { label: txt.pendente, valor: `R$ ${fmtN(totalPendente)}` },
          { label: txt.recebidoL, valor: `R$ ${fmtN(totalRecebido)}` },
        ],
        nomeArquivo: `axioma-contas-receber-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalPendente = contas.filter(c => c.status === 'pendente').reduce((s, c) => s + (c.valor || 0), 0)
  const totalRecebido = contas.filter(c => c.status === 'recebido').reduce((s, c) => s + (c.valor || 0), 0)
  const hoje = new Date().toISOString().split('T')[0]
  const isVencido = (data: string, status: string) => data < hoje && status !== 'recebido'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#020810' }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo} onExportarPDF={exportarPDF} exportando={exportando} onNovo={abrirNovo} labelBotao={txt.novo}>
      <div className="space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CanvasBox cor="#f87171">
            <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{txt.pendente}</p>
            <p className="text-2xl md:text-3xl font-black" style={{ color: '#f87171' }}>{fmt(totalPendente)}</p>
          </CanvasBox>
          <CanvasBox cor="#34d399">
            <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{txt.recebidoL}</p>
            <p className="text-2xl md:text-3xl font-black" style={{ color: '#34d399' }}>{fmt(totalRecebido)}</p>
          </CanvasBox>
        </div>

        {contas.length === 0 ? (
          <CanvasBox cor="#6ab0ff">
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
              <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semContas}</p>
            </div>
          </CanvasBox>
        ) : (
          <div className="space-y-3">
            {contas.map((conta, i) => {
              const vencido = isVencido(conta.data_vencimento || '', conta.status || 'pendente')
              const cor = conta.status === 'recebido' ? '#34d399' : vencido ? '#f87171' : '#6ab0ff'
              return (
                <motion.div key={conta.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex items-center justify-between gap-3 flex-wrap" style={{ opacity: conta.status === 'recebido' ? 0.8 : 1 }}>
                      <div className="flex items-center gap-4 min-w-0">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => marcarRecebido(conta.id, conta.status || 'pendente')}>
                          <CheckCircle2 size={22} style={{ color: conta.status === 'recebido' ? '#34d399' : '#1a3a5a' }} />
                        </motion.button>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: '#c8d8f0' }}>{conta.descricao}</p>
                          <p className="text-xs mt-1" style={{ color: vencido ? '#f87171' : '#3a6090' }}>
                            {txt.vence}{new Date((conta.data_vencimento || '') + 'T00:00:00').toLocaleDateString('pt-BR')}
                            {vencido && ` ⚠️ ${txt.vencido}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="text-lg font-black" style={{ color: cor }}>{fmt(conta.valor)}</p>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(conta)}>
                          <Pencil size={15} style={{ color: '#6ab0ff' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(conta.id)}>
                          <Trash2 size={15} style={{ color: '#f87171' }} />
                        </motion.button>
                      </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: '#6ab0ff' }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: '#5a7a9a' }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: txt.descricaoL, value: descricao, set: setDescricao, type: 'text' },
                    { label: txt.valorL, value: valor, set: setValor, type: 'number' },
                    { label: txt.vencimentoL, value: dataVencimento, set: setDataVencimento, type: 'date' },
                  ].map((c) => (
                    <div key={c.label}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{c.label}</label>
                      <input type={c.type} value={c.value} onChange={e => c.set(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#5a7a9a' }}>{txt.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={salvar} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff' }}>
                      {salvando ? '...' : txt.salvar}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  )
}