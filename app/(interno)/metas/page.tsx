'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { Target, Trash2, CheckCircle2, Clock, Pencil, X } from 'lucide-react'
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
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ['#6ab0ff', '#34d399', '#a78bfa', '#f472b6', '#fbbf24'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }))
    const chars = 'AXIOMA METAS GOALS AI TECH R$ 0 1 2 3 4 5 6 7 8 9 % META'.split(' ').map((c) => ({
      char: c, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ['#34d399', '#6ab0ff', '#fbbf24', '#a78bfa'][Math.floor(Math.random() * 4)],
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      chars.forEach(f => {
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

export default function Metas() {
  const { idioma } = useLanguage()
  const [metas, setMetas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [titulo, setTitulo] = useState('')
  const [valorMeta, setValorMeta] = useState('')
  const [prazo, setPrazo] = useState('')
  const [tipo, setTipo] = useState('receita')
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: idioma === 'pt' ? 'Metas Financeiras' : idioma === 'en' ? 'Financial Goals' : 'Metas Financieras',
    subtitulo: idioma === 'pt' ? 'Defina e acompanhe suas metas' : idioma === 'en' ? 'Set and track your goals' : 'Define y sigue tus metas',
    novo: idioma === 'pt' ? 'Nova Meta' : idioma === 'en' ? 'New Goal' : 'Nueva Meta',
    editar: idioma === 'pt' ? 'Editar Meta' : idioma === 'en' ? 'Edit Goal' : 'Editar Meta',
    salvar: idioma === 'pt' ? 'Salvar Meta' : idioma === 'en' ? 'Save Goal' : 'Guardar Meta',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    semMetas: idioma === 'pt' ? 'Nenhuma meta cadastrada.' : idioma === 'en' ? 'No goals yet.' : 'Sin metas aún.',
    nomeMeta: idioma === 'pt' ? 'Nome da Meta' : idioma === 'en' ? 'Goal Name' : 'Nombre',
    valorAlvo: idioma === 'pt' ? 'Valor Alvo' : idioma === 'en' ? 'Target Value' : 'Valor Objetivo',
    prazoLabel: idioma === 'pt' ? 'Prazo' : idioma === 'en' ? 'Deadline' : 'Plazo',
    tipoLabel: idioma === 'pt' ? 'Tipo' : idioma === 'en' ? 'Type' : 'Tipo',
    concluida: idioma === 'pt' ? 'Concluída' : idioma === 'en' ? 'Completed' : 'Completada',
    emAndamento: idioma === 'pt' ? 'Em andamento' : idioma === 'en' ? 'In progress' : 'En progreso',
    totalMetas: idioma === 'pt' ? 'Total Metas' : idioma === 'en' ? 'Total Goals' : 'Total Metas',
    concluidas: idioma === 'pt' ? 'Concluídas' : idioma === 'en' ? 'Completed' : 'Completadas',
    emProgresso: idioma === 'pt' ? 'Em Progresso' : idioma === 'en' ? 'In Progress' : 'En Progreso',
    valorTotal: idioma === 'pt' ? 'Valor Total' : idioma === 'en' ? 'Total Value' : 'Valor Total',
  }

  const tipoOpcoes = [
    { value: 'receita', label: idioma === 'pt' ? 'Aumentar Receita' : idioma === 'en' ? 'Increase Revenue' : 'Aumentar Ingresos' },
    { value: 'economia', label: idioma === 'pt' ? 'Economizar' : idioma === 'en' ? 'Save Money' : 'Ahorrar' },
    { value: 'investimento', label: idioma === 'pt' ? 'Investimento' : idioma === 'en' ? 'Investment' : 'Inversión' },
    { value: 'reducao', label: idioma === 'pt' ? 'Reduzir Custos' : idioma === 'en' ? 'Reduce Costs' : 'Reducir Costos' },
  ]

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('metas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setMetas(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditando(null); setTitulo(''); setValorMeta(''); setPrazo(''); setTipo('receita')
    setModalAberto(true)
  }

  function abrirEdicao(meta: any) {
    setEditando(meta); setTitulo(meta.titulo || ''); setValorMeta(String(meta.valor_meta || ''))
    setPrazo(meta.prazo || ''); setTipo(meta.tipo || 'receita'); setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null)
    setTitulo(''); setValorMeta(''); setPrazo(''); setTipo('receita')
  }

  async function salvar() {
    if (!titulo || !valorMeta) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const payload = { titulo, valor_meta: parseFloat(valorMeta), valor_atual: 0, prazo: prazo || null, tipo, status: 'em_andamento' }
    if (editando) {
      await supabase.from('metas').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('metas').insert({ ...payload, user_id: user.id })
    }
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('metas').delete().eq('id', id); carregar()
  }

  async function toggleStatus(meta: any) {
    const novoStatus = meta.status === 'concluida' ? 'em_andamento' : 'concluida'
    await supabase.from('metas').update({ status: novoStatus }).eq('id', meta.id); carregar()
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
        const ctx = sliceCanvas.getContext('2d')!
        ctx.fillStyle = '#020810'; ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, sliceHeight)
        remaining -= sliceHeight; position = 0
        if (remaining > 0) { pdf.addPage(); position = 0 }
      }
      pdf.save(`axioma-metas-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={abrirNovo} labelBotao={txt.novo}>
      <div ref={conteudoRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna esquerda — metas */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : metas.length === 0 ? (
            <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#f472b6">
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Target size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
                </motion.div>
                <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semMetas}</p>
              </div>
            </CanvasBox>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metas.map((meta, i) => {
                const concluida = meta.status === 'concluida'
                const progresso = meta.valor_meta > 0 ? Math.min(100, ((meta.valor_atual || 0) / meta.valor_meta) * 100) : 0
                return (
                  <motion.div key={meta.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <CanvasBox cor={concluida ? '#34d399' : '#6ab0ff'} corB={concluida ? '#6ab0ff' : '#34d399'} corC="#a78bfa" corD="#f472b6">
                      <div style={{ opacity: concluida ? 0.8 : 1 }}>
                        <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                          className="text-xs font-black tracking-[0.3em] uppercase mb-2"
                          style={{ color: concluida ? '#34d399' : '#6ab0ff', textShadow: `0 0 15px ${concluida ? '#34d399' : '#6ab0ff'}` }}>
                          AXIOMA AI.TECH
                        </motion.p>
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 mr-2">
                            <h3 className="font-bold text-sm mb-1 truncate" style={{ color: '#c8d8f0' }}>{meta.titulo}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                              {tipoOpcoes.find(t => t.value === meta.tipo)?.label || meta.tipo}
                            </span>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => toggleStatus(meta)}>
                              <CheckCircle2 size={18} style={{ color: concluida ? '#34d399' : '#1a3a5a' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(meta)}>
                              <Pencil size={16} style={{ color: '#6ab0ff' }} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(meta.id)}>
                              <Trash2 size={16} style={{ color: '#f87171' }} />
                            </motion.button>
                          </div>
                        </div>
                        <p className="text-2xl font-black mb-1" style={{ color: '#34d399', textShadow: '0 0 20px rgba(52,211,153,0.4)' }}>
                          {fmt(meta.valor_meta)}
                        </p>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1" style={{ color: '#3a5a8a' }}>
                            <span>{fmt(meta.valor_atual || 0)}</span>
                            <span>{progresso.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(59,111,212,0.1)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progresso}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + i * 0.1 }}
                              className="h-2 rounded-full"
                              style={{ background: concluida ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #1a3a8f, #6ab0ff)', boxShadow: `0 0 8px ${concluida ? '#34d399' : '#6ab0ff'}` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock size={12} style={{ color: '#3a6090' }} />
                            <p className="text-xs" style={{ color: '#3a6090' }}>
                              {meta.prazo ? new Date(meta.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: concluida ? 'rgba(52,211,153,0.15)' : 'rgba(106,176,255,0.1)',
                            color: concluida ? '#34d399' : '#6ab0ff'
                          }}>
                            {concluida ? txt.concluida : txt.emAndamento}
                          </span>
                        </div>
                      </div>
                    </CanvasBox>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Coluna direita — painel épico */}
        <div className="hidden lg:block">
          <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
            <div className="flex flex-col items-center justify-center gap-6 py-4 min-h-[400px]">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase"
                style={{ color: '#34d399', textShadow: '0 0 20px #34d399' }}>AXIOMA AI.TECH</motion.p>
              <div className="flex gap-1">
                {'METAS'.split('').map((letra, i) => (
                  <motion.span key={i}
                    animate={{ opacity: [0.5, 1, 0.5], y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                    className="text-4xl font-black"
                    style={{ color: '#34d399', textShadow: '0 0 30px #34d399' }}>
                    {letra}
                  </motion.span>
                ))}
              </div>
              <div className="relative flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-full border-2"
                  style={{ borderColor: '#34d399', borderTopColor: 'transparent', borderRightColor: '#6ab0ff' }} />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-12 h-12 rounded-full border-2"
                  style={{ borderColor: '#a78bfa', borderTopColor: 'transparent', borderLeftColor: '#f472b6' }} />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-6 h-6 rounded-full"
                  style={{ background: 'radial-gradient(circle, #34d399, transparent)', boxShadow: '0 0 20px #34d399' }} />
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  { label: txt.totalMetas, valor: metas.length, cor: '#6ab0ff' },
                  { label: txt.concluidas, valor: metas.filter(m => m.status === 'concluida').length, cor: '#34d399' },
                  { label: txt.emProgresso, valor: metas.filter(m => m.status !== 'concluida').length, cor: '#fbbf24' },
                  { label: txt.valorTotal, valor: `R$ ${metas.reduce((a, m) => a + (m.valor_meta || 0), 0).toLocaleString('pt-BR')}`, cor: '#a78bfa' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-xl p-3 text-center"
                    style={{ background: `${stat.cor}10`, border: `1px solid ${stat.cor}30` }}>
                    <motion.p animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
                      className="text-xl font-black mb-1" style={{ color: stat.cor, textShadow: `0 0 15px ${stat.cor}60` }}>
                      {stat.valor}
                    </motion.p>
                    <p className="text-xs" style={{ color: '#3a5a8a' }}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>
              <motion.p animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 4, repeat: Infinity }}
                className="text-xs text-center" style={{ color: '#3a5a8a' }}>
                {idioma === 'pt' ? 'Defina metas e conquiste resultados' : idioma === 'en' ? 'Set goals and achieve results' : 'Define metas y logra resultados'}
              </motion.p>
            </div>
          </CanvasBox>
        </div>
      </div>

      {/* Modal Premium */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                      style={{ color: '#34d399', textShadow: '0 0 20px #34d399' }}>AXIOMA AI.TECH</motion.p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: '#3a5a8a' }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{txt.nomeMeta}</label>
                    <input value={titulo} onChange={e => setTitulo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{txt.valorAlvo}</label>
                    <input type="number" value={valorMeta} onChange={e => setValorMeta(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{txt.prazoLabel}</label>
                    <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{txt.tipoLabel}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {tipoOpcoes.map(op => (
                        <motion.button key={op.value} whileTap={{ scale: 0.97 }} onClick={() => setTipo(op.value)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{ background: tipo === op.value ? 'rgba(52,211,153,0.2)' : 'rgba(59,111,212,0.05)', color: tipo === op.value ? '#34d399' : '#3a5a8a', border: `1px solid ${tipo === op.value ? 'rgba(52,211,153,0.4)' : 'rgba(59,111,212,0.1)'}` }}>
                          {op.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#3a5a8a' }}>{txt.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(52,211,153,0.4)' }} whileTap={{ scale: 0.98 }}
                      onClick={salvar} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #064e3b, #059669)', color: '#fff' }}>
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