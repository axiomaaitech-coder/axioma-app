'use client'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import ModuloLayout from '../../../components/ModuloLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { motion } from 'framer-motion'

function SimCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ['#6ab0ff', '#34d399', '#a78bfa', '#f472b6', '#fbbf24'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }))
    const floaters = 'AXIOMA SIMULAÇÕES FINANCE AI TECH GROWTH'.split('').map((char) => ({
      char, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14,
      opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ['#6ab0ff', '#34d399', '#a78bfa'][Math.floor(Math.random() * 3)],
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      floaters.forEach(f => {
        ctx.save()
        ctx.font = `900 ${f.size}px Arial`
        ctx.fillStyle = f.color
        ctx.globalAlpha = f.opacity
        ctx.fillText(f.char, (f.x / 100) * canvas.width, (f.y / 100) * canvas.height)
        ctx.restore()
        f.y -= f.speed
        if (f.y < -5) f.y = 105
      })
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.save()
            ctx.globalAlpha = (1 - dist / 110) * 0.12
            ctx.strokeStyle = p.color
            ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
            ctx.restore()
          }
        })
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 6
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
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

function CanvasBox({ children, cor = "#6ab0ff", corB = "#34d399", corC = "#a78bfa", corD = "#f472b6" }: {
  children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: "rgba(4,10,22,0.97)",
      border: `1px solid ${cor}30`,
      boxShadow: `0 0 60px ${cor}10`,
      minHeight: "350px",
    }}>
      <SimCanvas />
      {[
        { pos: "top-0 left-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(90deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 left-0", w: "w-[2.5px] h-20", bg: `linear-gradient(180deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 right-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(270deg, ${corB}, transparent)`, glow: corB },
        { pos: "top-0 right-0", w: "w-[2.5px] h-20", bg: `linear-gradient(180deg, ${corB}, transparent)`, glow: corB },
        { pos: "bottom-0 left-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(90deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 left-0", w: "w-[2.5px] h-20", bg: `linear-gradient(0deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 right-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(270deg, ${corD}, transparent)`, glow: corD },
        { pos: "bottom-0 right-0", w: "w-[2.5px] h-20", bg: `linear-gradient(0deg, ${corD}, transparent)`, glow: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 14px ${b.glow}`, borderRadius: "999px" }} />
      ))}
      <motion.div
        animate={{ left: ["-5%", "105%", "-5%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 20px #fff, 0 0 40px ${cor}`, borderRadius: "999px" }}
      />
      <motion.div
        animate={{ right: ["-5%", "105%", "-5%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 20px ${corB}`, borderRadius: "999px", position: "absolute" }}
      />
      <div className="relative z-10 p-5 md:p-6">{children}</div>
    </div>
  )
}

export default function Simulacoes() {
  const { idioma } = useLanguage()
  const [tipo, setTipo] = useState('lucro')
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)
  const [receita, setReceita] = useState('')
  const [custoFixo, setCustoFixo] = useState('')
  const [custoVariavel, setCustoVariavel] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [custoProduto, setCustoProduto] = useState('')
  const [custoFixoTotal, setCustoFixoTotal] = useState('')
  const [valorAtual, setValorAtual] = useState('')
  const [taxaCrescimento, setTaxaCrescimento] = useState('')
  const [meses, setMeses] = useState('')

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const lucro = parseFloat(receita || '0') - parseFloat(custoFixo || '0') - parseFloat(custoVariavel || '0')
  const pontoEq = (() => { const pv = parseFloat(precoVenda || '0'); const cp = parseFloat(custoProduto || '0'); const cf = parseFloat(custoFixoTotal || '0'); return pv - cp <= 0 ? 0 : cf / (pv - cp) })()
  const valorFinal = parseFloat(valorAtual || '0') * Math.pow(1 + parseFloat(taxaCrescimento || '0') / 100, parseInt(meses || '0'))

  const titulo = idioma === 'pt' ? 'Simulações Financeiras' : idioma === 'en' ? 'Financial Simulations' : 'Simulaciones Financieras'
  const subtitulo = idioma === 'pt' ? 'Simule cenários e tome decisões mais inteligentes' : idioma === 'en' ? 'Simulate scenarios and make smarter decisions' : 'Simula escenarios'

  const tipos = [
    { id: 'lucro', label: '💰 ' + (idioma === 'pt' ? 'Lucro' : 'Profit'), cor: "#34d399" },
    { id: 'equilibrio', label: '⚖️ ' + (idioma === 'pt' ? 'Equilíbrio' : 'Break Even'), cor: "#a78bfa" },
    { id: 'crescimento', label: '📈 ' + (idioma === 'pt' ? 'Crescimento' : 'Growth'), cor: "#6ab0ff" },
  ]
  const corAtual = tipos.find(t => t.id === tipo)?.cor || "#6ab0ff"

  const exportarPDF = async () => {
    if (!conteudoRef.current) return
    setExportando(true)
    try {
      const canvas = await html2canvas(conteudoRef.current, { backgroundColor: "#020810", scale: 2, useCORS: true })
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFillColor(2, 8, 16); pdf.rect(0, 0, pdfWidth, 20, "F")
      pdf.setTextColor(106, 176, 255); pdf.setFontSize(14); pdf.setFont("helvetica", "bold")
      pdf.text("AXIOMA AI.TECH", 14, 13)
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont("helvetica", "normal")
      pdf.text(`${titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" })
      let position = 22; let remaining = pdfHeight
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining)
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight)
        const sourceH = sliceHeight * (canvas.height / pdfHeight)
        const sliceCanvas = document.createElement("canvas")
        sliceCanvas.width = canvas.width; sliceCanvas.height = sourceH
        const ctx2 = sliceCanvas.getContext("2d")!
        ctx2.fillStyle = "#020810"; ctx2.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx2.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, position, pdfWidth, sliceHeight)
        remaining -= sliceHeight; position = 0
        if (remaining > 0) { pdf.addPage(); position = 0 }
      }
      pdf.save(`axioma-simulacoes-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const botaoTipos = (
    <div className="flex gap-2 flex-wrap">
      {tipos.map((t) => (
        <motion.button key={t.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          onClick={() => setTipo(t.id)}
          className="px-4 py-2 rounded-xl font-bold text-sm"
          style={{ background: tipo === t.id ? `${t.cor}25` : "rgba(10,22,40,0.8)", color: tipo === t.id ? t.cor : "#3a6090", border: `1px solid ${tipo === t.id ? `${t.cor}50` : "rgba(59,111,212,0.15)"}`, boxShadow: tipo === t.id ? `0 0 12px ${t.cor}30` : "none" }}>
          {t.label}
        </motion.button>
      ))}
    </div>
  )

  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }

  return (
    <ModuloLayout titulo={titulo} subtitulo={subtitulo} onExportarPDF={exportarPDF} exportando={exportando} botaoExtra={botaoTipos}>
      <div ref={conteudoRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Formulário com Canvas */}
        <CanvasBox cor="#6ab0ff" corB="#a78bfa" corC="#34d399" corD="#fbbf24">
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-black tracking-[0.3em] uppercase mb-1"
            style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}
          >
            AXIOMA AI.TECH
          </motion.p>
          <h3 className="text-sm font-bold mb-6" style={{ color: "#c8d8f0" }}>
            {idioma === 'pt' ? 'Dados da Simulação' : 'Simulation Data'}
          </h3>

          {tipo === 'lucro' && (
            <div className="space-y-4">
              {[
                { label: idioma === 'pt' ? 'Receita Total' : 'Total Revenue', value: receita, set: setReceita },
                { label: idioma === 'pt' ? 'Custos Fixos' : 'Fixed Costs', value: custoFixo, set: setCustoFixo },
                { label: idioma === 'pt' ? 'Custos Variáveis' : 'Variable Costs', value: custoVariavel, set: setCustoVariavel },
              ].map((c) => (
                <div key={c.label}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{c.label}</label>
                  <input value={c.value} onChange={e => c.set(e.target.value)} type="number" placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
              ))}
            </div>
          )}

          {tipo === 'equilibrio' && (
            <div className="space-y-4">
              {[
                { label: idioma === 'pt' ? 'Preço de Venda (un.)' : 'Selling Price (unit)', value: precoVenda, set: setPrecoVenda },
                { label: idioma === 'pt' ? 'Custo por Produto (un.)' : 'Product Cost (unit)', value: custoProduto, set: setCustoProduto },
                { label: idioma === 'pt' ? 'Custos Fixos Totais' : 'Total Fixed Costs', value: custoFixoTotal, set: setCustoFixoTotal },
              ].map((c) => (
                <div key={c.label}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{c.label}</label>
                  <input value={c.value} onChange={e => c.set(e.target.value)} type="number" placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
              ))}
            </div>
          )}

          {tipo === 'crescimento' && (
            <div className="space-y-4">
              {[
                { label: idioma === 'pt' ? 'Valor Atual' : 'Current Value', value: valorAtual, set: setValorAtual },
                { label: idioma === 'pt' ? 'Taxa de Crescimento Mensal (%)' : 'Monthly Growth Rate (%)', value: taxaCrescimento, set: setTaxaCrescimento },
                { label: idioma === 'pt' ? 'Quantidade de Meses' : 'Number of Months', value: meses, set: setMeses },
              ].map((c) => (
                <div key={c.label}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{c.label}</label>
                  <input value={c.value} onChange={e => c.set(e.target.value)} type="number" placeholder="0"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
              ))}
            </div>
          )}
        </CanvasBox>

        {/* Resultado com Canvas */}
        <CanvasBox cor={corAtual} corB="#34d399" corC="#a78bfa" corD="#f472b6">
          <div className="flex flex-col justify-center items-center text-center min-h-[280px]">
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-xs font-black tracking-[0.3em] uppercase mb-2"
              style={{ color: corAtual, textShadow: `0 0 20px ${corAtual}` }}
            >
              AXIOMA AI.TECH
            </motion.p>
            <p className="text-xs mb-8" style={{ color: "#3a5a8a" }}>
              {idioma === 'pt' ? 'Resultado da Simulação' : 'Simulation Result'}
            </p>

            {tipo === 'lucro' && (
              <>
                <motion.p key={lucro} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-black mb-3"
                  style={{ color: lucro >= 0 ? "#34d399" : "#f87171", textShadow: `0 0 30px ${lucro >= 0 ? "#34d399" : "#f87171"}80` }}>
                  {fmt(lucro)}
                </motion.p>
                <p className="text-sm mb-6" style={{ color: lucro >= 0 ? "#34d399" : "#f87171" }}>
                  {lucro >= 0 ? '✅ Operação lucrativa' : '⚠️ Operação no prejuízo'}
                </p>
                <div className="w-full space-y-3">
                  {[
                    { label: 'Receita', value: fmt(parseFloat(receita || '0')), cor: "#6ab0ff" },
                    { label: 'Custos Totais', value: fmt(parseFloat(custoFixo || '0') + parseFloat(custoVariavel || '0')), cor: "#f87171" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between px-4 py-2 rounded-xl" style={{ background: `${item.cor}10` }}>
                      <span className="text-xs" style={{ color: "#3a6090" }}>{item.label}</span>
                      <span className="text-xs font-bold" style={{ color: item.cor }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tipo === 'equilibrio' && (
              <>
                <motion.p key={pontoEq} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-black mb-3"
                  style={{ color: "#a78bfa", textShadow: "0 0 30px rgba(167,139,250,0.8)" }}>
                  {Math.ceil(pontoEq)} {idioma === 'pt' ? 'un.' : 'units'}
                </motion.p>
                <p className="text-sm mb-4" style={{ color: "#3a6090" }}>
                  {idioma === 'pt' ? 'Unidades para cobrir todos os custos' : 'Units to cover all costs'}
                </p>
                <p className="text-lg font-bold" style={{ color: "#34d399" }}>{fmt(pontoEq * parseFloat(precoVenda || '0'))}</p>
                <p className="text-xs mt-1" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'em faturamento' : 'in revenue'}</p>
              </>
            )}

            {tipo === 'crescimento' && (
              <>
                <motion.p key={valorFinal} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-black mb-3"
                  style={{ color: "#34d399", textShadow: "0 0 30px rgba(52,211,153,0.8)" }}>
                  {fmt(valorFinal)}
                </motion.p>
                <p className="text-sm mb-4" style={{ color: "#3a6090" }}>
                  {idioma === 'pt' ? `Valor projetado em ${meses || 0} meses` : `Projected in ${meses || 0} months`}
                </p>
                <div className="flex justify-between w-full px-4 py-2 rounded-xl" style={{ background: "rgba(52,211,153,0.1)" }}>
                  <span className="text-xs" style={{ color: "#3a6090" }}>{idioma === 'pt' ? 'Crescimento total' : 'Total growth'}</span>
                  <span className="text-xs font-bold" style={{ color: "#34d399" }}>{fmt(valorFinal - parseFloat(valorAtual || '0'))}</span>
                </div>
              </>
            )}
          </div>
        </CanvasBox>
      </div>
    </ModuloLayout>
  )
}