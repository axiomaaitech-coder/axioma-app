'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { AlertTriangle, X } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'

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
    const chars = 'MEI CNPJ DAS DASN R$ 81K SIMEI AXIOMA 0 1 2 3 4 5 6 7 8 9'.split(' ').map((c) => ({
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

export default function PainelMEI() {
  const { idioma } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [modalConfig, setModalConfig] = useState(false)
  const [categoriaMei, setCategoriaMei] = useState('Serviços')
  const [dasValor, setDasValor] = useState('75.90')
  const [dataAbertura, setDataAbertura] = useState('')
  const [salvando, setSalvando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — Painel', en: 'MEI — Dashboard', es: 'MEI — Panel' },
    subtitulo: { pt: 'Painel inteligente para Microempreendedor Individual', en: 'Smart dashboard for Individual Microentrepreneur', es: 'Panel inteligente para Microempresario Individual' },
    configurar: { pt: 'Configurar MEI', en: 'Configure MEI', es: 'Configurar MEI' },
    salvar: { pt: 'Salvar', en: 'Save', es: 'Guardar' },
    cancelar: { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar' },
    faturamento: { pt: 'Faturamento', en: 'Revenue', es: 'Facturación' },
    limiteRestante: { pt: 'Limite Restante', en: 'Remaining Limit', es: 'Límite Restante' },
    dasMensal: { pt: 'DAS Mensal', en: 'Monthly DAS', es: 'DAS Mensual' },
    velocimetro: { pt: 'Velocímetro de Faturamento', en: 'Revenue Speedometer', es: 'Velocímetro de Facturación' },
    alerta: { pt: 'No ritmo atual, você atinge o limite em aproximadamente', en: 'At the current pace, you will reach the limit in approximately', es: 'Al ritmo actual, alcanzarás el límite en aproximadamente' },
    meses: { pt: 'meses', en: 'months', es: 'meses' },
    categoriaMei: { pt: 'Categoria MEI', en: 'MEI Category', es: 'Categoría MEI' },
    valorDas: { pt: 'Valor DAS Mensal (R$)', en: 'Monthly DAS Value (R$)', es: 'Valor DAS Mensual (R$)' },
    dataAbertura: { pt: 'Data de Abertura do MEI', en: 'MEI Opening Date', es: 'Fecha de Apertura del MEI' },
    resumoAnual: { pt: 'Resumo Anual MEI', en: 'MEI Annual Summary', es: 'Resumen Anual MEI' },
    totalReceitas: { pt: 'Total de receitas lançadas', en: 'Total registered revenues', es: 'Total de ingresos registrados' },
    mediaMensal: { pt: 'Média mensal', en: 'Monthly average', es: 'Promedio mensual' },
    projecaoAnual: { pt: 'Projeção anual', en: 'Annual projection', es: 'Proyección anual' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [{ data: mei }, { data: rec }] = await Promise.all([
      supabase.from('mei_dados').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('receitas').select('*').eq('user_id', user.id).order('data', { ascending: false }),
    ])
    setMeiDados(mei || null)
    setReceitas(rec || [])
    if (mei) {
      setCategoriaMei(mei.categoria_mei || 'Serviços')
      setDasValor(String(mei.das_valor || '75.90'))
      setDataAbertura(mei.data_abertura || '')
    }
    setLoading(false)
  }

  async function salvarConfig() {
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const { error } = await supabase.from('mei_dados').upsert({
      user_id: user.id,
      categoria_mei: categoriaMei,
      das_valor: parseFloat(dasValor),
      data_abertura: dataAbertura || null,
      limite_anual: LIMITE_ANUAL,
      regime_tributario: 'mei',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) console.error('Erro ao salvar MEI:', error)
    setModalConfig(false)
    setSalvando(false)
    carregar()
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas.filter(r => new Date(r.data).getFullYear() === anoAtual).reduce((acc, r) => acc + (r.valor || 0), 0)
  const percentualLimite = Math.min(100, (faturamentoAnual / LIMITE_ANUAL) * 100)
  const restanteLimite = Math.max(0, LIMITE_ANUAL - faturamentoAnual)
  const mesAtual = new Date().getMonth()
  const ultimos3Meses = receitas.filter(r => { const d = new Date(r.data); return d.getFullYear() === anoAtual && d.getMonth() >= mesAtual - 3 })
  const mediaMensal = ultimos3Meses.length > 0 ? ultimos3Meses.reduce((a, r) => a + r.valor, 0) / 3 : 0
  const mesesParaEstourar = mediaMensal > 0 ? Math.ceil(restanteLimite / mediaMensal) : null
  const projecaoAnual = mediaMensal * 12

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
      pdf.text('AXIOMA AI.TECH — MEI Painel', 14, 13)
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
      pdf.save(`axioma-mei-painel-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  return (
    <ModuloLayout
      titulo={t('titulo')}
      subtitulo={t('subtitulo')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => setModalConfig(true)}
      labelBotao={t('configurar')}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards principais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `${t('faturamento')} ${anoAtual}`, value: fmt(faturamentoAnual), cor: COR },
            { label: t('limiteRestante'), value: fmt(restanteLimite), cor: '#34d399' },
            { label: t('dasMensal'), value: fmt(parseFloat(dasValor || '75.90')), cor: '#a78bfa' },
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
            <motion.div initial={{ width: 0 }} animate={{ width: `${percentualLimite}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-4 rounded-full"
              style={{
                background: percentualLimite >= 90 ? 'linear-gradient(90deg, #dc2626, #f87171)' : percentualLimite >= 70 ? 'linear-gradient(90deg, #d97706, #fbbf24)' : `linear-gradient(90deg, #c2410c, ${COR})`,
                boxShadow: `0 0 12px ${percentualLimite >= 90 ? '#f87171' : percentualLimite >= 70 ? '#fbbf24' : COR}`
              }} />
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

        {/* Resumo anual */}
        <CanvasBox>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('resumoAnual')} — {anoAtual}</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: t('totalReceitas'), value: fmt(faturamentoAnual), cor: COR },
                { label: t('mediaMensal'), value: fmt(mediaMensal), cor: '#6ab0ff' },
                { label: t('projecaoAnual'), value: fmt(projecaoAnual), cor: projecaoAnual > LIMITE_ANUAL ? '#f87171' : '#34d399' },
                { label: lang === 'pt' ? 'Categoria MEI' : lang === 'en' ? 'MEI Category' : 'Categoría MEI', value: meiDados?.categoria_mei || 'Serviços', cor: '#a78bfa' },
                { label: lang === 'pt' ? 'DAS pago no ano (estimado)' : lang === 'en' ? 'DAS paid in year (estimated)' : 'DAS pagado en el año (estimado)', value: fmt(parseFloat(dasValor || '75.90') * (mesAtual + 1)), cor: '#fbbf24' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex justify-between items-center p-3 rounded-xl"
                  style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}15` }}>
                  <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                  <span className="text-sm font-black" style={{ color: item.cor }}>{item.value}</span>
                </motion.div>
              ))}
            </div>
          )}
        </CanvasBox>

        {/* Acesso rápido aos módulos */}
        <CanvasBox>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>
            {lang === 'pt' ? 'Acesso Rápido' : lang === 'en' ? 'Quick Access' : 'Acceso Rápido'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: lang === 'pt' ? 'Faturamento' : lang === 'en' ? 'Revenue' : 'Facturación', path: '/mei/faturamento', emoji: '📊', cor: COR },
              { label: 'DAS & Obrigações', path: '/mei/das', emoji: '🔔', cor: '#fbbf24' },
              { label: lang === 'pt' ? 'Reforma Tributária' : lang === 'en' ? 'Tax Reform' : 'Reforma Tributaria', path: '/mei/reforma', emoji: '⚠️', cor: '#fb923c' },
              { label: lang === 'pt' ? 'Precificação' : lang === 'en' ? 'Pricing' : 'Precios', path: '/mei/precificacao', emoji: '🧮', cor: '#34d399' },
              { label: 'IA MEI Advisor', path: '/mei/ia-advisor', emoji: '🤖', cor: '#a78bfa' },
              { label: lang === 'pt' ? 'Imposto de Renda' : lang === 'en' ? 'Income Tax' : 'Impuesto Renta', path: '/mei/imposto-renda', emoji: '🧾', cor: '#f472b6' },
            ].map((item, i) => (
              <motion.a key={i} href={item.path}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 p-3 rounded-xl cursor-pointer"
                style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}25`, textDecoration: 'none' }}>
                <span className="text-lg">{item.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: item.cor }}>{item.label}</span>
              </motion.a>
            ))}
          </div>
        </CanvasBox>

      </div>

      {/* Modal Configurar MEI */}
      <AnimatePresence>
        {modalConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25 }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>
                      AXIOMA AI.TECH
                    </motion.p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{t('configurar')}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setModalConfig(false)} style={{ color: '#3a5a8a' }}>
                    <X size={20} />
                  </motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>
                      {t('categoriaMei')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { pt: 'Serviços', en: 'Services', es: 'Servicios' },
                        { pt: 'Comércio', en: 'Commerce', es: 'Comercio' },
                        { pt: 'Indústria', en: 'Industry', es: 'Industria' },
                        { pt: 'Transporte', en: 'Transport', es: 'Transporte' },
                      ].map(cat => (
                        <motion.button key={cat.pt} whileTap={{ scale: 0.97 }}
                          onClick={() => setCategoriaMei(cat.pt)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{
                            background: categoriaMei === cat.pt ? `${COR}20` : 'rgba(59,111,212,0.05)',
                            color: categoriaMei === cat.pt ? COR : '#3a5a8a',
                            border: `1px solid ${categoriaMei === cat.pt ? COR + '40' : 'rgba(59,111,212,0.1)'}`,
                          }}>
                          {cat[lang]}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>
                      {t('valorDas')}
                    </label>
                    <input type="number" value={dasValor} onChange={e => setDasValor(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>
                      {t('dataAbertura')}
                    </label>
                    <input type="date" value={dataAbertura} onChange={e => setDataAbertura(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setModalConfig(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(59,111,212,0.1)', color: '#3a5a8a' }}>
                      {t('cancelar')}
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={salvarConfig} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff' }}>
                      {salvando ? '...' : t('salvar')}
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