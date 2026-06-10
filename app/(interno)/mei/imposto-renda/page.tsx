'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react'
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
    const chars = 'IRPF IR MEI IMPOSTO RENDA R$ CPF AXIOMA DECLARAÇÃO ISENÇÃO'.split(' ').map((c) => ({
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

const FAIXAS_IRPF = [
  { limite: 2259.20, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896.00 },
]

function calcularIRPF(rendaMensal: number): { imposto: number; aliquota: number; aliquotaEfetiva: number } {
  const faixa = FAIXAS_IRPF.find(f => rendaMensal <= f.limite)!
  const imposto = Math.max(0, rendaMensal * faixa.aliquota - faixa.deducao)
  const aliquotaEfetiva = rendaMensal > 0 ? (imposto / rendaMensal) * 100 : 0
  return { imposto, aliquota: faixa.aliquota * 100, aliquotaEfetiva }
}

export default function ImpostoRendaMEI() {
  const { idioma } = useLanguage()
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [outraRenda, setOutraRenda] = useState('')
  const [exportando, setExportando] = useState(false)
  const [checklistMarcado, setChecklistMarcado] = useState<boolean[]>([false, false, false, false, false, false])
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — Imposto de Renda', en: 'MEI — Income Tax', es: 'MEI — Impuesto a la Renta' },
    subtitulo: { pt: 'Calcule e planeje seu IRPF com dados reais — exclusivo Axioma', en: 'Calculate and plan your IRPF with real data — Axioma exclusive', es: 'Calcule y planifique su IRPF con datos reales — exclusivo Axioma' },
    resumo: { pt: 'Resumo IRPF MEI', en: 'MEI IRPF Summary', es: 'Resumen IRPF MEI' },
    receitaBruta: { pt: 'Receita Bruta MEI', en: 'MEI Gross Revenue', es: 'Ingresos Brutos MEI' },
    isencao: { pt: 'Parcela Isenta MEI', en: 'MEI Exempt Portion', es: 'Porción Exenta MEI' },
    rendaTributavel: { pt: 'Renda Tributável', en: 'Taxable Income', es: 'Renta Tributable' },
    outraRenda: { pt: 'Outra renda mensal (salário, aluguel, etc.)', en: 'Other monthly income (salary, rent, etc.)', es: 'Otros ingresos mensuales (salario, alquiler, etc.)' },
    tabela: { pt: 'Tabela Progressiva IRPF 2025', en: 'Progressive IRPF Table 2025', es: 'Tabla Progresiva IRPF 2025' },
    checklist: { pt: 'Checklist Declaração IRPF MEI', en: 'MEI IRPF Declaration Checklist', es: 'Checklist Declaración IRPF MEI' },
    abrirReceita: { pt: 'Acessar Receita Federal', en: 'Access Federal Revenue', es: 'Acceder a Receita Federal' },
    obrigatorio: { pt: 'Declaração OBRIGATÓRIA', en: 'MANDATORY Declaration', es: 'Declaración OBLIGATORIA' },
    naoObrigatorio: { pt: 'Declaração não obrigatória', en: 'Declaration not required', es: 'Declaración no obligatoria' },
    progresso: { pt: 'itens concluídos', en: 'items completed', es: 'elementos completados' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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

    // ✅ Carregar checklist salvo do localStorage
    const salvo = localStorage.getItem(`axioma-irpf-checklist-${user.id}`)
    if (salvo) {
      try { setChecklistMarcado(JSON.parse(salvo)) } catch {}
    }
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas
    .filter(r => new Date(r.data).getFullYear() === anoAtual)
    .reduce((acc, r) => acc + (r.valor || 0), 0)

  const percentualIsento = meiDados?.categoria_mei === 'Comércio' ? 0.08
    : meiDados?.categoria_mei === 'Indústria' ? 0.08
    : meiDados?.categoria_mei === 'Transporte' ? 0.16 : 0.32

  const isencaoMEI = faturamentoAnual * percentualIsento
  const rendaTributavelMEI = faturamentoAnual - isencaoMEI
  const outraRendaAnual = parseFloat(outraRenda || '0') * 12
  const rendaTotalAnual = rendaTributavelMEI + outraRendaAnual
  const rendaMensalMedia = rendaTotalAnual / 12

  const { imposto, aliquotaEfetiva } = calcularIRPF(rendaMensalMedia)
  const impostoAnual = imposto * 12
  const obrigado = rendaTotalAnual > 33888 || faturamentoAnual > 0

  // ✅ Checklist com itens automáticos e manuais
  const checklistItens = [
    { pt: 'CNPJ MEI ativo e em dia com DAS', en: 'Active MEI CNPJ with DAS up to date', es: 'CNPJ MEI activo y al día con DAS', auto: !!meiDados },
    { pt: 'DASN-SIMEI declarada (receita bruta anual)', en: 'DASN-SIMEI declared (annual gross revenue)', es: 'DASN-SIMEI declarada (ingresos brutos anuales)', auto: faturamentoAnual > 0 },
    { pt: 'Comprovante de rendimentos MEI separado', en: 'MEI income proof separated', es: 'Comprobante de ingresos MEI separado', auto: false },
    { pt: 'Recibos e notas fiscais do ano organizados', en: 'Receipts and invoices for the year organized', es: 'Recibos y facturas del año organizados', auto: receitas.length > 0 },
    { pt: 'Informes de outras fontes de renda (se houver)', en: 'Reports from other income sources (if any)', es: 'Informes de otras fuentes de ingresos (si hay)', auto: false },
    { pt: 'Programa IRPF Receita Federal instalado', en: 'Receita Federal IRPF Program installed', es: 'Programa IRPF Receita Federal instalado', auto: false },
  ]

  function toggleChecklist(index: number) {
    // Itens automáticos não podem ser desmarcados manualmente
    if (checklistItens[index].auto) return
    const novo = [...checklistMarcado]
    novo[index] = !novo[index]
    setChecklistMarcado(novo)
    // Salva no localStorage
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) localStorage.setItem(`axioma-irpf-checklist-${user.id}`, JSON.stringify(novo))
    })
  }

  const itensConcluidos = checklistItens.filter((item, i) => item.auto || checklistMarcado[i]).length
  const totalItens = checklistItens.length

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
      pdf.text('AXIOMA AI.TECH — MEI Imposto de Renda', 14, 13)
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
      pdf.save(`axioma-mei-irpf-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  return (
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Badge exclusivo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(251,191,36,0.1))', border: '1px solid rgba(249,115,22,0.3)' }}>
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-sm font-black" style={{ color: COR }}>
              {lang === 'pt' ? 'Funcionalidade exclusiva Axioma AI.Tech' : lang === 'en' ? 'Exclusive Axioma AI.Tech feature' : 'Función exclusiva Axioma AI.Tech'}
            </p>
            <p className="text-xs" style={{ color: '#7a9aba' }}>
              {lang === 'pt' ? 'Nenhum concorrente oferece cálculo de IRPF MEI com dados reais integrados.'
                : lang === 'en' ? 'No competitor offers MEI IRPF calculation with integrated real data.'
                : 'Ningún competidor ofrece cálculo de IRPF MEI con datos reales integrados.'}
            </p>
          </div>
        </motion.div>

        {/* Status obrigatoriedade */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{
            background: obrigado ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
            border: `1px solid ${obrigado ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
          }}>
          {obrigado
            ? <AlertTriangle size={22} style={{ color: '#f87171', flexShrink: 0 }} />
            : <CheckCircle size={22} style={{ color: '#34d399', flexShrink: 0 }} />}
          <div>
            <p className="text-sm font-black" style={{ color: obrigado ? '#f87171' : '#34d399' }}>
              {obrigado ? t('obrigatorio') : t('naoObrigatorio')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#7a9aba' }}>
              {obrigado
                ? (lang === 'pt' ? `Axioma identificou: sua renda tributável (${fmt(rendaTotalAnual)}/ano) supera o limite de isenção de R$ 33.888/ano.`
                  : lang === 'en' ? `Axioma identified: your taxable income (${fmt(rendaTotalAnual)}/year) exceeds the exemption limit of R$ 33,888/year.`
                  : `Axioma identificó: su renta tributable (${fmt(rendaTotalAnual)}/año) supera el límite de exención de R$ 33.888/año.`)
                : (lang === 'pt' ? '✅ Axioma analisou seus dados: você está dentro do limite de isenção.'
                  : lang === 'en' ? '✅ Axioma analyzed your data: you are within the exemption limit.'
                  : '✅ Axioma analizó sus datos: está dentro del límite de exención.')}
            </p>
          </div>
        </motion.div>

        {/* Cards principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('receitaBruta'), value: fmt(faturamentoAnual), cor: COR },
            { label: t('isencao'), value: fmt(isencaoMEI), cor: '#34d399' },
            { label: t('rendaTributavel'), value: fmt(rendaTributavelMEI), cor: '#fbbf24' },
            { label: lang === 'pt' ? 'IRPF estimado/ano' : lang === 'en' ? 'Estimated IRPF/year' : 'IRPF estimado/año', value: fmt(impostoAnual), cor: obrigado ? '#f87171' : '#3a5a8a' },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{card.label}</p>
                <p className="text-base md:text-lg font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Calculadora */}
        <CanvasBox>
          <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>
            AXIOMA AI.TECH — IRPF MEI
          </motion.p>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('resumo')}</p>
          <div className="mb-4">
            <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>
              {t('outraRenda')}
            </label>
            <input type="number" value={outraRenda} onChange={e => setOutraRenda(e.target.value)}
              placeholder="0,00" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }} />
          </div>
          <div className="space-y-2">
            {[
              { label: lang === 'pt' ? `Receita Bruta MEI ${anoAtual}` : lang === 'en' ? `MEI Gross Revenue ${anoAtual}` : `Ingresos Brutos MEI ${anoAtual}`, value: fmt(faturamentoAnual), cor: COR },
              { label: lang === 'pt' ? `Isenção MEI (${(percentualIsento * 100).toFixed(0)}% — ${meiDados?.categoria_mei || 'Serviços'})` : lang === 'en' ? `MEI Exemption (${(percentualIsento * 100).toFixed(0)}%)` : `Exención MEI (${(percentualIsento * 100).toFixed(0)}%)`, value: `- ${fmt(isencaoMEI)}`, cor: '#34d399' },
              { label: lang === 'pt' ? 'Renda tributável MEI' : lang === 'en' ? 'MEI taxable income' : 'Renta tributable MEI', value: fmt(rendaTributavelMEI), cor: '#fbbf24' },
              { label: lang === 'pt' ? 'Outra renda (anual)' : lang === 'en' ? 'Other income (annual)' : 'Otros ingresos (anual)', value: fmt(outraRendaAnual), cor: '#a78bfa' },
              { label: lang === 'pt' ? 'Renda total tributável/ano' : lang === 'en' ? 'Total taxable income/year' : 'Renta total tributable/año', value: fmt(rendaTotalAnual), cor: '#6ab0ff' },
              { label: lang === 'pt' ? 'Alíquota efetiva IRPF' : lang === 'en' ? 'Effective IRPF rate' : 'Alícuota efectiva IRPF', value: `${aliquotaEfetiva.toFixed(1)}%`, cor: obrigado ? '#f87171' : '#34d399' },
              { label: lang === 'pt' ? '💰 IRPF total estimado/ano' : lang === 'en' ? '💰 Estimated total IRPF/year' : '💰 IRPF total estimado/año', value: fmt(impostoAnual), cor: obrigado ? '#f87171' : '#34d399' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex justify-between items-center p-3 rounded-xl"
                style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}15` }}>
                <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                <span className="text-sm font-black" style={{ color: item.cor }}>{item.value}</span>
              </motion.div>
            ))}
          </div>
        </CanvasBox>

        {/* Tabela progressiva */}
        <CanvasBox>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>{t('tabela')}</p>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  lang === 'pt' ? 'Base de Cálculo Mensal' : lang === 'en' ? 'Monthly Calculation Base' : 'Base de Cálculo Mensual',
                  lang === 'pt' ? 'Alíquota' : lang === 'en' ? 'Rate' : 'Alícuota',
                  lang === 'pt' ? 'Dedução' : lang === 'en' ? 'Deduction' : 'Deducción',
                ].map((h, i) => (
                  <p key={i} className="text-xs font-bold uppercase tracking-wider px-2" style={{ color: '#3a5a8a' }}>{h}</p>
                ))}
              </div>
              {[
                { faixa: lang === 'pt' ? 'Até R$ 2.259,20' : lang === 'en' ? 'Up to R$ 2,259.20' : 'Hasta R$ 2.259,20', aliquota: 'Isento', deducao: '—', cor: '#34d399' },
                { faixa: 'R$ 2.259,21 – R$ 2.826,65', aliquota: '7,5%', deducao: 'R$ 169,44', cor: '#6ab0ff' },
                { faixa: 'R$ 2.826,66 – R$ 3.751,05', aliquota: '15%', deducao: 'R$ 381,44', cor: COR_C },
                { faixa: 'R$ 3.751,06 – R$ 4.664,68', aliquota: '22,5%', deducao: 'R$ 662,77', cor: COR },
                { faixa: lang === 'pt' ? 'Acima de R$ 4.664,68' : lang === 'en' ? 'Above R$ 4,664.68' : 'Por encima de R$ 4.664,68', aliquota: '27,5%', deducao: 'R$ 896,00', cor: '#f87171' },
              ].map((row, i) => {
                const ehFaixaAtual = rendaMensalMedia > 0 && (
                  (i === 0 && rendaMensalMedia <= 2259.20) ||
                  (i === 1 && rendaMensalMedia > 2259.20 && rendaMensalMedia <= 2826.65) ||
                  (i === 2 && rendaMensalMedia > 2826.65 && rendaMensalMedia <= 3751.05) ||
                  (i === 3 && rendaMensalMedia > 3751.05 && rendaMensalMedia <= 4664.68) ||
                  (i === 4 && rendaMensalMedia > 4664.68)
                )
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="grid grid-cols-3 gap-2 p-2 rounded-xl"
                    style={{
                      background: ehFaixaAtual ? `${row.cor}15` : `${row.cor}05`,
                      border: `1px solid ${ehFaixaAtual ? row.cor + '40' : row.cor + '15'}`,
                      boxShadow: ehFaixaAtual ? `0 0 12px ${row.cor}20` : 'none',
                    }}>
                    <p className="text-xs" style={{ color: ehFaixaAtual ? '#c8d8f0' : '#5a7a9a' }}>{ehFaixaAtual ? '👉 ' : ''}{row.faixa}</p>
                    <p className="text-xs font-bold text-center" style={{ color: row.cor }}>{row.aliquota}</p>
                    <p className="text-xs text-right" style={{ color: ehFaixaAtual ? '#c8d8f0' : '#5a7a9a' }}>{row.deducao}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: '#3a5a8a' }}>
            {lang === 'pt' ? '* Tabela IRPF 2025. Axioma calculou automaticamente com base nos seus dados reais.'
              : lang === 'en' ? '* IRPF 2025 table. Axioma calculated automatically based on your real data.'
              : '* Tabla IRPF 2025. Axioma calculó automáticamente con base en sus datos reales.'}
          </p>
        </CanvasBox>

        {/* ✅ Checklist CLICÁVEL */}
        <CanvasBox>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm font-semibold" style={{ color: '#c8d8f0' }}>{t('checklist')}</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full overflow-hidden" style={{ background: 'rgba(59,111,212,0.15)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(itensConcluidos / totalItens) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-2 rounded-full"
                  style={{ background: `linear-gradient(90deg, #34d399, #6ab0ff)` }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: '#34d399' }}>
                {itensConcluidos}/{totalItens} {t('progresso')}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {checklistItens.map((item, i) => {
              const marcado = item.auto || checklistMarcado[i]
              const clicavel = !item.auto
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={clicavel ? { scale: 1.01, x: 2 } : {}}
                  whileTap={clicavel ? { scale: 0.98 } : {}}
                  onClick={() => toggleChecklist(i)}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{
                    background: marcado ? 'rgba(52,211,153,0.08)' : 'rgba(59,111,212,0.05)',
                    border: `1px solid ${marcado ? 'rgba(52,211,153,0.25)' : 'rgba(59,111,212,0.12)'}`,
                    cursor: clicavel ? 'pointer' : 'default',
                    boxShadow: marcado ? '0 0 10px rgba(52,211,153,0.08)' : 'none',
                  }}>
                  <motion.div
                    animate={{ scale: marcado ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0">
                    {marcado ? (
                      <CheckCircle size={18} style={{ color: '#34d399' }} />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 transition-all"
                        style={{ borderColor: clicavel ? '#3a6090' : '#2a4060' }} />
                    )}
                  </motion.div>
                  <p className="text-xs flex-1" style={{ color: marcado ? '#c8d8f0' : '#5a7a9a' }}>
                    {item[lang]}
                  </p>
                  {item.auto && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: 10 }}>
                      {lang === 'pt' ? 'auto' : 'auto'}
                    </span>
                  )}
                  {clicavel && !marcado && (
                    <span className="text-xs flex-shrink-0" style={{ color: '#3a5a8a', fontSize: 10 }}>
                      {lang === 'pt' ? 'clique para marcar' : lang === 'en' ? 'click to check' : 'clic para marcar'}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>

          {itensConcluidos === totalItens && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl text-center"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <p className="text-sm font-bold" style={{ color: '#34d399' }}>
                🎉 {lang === 'pt' ? 'Checklist completo! Você está pronto para declarar.' : lang === 'en' ? 'Checklist complete! You are ready to file.' : '¡Checklist completo! Está listo para declarar.'}
              </p>
            </motion.div>
          )}

          <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mt-4"
            style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff', boxShadow: `0 4px 20px ${COR}40` }}>
            <FileText size={16} />{t('abrirReceita')}
          </motion.a>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}