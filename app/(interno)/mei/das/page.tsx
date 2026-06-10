'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { Pencil, Check, X, FileText, Bell } from 'lucide-react'
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
    const chars = 'DAS DASN MEI CNPJ R$ SIMEI AXIOMA IRPF 20 31 MAIO'.split(' ').map((c) => ({
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

export default function DASObrigacoes() {
  const { idioma } = useLanguage()
  const [receitas, setReceitas] = useState<any[]>([])
  const [meiDados, setMeiDados] = useState<any>(null)
  const [dasValor, setDasValor] = useState('75.90')
  const [editandoDas, setEditandoDas] = useState(false)
  const [dasValorTemp, setDasValorTemp] = useState('')
  const [statusDasn, setStatusDasn] = useState<'Pendente' | 'Entregue' | 'Atrasado'>('Pendente')
  const [statusIrpf, setStatusIrpf] = useState<'Não obrigatório' | 'Pendente' | 'Entregue'>('Não obrigatório')
  const [editandoStatusDasn, setEditandoStatusDasn] = useState(false)
  const [editandoStatusIrpf, setEditandoStatusIrpf] = useState(false)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — DAS & Obrigações', en: 'MEI — DAS & Obligations', es: 'MEI — DAS & Obligaciones' },
    subtitulo: { pt: 'Calendário fiscal e controle de obrigações do MEI', en: 'Tax calendar and MEI fiscal obligations control', es: 'Calendario fiscal y control de obligaciones MEI' },
    calendario: { pt: 'Calendário de Obrigações Fiscais', en: 'Tax Obligations Calendar', es: 'Calendario de Obligaciones Fiscales' },
    dasRecorrente: { pt: 'Recorrente', en: 'Recurring', es: 'Recurrente' },
    dasTodo: { pt: 'Todo dia 20 de cada mês', en: 'Every 20th of each month', es: 'Cada día 20 de cada mes' },
    dasnPrazo: { pt: 'Até 31 de maio de cada ano', en: 'By May 31st each year', es: 'Hasta el 31 de mayo de cada año' },
    dasnDesc: { pt: 'Declaração Anual de Faturamento', en: 'Annual Revenue Declaration', es: 'Declaración Anual de Facturación' },
    irpfPrazo: { pt: 'Até 30 de abril de cada ano', en: 'By April 30th each year', es: 'Hasta el 30 de abril de cada año' },
    calculadora: { pt: 'Calculadora DASN-SIMEI', en: 'DASN-SIMEI Calculator', es: 'Calculadora DASN-SIMEI' },
    receitaBruta: { pt: 'Receita Bruta', en: 'Gross Revenue', es: 'Ingresos Brutos' },
    categoria: { pt: 'Categoria', en: 'Category', es: 'Categoría' },
    abrirPortal: { pt: 'Abrir Portal DASN-SIMEI', en: 'Open DASN-SIMEI Portal', es: 'Abrir Portal DASN-SIMEI' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: mei }, { data: rec }] = await Promise.all([
      supabase.from('mei_dados').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('receitas').select('*').eq('user_id', user.id),
    ])
    setMeiDados(mei)
    setReceitas(rec || [])
    if (mei) setDasValor(String(mei.das_valor || '75.90'))
  }

  async function salvarDasInline() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const novoValor = parseFloat(dasValorTemp)
    if (isNaN(novoValor)) return
    setDasValor(String(novoValor))
    await supabase.from('mei_dados').upsert({
      user_id: user.id, das_valor: novoValor,
      categoria_mei: meiDados?.categoria_mei || 'Serviços',
      limite_anual: 81000, regime_tributario: 'mei',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setEditandoDas(false)
    carregar()
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas
    .filter(r => new Date(r.data).getFullYear() === anoAtual)
    .reduce((acc, r) => acc + (r.valor || 0), 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const corStatus = (s: string) =>
    s === 'Entregue' ? '#34d399' : s === 'Atrasado' ? '#f87171' : s === 'Não obrigatório' ? '#3a5a8a' : '#fbbf24'

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
      pdf.text('AXIOMA AI.TECH — MEI DAS & Obrigações', 14, 13)
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
      pdf.save(`axioma-mei-das-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  return (
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'DAS Mensal', value: fmt(parseFloat(dasValor || '75.90')), cor: COR },
            { label: `DAS Anual ${anoAtual}`, value: fmt(parseFloat(dasValor || '75.90') * 12), cor: '#fb923c' },
            { label: `Receita Bruta ${anoAtual}`, value: fmt(faturamentoAnual), cor: '#34d399' },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{card.label}</p>
                <p className="text-xl md:text-2xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Calendário */}
        <CanvasBox>
          <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>
            AXIOMA AI.TECH — MEI
          </motion.p>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('calendario')}</p>
          <div className="space-y-3">

            {/* DAS Mensal */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 p-4 rounded-xl flex-wrap"
              style={{ background: `${COR}08`, border: `1px solid ${COR}20` }}>
              <Bell size={18} style={{ color: COR, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>DAS Mensal</p>
                <p className="text-xs" style={{ color: '#3a6090' }}>{t('dasTodo')}</p>
                {editandoDas ? (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <input type="number" value={dasValorTemp} onChange={e => setDasValorTemp(e.target.value)}
                      className="w-28 px-2 py-1 rounded-lg text-xs focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${COR}40`, color: '#c8d8f0' }} autoFocus />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={salvarDasInline}
                      className="p-1.5 rounded-lg" style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
                      <Check size={14} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditandoDas(false)}
                      className="p-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}>
                      <X size={14} />
                    </motion.button>
                  </div>
                ) : (
                  <p className="text-xs font-semibold mt-1" style={{ color: COR }}>{fmt(parseFloat(dasValor || '75.90'))}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${COR}15`, color: COR, border: `1px solid ${COR}30` }}>
                  {t('dasRecorrente')}
                </span>
                {!editandoDas && (
                  <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { setDasValorTemp(dasValor); setEditandoDas(true) }}
                    style={{ color: '#6ab0ff' }}>
                    <Pencil size={15} />
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* DASN-SIMEI */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl flex-wrap"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <FileText size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>DASN-SIMEI</p>
                <p className="text-xs" style={{ color: '#3a6090' }}>{t('dasnPrazo')}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: '#fbbf24' }}>{t('dasnDesc')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <AnimatePresence mode="wait">
                  {editandoStatusDasn ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex gap-1 flex-wrap">
                      {(['Pendente', 'Entregue', 'Atrasado'] as const).map(s => (
                        <motion.button key={s} whileTap={{ scale: 0.9 }}
                          onClick={() => { setStatusDasn(s); setEditandoStatusDasn(false) }}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: `${corStatus(s)}20`, color: corStatus(s), border: `1px solid ${corStatus(s)}40` }}>
                          {s}
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: `${corStatus(statusDasn)}15`, color: corStatus(statusDasn), border: `1px solid ${corStatus(statusDasn)}30` }}>
                        {statusDasn}
                      </span>
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setEditandoStatusDasn(true)} style={{ color: '#6ab0ff' }}>
                        <Pencil size={15} />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* IRPF MEI */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="flex items-center gap-4 p-4 rounded-xl flex-wrap"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <FileText size={18} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>IRPF MEI</p>
                <p className="text-xs" style={{ color: '#3a6090' }}>{t('irpfPrazo')}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: '#a78bfa' }}>
                  {faturamentoAnual > 33888
                    ? lang === 'pt' ? '⚠️ Sua renda está acima do limite de isenção — acesse o módulo IR MEI'
                    : lang === 'en' ? '⚠️ Your income exceeds the exemption limit — access the MEI IR module'
                    : '⚠️ Sus ingresos superan el límite de exención — acceda al módulo IR MEI'
                    : lang === 'pt' ? '✅ Axioma calculou: você está dentro do limite de isenção'
                    : lang === 'en' ? '✅ Axioma calculated: you are within the exemption limit'
                    : '✅ Axioma calculó: está dentro del límite de exención'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <AnimatePresence mode="wait">
                  {editandoStatusIrpf ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex gap-1 flex-wrap">
                      {(['Não obrigatório', 'Pendente', 'Entregue'] as const).map(s => (
                        <motion.button key={s} whileTap={{ scale: 0.9 }}
                          onClick={() => { setStatusIrpf(s); setEditandoStatusIrpf(false) }}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: `${corStatus(s)}20`, color: corStatus(s), border: `1px solid ${corStatus(s)}40` }}>
                          {s}
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: `${corStatus(statusIrpf)}15`, color: corStatus(statusIrpf), border: `1px solid ${corStatus(statusIrpf)}30` }}>
                        {statusIrpf}
                      </span>
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setEditandoStatusIrpf(true)} style={{ color: '#6ab0ff' }}>
                        <Pencil size={15} />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </CanvasBox>

        {/* Calculadora DASN */}
        <CanvasBox>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('calculadora')}</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
              <span className="text-sm" style={{ color: '#c8d8f0' }}>{t('receitaBruta')} {anoAtual}</span>
              <span className="text-sm font-black" style={{ color: COR }}>{fmt(faturamentoAnual)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <span className="text-sm" style={{ color: '#c8d8f0' }}>{t('categoria')}</span>
              <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{meiDados?.categoria_mei || 'Serviços'}</span>
            </div>
            {/* ✅ Link correto do Portal DASN-SIMEI */}
            <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/declaracao-anual-de-faturamento-dasn-simei"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff', boxShadow: `0 4px 20px ${COR}40` }}>
              <FileText size={16} />{t('abrirPortal')}
            </motion.a>
          </div>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}