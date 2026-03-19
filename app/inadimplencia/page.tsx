'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import ModuloLayout from '../../components/ModuloLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Inadimplencia() {
  const { idioma } = useLanguage()
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [descricao, setDescricao] = useState('')
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('inadimplencia').select('*').eq('user_id', user.id).order('vencimento', { ascending: true })
    setRegistros(data || [])
    setLoading(false)
  }

  async function adicionar() {
    if (!cliente || !valor || !vencimento) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('inadimplencia').insert({
      user_id: user.id, cliente, valor: parseFloat(valor), vencimento, descricao, regularizado: false
    })
    setCliente(''); setValor(''); setVencimento(''); setDescricao('')
    setMostrarForm(false)
    carregar()
  }

  async function regularizar(id: string, status: boolean) {
    const supabase = createClient()
    await supabase.from('inadimplencia').update({ regularizado: !status }).eq('id', id)
    carregar()
  }

  async function excluir(id: string) {
    const supabase = createClient()
    await supabase.from('inadimplencia').delete().eq('id', id)
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

      pdf.setFillColor(2, 8, 16)
      pdf.rect(0, 0, pdfWidth, 20, "F")
      pdf.setTextColor(106, 176, 255)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("AXIOMA AI.TECH", 14, 13)
      pdf.setTextColor(58, 90, 138)
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")
      pdf.text(`${idioma === 'pt' ? 'Inadimplência' : idioma === 'en' ? 'Delinquency' : 'Morosidad'} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" })

      let position = 22
      let remaining = pdfHeight
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining)
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight)
        const sourceH = sliceHeight * (canvas.height / pdfHeight)
        const sliceCanvas = document.createElement("canvas")
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sourceH
        const ctx = sliceCanvas.getContext("2d")!
        ctx.fillStyle = "#020810"
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, position, pdfWidth, sliceHeight)
        remaining -= sliceHeight
        position = 0
        if (remaining > 0) { pdf.addPage(); position = 0 }
      }
      pdf.save(`axioma-inadimplencia-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalInadimplente = registros.filter(r => !r.regularizado).reduce((s, r) => s + (r.valor || 0), 0)
  const totalRegularizado = registros.filter(r => r.regularizado).reduce((s, r) => s + (r.valor || 0), 0)

  const diasAtraso = (data: string) => {
    const hoje = new Date()
    const venc = new Date(data)
    const diff = Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const titulo = idioma === 'pt' ? 'Inadimplência' : idioma === 'en' ? 'Delinquency' : 'Morosidad'
  const subtitulo = idioma === 'pt' ? 'Controle clientes com pagamentos em atraso' : idioma === 'en' ? 'Control clients with overdue payments' : 'Controla clientes con pagos atrasados'
  const labelNovo = idioma === 'pt' ? 'Novo Registro' : idioma === 'en' ? 'New Record' : 'Nuevo Registro'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#020810" }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <ModuloLayout
      titulo={titulo}
      subtitulo={subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => setMostrarForm(!mostrarForm)}
      labelBotao={labelNovo}
    >
      <div ref={conteudoRef}>
        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#3a5a8a" }}>
              {idioma === 'pt' ? 'Total Inadimplente' : idioma === 'en' ? 'Total Delinquent' : 'Total Moroso'}
            </p>
            <p className="text-2xl md:text-3xl font-black" style={{ color: "#f87171" }}>{fmt(totalInadimplente)}</p>
            <p className="text-xs mt-1" style={{ color: "#3a6090" }}>
              {registros.filter(r => !r.regularizado).length} {idioma === 'pt' ? 'clientes' : idioma === 'en' ? 'clients' : 'clientes'}
            </p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#3a5a8a" }}>
              {idioma === 'pt' ? 'Total Regularizado' : idioma === 'en' ? 'Total Regularized' : 'Total Regularizado'}
            </p>
            <p className="text-2xl md:text-3xl font-black" style={{ color: "#34d399" }}>{fmt(totalRegularizado)}</p>
            <p className="text-xs mt-1" style={{ color: "#3a6090" }}>
              {registros.filter(r => r.regularizado).length} {idioma === 'pt' ? 'clientes' : idioma === 'en' ? 'clients' : 'clientes'}
            </p>
          </div>
        </div>

        {/* Formulário */}
        {mostrarForm && (
          <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>
              {idioma === 'pt' ? 'Novo Registro de Inadimplência' : idioma === 'en' ? 'New Delinquency Record' : 'Nuevo Registro de Morosidad'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: idioma === 'pt' ? 'Cliente' : idioma === 'en' ? 'Client' : 'Cliente', value: cliente, set: setCliente, type: 'text', placeholder: idioma === 'pt' ? 'Nome do cliente' : 'Client name' },
                { label: idioma === 'pt' ? 'Valor em Atraso (R$)' : idioma === 'en' ? 'Overdue Amount ($)' : 'Monto Atrasado ($)', value: valor, set: setValor, type: 'number', placeholder: '0,00' },
                { label: idioma === 'pt' ? 'Data de Vencimento' : idioma === 'en' ? 'Due Date' : 'Fecha de Vencimiento', value: vencimento, set: setVencimento, type: 'date', placeholder: '' },
                { label: idioma === 'pt' ? 'Descrição' : idioma === 'en' ? 'Description' : 'Descripción', value: descricao, set: setDescricao, type: 'text', placeholder: idioma === 'pt' ? 'Ex: Fatura de outubro' : 'Ex: October invoice' },
              ].map((campo) => (
                <div key={campo.label}>
                  <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "#3a5a8a" }}>{campo.label}</label>
                  <input value={campo.value} onChange={e => campo.set(e.target.value)} type={campo.type}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}
                    placeholder={campo.placeholder} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={adicionar}
                className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                {idioma === 'pt' ? 'Salvar' : idioma === 'en' ? 'Save' : 'Guardar'}
              </button>
              <button onClick={() => setMostrarForm(false)}
                className="px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.05)", color: "#3a6090" }}>
                {idioma === 'pt' ? 'Cancelar' : idioma === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {registros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={48} style={{ color: "#1a3a5a" }} className="mb-4" />
            <p className="text-sm" style={{ color: "#3a6090" }}>
              {idioma === 'pt' ? 'Nenhum registro de inadimplência.' : idioma === 'en' ? 'No delinquency records.' : 'Sin registros de morosidad.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registros.map((r) => (
              <div key={r.id} className="rounded-2xl p-4 md:p-5 flex items-center justify-between gap-3 flex-wrap" style={{
                background: "rgba(10,22,40,0.8)",
                border: r.regularizado ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(248,113,113,0.25)",
                opacity: r.regularizado ? 0.7 : 1
              }}>
                <div className="flex items-center gap-4 min-w-0">
                  <button onClick={() => regularizar(r.id, r.regularizado)} className="flex-shrink-0">
                    <CheckCircle2 size={22} style={{ color: r.regularizado ? "#34d399" : "#f87171" }} />
                  </button>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "#c8d8f0" }}>{r.cliente}</p>
                    <p className="text-xs truncate" style={{ color: "#3a6090" }}>{r.descricao}</p>
                    <p className="text-xs mt-1" style={{ color: r.regularizado ? "#34d399" : "#f87171" }}>
                      {r.regularizado
                        ? (idioma === 'pt' ? '✅ Regularizado' : idioma === 'en' ? '✅ Regularized' : '✅ Regularizado')
                        : `⚠️ ${diasAtraso(r.vencimento)} ${idioma === 'pt' ? 'dias em atraso' : idioma === 'en' ? 'days overdue' : 'días de atraso'}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <p className="text-lg md:text-xl font-black" style={{ color: r.regularizado ? "#34d399" : "#f87171" }}>{fmt(r.valor)}</p>
                  <button onClick={() => excluir(r.id)}>
                    <Trash2 size={16} style={{ color: "#f87171" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModuloLayout>
  )
}