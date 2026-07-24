'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
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
    const chars = 'MEI IBS CBS REFORMA 2026 2027 SIMPLES AXIOMA R$ CNPJ'.split(' ').map((c) => ({
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

export default function ReformaTributaria() {
  const { idioma } = useLanguage()
  const [receitas, setReceitas] = useState<any[]>([])
  const [meiDados, setMeiDados] = useState<any>(null)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — Reforma Tributária', en: 'MEI — Tax Reform', es: 'MEI — Reforma Tributaria' },
    subtitulo: { pt: 'Entenda o impacto da Reforma Tributária 2026 no seu MEI', en: 'Understand the impact of the 2026 Tax Reform on your MEI', es: 'Entienda el impacto de la Reforma Tributaria 2026 en su MEI' },
    impacto: { pt: 'Reforma Tributária 2026 — Impacto no MEI', en: '2026 Tax Reform — MEI Impact', es: 'Reforma Tributaria 2026 — Impacto en MEI' },
    simulador: { pt: 'Simulador: MEI vs ME Simples Nacional', en: 'Simulator: MEI vs ME Simples Nacional', es: 'Simulador: MEI vs ME Simples Nacional' },
    porMes: { pt: 'por mês (DAS fixo)', en: 'per month (fixed DAS)', es: 'por mes (DAS fijo)' },
    estimado: { pt: 'estimado/mês (~6%)', en: 'estimated/month (~6%)', es: 'estimado/mes (~6%)' },
    aviso: { pt: '* Estimativa baseada no seu faturamento atual. Consulte um contador.', en: '* Estimate based on your current revenue. Consult an accountant.', es: '* Estimación basada en su facturación actual. Consulte un contador.' },
    timeline: { pt: 'Linha do Tempo — Transição até 2033', en: 'Timeline — Transition until 2033', es: 'Línea de Tiempo — Transición hasta 2033' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: mei }, { data: rec }] = await Promise.all([
      supabase.from('mei_dados').select('*').maybeSingle(),
      supabase.from('receitas').select('*'),
    ])
    setMeiDados(mei)
    setReceitas(rec || [])
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas
    .filter(r => new Date(r.data).getFullYear() === anoAtual)
    .reduce((acc, r) => acc + (r.valor || 0), 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dasValor = meiDados?.das_valor || 75.90

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
      pdf.text('AXIOMA AI.TECH — MEI Reforma Tributária', 14, 13)
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
      pdf.save(`axioma-mei-reforma-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const itensReforma = [
    { titulo: { pt: 'IBS e CBS já em vigor', en: 'IBS and CBS already in effect', es: 'IBS y CBS ya en vigor' }, desc: { pt: 'Substituem PIS, COFINS e ICMS gradualmente até 2033. MEI está isento durante a transição.', en: 'Replace PIS, COFINS and ICMS gradually until 2033. MEI is exempt during the transition.', es: 'Reemplazan PIS, COFINS e ICMS gradualmente hasta 2033. MEI está exento durante la transición.' }, cor: '#34d399', status: '✅' },
    { titulo: { pt: 'Prazo decisão: setembro 2026', en: 'Decision deadline: September 2026', es: 'Plazo decisión: septiembre 2026' }, desc: { pt: 'MEI precisa decidir se continua no regime simplificado ou migra para ME em 2027.', en: 'MEI needs to decide whether to stay in the simplified regime or migrate to ME in 2027.', es: 'MEI debe decidir si continúa en el régimen simplificado o migra a ME en 2027.' }, cor: '#fbbf24', status: '⚠️' },
    { titulo: { pt: 'Limite MEI pode subir em 2027', en: 'MEI limit may increase in 2027', es: 'Límite MEI puede subir en 2027' }, desc: { pt: 'Proposta de aumento do limite para R$ 130.000/ano está em discussão no Congresso.', en: 'Proposal to increase the limit to R$ 130,000/year is under discussion in Congress.', es: 'Propuesta de aumento del límite a R$ 130.000/año está en discusión en el Congreso.' }, cor: COR, status: '📋' },
    { titulo: { pt: 'Nota Fiscal obrigatória em 2027', en: 'Invoice mandatory in 2027', es: 'Factura obligatoria en 2027' }, desc: { pt: 'MEI prestador de serviços terá obrigatoriedade de emitir NFS-e pelo sistema nacional unificado.', en: 'MEI service providers will be required to issue NFS-e through the unified national system.', es: 'MEI prestadores de servicios deberán emitir NFS-e a través del sistema nacional unificado.' }, cor: '#a78bfa', status: '📌' },
  ]

  const timeline = [
    { ano: '2024', desc: { pt: 'IBS e CBS criados — alíquotas zero', en: 'IBS and CBS created — zero rates', es: 'IBS y CBS creados — alícuotas cero' }, cor: '#34d399' },
    { ano: '2025', desc: { pt: 'Teste com alíquotas mínimas (0,1%)', en: 'Test with minimum rates (0.1%)', es: 'Prueba con alícuotas mínimas (0,1%)' }, cor: '#6ab0ff' },
    { ano: '2026', desc: { pt: 'Decisão: MEI ou ME Simples para 2027', en: 'Decision: MEI or ME Simples for 2027', es: 'Decisión: MEI o ME Simples para 2027' }, cor: COR },
    { ano: '2027', desc: { pt: 'Redução progressiva PIS/COFINS começa', en: 'Progressive PIS/COFINS reduction begins', es: 'Reducción progresiva PIS/COFINS comienza' }, cor: '#fbbf24' },
    { ano: '2033', desc: { pt: 'Transição completa — novo sistema vigente', en: 'Full transition — new system in effect', es: 'Transición completa — nuevo sistema vigente' }, cor: '#f87171' },
  ]

  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'

  return (
    <ModuloLayout
      titulo={t('titulo')}
      subtitulo={t('subtitulo')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Alerta destaque */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <AlertTriangle size={20} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: '#fbbf24' }}>
              {lang === 'pt' ? '⚠️ Ação necessária até setembro 2026' : lang === 'en' ? '⚠️ Action required by September 2026' : '⚠️ Acción necesaria antes de septiembre 2026'}
            </p>
            <p className="text-xs" style={{ color: '#c8d8f0' }}>
              {lang === 'pt' ? 'Você precisa decidir se continuará como MEI ou migrará para ME Simples Nacional em 2027. Use o simulador abaixo para comparar.' : lang === 'en' ? 'You need to decide whether to continue as MEI or migrate to ME Simples Nacional in 2027. Use the simulator below to compare.' : 'Necesita decidir si continuará como MEI o migrará a ME Simples Nacional en 2027. Use el simulador a continuación para comparar.'}
            </p>
          </div>
        </motion.div>

        {/* Impactos */}
        <CanvasBox>
          <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>
            AXIOMA AI.TECH — MEI
          </motion.p>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('impacto')}</p>
          <div className="space-y-3">
            {itensReforma.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl" style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}20` }}>
                <p className="text-sm font-bold mb-1" style={{ color: '#c8d8f0' }}>{item.status} {item.titulo[lang]}</p>
                <p className="text-xs" style={{ color: '#5a8ab0' }}>{item.desc[lang]}</p>
              </motion.div>
            ))}
          </div>
        </CanvasBox>

        {/* Simulador MEI vs ME */}
        <CanvasBox>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('simulador')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl text-center" style={{ background: `${COR}10`, border: `1px solid ${COR}30` }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: COR }}>MEI 2027</p>
              <p className="text-lg font-black mb-1" style={{ color: COR }}>{fmt(dasValor)}</p>
              <p className="text-xs mb-3" style={{ color: '#3a6090' }}>{t('porMes')}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: '#34d399' }}>✓ {lang === 'pt' ? 'Simples e barato' : lang === 'en' ? 'Simple and cheap' : 'Simple y barato'}</p>
                <p className="text-xs font-semibold" style={{ color: '#34d399' }}>✓ {lang === 'pt' ? 'Sem contador obrigatório' : lang === 'en' ? 'No accountant required' : 'Sin contador obligatorio'}</p>
                <p className="text-xs" style={{ color: '#f87171' }}>✗ {lang === 'pt' ? 'Limite R$ 81k/ano' : lang === 'en' ? 'Limit R$ 81k/year' : 'Límite R$ 81k/año'}</p>
                <p className="text-xs" style={{ color: '#f87171' }}>✗ {lang === 'pt' ? 'Sem sócios' : lang === 'en' ? 'No partners' : 'Sin socios'}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#a78bfa' }}>ME Simples</p>
              <p className="text-lg font-black mb-1" style={{ color: '#a78bfa' }}>{fmt(faturamentoAnual * 0.06 / 12)}</p>
              <p className="text-xs mb-3" style={{ color: '#3a6090' }}>{t('estimado')}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: '#34d399' }}>✓ {lang === 'pt' ? 'Limite R$ 4,8M/ano' : lang === 'en' ? 'Limit R$ 4.8M/year' : 'Límite R$ 4,8M/año'}</p>
                <p className="text-xs font-semibold" style={{ color: '#34d399' }}>✓ {lang === 'pt' ? 'Pode ter sócios' : lang === 'en' ? 'Can have partners' : 'Puede tener socios'}</p>
                <p className="text-xs" style={{ color: '#f87171' }}>✗ {lang === 'pt' ? 'Mais obrigações' : lang === 'en' ? 'More obligations' : 'Más obligaciones'}</p>
                <p className="text-xs" style={{ color: '#f87171' }}>✗ {lang === 'pt' ? 'Contador obrigatório' : lang === 'en' ? 'Accountant required' : 'Contador obligatorio'}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: '#3a5a8a' }}>{t('aviso')}</p>
        </CanvasBox>

        {/* Timeline */}
        <CanvasBox>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('timeline')}</p>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ background: `linear-gradient(180deg, ${COR}, #a78bfa)` }} />
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 pl-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                    style={{ background: `${item.cor}20`, border: `2px solid ${item.cor}`, boxShadow: `0 0 12px ${item.cor}40` }}>
                    <span className="text-xs font-black" style={{ color: item.cor }}>{item.ano.slice(2)}</span>
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-xs font-black mb-0.5" style={{ color: item.cor }}>{item.ano}</p>
                    <p className="text-xs" style={{ color: '#7a9aba' }}>{item.desc[lang]}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}