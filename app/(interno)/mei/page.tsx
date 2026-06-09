'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import {
  FileText, AlertTriangle, Calculator, TrendingUp,
  Bot, Bell, Menu, X, Pencil, Check
} from 'lucide-react'
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

const SUBMODULOS = [
  { id: 'painel', icon: TrendingUp, label: { pt: 'Painel MEI', en: 'MEI Dashboard', es: 'Panel MEI' } },
  { id: 'faturamento', icon: FileText, label: { pt: 'Faturamento', en: 'Revenue', es: 'Facturación' } },
  { id: 'das', icon: Bell, label: { pt: 'DAS & Obrigações', en: 'DAS & Obligations', es: 'DAS & Obligaciones' } },
  { id: 'reforma', icon: AlertTriangle, label: { pt: 'Reforma Tributária', en: 'Tax Reform', es: 'Reforma Tributaria' } },
  { id: 'precificacao', icon: Calculator, label: { pt: 'Precificação MEI', en: 'MEI Pricing', es: 'Precios MEI' } },
  { id: 'ia', icon: Bot, label: { pt: 'IA MEI Advisor', en: 'AI MEI Advisor', es: 'IA Advisor MEI' } },
]

export default function MEI() {
  const { idioma } = useLanguage()
  const [submodulo, setSubmodulo] = useState('painel')
  const [menuAberto, setMenuAberto] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [modalConfig, setModalConfig] = useState(false)
  const [categoriaMei, setCategoriaMei] = useState('Serviços')
  const [dasValor, setDasValor] = useState('75.90')
  const [dataAbertura, setDataAbertura] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [chatMensagens, setChatMensagens] = useState<{ role: string; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoHoras, setPrecoHoras] = useState('')
  const [precoMargem, setPrecoMargem] = useState('30')
  const [precoResultado, setPrecoResultado] = useState<any>(null)
  const [editandoDas, setEditandoDas] = useState(false)
  const [dasValorTemp, setDasValorTemp] = useState('')
  const [statusDasn, setStatusDasn] = useState<'Pendente' | 'Entregue' | 'Atrasado'>('Pendente')
  const [statusIrpf, setStatusIrpf] = useState<'Não obrigatório' | 'Pendente' | 'Entregue'>('Não obrigatório')
  const [editandoStatusDasn, setEditandoStatusDasn] = useState(false)
  const [editandoStatusIrpf, setEditandoStatusIrpf] = useState(false)

  const txt = {
    titulo: idioma === 'pt' ? 'MEI — Gestão Completa' : idioma === 'en' ? 'MEI — Complete Management' : 'MEI — Gestión Completa',
    subtitulo: idioma === 'pt' ? 'Painel inteligente para Microempreendedor Individual' : idioma === 'en' ? 'Smart dashboard for Individual Microentrepreneur' : 'Panel inteligente para Microempresario Individual',
    configurar: idioma === 'pt' ? 'Configurar MEI' : idioma === 'en' ? 'Configure MEI' : 'Configurar MEI',
    salvar: idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
  }

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

  async function salvarDasInline() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const novoValor = parseFloat(dasValorTemp)
    if (isNaN(novoValor)) return
    setDasValor(String(novoValor))
    await supabase.from('mei_dados').upsert({
      user_id: user.id,
      das_valor: novoValor,
      categoria_mei: categoriaMei,
      limite_anual: LIMITE_ANUAL,
      regime_tributario: 'mei',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setEditandoDas(false)
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
  const percentualIsento = categoriaMei === 'Comércio' ? 0.08 : categoriaMei === 'Indústria' ? 0.08 : categoriaMei === 'Transporte' ? 0.16 : 0.32

  function calcularPreco() {
    if (!precoCusto) return
    const custo = parseFloat(precoCusto)
    const horas = parseFloat(precoHoras) || 1
    const margem = parseFloat(precoMargem) / 100
    const dasPerc = meiDados?.das_valor ? (meiDados.das_valor * 12) / LIMITE_ANUAL : 0.011
    const custoTotal = custo / horas
    const precoMinimo = custoTotal / (1 - margem - dasPerc - percentualIsento * 0.275)
    setPrecoResultado({ custoHora: custoTotal, precoMinimo, margemReais: precoMinimo * margem, impostos: precoMinimo * (dasPerc + percentualIsento * 0.275) })
  }

  async function enviarMensagemIA() {
    if (!chatInput.trim()) return
    const msg = chatInput
    setChatMensagens(prev => [...prev, { role: 'user', content: msg }])
    setChatInput('')
    setChatLoading(true)
    const contexto = `Você é o MEI Advisor da Axioma AI.Tech. Dados: Categoria: ${categoriaMei}, Faturamento ${anoAtual}: R$ ${faturamentoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Limite usado: ${percentualLimite.toFixed(1)}%, Restante: R$ ${restanteLimite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, DAS: R$ ${dasValor}. Responda em português, claro e prático, máximo 3 parágrafos.`
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          system: contexto,
          messages: [...chatMensagens.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })), { role: 'user', content: msg }],
        })
      })
      const data = await response.json()
      setChatMensagens(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text || 'Erro.' }])
    } catch { setChatMensagens(prev => [...prev, { role: 'assistant', content: 'Erro de conexão.' }]) }
    setChatLoading(false)
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
      pdf.text('AXIOMA AI.TECH — MEI', 14, 13)
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
      pdf.save(`axioma-mei-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const subAtual = SUBMODULOS.find(s => s.id === submodulo)
  const corStatus = (s: string) => s === 'Entregue' ? '#34d399' : s === 'Atrasado' ? '#f87171' : s === 'Recorrente' ? COR : s === 'Não obrigatório' ? '#3a5a8a' : '#fbbf24'

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo} onExportarPDF={exportarPDF} exportando={exportando} onNovo={() => setModalConfig(true)} labelBotao={txt.configurar}>
      <div ref={conteudoRef} className="space-y-4">

        <CanvasBox>
          <div className="flex items-center gap-3 flex-wrap">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMenuAberto(!menuAberto)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm md:hidden"
              style={{ background: `${COR}20`, color: COR, border: `1px solid ${COR}40` }}>
              <Menu size={16} />{subAtual?.label[idioma as 'pt' | 'en' | 'es']}
            </motion.button>
            <div className="hidden md:flex gap-2 flex-wrap">
              {SUBMODULOS.map(s => {
                const Icon = s.icon; const ativo = submodulo === s.id
                return (
                  <motion.button key={s.id} whileTap={{ scale: 0.95 }} onClick={() => setSubmodulo(s.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: ativo ? `${COR}25` : 'rgba(255,255,255,0.03)', color: ativo ? COR : '#3a5a8a', border: `1px solid ${ativo ? COR + '50' : 'rgba(255,255,255,0.06)'}`, boxShadow: ativo ? `0 0 12px ${COR}30` : 'none' }}>
                    <Icon size={14} />{s.label[idioma as 'pt' | 'en' | 'es']}
                  </motion.button>
                )
              })}
            </div>
            {percentualLimite >= 70 && (
              <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ml-auto"
                style={{ background: percentualLimite >= 90 ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)', color: percentualLimite >= 90 ? '#f87171' : '#fbbf24', border: `1px solid ${percentualLimite >= 90 ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
                <AlertTriangle size={14} />{percentualLimite.toFixed(0)}% do limite
              </motion.div>
            )}
          </div>
          <AnimatePresence>
            {menuAberto && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 grid grid-cols-2 gap-2 md:hidden">
                {SUBMODULOS.map(s => {
                  const Icon = s.icon; const ativo = submodulo === s.id
                  return (
                    <motion.button key={s.id} whileTap={{ scale: 0.95 }} onClick={() => { setSubmodulo(s.id); setMenuAberto(false) }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: ativo ? `${COR}25` : 'rgba(255,255,255,0.03)', color: ativo ? COR : '#3a5a8a', border: `1px solid ${ativo ? COR + '50' : 'rgba(255,255,255,0.06)'}` }}>
                      <Icon size={14} />{s.label[idioma as 'pt' | 'en' | 'es']}
                    </motion.button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CanvasBox>

        {submodulo === 'painel' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Faturamento ' + anoAtual, value: fmt(faturamentoAnual), cor: COR },
                { label: 'Limite Restante', value: fmt(restanteLimite), cor: '#34d399' },
                { label: 'DAS Mensal', value: fmt(parseFloat(dasValor || '75.90')), cor: '#a78bfa' },
              ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <CanvasBox cor={card.cor}>
                    <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{card.label}</p>
                    <p className="text-xl md:text-2xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
                  </CanvasBox>
                </motion.div>
              ))}
            </div>
            <CanvasBox>
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>AXIOMA AI.TECH — MEI</motion.p>
              <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0' }}>Velocímetro de Faturamento</p>
              <div className="w-full h-4 rounded-full mb-2" style={{ background: 'rgba(59,111,212,0.1)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${percentualLimite}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-4 rounded-full"
                  style={{ background: percentualLimite >= 90 ? 'linear-gradient(90deg, #dc2626, #f87171)' : percentualLimite >= 70 ? 'linear-gradient(90deg, #d97706, #fbbf24)' : `linear-gradient(90deg, #c2410c, ${COR})`, boxShadow: `0 0 12px ${percentualLimite >= 90 ? '#f87171' : percentualLimite >= 70 ? '#fbbf24' : COR}` }} />
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
                  No ritmo atual, você atinge o limite em aproximadamente {mesesParaEstourar} meses.
                </motion.div>
              )}
            </CanvasBox>
          </div>
        )}

        {submodulo === 'faturamento' && (
          <CanvasBox>
            <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>AXIOMA AI.TECH — MEI</motion.p>
            <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>Faturamento Mensal — {anoAtual}</p>
            <div className="space-y-2">
              {Array.from({ length: 12 }, (_, i) => {
                const nomeMes = new Date(anoAtual, i, 1).toLocaleDateString('pt-BR', { month: 'long' })
                const valor = receitas.filter(r => { const d = new Date(r.data); return d.getFullYear() === anoAtual && d.getMonth() === i }).reduce((a, r) => a + r.valor, 0)
                const perc = (valor / (LIMITE_ANUAL / 12)) * 100
                return (
                  <div key={i} className="flex items-center gap-3">
                    <p className="text-xs w-20 capitalize" style={{ color: '#3a6090' }}>{nomeMes}</p>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(59,111,212,0.1)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, perc)}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, #c2410c, ${COR})`, boxShadow: valor > 0 ? `0 0 6px ${COR}` : 'none' }} />
                    </div>
                    <p className="text-xs w-24 text-right font-semibold" style={{ color: valor > 0 ? COR : '#1a3a5a' }}>{fmt(valor)}</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 flex justify-between" style={{ borderTop: '1px solid rgba(249,115,22,0.15)' }}>
              <span className="text-sm font-semibold" style={{ color: '#c8d8f0' }}>Total {anoAtual}</span>
              <span className="text-sm font-black" style={{ color: COR }}>{fmt(faturamentoAnual)}</span>
            </div>
          </CanvasBox>
        )}

        {submodulo === 'das' && (
          <div className="space-y-4">
            <CanvasBox>
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>AXIOMA AI.TECH — MEI</motion.p>
              <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>Calendário de Obrigações Fiscais</p>
              <div className="space-y-3">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${COR}08`, border: `1px solid ${COR}20` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>DAS Mensal</p>
                    <p className="text-xs" style={{ color: '#3a6090' }}>Todo dia 20 de cada mês</p>
                    {editandoDas ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input type="number" value={dasValorTemp} onChange={e => setDasValorTemp(e.target.value)}
                          className="w-28 px-2 py-1 rounded-lg text-xs focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${COR}40`, color: '#c8d8f0' }} autoFocus />
                        <motion.button whileTap={{ scale: 0.9 }} onClick={salvarDasInline} className="p-1 rounded-lg" style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399' }}><Check size={14} /></motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditandoDas(false)} className="p-1 rounded-lg" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}><X size={14} /></motion.button>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold mt-0.5" style={{ color: COR }}>{fmt(parseFloat(dasValor || '75.90'))}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${COR}15`, color: COR, border: `1px solid ${COR}30` }}>Recorrente</span>
                    {!editandoDas && <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => { setDasValorTemp(dasValor); setEditandoDas(true) }} style={{ color: '#6ab0ff' }}><Pencil size={15} /></motion.button>}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>DASN-SIMEI</p>
                    <p className="text-xs" style={{ color: '#3a6090' }}>Até 31 de maio de cada ano</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#fbbf24' }}>Declaração Anual</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editandoStatusDasn ? (
                      <div className="flex gap-1 flex-wrap">
                        {(['Pendente', 'Entregue', 'Atrasado'] as const).map(s => (
                          <motion.button key={s} whileTap={{ scale: 0.9 }} onClick={() => { setStatusDasn(s); setEditandoStatusDasn(false) }}
                            className="text-xs px-2 py-1 rounded-full" style={{ background: `${corStatus(s)}20`, color: corStatus(s), border: `1px solid ${corStatus(s)}40` }}>{s}</motion.button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${corStatus(statusDasn)}15`, color: corStatus(statusDasn), border: `1px solid ${corStatus(statusDasn)}30` }}>{statusDasn}</span>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => setEditandoStatusDasn(true)} style={{ color: '#6ab0ff' }}><Pencil size={15} /></motion.button>
                      </>
                    )}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>IRPF MEI</p>
                    <p className="text-xs" style={{ color: '#3a6090' }}>Até 29 de maio de cada ano</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#a78bfa' }}>{faturamentoAnual > 33888 ? 'Atenção: renda acima do limite de isenção' : 'Se renda > R$ 33.888/ano'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editandoStatusIrpf ? (
                      <div className="flex gap-1 flex-wrap">
                        {(['Não obrigatório', 'Pendente', 'Entregue'] as const).map(s => (
                          <motion.button key={s} whileTap={{ scale: 0.9 }} onClick={() => { setStatusIrpf(s); setEditandoStatusIrpf(false) }}
                            className="text-xs px-2 py-1 rounded-full" style={{ background: `${corStatus(s)}20`, color: corStatus(s), border: `1px solid ${corStatus(s)}40` }}>{s}</motion.button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${corStatus(statusIrpf)}15`, color: corStatus(statusIrpf), border: `1px solid ${corStatus(statusIrpf)}30` }}>{statusIrpf}</span>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => setEditandoStatusIrpf(true)} style={{ color: '#6ab0ff' }}><Pencil size={15} /></motion.button>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </CanvasBox>
            <CanvasBox>
              <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0' }}>Calculadora DASN-SIMEI</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
                  <span className="text-sm" style={{ color: '#c8d8f0' }}>Receita Bruta {anoAtual}</span>
                  <span className="text-sm font-black" style={{ color: COR }}>{fmt(faturamentoAnual)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
                  <span className="text-sm" style={{ color: '#c8d8f0' }}>Categoria</span>
                  <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{categoriaMei}</span>
                </div>
                <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/declaracao-anual-de-faturamento-dasn-simei"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff', boxShadow: `0 4px 20px ${COR}40` }}>
                  <FileText size={16} />Abrir Portal DASN-SIMEI
                </motion.a>
              </div>
            </CanvasBox>
          </div>
        )}

        {submodulo === 'reforma' && (
          <div className="space-y-4">
            <CanvasBox>
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>AXIOMA AI.TECH — MEI</motion.p>
              <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>Reforma Tributária 2026 — Impacto no MEI</p>
              <div className="space-y-3">
                {[
                  { titulo: 'IBS e CBS já em vigor', desc: 'Substituem PIS, COFINS e ICMS gradualmente até 2033. MEI está isento durante a transição.', cor: '#34d399', status: '✅' },
                  { titulo: 'Prazo decisão: setembro 2026', desc: 'MEI precisa decidir se continua no regime simplificado ou migra para ME em 2027.', cor: '#fbbf24', status: '⚠️' },
                  { titulo: 'Limite MEI pode subir em 2027', desc: 'Proposta de aumento do limite para R$ 130.000/ano está em discussão no Congresso.', cor: COR, status: '📋' },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl" style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}20` }}>
                    <p className="text-sm font-bold mb-1" style={{ color: '#c8d8f0' }}>{item.status} {item.titulo}</p>
                    <p className="text-xs" style={{ color: '#5a8ab0' }}>{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </CanvasBox>
            <CanvasBox>
              <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>Simulador: MEI vs ME Simples Nacional</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ background: `${COR}10`, border: `1px solid ${COR}30` }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: COR }}>MEI 2027</p>
                  <p className="text-lg font-black mb-1" style={{ color: COR }}>{fmt(parseFloat(dasValor || '75.90'))}</p>
                  <p className="text-xs" style={{ color: '#3a6090' }}>por mês (DAS fixo)</p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#34d399' }}>✓ Simples e barato</p>
                  <p className="text-xs" style={{ color: '#f87171' }}>✗ Limite R$ 81k/ano</p>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#a78bfa' }}>ME Simples</p>
                  <p className="text-lg font-black mb-1" style={{ color: '#a78bfa' }}>{fmt(faturamentoAnual * 0.06 / 12)}</p>
                  <p className="text-xs" style={{ color: '#3a6090' }}>estimado/mês (~6%)</p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#34d399' }}>✓ Limite R$ 4,8M/ano</p>
                  <p className="text-xs" style={{ color: '#f87171' }}>✗ Mais obrigações</p>
                </div>
              </div>
              <p className="text-xs text-center mt-3" style={{ color: '#3a5a8a' }}>* Estimativa baseada no seu faturamento atual. Consulte um contador.</p>
            </CanvasBox>
          </div>
        )}

        {submodulo === 'precificacao' && (
          <CanvasBox>
            <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>AXIOMA AI.TECH — MEI</motion.p>
            <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0' }}>Calculadora de Preço Justo MEI</p>
            <div className="space-y-4">
              {[
                { label: 'Custo total mensal (R$)', value: precoCusto, set: setPrecoCusto },
                { label: 'Horas trabalhadas/mês', value: precoHoras, set: setPrecoHoras },
                { label: 'Margem de lucro desejada (%)', value: precoMargem, set: setPrecoMargem },
              ].map((campo, i) => (
                <div key={i}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{campo.label}</label>
                  <input type="number" value={campo.value} onChange={e => campo.set(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }} />
                </div>
              ))}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={calcularPreco}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff', boxShadow: `0 4px 20px ${COR}40` }}>
                Calcular Preço Justo
              </motion.button>
              {precoResultado && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mt-2">
                  {[
                    { label: 'Custo por hora', value: fmt(precoResultado.custoHora), cor: '#3a6090' },
                    { label: 'Impostos estimados/hora', value: fmt(precoResultado.impostos), cor: '#fbbf24' },
                    { label: 'Margem de lucro/hora', value: fmt(precoResultado.margemReais), cor: '#34d399' },
                    { label: '💰 Preço mínimo/hora', value: fmt(precoResultado.precoMinimo), cor: COR },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl" style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}20` }}>
                      <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                      <span className="text-sm font-black" style={{ color: item.cor }}>{item.value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </CanvasBox>
        )}

        {submodulo === 'ia' && (
          <CanvasBox>
            <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>AXIOMA AI.TECH — MEI ADVISOR</motion.p>
            <div className="flex gap-2 flex-wrap mb-4">
              {[
                { label: `${percentualLimite.toFixed(0)}% limite`, cor: percentualLimite >= 80 ? '#f87171' : COR },
                { label: fmt(faturamentoAnual), cor: '#34d399' },
                { label: categoriaMei, cor: '#a78bfa' },
              ].map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: `${tag.cor}15`, color: tag.cor, border: `1px solid ${tag.cor}30` }}>{tag.label}</span>
              ))}
            </div>
            <div className="h-64 overflow-y-auto rounded-xl p-3 mb-3 space-y-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.1)' }}>
              {chatMensagens.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Bot size={32} style={{ color: '#1a3a5a' }} />
                  <p className="text-xs text-center" style={{ color: '#3a5a8a' }}>Olá! Sou o MEI Advisor. Conheço seus dados reais. Pergunte sobre DAS, limite, IRPF, Reforma Tributária ou precificação.</p>
                </div>
              )}
              {chatMensagens.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] px-4 py-3 rounded-xl text-sm" style={{ background: msg.role === 'user' ? `${COR}20` : 'rgba(255,255,255,0.05)', color: '#c8d8f0', border: `1px solid ${msg.role === 'user' ? COR + '30' : 'rgba(255,255,255,0.06)'}` }}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (<motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-2 h-2 rounded-full" style={{ background: COR }} />))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagemIA()}
                placeholder="Pergunte sobre seu MEI..."
                className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }} />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={enviarMensagemIA} disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff' }}>
                Enviar
              </motion.button>
            </div>
            <div className="flex gap-2 flex-wrap mt-3">
              {['Vou estourar o limite?', 'Preciso declarar IRPF?', 'MEI ou ME em 2027?'].map((q, i) => (
                <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => setChatInput(q)}
                  className="text-xs px-3 py-1.5 rounded-full" style={{ background: `${COR}10`, color: COR, border: `1px solid ${COR}25` }}>{q}</motion.button>
              ))}
            </div>
          </CanvasBox>
        )}

      </div>

      <AnimatePresence>
        {modalConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25 }} className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>AXIOMA AI.TECH</motion.p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{txt.configurar}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalConfig(false)} style={{ color: '#3a5a8a' }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>Categoria MEI</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Serviços', 'Comércio', 'Indústria', 'Transporte'].map(cat => (
                        <motion.button key={cat} whileTap={{ scale: 0.97 }} onClick={() => setCategoriaMei(cat)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{ background: categoriaMei === cat ? `${COR}20` : 'rgba(59,111,212,0.05)', color: categoriaMei === cat ? COR : '#3a5a8a', border: `1px solid ${categoriaMei === cat ? COR + '40' : 'rgba(59,111,212,0.1)'}` }}>
                          {cat}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>Valor DAS Mensal (R$)</label>
                    <input type="number" value={dasValor} onChange={e => setDasValor(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>Data de Abertura do MEI</label>
                    <input type="date" value={dataAbertura} onChange={e => setDataAbertura(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setModalConfig(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#3a5a8a' }}>{txt.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarConfig} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff' }}>
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