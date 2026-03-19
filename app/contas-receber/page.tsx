'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { Inbox, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import ModuloLayout from '../../components/ModuloLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function ContasReceber() {
  const { idioma } = useLanguage()
  const [contas, setContas] = useState<any[]>([])
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
    const { data } = await supabase.from('contas_receber').select('*').eq('user_id', user.id).order('vencimento', { ascending: true })
    setContas(data || [])
    setLoading(false)
  }

  async function adicionar() {
    if (!cliente || !valor || !vencimento) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('contas_receber').insert({
      user_id: user.id, cliente, valor: parseFloat(valor), vencimento, descricao, recebido: false
    })
    setCliente(''); setValor(''); setVencimento(''); setDescricao('')
    setMostrarForm(false)
    carregar()
  }

  async function marcarRecebido(id: string, status: boolean) {
    const supabase = createClient()
    await supabase.from('contas_receber').update({ recebido: !status }).eq('id', id)
    carregar()
  }

  async function excluir(id: string) {
    const supabase = createClient()
    await supabase.from('contas_receber').delete().eq('id', id)
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
      pdf.text(`${idioma === 'pt' ? 'Contas a Receber' : idioma === 'en' ? 'Accounts Receivable' : 'Cuentas por Cobrar'} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" })

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
      pdf.save(`axioma-contas-receber-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalPendente = contas.filter(c => !c.recebido).reduce((s, c) => s + (c.valor || 0), 0)
  const totalRecebido = contas.filter(c => c.recebido).reduce((s, c) => s + (c.valor || 0), 0)
  const hoje = new Date().toISOString().split('T')[0]
  const vencido = (data: string) => data < hoje

  const titulo = idioma === 'pt' ? 'Contas a Receber' : idioma === 'en' ? 'Accounts Receivable' : 'Cuentas por Cobrar'
  const subtitulo = idioma === 'pt' ? 'Gerencie os valores que seus clientes devem pagar' : idioma === 'en' ? 'Manage the amounts your clients owe you' : 'Gestiona los montos que tus clientes deben pagar'
  const labelNovo = idioma === 'pt' ? 'Nova Conta' : idioma === 'en' ? 'New Account' : 'Nueva Cuenta'

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
              {idioma === 'pt' ? 'Total Pendente' : idioma === 'en' ? 'Total Pending' : 'Total Pendiente'}
            </p>
            <p className="text-2xl md:text-3xl font-black" style={{ color: "#f87171" }}>{fmt(totalPendente)}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#3a5a8a" }}>
              {idioma === 'pt' ? 'Total Recebido' : idioma === 'en' ? 'Total Received' : 'Total Recibido'}
            </p>
            <p className="text-2xl md:text-3xl font-black" style={{ color: "#34d399" }}>{fmt(totalRecebido)}</p>
          </div>
        </div>

        {/* Formulário */}
        {mostrarForm && (
          <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>
              {idioma === 'pt' ? 'Nova Conta a Receber' : idioma === 'en' ? 'New Receivable' : 'Nueva Cuenta por Cobrar'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: idioma === 'pt' ? 'Cliente' : idioma === 'en' ? 'Client' : 'Cliente', value: cliente, set: setCliente, type: 'text', placeholder: idioma === 'pt' ? 'Nome do cliente' : 'Client name' },
                { label: idioma === 'pt' ? 'Valor (R$)' : idioma === 'en' ? 'Value ($)' : 'Valor ($)', value: valor, set: setValor, type: 'number', placeholder: '0,00' },
                { label: idioma === 'pt' ? 'Vencimento' : idioma === 'en' ? 'Due Date' : 'Vencimiento', value: vencimento, set: setVencimento, type: 'date', placeholder: '' },
                { label: idioma === 'pt' ? 'Descrição' : idioma === 'en' ? 'Description' : 'Descripción', value: descricao, set: setDescricao, type: 'text', placeholder: idioma === 'pt' ? 'Ex: Serviço de consultoria' : 'Ex: Consulting service' },
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
        {contas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Inbox size={48} style={{ color: "#1a3a5a" }} className="mb-4" />
            <p className="text-sm" style={{ color: "#3a6090" }}>
              {idioma === 'pt' ? 'Nenhuma conta cadastrada.' : idioma === 'en' ? 'No accounts yet.' : 'Sin cuentas aún.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contas.map((conta) => (
              <div key={conta.id} className="rounded-2xl p-4 md:p-5 flex items-center justify-between gap-3 flex-wrap" style={{
                background: "rgba(10,22,40,0.8)",
                border: conta.recebido ? "1px solid rgba(52,211,153,0.2)" : vencido(conta.vencimento) ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(59,111,212,0.15)",
                opacity: conta.recebido ? 0.7 : 1
              }}>
                <div className="flex items-center gap-4 min-w-0">
                  <button onClick={() => marcarRecebido(conta.id, conta.recebido)} className="flex-shrink-0">
                    <CheckCircle2 size={22} style={{ color: conta.recebido ? "#34d399" : "#1a3a5a" }} />
                  </button>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "#c8d8f0" }}>{conta.cliente}</p>
                    <p className="text-xs truncate" style={{ color: "#3a6090" }}>{conta.descricao}</p>
                    <p className="text-xs mt-1" style={{ color: vencido(conta.vencimento) && !conta.recebido ? "#f87171" : "#3a6090" }}>
                      {idioma === 'pt' ? 'Vence em: ' : idioma === 'en' ? 'Due: ' : 'Vence: '}
                      {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                      {vencido(conta.vencimento) && !conta.recebido && ` ⚠️ ${idioma === 'pt' ? 'Vencido' : idioma === 'en' ? 'Overdue' : 'Vencido'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <p className="text-lg md:text-xl font-black" style={{ color: conta.recebido ? "#34d399" : "#6ab0ff" }}>{fmt(conta.valor)}</p>
                  <button onClick={() => excluir(conta.id)}>
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