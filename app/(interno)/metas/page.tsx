'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { Target, Trash2, CheckCircle2, Clock, Pencil, X } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function NeonBox({ children, cor = "#6ab0ff" }: { children: React.ReactNode; cor?: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: "rgba(10,22,40,0.85)",
      border: `1px solid ${cor}30`,
      boxShadow: `0 0 20px ${cor}10, inset 0 1px 0 ${cor}15`,
    }}>
      <motion.div
        animate={{ left: ["-15%", "115%", "-15%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
        className="absolute top-0 h-[1.5px] w-16 z-10 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cor}, transparent)`, boxShadow: `0 0 10px ${cor}`, borderRadius: "999px" }}
      />
      <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at top left, ${cor}12 0%, transparent 70%)` }} />
      <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at bottom right, ${cor}08 0%, transparent 70%)` }} />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default function Metas() {
  const { idioma } = useLanguage()
  const [metas, setMetas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [prazo, setPrazo] = useState('')
  const [tipo, setTipo] = useState('receita')
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: idioma === 'pt' ? 'Metas Financeiras' : idioma === 'en' ? 'Financial Goals' : 'Metas Financieras',
    subtitulo: idioma === 'pt' ? 'Defina e acompanhe suas metas' : idioma === 'en' ? 'Set and track your goals' : 'Define y sigue tus metas',
    novo: idioma === 'pt' ? 'Nova Meta' : idioma === 'en' ? 'New Goal' : 'Nueva Meta',
    editar: idioma === 'pt' ? 'Editar Meta' : idioma === 'en' ? 'Edit Goal' : 'Editar Meta',
    salvar: idioma === 'pt' ? 'Salvar Meta' : idioma === 'en' ? 'Save Goal' : 'Guardar Meta',
    cancelar: idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar',
    semMetas: idioma === 'pt' ? 'Nenhuma meta cadastrada.' : idioma === 'en' ? 'No goals yet.' : 'Sin metas aún.',
    nome: idioma === 'pt' ? 'Nome da Meta' : idioma === 'en' ? 'Goal Name' : 'Nombre',
    valorAlvo: idioma === 'pt' ? 'Valor Alvo' : idioma === 'en' ? 'Target Value' : 'Valor Objetivo',
    prazoLabel: idioma === 'pt' ? 'Prazo' : idioma === 'en' ? 'Deadline' : 'Plazo',
    tipoLabel: idioma === 'pt' ? 'Tipo' : idioma === 'en' ? 'Type' : 'Tipo',
  }

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('metas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setMetas(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditando(null)
    setNome(''); setValor(''); setPrazo(''); setTipo('receita')
    setModalAberto(true)
  }

  function abrirEdicao(meta: any) {
    setEditando(meta)
    setNome(meta.nome)
    setValor(String(meta.valor))
    setPrazo(meta.prazo)
    setTipo(meta.tipo)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
    setNome(''); setValor(''); setPrazo(''); setTipo('receita')
  }

  async function salvar() {
    if (!nome || !valor || !prazo) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    if (editando) {
      await supabase.from('metas').update({ nome, valor: parseFloat(valor), prazo, tipo }).eq('id', editando.id)
    } else {
      await supabase.from('metas').insert({ user_id: user.id, nome, valor: parseFloat(valor), prazo, tipo, concluida: false })
    }
    fecharModal()
    setSalvando(false)
    carregar()
  }

  async function excluir(id: string) {
    await supabase.from('metas').delete().eq('id', id)
    carregar()
  }

  async function concluir(id: string, status: boolean) {
    await supabase.from('metas').update({ concluida: !status }).eq('id', id)
    carregar()
  }

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
      pdf.text(`${txt.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" })
      let position = 22; let remaining = pdfHeight
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining)
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight)
        const sourceH = sliceHeight * (canvas.height / pdfHeight)
        const sliceCanvas = document.createElement("canvas")
        sliceCanvas.width = canvas.width; sliceCanvas.height = sourceH
        const ctx = sliceCanvas.getContext("2d")!
        ctx.fillStyle = "#020810"; ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, position, pdfWidth, sliceHeight)
        remaining -= sliceHeight; position = 0
        if (remaining > 0) { pdf.addPage(); position = 0 }
      }
      pdf.save(`axioma-metas-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const tipoOpcoes = [
    { value: 'receita', label: idioma === 'pt' ? 'Aumentar Receita' : idioma === 'en' ? 'Increase Revenue' : 'Aumentar Ingresos' },
    { value: 'economia', label: idioma === 'pt' ? 'Economizar' : idioma === 'en' ? 'Save Money' : 'Ahorrar' },
    { value: 'investimento', label: idioma === 'pt' ? 'Investimento' : idioma === 'en' ? 'Investment' : 'Inversión' },
    { value: 'reducao', label: idioma === 'pt' ? 'Reduzir Custos' : idioma === 'en' ? 'Reduce Costs' : 'Reducir Costos' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#020810" }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <ModuloLayout
      titulo={txt.titulo}
      subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={abrirNovo}
      labelBotao={txt.novo}
    >
      <div ref={conteudoRef}>
        {metas.length === 0 ? (
          <NeonBox cor="#6ab0ff">
            <div className="flex flex-col items-center justify-center py-20">
              <Target size={48} style={{ color: "#1a3a5a" }} className="mb-4" />
              <p className="text-sm" style={{ color: "#3a6090" }}>{txt.semMetas}</p>
            </div>
          </NeonBox>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metas.map((meta, i) => (
              <motion.div
                key={meta.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <NeonBox cor={meta.concluida ? "#34d399" : "#6ab0ff"}>
                  <div className="p-5 md:p-6" style={{ opacity: meta.concluida ? 0.75 : 1 }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 mr-2">
                        <h3 className="font-bold text-sm mb-1 truncate" style={{ color: "#c8d8f0" }}>{meta.nome}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
                          {tipoOpcoes.find(t => t.value === meta.tipo)?.label || meta.tipo}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => concluir(meta.id, meta.concluida)}>
                          <CheckCircle2 size={18} style={{ color: meta.concluida ? "#34d399" : "#1a3a5a" }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(meta)}>
                          <Pencil size={16} style={{ color: "#6ab0ff" }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(meta.id)}>
                          <Trash2 size={16} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-2xl font-black mb-2" style={{ color: "#34d399", textShadow: "0 0 20px rgba(52,211,153,0.4)" }}>{fmt(meta.valor)}</p>
                    <div className="flex items-center gap-2">
                      <Clock size={14} style={{ color: "#3a6090" }} />
                      <p className="text-xs" style={{ color: "#3a6090" }}>{new Date(meta.prazo).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </NeonBox>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Premium */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl p-6 relative"
              style={{ background: "rgba(6,15,30,0.98)", border: "1px solid rgba(106,176,255,0.25)", boxShadow: "0 0 60px rgba(106,176,255,0.15)" }}
            >
              <div className="absolute top-0 left-0 w-20 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #6ab0ff, transparent)", boxShadow: "0 0 12px #6ab0ff" }} />
              <div className="absolute top-0 left-0 w-[2px] h-20 rounded-full" style={{ background: "linear-gradient(180deg, #6ab0ff, transparent)", boxShadow: "0 0 12px #6ab0ff" }} />
              <div className="absolute bottom-0 right-0 w-20 h-[2px] rounded-full" style={{ background: "linear-gradient(270deg, #34d399, transparent)", boxShadow: "0 0 12px #34d399" }} />
              <div className="absolute bottom-0 right-0 w-[2px] h-20 rounded-full" style={{ background: "linear-gradient(0deg, #34d399, transparent)", boxShadow: "0 0 12px #34d399" }} />

              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? txt.editar : txt.novo}</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.nome}</label>
                  <input value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.valorAlvo}</label>
                  <input type="number" value={valor} onChange={e => setValor(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.prazoLabel}</label>
                  <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.tipoLabel}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tipoOpcoes.map(op => (
                      <motion.button key={op.value} whileTap={{ scale: 0.97 }} onClick={() => setTipo(op.value)}
                        className="py-2.5 rounded-xl text-xs font-semibold"
                        style={{ background: tipo === op.value ? "rgba(52,211,153,0.2)" : "rgba(59,111,212,0.05)", color: tipo === op.value ? "#34d399" : "#3a5a8a", border: `1px solid ${tipo === op.value ? "rgba(52,211,153,0.4)" : "rgba(59,111,212,0.1)"}` }}>
                        {op.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{txt.cancelar}</button>
                  <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(52,211,153,0.4)" }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
                    {salvando ? '...' : txt.salvar}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  )
}