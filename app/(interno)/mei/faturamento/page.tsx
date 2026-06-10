'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { AlertTriangle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const COR = '#f97316'
const COR_B = '#fb923c'
const COR_C = '#fbbf24'
const COR_D = '#f472b6'
const LIMITE_ANUAL = 81000

function CanvasNeural() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ['#f97316', '#fb923c', '#fbbf24', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }))
    const chars = 'MEI CNPJ DAS R$ 81K SIMEI AXIOMA FATURAMENTO RECEITA'.split(' ').map((c) => ({
      char: c, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 26 + 12, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ['#f97316', '#fbbf24', '#fb923c', '#a78bfa'][Math.floor(Math.random() * 4)],
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
          if (dist < 100) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 100) * 0.1
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

function CanvasBox({ children, cor = COR, corB = COR_B, corC = COR_C, corD = COR_D }: {
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

export default function FaturamentoMEI() {
  const { idioma } = useLanguage()
  const [receitas, setReceitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — Faturamento', en: 'MEI — Revenue', es: 'MEI — Facturación' },
    subtitulo: { pt: 'Acompanhe seu faturamento mensal e limite anual MEI', en: 'Track your monthly revenue and annual MEI limit', es: 'Seguimiento de facturación mensual y límite anual MEI' },
    faturamento: { pt: 'Faturamento', en: 'Revenue', es: 'Facturación' },
    limiteRestante: { pt: 'Limite Restante', en: 'Remaining Limit', es: 'Límite Restante' },
    limiteUsado: { pt: 'Limite Usado', en: 'Limit Used', es: 'Límite Usado' },
    velocimetro: { pt: 'Velocímetro de Faturamento', en: 'Revenue Speedometer', es: 'Velocímetro de Facturación' },
    faturamentoMensal: { pt: 'Faturamento Mensal', en: 'Monthly Revenue', es: 'Facturación Mensual' },
    total: { pt: 'Total', en: 'Total', es: 'Total' },
    alerta: { pt: 'No ritmo atual, você atinge o limite em aproximadamente', en: 'At the current pace, you will reach the limit in approximately', es: 'Al ritmo actual, alcanzarás el límite en aproximadamente' },
    meses: { pt: 'meses', en: 'months', es: 'meses' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('receitas').select('*').eq('user_id', user.id).order('data', { ascending: false })
    setReceitas(data || [])
    setLoading(false)
  }

  const anoAtual = new Date().getFullYear()
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const faturamentoAnual = receitas
    .filter(r => new Date(r.data).getFullYear() === anoAtual)
    .reduce((acc, r) => acc + (r.valor || 0), 0)

  const percentualLimite = Math.min(100, (faturamentoAnual / LIMITE_ANUAL) * 100)
  const restanteLimite = Math.max(0, LIMITE_ANUAL - faturamentoAnual)
  const mesAtual = new Date().getMonth()
  const ultimos3Meses = receitas.filter(r => {
    const d = new Date(r.data)
    return d.getFullYear() === anoAtual && d.getMonth() >= mesAtual - 3
  })
  const mediaMensal = ultimos3Meses.length > 0 ? ultimos3Meses.reduce((a, r) => a + r.valor, 0) / 3 : 0
  const mesesParaEstourar = mediaMensal > 0 ? Math.ceil(restanteLimite / mediaMensal) : null

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
      pdf.setTextColor(249, 115, 22); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold')
      pdf.text('AXIOMA AI.TECH — MEI Faturamento', 14, 13)
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
      pdf.text(new Date().toLocaleDateString('pt-BR'), pdfWidth - 14, 13, { align: 'right' })
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
      pdf.save(`axioma-mei-faturamento-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  return (
    <ModuloLayout
      titulo={t('titulo')}
      subtitulo={t('subtitulo')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `${t('faturamento')} ${anoAtual}`, value: fmt(faturamentoAnual), cor: COR },
            { label: t('limiteRestante'), value: fmt(restanteLimite), cor: '#34d399' },
            { label: t('limiteUsado'), value: `${percentualLimite.toFixed(1)}%`, cor: '#fbbf24' },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{card.label}</p>
                <p className="text-xl md:text-2xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Velocímetro */}
        <CanvasBox>
          <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>
            AXIOMA AI.TECH — MEI
          </motion.p>
          <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0' }}>{t('velocimetro')} {anoAtual}</p>
          <div className="w-full h-4 rounded-full mb-2" style={{ background: 'rgba(59,111,212,0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentualLimite}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-4 rounded-full"
              style={{
                background: percentualLimite >= 90 ? 'linear-gradient(90deg, #dc2626, #f87171)'
                  : percentualLimite >= 70 ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                  : `linear-gradient(90deg, #c2410c, ${COR})`,
                boxShadow: `0 0 12px ${percentualLimite >= 90 ? '#f87171' : percentualLimite >= 70 ? '#fbbf24' : COR}`
              }}
            />
          </div>
          <div className="flex justify-between text-xs mb-4" style={{ color: '#3a5a8a' }}>
            <span>{fmt(faturamentoAnual)}</span>
            <span className="font-bold" style={{ color: percentualLimite >= 90 ? '#f87171' : percentualLimite >= 70 ? '#fbbf24' : COR }}>{percentualLimite.toFixed(1)}%</span>
            <span>R$ 81.000</span>
          </div>
          {mesesParaEstourar !== null && mesesParaEstourar <= 6 && (
            <motion.div animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
              <AlertTriangle size={16} />
              {t('alerta')} {mesesParaEstourar} {t('meses')}.
            </motion.div>
          )}
        </CanvasBox>

        {/* Faturamento por mês */}
        <CanvasBox>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('faturamentoMensal')} — {anoAtual}</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 12 }, (_, i) => {
                const nomeMes = new Date(anoAtual, i, 1).toLocaleDateString(
                  idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR',
                  { month: 'long' }
                )
                const valor = receitas
                  .filter(r => { const d = new Date(r.data); return d.getFullYear() === anoAtual && d.getMonth() === i })
                  .reduce((a, r) => a + r.valor, 0)
                const perc = (valor / (LIMITE_ANUAL / 12)) * 100
                const mesAtualIndex = new Date().getMonth()
                const ehMesAtual = i === mesAtualIndex
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3">
                    <p className="text-xs w-24 capitalize" style={{ color: ehMesAtual ? COR : '#3a6090', fontWeight: ehMesAtual ? 700 : 400 }}>{nomeMes}</p>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(59,111,212,0.1)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, perc)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="h-2 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, #c2410c, ${COR})`,
                          boxShadow: valor > 0 ? `0 0 6px ${COR}` : 'none'
                        }}
                      />
                    </div>
                    <p className="text-xs w-28 text-right font-semibold" style={{ color: valor > 0 ? COR : '#1a3a5a' }}>{fmt(valor)}</p>
                  </motion.div>
                )
              })}
            </div>
          )}
          <div className="mt-4 pt-4 flex justify-between" style={{ borderTop: '1px solid rgba(249,115,22,0.15)' }}>
            <span className="text-sm font-semibold" style={{ color: '#c8d8f0' }}>{t('total')} {anoAtual}</span>
            <span className="text-sm font-black" style={{ color: COR }}>{fmt(faturamentoAnual)}</span>
          </div>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}