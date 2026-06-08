'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { Tag, Trash2, Pencil, X } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import ModuloLayout from '../../../components/ModuloLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function CanvasNeural() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ['#6ab0ff', '#34d399', '#a78bfa', '#f59e0b', '#f472b6'][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }))
    const chars = 'AXIOMA PRICE AI TECH R$ 0 1 2 3 4 5 6 7 8 9 % MARGIN CUSTO'.split(' ').map((c) => ({
      char: c, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ['#f59e0b', '#6ab0ff', '#34d399', '#a78bfa'][Math.floor(Math.random() * 4)],
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
          if (dist < 110) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 110) * 0.12
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

function CanvasBox({ children, cor = '#f59e0b', corB = '#6ab0ff', corC = '#34d399', corD = '#a78bfa' }: {
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

export default function Precificacao() {
  const { idioma } = useLanguage()
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  // Campos corretos conforme tabela: produto_servico, custo_total, margem_desejada, preco_sugerido
  const [produtoServico, setProdutoServico] = useState('')
  const [custoTotal, setCustoTotal] = useState('')
  const [margemDesejada, setMargemDesejada] = useState('')
  const [impostos, setImpostos] = useState('')
  const [despesas, setDespesas] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: idioma === 'pt' ? 'Precificação' : idioma === 'en' ? 'Pricing' : 'Precios',
    subtitulo: idioma === 'pt' ? 'Calcule o preço ideal dos seus produtos e serviços' : idioma === 'en' ? 'Calculate the ideal price for your products and services' : 'Calcula el precio ideal',
    novo: idioma === 'pt' ? 'Novo Produto' : idioma === 'en' ? 'New Product' : 'Nuevo Producto',
    editar: idioma === 'pt' ? 'Editar Produto' : idioma === 'en' ? 'Edit Product' : 'Editar Producto',
    salvar: idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    semProdutos: idioma === 'pt' ? 'Nenhum produto cadastrado.' : idioma === 'en' ? 'No products yet.' : 'Sin productos aún.',
    precoSugerido: idioma === 'pt' ? 'Preço Sugerido' : idioma === 'en' ? 'Suggested Price' : 'Precio Sugerido',
    custo: idioma === 'pt' ? 'Custo' : idioma === 'en' ? 'Cost' : 'Costo',
    lucro: idioma === 'pt' ? 'Lucro' : idioma === 'en' ? 'Profit' : 'Ganancia',
    margem: idioma === 'pt' ? 'Margem' : idioma === 'en' ? 'Margin' : 'Margen',
    dadosProduto: idioma === 'pt' ? 'Dados do Produto' : idioma === 'en' ? 'Product Data' : 'Datos del Producto',
  }

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('precificacao').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setProdutos(data || [])
    setLoading(false)
  }

  function calcularPreco(c: string, m: string, imp: string, desp: string) {
    const custoNum = parseFloat(c || '0')
    const margemNum = parseFloat(m || '0') / 100
    const impostosNum = parseFloat(imp || '0') / 100
    const despesasNum = parseFloat(desp || '0') / 100
    const divisor = 1 - margemNum - impostosNum - despesasNum
    if (divisor <= 0) return 0
    return custoNum / divisor
  }

  const precoPreview = calcularPreco(custoTotal, margemDesejada, impostos, despesas)

  function abrirNovo() {
    setEditando(null)
    setProdutoServico(''); setCustoTotal(''); setMargemDesejada(''); setImpostos(''); setDespesas('')
    setModalAberto(true)
  }

  function abrirEdicao(p: any) {
    setEditando(p)
    setProdutoServico(p.produto_servico || '')
    setCustoTotal(String(p.custo_total || ''))
    setMargemDesejada(String(p.margem_desejada || ''))
    setImpostos(String(p.impostos || ''))
    setDespesas(String(p.despesas || ''))
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null)
    setProdutoServico(''); setCustoTotal(''); setMargemDesejada(''); setImpostos(''); setDespesas('')
  }

  async function salvar() {
    if (!produtoServico || !custoTotal || !margemDesejada) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const precoSugerido = calcularPreco(custoTotal, margemDesejada, impostos, despesas)
    const payload = {
      produto_servico: produtoServico,
      custo_total: parseFloat(custoTotal),
      margem_desejada: parseFloat(margemDesejada),
      preco_sugerido: precoSugerido,
    }
    if (editando) {
      const { error } = await supabase.from('precificacao').update(payload).eq('id', editando.id)
      if (error) console.error('Erro ao editar:', error)
    } else {
      const { error } = await supabase.from('precificacao').insert({ ...payload, user_id: user.id })
      if (error) console.error('Erro ao inserir:', error)
    }
    fecharModal(); setSalvando(false); carregar()
  }

  async function excluir(id: string) {
    await supabase.from('precificacao').delete().eq('id', id); carregar()
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
      pdf.setTextColor(106, 176, 255); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold')
      pdf.text('AXIOMA AI.TECH', 14, 13)
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
      pdf.text(`${txt.titulo} - ${new Date().toLocaleDateString('pt-BR')}`, pdfWidth - 14, 13, { align: 'right' })
      let position = 22; let remaining = pdfHeight
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining)
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight)
        const sourceH = sliceHeight * (canvas.height / pdfHeight)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width; sliceCanvas.height = sourceH
        const ctx2 = sliceCanvas.getContext('2d')!
        ctx2.fillStyle = '#020810'; ctx2.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx2.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, sliceHeight)
        remaining -= sliceHeight; position = 0
        if (remaining > 0) { pdf.addPage(); position = 0 }
      }
      pdf.save(`axioma-precificacao-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={abrirNovo} labelBotao={txt.novo}>
      <div ref={conteudoRef} className="space-y-4">

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : produtos.length === 0 ? (
          <CanvasBox cor="#f59e0b">
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Tag size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
              </motion.div>
              <p className="text-sm" style={{ color: '#3a6090' }}>{txt.semProdutos}</p>
            </div>
          </CanvasBox>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {produtos.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <CanvasBox cor="#f59e0b" corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
                  <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                    className="text-xs font-black tracking-[0.3em] uppercase mb-2"
                    style={{ color: '#f59e0b', textShadow: '0 0 15px #f59e0b' }}>AXIOMA AI.TECH</motion.p>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-sm truncate mr-2" style={{ color: '#c8d8f0' }}>{p.produto_servico}</h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(p)}>
                        <Pencil size={15} style={{ color: '#6ab0ff' }} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(p.id)}>
                        <Trash2 size={15} style={{ color: '#f87171' }} />
                      </motion.button>
                    </div>
                  </div>
                  <p className="text-2xl font-black mb-3" style={{ color: '#f59e0b', textShadow: '0 0 20px rgba(245,158,11,0.6)' }}>{fmt(p.preco_sugerido || 0)}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#3a6090' }}>{txt.custo}</span>
                      <span className="text-xs font-black" style={{ color: '#f87171' }}>{fmt(p.custo_total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#3a6090' }}>{txt.margem}</span>
                      <span className="text-xs font-black" style={{ color: '#34d399' }}>{p.margem_desejada}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#3a6090' }}>{txt.lucro}</span>
                      <span className="text-xs font-black" style={{ color: '#6ab0ff' }}>{fmt((p.preco_sugerido || 0) * ((p.margem_desejada || 0) / 100))}</span>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Premium */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-2xl max-h-screen overflow-y-auto">
              <CanvasBox cor="#f59e0b" corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                      style={{ color: '#f59e0b', textShadow: '0 0 20px #f59e0b' }}>AXIOMA AI.TECH</motion.p>
                    <h3 className="text-lg font-bold" style={{ color: '#c8d8f0' }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: '#3a5a8a' }}><X size={20} /></motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Campos */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold" style={{ color: '#c8d8f0' }}>{txt.dadosProduto}</h4>
                    {[
                      { label: idioma === 'pt' ? 'Nome do Produto/Serviço' : 'Product/Service Name', value: produtoServico, set: setProdutoServico, type: 'text' },
                      { label: idioma === 'pt' ? 'Custo Total (R$)' : 'Total Cost ($)', value: custoTotal, set: setCustoTotal, type: 'number' },
                      { label: idioma === 'pt' ? 'Margem Desejada (%)' : 'Desired Margin (%)', value: margemDesejada, set: setMargemDesejada, type: 'number' },
                      { label: idioma === 'pt' ? 'Impostos (%)' : 'Taxes (%)', value: impostos, set: setImpostos, type: 'number' },
                      { label: idioma === 'pt' ? 'Despesas Operacionais (%)' : 'Operating Expenses (%)', value: despesas, set: setDespesas, type: 'number' },
                    ].map((c, idx) => (
                      <div key={idx}>
                        <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a8fd4' }}>{c.label}</label>
                        <input type={c.type} value={c.value} onChange={e => c.set(e.target.value)} placeholder="0"
                          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
                      </div>
                    ))}
                  </div>
                  {/* Preview */}
                  <div className="flex flex-col justify-center items-center text-center gap-4">
                    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#3a5a8a' }}>{txt.precoSugerido}</p>
                    <motion.p key={precoPreview} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-black"
                      style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.8)' }}>
                      {fmt(precoPreview)}
                    </motion.p>
                    <div className="w-full space-y-2">
                      {[
                        { label: txt.custo, value: fmt(parseFloat(custoTotal || '0')), cor: '#f87171' },
                        { label: txt.lucro, value: fmt(precoPreview * (parseFloat(margemDesejada || '0') / 100)), cor: '#34d399' },
                        { label: txt.margem, value: `${margemDesejada || 0}%`, cor: '#6ab0ff' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between px-3 py-2 rounded-xl" style={{ background: `${item.cor}10` }}>
                          <span className="text-xs" style={{ color: '#3a6090' }}>{item.label}</span>
                          <span className="text-xs font-black" style={{ color: item.cor }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 w-full">
                      <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,111,212,0.1)', color: '#3a5a8a' }}>{txt.cancelar}</button>
                      <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(245,158,11,0.4)' }} whileTap={{ scale: 0.98 }}
                        onClick={salvar} disabled={salvando}
                        className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #92400e, #f59e0b)', color: '#fff' }}>
                        {salvando ? '...' : txt.salvar}
                      </motion.button>
                    </div>
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