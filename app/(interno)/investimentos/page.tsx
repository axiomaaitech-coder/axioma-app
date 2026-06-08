'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { TrendingUp, Trash2, Pencil, X } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const corTipo: Record<string, string> = {
  renda_fixa: '#34d399', renda_variavel: '#f59e0b',
  criptomoeda: '#a78bfa', imovel: '#6ab0ff', outro: '#f472b6'
}

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
      color: ['#6ab0ff', '#34d399', '#a78bfa', '#f59e0b', '#f472b6'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }))
    const chars = 'AXIOMA INVEST AI TECH R$ 0 1 2 3 4 5 6 7 8 9 % CDB FII BTC'.split(' ').map((c) => ({
      char: c, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ['#34d399', '#f59e0b', '#6ab0ff', '#a78bfa'][Math.floor(Math.random() * 4)],
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

export default function Investimentos() {
  const { idioma } = useLanguage()
  const [investimentos, setInvestimentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('renda_fixa')
  const [data, setData] = useState('')
  const [rentabilidade, setRentabilidade] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: idioma === 'pt' ? 'Investimentos' : idioma === 'en' ? 'Investments' : 'Inversiones',
    subtitulo: idioma === 'pt' ? 'Acompanhe sua carteira de investimentos' : idioma === 'en' ? 'Track your investment portfolio' : 'Sigue tu cartera de inversiones',
    novo: idioma === 'pt' ? 'Novo Investimento' : idioma === 'en' ? 'New Investment' : 'Nueva Inversión',
    editar: idioma === 'pt' ? 'Editar Investimento' : idioma === 'en' ? 'Edit Investment' : 'Editar Inversión',
    salvar: idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    totalInvestido: idioma === 'pt' ? 'Total Investido' : idioma === 'en' ? 'Total Invested' : 'Total Invertido',
    semInv: idioma === 'pt' ? 'Nenhum investimento cadastrado.' : idioma === 'en' ? 'No investments yet.' : 'Sin inversiones aún.',
    ativos: idioma === 'pt' ? 'Ativos' : idioma === 'en' ? 'Assets' : 'Activos',
    melhorRent: idioma === 'pt' ? 'Melhor Rent.' : idioma === 'en' ? 'Best Return' : 'Mejor Rent.',
  }

  const tipoOpcoes = [
    { value: 'renda_fixa', label: idioma === 'pt' ? 'Renda Fixa' : idioma === 'en' ? 'Fixed Income' : 'Renta Fija' },
    { value: 'renda_variavel', label: idioma === 'pt' ? 'Renda Variável' : idioma === 'en' ? 'Variable Income' : 'Renta Variable' },
    { value: 'criptomoeda', label: idioma === 'pt' ? 'Criptomoeda' : idioma === 'en' ? 'Cryptocurrency' : 'Criptomoneda' },
    { value: 'imovel', label: idioma === 'pt' ? 'Imóvel' : idioma === 'en' ? 'Real Estate' : 'Inmueble' },
    { value: 'outro', label: idioma === 'pt' ? 'Outro' : idioma === 'en' ? 'Other' : 'Otro' },
  ]

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('investimentos').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setInvestimentos(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditando(null); setNome(''); setValor(''); setTipo('renda_fixa'); setData(''); setRentabilidade('')
    setModalAberto(true)
  }

  function abrirEdicao(inv: any) {
    setEditando(inv); setNome(inv.nome); setValor(String(inv.valor))
    setTipo(inv.tipo); setData(inv.data); setRentabilidade(String(inv.rentabilidade || ''))
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null)
    setNome(''); setValor(''); setTipo('renda_fixa'); setData(''); setRentabilidade('')
  }

  async function salvar() {
    if (!nome || !valor || !data) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const payload = { nome, valor: parseFloat(valor), tipo, data, rentabilidade: parseFloat(rentabilidade || '0') }
    editando
      ? await supabase.from('investimentos').update(payload).eq('id', editando.id)
      : await supabase.from('investimentos').insert({ ...payload, user_id: user.id })
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('investimentos').delete().eq('id', id); carregar()
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
      pdf.save(`axioma-investimentos-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalInvestido = investimentos.reduce((s, i) => s + (i.valor || 0), 0)
  const melhorRent = investimentos.length > 0 ? Math.max(...investimentos.map(i => i.rentabilidade || 0)) : 0

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={abrirNovo} labelBotao={txt.novo}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards topo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: txt.totalInvestido, value: fmt(totalInvestido), cor: '#34d399' },
            { label: txt.ativos, value: `${investimentos.length}`, cor: '#6ab0ff' },
            { label: txt.melhorRent, value: `${melhorRent}% a.a.`, cor: '#f59e0b' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={card.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{card.label}</p>
                <p className="text-2xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : investimentos.length === 0 ? (
          <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <TrendingUp size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
              </motion.div>
              <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semInv}</p>
            </div>
          </CanvasBox>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {investimentos.map((inv, i) => {
              const cor = corTipo[inv.tipo] || '#6ab0ff'
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <CanvasBox cor={cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-2"
                      style={{ color: cor, textShadow: `0 0 15px ${cor}` }}>AXIOMA AI.TECH</motion.p>
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 mr-2">
                        <h3 className="font-bold text-sm mb-1 truncate" style={{ color: '#c8d8f0' }}>{inv.nome}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cor}20`, color: cor, border: `1px solid ${cor}40` }}>
                          {tipoOpcoes.find(t => t.value === inv.tipo)?.label || inv.tipo}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(inv)}>
                          <Pencil size={16} style={{ color: '#6ab0ff' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(inv.id)}>
                          <Trash2 size={16} style={{ color: '#f87171' }} />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-2xl font-black mb-2" style={{ color: cor, textShadow: `0 0 20px ${cor}60` }}>{fmt(inv.valor)}</p>
                    <div className="flex justify-between">
                      <p className="text-xs" style={{ color: '#3a6090' }}>{new Date(inv.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      {inv.rentabilidade > 0 && (
                        <p className="text-xs font-black" style={{ color: '#34d399', textShadow: '0 0 10px rgba(52,211,153,0.4)' }}>{inv.rentabilidade}% a.a.</p>
                      )}
                    </div>
                  </CanvasBox>
                </motion.div>
              )
            })}
          </div>
        )}
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
              <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#f59e0b">
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
                  {[
                    { label: idioma === 'pt' ? 'Nome' : 'Name', key: 'nome', value: nome, set: setNome, type: 'text' },
                    { label: idioma === 'pt' ? 'Valor' : 'Value', key: 'valor', value: valor, set: setValor, type: 'number' },
                    { label: idioma === 'pt' ? 'Data' : 'Date', key: 'data', value: data, set: setData, type: 'date' },
                    { label: idioma === 'pt' ? 'Rentabilidade % a.a.' : 'Return % p.a.', key: 'rent', value: rentabilidade, set: setRentabilidade, type: 'number' },
                  ].map(({ label, key, value, set, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{label}</label>
                      <input type={type} value={value} onChange={e => set(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{idioma === 'pt' ? 'Tipo' : 'Type'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {tipoOpcoes.map(op => (
                        <motion.button key={op.value} whileTap={{ scale: 0.97 }} onClick={() => setTipo(op.value)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{ background: tipo === op.value ? `${corTipo[op.value]}25` : 'rgba(59,111,212,0.05)', color: tipo === op.value ? corTipo[op.value] : '#3a5a8a', border: `1px solid ${tipo === op.value ? `${corTipo[op.value]}50` : 'rgba(59,111,212,0.1)'}` }}>
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