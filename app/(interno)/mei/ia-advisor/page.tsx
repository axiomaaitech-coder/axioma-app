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

// Respostas simuladas inteligentes baseadas nos dados reais
function gerarResposta(pergunta: string, dados: {
  faturamento: number, limite: number, percentual: number,
  restante: number, das: string, categoria: string, lang: string
}): string {
  const p = pergunta.toLowerCase()
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const { faturamento, limite, percentual, restante, das, categoria, lang } = dados

  if (p.includes('limit') || p.includes('estourar') || p.includes('81') || p.includes('faturamento')) {
    if (percentual >= 90) return lang === 'pt'
      ? `⚠️ Atenção! Você já usou ${percentual.toFixed(1)}% do limite MEI (${fmt(faturamento)} de ${fmt(limite)}). Só restam ${fmt(restante)}. Você está em zona de risco — considere urgentemente migrar para ME Simples Nacional antes de ultrapassar o limite e ter problemas com a Receita Federal.`
      : `⚠️ Warning! You have used ${percentual.toFixed(1)}% of the MEI limit. Only ${fmt(restante)} remaining. Consider urgently migrating to ME Simples Nacional.`
    if (percentual >= 70) return lang === 'pt'
      ? `📊 Seu faturamento atual é ${fmt(faturamento)}, representando ${percentual.toFixed(1)}% do limite de ${fmt(limite)}. Você ainda tem ${fmt(restante)} disponíveis. No ritmo atual, monitore de perto os próximos meses para não ultrapassar o limite.`
      : `📊 Your current revenue is ${fmt(faturamento)}, representing ${percentual.toFixed(1)}% of the limit. You still have ${fmt(restante)} available.`
    return lang === 'pt'
      ? `✅ Seu faturamento está tranquilo! Você usou apenas ${percentual.toFixed(1)}% do limite (${fmt(faturamento)} de ${fmt(limite)}). Ainda tem ${fmt(restante)} disponíveis para faturar no ano.`
      : `✅ Your revenue is fine! You've used only ${percentual.toFixed(1)}% of the limit. ${fmt(restante)} still available.`
  }

  if (p.includes('das') || p.includes('imposto') || p.includes('pagar') || p.includes('boleto')) {
    return lang === 'pt'
      ? `💡 Seu DAS mensal é de R$ ${das}. O pagamento vence todo dia 20 de cada mês. O DAS cobre INSS, ISS e ICMS de forma simplificada. Nunca atrase — o atraso gera multa de 0,33% ao dia (máximo 20%) mais juros Selic. Para ${categoria}, a alíquota do SIMEI é calculada automaticamente pelo Axioma.`
      : `💡 Your monthly DAS is R$ ${das}. Payment is due every 20th of the month. Never be late — late payment generates a fine of 0.33% per day.`
  }

  if (p.includes('irpf') || p.includes('imposto de renda') || p.includes('declarar') || p.includes('declaração')) {
    const obrigado = faturamento > 33888
    return lang === 'pt'
      ? obrigado
        ? `📋 Com base no seu faturamento de ${fmt(faturamento)}, o Axioma identificou que você pode estar obrigado a declarar IRPF. Acesse o módulo "Imposto de Renda MEI" para ver o cálculo completo personalizado com seus dados reais.`
        : `✅ Com base no seu faturamento atual de ${fmt(faturamento)}, o Axioma calculou que você provavelmente não é obrigado a declarar IRPF (limite de isenção: R$ 33.888/ano). Mas use o módulo "Imposto de Renda MEI" para uma análise completa incluindo outras rendas.`
      : obrigado
        ? `📋 Based on your revenue of ${fmt(faturamento)}, Axioma identified you may be required to file IRPF. Check the Income Tax MEI module for complete calculation.`
        : `✅ Based on your current revenue of ${fmt(faturamento)}, Axioma calculated you are likely not required to file IRPF.`
  }

  if (p.includes('mei ou me') || p.includes('simples') || p.includes('migrar') || p.includes('2027')) {
    return lang === 'pt'
      ? `🔄 A Reforma Tributária 2026 exige uma decisão importante até setembro de 2026. Como MEI ${categoria}, você paga R$ ${das}/mês (DAS fixo). Se migrar para ME Simples Nacional, o imposto seria variável (~6% do faturamento = ${fmt(faturamento * 0.06 / 12)}/mês estimado). O MEI é mais barato se você não ultrapassar R$ 81k/ano. Use o módulo "Reforma Tributária" para ver a simulação completa.`
      : `🔄 The 2026 Tax Reform requires an important decision by September 2026. As MEI ${categoria}, you pay R$ ${das}/month. If you migrate to ME Simples Nacional, the tax would be variable (~6% of revenue).`
  }

  if (p.includes('preço') || p.includes('precific') || p.includes('cobrar') || p.includes('valor') || p.includes('hora')) {
    return lang === 'pt'
      ? `💰 Para ${categoria}, o Axioma recomenda incluir no seu preço: custo real por hora + DAS proporcional + isenção IRPF + margem de lucro mínima de 30%. Use o módulo "Precificação MEI" para calcular exatamente quanto cobrar pelos seus produtos e serviços com base nos seus custos reais.`
      : `💰 For ${categoria}, Axioma recommends including in your price: real hourly cost + proportional DAS + IRPF exemption + minimum profit margin of 30%.`
  }

  if (p.includes('dasn') || p.includes('declaração anual') || p.includes('anual')) {
    return lang === 'pt'
      ? `📄 A DASN-SIMEI é a declaração anual do MEI que deve ser entregue até 31 de maio de cada ano. Você declara o faturamento bruto do ano anterior. Para ${new Date().getFullYear()}, seu faturamento acumulado é de ${fmt(faturamento)}. Acesse o módulo "DAS & Obrigações" para verificar o status da sua declaração.`
      : `📄 DASN-SIMEI is the annual MEI declaration due by May 31st each year. Your current accumulated revenue is ${fmt(faturamento)}.`
  }

  if (p.includes('reforma') || p.includes('ibs') || p.includes('cbs')) {
    return lang === 'pt'
      ? `⚠️ A Reforma Tributária 2026 está em andamento. Os principais impactos para o MEI ${categoria}: IBS e CBS substituem gradualmente PIS, COFINS e ICMS até 2033. O MEI está isento durante a transição. A decisão mais urgente é: continuar como MEI ou migrar para ME em 2027? Acesse o módulo "Reforma Tributária" para a simulação completa.`
      : `⚠️ The 2026 Tax Reform is underway. MEI is exempt during the transition period. The most urgent decision is whether to continue as MEI or migrate to ME in 2027.`
  }

  // Resposta padrão
  return lang === 'pt'
    ? `🤖 Olá! Sou o MEI Advisor da Axioma. Aqui estão seus dados atuais:\n\n📊 Faturamento ${new Date().getFullYear()}: ${fmt(faturamento)}\n📈 Limite usado: ${percentual.toFixed(1)}%\n💰 DAS mensal: R$ ${das}\n🏷️ Categoria: ${categoria}\n\nPosso te ajudar com: limite MEI, DAS, IRPF, Reforma Tributária 2026, precificação e DASN-SIMEI. O que você precisa saber?`
    : `🤖 Hello! I'm the Axioma MEI Advisor. Your current data:\n\nRevenue ${new Date().getFullYear()}: ${fmt(faturamento)}\nLimit used: ${percentual.toFixed(1)}%\nMonthly DAS: R$ ${das}\nCategory: ${categoria}\n\nI can help with: MEI limit, DAS, IRPF, Tax Reform 2026, pricing and DASN-SIMEI.`
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
    bemvindo: { pt: 'Olá! Sou o MEI Advisor da Axioma. Conheço seus dados reais. Pergunte sobre DAS, limite, IRPF, Reforma Tributária ou precificação.', en: 'Hello! I am the Axioma MEI Advisor. I know your real data. Ask about DAS, limit, IRPF, Tax Reform or pricing.', es: 'Hola! Soy el MEI Advisor de Axioma. Conozco sus datos reales. Pregunte sobre DAS, límite, IRPF, Reforma Tributaria o precios.' },
    sugestoes: {
      pt: ['Vou estourar o limite?', 'Preciso declarar IRPF?', 'MEI ou ME em 2027?', 'Como reduzir meus impostos?', 'Qual meu DAS correto?'],
      en: ['Will I exceed the limit?', 'Do I need to declare IRPF?', 'MEI or ME in 2027?', 'How to reduce my taxes?', 'What is my correct DAS?'],
      es: ['¿Superaré el límite?', '¿Necesito declarar IRPF?', '¿MEI o ME en 2027?', '¿Cómo reducir mis impuestos?', '¿Cuál es mi DAS correcto?'],
    },
  }

  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const t = (key: keyof typeof txt) => {
    const val = txt[key]
    if (typeof val === 'object' && !Array.isArray(val)) return (val as any)[lang] ?? (val as any).pt
    return val
  }
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
  const faturamentoAnual = receitas.filter(r => new Date(r.data).getFullYear() === anoAtual).reduce((acc, r) => acc + (r.valor || 0), 0)
  const percentualLimite = Math.min(100, (faturamentoAnual / LIMITE_ANUAL) * 100)
  const restanteLimite = Math.max(0, LIMITE_ANUAL - faturamentoAnual)
  const dasValor = meiDados?.das_valor || 75.90
  const categoria = meiDados?.categoria_mei || 'Serviços'

  async function enviarMensagem() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput
    setChatMensagens(prev => [...prev, { role: 'user', content: msg }])
    setChatInput('')
    setChatLoading(true)

    // Simula delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1200))

    const resposta = gerarResposta(msg, {
      faturamento: faturamentoAnual,
      limite: LIMITE_ANUAL,
      percentual: percentualLimite,
      restante: restanteLimite,
      das: String(dasValor),
      categoria,
      lang,
    })

    setChatMensagens(prev => [...prev, { role: 'assistant', content: resposta }])
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
    <ModuloLayout titulo={t('titulo') as string} subtitulo={t('subtitulo') as string} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards contexto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `Faturamento ${anoAtual}`, value: fmt(faturamentoAnual), cor: COR },
            { label: lang === 'pt' ? 'Limite usado' : lang === 'en' ? 'Limit used' : 'Límite usado', value: `${percentualLimite.toFixed(1)}%`, cor: percentualLimite >= 80 ? '#f87171' : '#34d399' },
            { label: lang === 'pt' ? 'Categoria MEI' : lang === 'en' ? 'MEI Category' : 'Categoría MEI', value: categoria, cor: '#a78bfa' },
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

          <div className="h-96 overflow-y-auto rounded-xl p-3 mb-3 space-y-3"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.1)' }}>
            {chatMensagens.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Bot size={40} style={{ color: `${COR}60` }} />
                </motion.div>
                <p className="text-xs text-center px-4" style={{ color: '#3a5a8a' }}>
                  {(t('bemvindo') as string)}
                </p>
              </div>
            )}
            {chatMensagens.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-3 rounded-xl text-sm whitespace-pre-line"
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

          <div className="flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
              placeholder={t('placeholder') as string}
              className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)', color: '#c8d8f0' }} />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={enviarMensagem} disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, #c2410c, ${COR})`, color: '#fff' }}>
              {t('enviar')}
            </motion.button>
          </div>

          <div className="flex gap-2 flex-wrap mt-3">
            {((txt.sugestoes as any)[lang] as string[]).map((q: string, i: number) => (
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