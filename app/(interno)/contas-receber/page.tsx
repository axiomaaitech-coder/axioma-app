'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { Inbox, Trash2, CheckCircle2, Pencil, X } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function CanvasNeural() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ['#6ab0ff', '#34d399', '#a78bfa', '#f472b6', '#fbbf24'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }))
    const floaters = 'AXIOMA CONTAS RECEBER AI TECH FINANCE'.split('').map((char) => ({
      char, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ['#6ab0ff', '#34d399', '#fbbf24'][Math.floor(Math.random() * 3)],
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      floaters.forEach(f => {
        ctx.save(); ctx.font = `900 ${f.size}px Arial`
        ctx.fillStyle = f.color; ctx.globalAlpha = f.opacity
        ctx.fillText(f.char, (f.x / 100) * canvas.width, (f.y / 100) * canvas.height)
        ctx.restore(); f.y -= f.speed; if (f.y < -5) f.y = 105
      })
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 110) * 0.12
            ctx.strokeStyle = p.color; ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore()
          }
        })
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color
        ctx.shadowColor = p.color; ctx.shadowBlur = 6
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />
}

function CanvasBox({ children, cor = '#6ab0ff', corB = '#34d399', corC = '#a78bfa', corD = '#f472b6' }: {
  children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: 'rgba(4,10,22,0.97)', border: `1px solid ${cor}30`, boxShadow: `0 0 60px ${cor}10`,
    }}>
      <CanvasNeural />
      {[
        { pos: 'top-0 left-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(90deg, ${cor}, transparent)`, glow: cor },
        { pos: 'top-0 left-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(180deg, ${cor}, transparent)`, glow: cor },
        { pos: 'top-0 right-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(270deg, ${corB}, transparent)`, glow: corB },
        { pos: 'top-0 right-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(180deg, ${corB}, transparent)`, glow: corB },
        { pos: 'bottom-0 left-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(90deg, ${corC}, transparent)`, glow: corC },
        { pos: 'bottom-0 left-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(0deg, ${corC}, transparent)`, glow: corC },
        { pos: 'bottom-0 right-0', w: 'w-20 h-[2.5px]', bg: `linear-gradient(270deg, ${corD}, transparent)`, glow: corD },
        { pos: 'bottom-0 right-0', w: 'w-[2.5px] h-20', bg: `linear-gradient(0deg, ${corD}, transparent)`, glow: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 14px ${b.glow}`, borderRadius: '999px' }} />
      ))}
      <motion.div animate={{ left: ['-5%', '105%', '-5%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 20px #fff, 0 0 40px ${cor}`, borderRadius: '999px' }} />
      <motion.div animate={{ right: ['-5%', '105%', '-5%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        className="absolute bottom-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 20px ${corB}`, borderRadius: '999px', position: 'absolute' }} />
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </div>
  )
}

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
  const conteudoRef = useRef<HTMLDivElement>(null)

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

  const exportarPDF = async () => {
    if (!conteudoRef.current) return
    setExportando(true)
    try {
      const canvas = await html2canvas(conteudoRef.current, { backgroundColor: '#020810', scale: 2, useCORS: true })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFillColor(2, 8, 16); pdf.rect(0, 0, pdfWidth, 20, 'F')
      pdf.setTextColor(106, 176, 255); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold')
      pdf.text('AXIOMA AI.TECH', 14, 13)
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
      pdf.text(`${txt.titulo} - ${new Date().toLocaleDateString('pt-BR')}`, pdfWidth - 14, 13, { align: 'right' })
      let position = 22; let remaining = pdfHeight
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining)
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight)
        const sourceH = sliceHeight * (canvas.height / pdfHeight)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width; sliceCanvas.height = sourceH
        const ctx2 = sliceCanvas.getContext('2d')!
        ctx2.fillStyle = '#020810'; ctx2.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx2.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, sliceHeight)
        remaining -= sliceHeight; position = 0
        if (remaining > 0) { pdf.addPage(); position = 0 }
      }
      pdf.save(`axioma-contas-receber-${new Date().toISOString().slice(0, 10)}.pdf`)
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
      <div ref={conteudoRef} className="space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CanvasBox cor="#f87171" corB="#34d399" corC="#a78bfa" corD="#6ab0ff">
            <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{txt.pendente}</p>
            <p className="text-2xl md:text-3xl font-black" style={{ color: '#f87171', textShadow: '0 0 20px rgba(248,113,113,0.6)' }}>{fmt(totalPendente)}</p>
          </CanvasBox>
          <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
            <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{txt.recebidoL}</p>
            <p className="text-2xl md:text-3xl font-black" style={{ color: '#34d399', textShadow: '0 0 20px rgba(52,211,153,0.6)' }}>{fmt(totalRecebido)}</p>
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
                <motion.div key={conta.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CanvasBox cor={cor} corB="#34d399" corC="#a78bfa" corD="#f472b6">
                    <div className="flex items-center justify-between gap-3 flex-wrap" style={{ opacity: conta.status === 'recebido' ? 0.75 : 1 }}>
                      <div className="flex items-center gap-4 min-w-0">
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => marcarRecebido(conta.id, conta.status || 'pendente')}>
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
                        <p className="text-lg font-black" style={{ color: cor, textShadow: `0 0 15px ${cor}60` }}>{fmt(conta.valor)}</p>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(conta)}>
                          <Pencil size={15} style={{ color: '#6ab0ff' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(conta.id)}>
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
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#f472b6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                      style={{ color: '#6ab0ff', textShadow: '0 0 20px #6ab0ff' }}>AXIOMA AI.TECH</motion.p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: '#3a5a8a' }}><X size={20} /></motion.button>
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
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#3a5a8a' }}>{txt.cancelar}</button>
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