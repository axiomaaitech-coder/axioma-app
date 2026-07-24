'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
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
    const chars = 'MEI PREÇO CUSTO MARGEM R$ LUCRO HORA AXIOMA SERVIÇO'.split(' ').map((c) => ({
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

export default function PrecificacaoMEI() {
  const { idioma } = useLanguage()
  const [meiDados, setMeiDados] = useState<any>(null)
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoHoras, setPrecoHoras] = useState('')
  const [precoMargem, setPrecoMargem] = useState('30')
  const [precoResultado, setPrecoResultado] = useState<any>(null)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — Precificação', en: 'MEI — Pricing', es: 'MEI — Precios' },
    subtitulo: { pt: 'Calcule o preço justo dos seus produtos e serviços', en: 'Calculate the fair price for your products and services', es: 'Calcule el precio justo de sus productos y servicios' },
    calculadora: { pt: 'Calculadora de Preço Justo MEI', en: 'MEI Fair Price Calculator', es: 'Calculadora de Precio Justo MEI' },
    custo: { pt: 'Custo total mensal (R$)', en: 'Total monthly cost (R$)', es: 'Costo total mensual (R$)' },
    horas: { pt: 'Horas trabalhadas por mês', en: 'Hours worked per month', es: 'Horas trabajadas por mes' },
    margem: { pt: 'Margem de lucro desejada (%)', en: 'Desired profit margin (%)', es: 'Margen de ganancia deseado (%)' },
    calcular: { pt: 'Calcular Preço Justo', en: 'Calculate Fair Price', es: 'Calcular Precio Justo' },
    custoHora: { pt: 'Custo por hora', en: 'Cost per hour', es: 'Costo por hora' },
    impostos: { pt: 'Impostos estimados/hora', en: 'Estimated taxes/hour', es: 'Impuestos estimados/hora' },
    margemReais: { pt: 'Margem de lucro/hora', en: 'Profit margin/hour', es: 'Margen de ganancia/hora' },
    precoMinimo: { pt: '💰 Preço mínimo/hora', en: '💰 Minimum price/hour', es: '💰 Precio mínimo/hora' },
    dicas: { pt: 'Dicas de Precificação MEI', en: 'MEI Pricing Tips', es: 'Consejos de Precios MEI' },
    categoria: { pt: 'Categoria MEI', en: 'MEI Category', es: 'Categoría MEI' },
    aliquota: { pt: 'Alíquota de isenção IRPF', en: 'IRPF exemption rate', es: 'Alícuota de exención IRPF' },
    dasAnual: { pt: 'DAS anual estimado', en: 'Estimated annual DAS', es: 'DAS anual estimado' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: mei } = await supabase.from('mei_dados').select('*').maybeSingle()
    setMeiDados(mei)
  }

  const percentualIsento = meiDados?.categoria_mei === 'Comércio' ? 0.08
    : meiDados?.categoria_mei === 'Indústria' ? 0.08
    : meiDados?.categoria_mei === 'Transporte' ? 0.16 : 0.32

  function calcularPreco() {
    if (!precoCusto) return
    const custo = parseFloat(precoCusto)
    const horas = parseFloat(precoHoras) || 1
    const margem = parseFloat(precoMargem) / 100
    const dasPerc = meiDados?.das_valor ? (meiDados.das_valor * 12) / LIMITE_ANUAL : 0.011
    const custoTotal = custo / horas
    const precoMinimo = custoTotal / (1 - margem - dasPerc - percentualIsento * 0.275)
    setPrecoResultado({
      custoHora: custoTotal,
      precoMinimo,
      margemReais: precoMinimo * margem,
      impostos: precoMinimo * (dasPerc + percentualIsento * 0.275)
    })
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
      pdf.setTextColor(249, 115, 22); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold')
      pdf.text('AXIOMA AI.TECH — MEI Precificação', 14, 13)
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
      pdf.save(`axioma-mei-precificacao-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const dicas = [
    { pt: 'Nunca precifique abaixo do custo real por hora — inclua DAS, IRPF e tempo improdutivo.', en: 'Never price below the real hourly cost — include DAS, IRPF and unproductive time.', es: 'Nunca precios por debajo del costo real por hora — incluya DAS, IRPF y tiempo improductivo.' },
    { pt: 'Adicione 20-30% de margem mínima para cobrir imprevistos e investimentos no negócio.', en: 'Add 20-30% minimum margin to cover unforeseen events and business investments.', es: 'Agregue 20-30% de margen mínimo para cubrir imprevistos e inversiones en el negocio.' },
    { pt: 'Revise seus preços a cada 6 meses considerando inflação e novos custos.', en: 'Review your prices every 6 months considering inflation and new costs.', es: 'Revise sus precios cada 6 meses considerando inflación y nuevos costos.' },
    { pt: 'Serviços MEI têm isenção de 32% de IRPF sobre a receita — use isso no seu cálculo.', en: 'MEI services have a 32% IRPF exemption on revenue — use this in your calculation.', es: 'Servicios MEI tienen exención de 32% de IRPF sobre ingresos — úselo en su cálculo.' },
  ]

  return (
    <ModuloLayout
      titulo={t('titulo')}
      subtitulo={t('subtitulo')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Info do MEI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t('categoria'), value: meiDados?.categoria_mei || 'Serviços', cor: COR },
            { label: t('aliquota'), value: `${(percentualIsento * 100).toFixed(0)}%`, cor: '#34d399' },
            { label: t('dasAnual'), value: fmt((meiDados?.das_valor || 75.90) * 12), cor: '#a78bfa' },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{card.label}</p>
                <p className="text-lg md:text-xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Calculadora */}
        <CanvasBox>
          <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>
            AXIOMA AI.TECH — MEI
          </motion.p>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('calculadora')}</p>
          <div className="space-y-4">
            {[
              { label: t('custo'), value: precoCusto, set: setPrecoCusto },
              { label: t('horas'), value: precoHoras, set: setPrecoHoras },
              { label: t('margem'), value: precoMargem, set: setPrecoMargem },
            ].map((campo, i) => (
              <div key={i}>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{campo.label}</label>
                <input
                  type="number"
                  value={campo.value}
                  onChange={e => campo.set(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }}
                />
              </div>
            ))}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={calcularPreco}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff', boxShadow: `0 4px 20px ${COR}40` }}>
              {t('calcular')}
            </motion.button>

            <AnimatePresence>
              {precoResultado && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2 mt-2">
                  {[
                    { label: t('custoHora'), value: fmt(precoResultado.custoHora), cor: '#3a6090' },
                    { label: t('impostos'), value: fmt(precoResultado.impostos), cor: '#fbbf24' },
                    { label: t('margemReais'), value: fmt(precoResultado.margemReais), cor: '#34d399' },
                    { label: t('precoMinimo'), value: fmt(precoResultado.precoMinimo), cor: COR },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex justify-between items-center p-3 rounded-xl"
                      style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}20` }}>
                      <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                      <span className="text-sm font-black" style={{ color: item.cor }}>{item.value}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CanvasBox>

        {/* Dicas */}
        <CanvasBox>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('dicas')}</p>
          <div className="space-y-3">
            {dicas.map((dica, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: `${COR}06`, border: `1px solid ${COR}15` }}>
                <span className="text-sm flex-shrink-0" style={{ color: COR }}>💡</span>
                <p className="text-xs" style={{ color: '#7a9aba' }}>{dica[lang]}</p>
              </motion.div>
            ))}
          </div>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}