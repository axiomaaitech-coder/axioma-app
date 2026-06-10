'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { Bot } from 'lucide-react'
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
    const chars = 'MEI IA AI CNPJ DAS R$ AXIOMA ADVISOR FISCAL'.split(' ').map((c) => ({
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

export default function IAMEIAdvisor() {
  const { idioma } = useLanguage()
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [chatMensagens, setChatMensagens] = useState<{ role: string; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'IA MEI Advisor', en: 'AI MEI Advisor', es: 'IA MEI Advisor' },
    subtitulo: { pt: 'Seu consultor financeiro e fiscal MEI com inteligência artificial', en: 'Your MEI financial and tax advisor with artificial intelligence', es: 'Su asesor financiero y fiscal MEI con inteligencia artificial' },
    placeholder: { pt: 'Pergunte sobre seu MEI...', en: 'Ask about your MEI...', es: 'Pregunte sobre su MEI...' },
    enviar: { pt: 'Enviar', en: 'Send', es: 'Enviar' },
    bemvindo: { pt: 'Olá! Sou o MEI Advisor da Axioma. Conheço seus dados reais. Pergunte sobre DAS, limite, IRPF, Reforma Tributária, precificação ou qualquer dúvida do seu MEI.', en: 'Hello! I am the Axioma MEI Advisor. I know your real data. Ask about DAS, limit, IRPF, Tax Reform, pricing or any MEI question.', es: 'Hola! Soy el MEI Advisor de Axioma. Conozco sus datos reales. Pregunte sobre DAS, límite, IRPF, Reforma Tributaria, precios o cualquier duda de su MEI.' },
    sugestoes: {
      pt: ['Vou estourar o limite?', 'Preciso declarar IRPF?', 'MEI ou ME em 2027?', 'Como reduzir meus impostos?', 'Qual meu DAS correto?'],
      en: ['Will I exceed the limit?', 'Do I need to declare IRPF?', 'MEI or ME in 2027?', 'How to reduce my taxes?', 'What is my correct DAS?'],
      es: ['¿Superaré el límite?', '¿Necesito declarar IRPF?', '¿MEI o ME en 2027?', '¿Cómo reducir mis impuestos?', '¿Cuál es mi DAS correcto?'],
    },
  }

  const t = (key: keyof typeof txt) => {
    const val = txt[key]
    if (typeof val === 'object' && !Array.isArray(val)) return val[idioma as 'pt' | 'en' | 'es'] ?? val.pt
    return val
  }
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMensagens])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: mei }, { data: rec }] = await Promise.all([
      supabase.from('mei_dados').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('receitas').select('*').eq('user_id', user.id),
    ])
    setMeiDados(mei)
    setReceitas(rec || [])
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas
    .filter(r => new Date(r.data).getFullYear() === anoAtual)
    .reduce((acc, r) => acc + (r.valor || 0), 0)
  const percentualLimite = Math.min(100, (faturamentoAnual / LIMITE_ANUAL) * 100)

  async function enviarMensagem() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput
    setChatMensagens(prev => [...prev, { role: 'user', content: msg }])
    setChatInput('')
    setChatLoading(true)
    try {
      const response = await fetch('/api/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: msg,
          historico: chatMensagens,
          contexto: `Você é o MEI Advisor da Axioma AI.Tech, um assistente especialista em MEI (Microempreendedor Individual) brasileiro. Responda sempre em ${lang === 'pt' ? 'português' : lang === 'en' ? 'inglês' : 'espanhol'}. Dados reais do usuário: Categoria MEI: ${meiDados?.categoria_mei || 'Serviços'}, Faturamento ${anoAtual}: ${fmt(faturamentoAnual)}, Limite usado: ${percentualLimite.toFixed(1)}%, Limite restante: ${fmt(Math.max(0, LIMITE_ANUAL - faturamentoAnual))}, DAS mensal: R$ ${meiDados?.das_valor || '75,90'}, Data abertura: ${meiDados?.data_abertura || 'não informada'}. Seja direto, prático e use os dados reais. Máximo 3 parágrafos.`
        })
      })
      const data = await response.json()
      setChatMensagens(prev => [...prev, { role: 'assistant', content: data.resposta || 'Erro ao obter resposta.' }])
    } catch {
      setChatMensagens(prev => [...prev, { role: 'assistant', content: lang === 'pt' ? 'Erro de conexão. Tente novamente.' : lang === 'en' ? 'Connection error. Try again.' : 'Error de conexión. Inténtelo de nuevo.' }])
    }
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
      pdf.text('AXIOMA AI.TECH — IA MEI Advisor', 14, 13)
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
      pdf.save(`axioma-mei-ia-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  return (
    <ModuloLayout
      titulo={t('titulo') as string}
      subtitulo={t('subtitulo') as string}
      onExportarPDF={exportarPDF}
      exportando={exportando}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards contexto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `Faturamento ${anoAtual}`, value: fmt(faturamentoAnual), cor: COR },
            { label: 'Limite usado', value: `${percentualLimite.toFixed(1)}%`, cor: percentualLimite >= 80 ? '#f87171' : '#34d399' },
            { label: 'Categoria MEI', value: meiDados?.categoria_mei || 'Serviços', cor: '#a78bfa' },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#3a5a8a' }}>{card.label}</p>
                <p className="text-lg md:text-xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Chat */}
        <CanvasBox>
          <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: COR, textShadow: `0 0 20px ${COR}` }}>
            AXIOMA AI.TECH — MEI ADVISOR
          </motion.p>

          {/* Área do chat */}
          <div className="h-96 overflow-y-auto rounded-xl p-3 mb-3 space-y-3"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.1)' }}>
            {chatMensagens.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Bot size={40} style={{ color: `${COR}60` }} />
                </motion.div>
                <p className="text-xs text-center px-4" style={{ color: '#3a5a8a' }}>
                  {txt.bemvindo[lang]}
                </p>
              </div>
            )}
            {chatMensagens.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: msg.role === 'user' ? `${COR}20` : 'rgba(255,255,255,0.05)',
                    color: '#c8d8f0',
                    border: `1px solid ${msg.role === 'user' ? COR + '30' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full" style={{ background: COR }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
              placeholder={t('placeholder') as string}
              className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }}
            />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={enviarMensagem} disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff' }}>
              {t('enviar')}
            </motion.button>
          </div>

          {/* Sugestões */}
          <div className="flex gap-2 flex-wrap mt-3">
            {(txt.sugestoes[lang] as string[]).map((q, i) => (
              <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => setChatInput(q)}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: `${COR}10`, color: COR, border: `1px solid ${COR}25` }}>
                {q}
              </motion.button>
            ))}
          </div>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}