'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { AlertTriangle, Pencil, Trash2, X } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { meiT } from '../../../../lib/meiTextos'
import { LIMITE_ANUAL_MEI, faturamentoAnoMEI, limiteRestante, percentualLimite, projecaoTeto } from '../../../../lib/meiHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const OURO = '#d4af37'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AZUL = '#6ab0ff'
const AMBAR = '#f59e0b'
const FONTE = { fontFamily: "'Georgia','Times New Roman',serif" }
const CATEGORIAS = ["Vendas de produtos", "Prestação de serviços", "Recorrentes", "Eventuais", "Outras"]

type Receita = { id: string; descricao: string; valor: number; data: string; categoria: string; status: string; considera_teto_mei?: boolean | null }

export default function FaturamentoMEI() {
  const { idioma } = useLanguage()
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [editando, setEditando] = useState<Receita | null>(null)
  const [excluindo, setExcluindo] = useState<Receita | null>(null)
  const [form, setForm] = useState({ descricao: '', valor: '', data: '', categoria: CATEGORIAS[0], status: 'recebido' })
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — Faturamento', en: 'MEI — Revenue', es: 'MEI — Facturación' },
    subtitulo: { pt: 'Acompanhe seu faturamento mensal e limite anual MEI', en: 'Track your monthly revenue and annual MEI limit', es: 'Seguimiento de facturación mensual y límite anual MEI' },
    faturamento: { pt: 'Faturamento', en: 'Revenue', es: 'Facturación' },
    limiteRestante: { pt: 'Limite Restante', en: 'Remaining Limit', es: 'Límite Restante' },
    limiteUsado: { pt: 'Limite Usado', en: 'Limit Used', es: 'Límite Usado' },
    velocimetro: { pt: 'Velocímetro de Faturamento', en: 'Revenue Speedometer', es: 'Velocímetro de Facturación' },
    faturamentoMensal: { pt: 'Faturamento Mensal', en: 'Monthly Revenue', es: 'Facturación Mensual' },
    total: { pt: 'Total', en: 'Total', es: 'Total' },
    alerta: { pt: 'No ritmo atual, você atinge o limite em aproximadamente', en: 'At the current pace, you will reach the limit in approximately', es: 'Al ritmo actual, alcanzarás el límite en aproximadamente' },
    meses: { pt: 'meses', en: 'months', es: 'meses' },
    lancamentos: { pt: 'Lançamentos do Ano', en: "Year's Entries", es: 'Movimientos del Año' },
    contaTeto: { pt: 'Conta pro teto MEI', en: 'Counts toward MEI cap', es: 'Cuenta para el límite MEI' },
    descricao: { pt: 'Descrição', en: 'Description', es: 'Descripción' },
    valor: { pt: 'Valor (R$)', en: 'Value (R$)', es: 'Valor (R$)' },
    data: { pt: 'Data', en: 'Date', es: 'Fecha' },
    categoria: { pt: 'Categoria', en: 'Category', es: 'Categoría' },
    status: { pt: 'Status', en: 'Status', es: 'Estado' },
    recebido: { pt: 'Recebido', en: 'Received', es: 'Recibido' },
    pendente: { pt: 'Pendente', en: 'Pending', es: 'Pendiente' },
    salvar: { pt: 'Salvar', en: 'Save', es: 'Guardar' },
    cancelar: { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar' },
    confirmarExcluir: { pt: 'Excluir este lançamento?', en: 'Delete this entry?', es: '¿Eliminar este movimiento?' },
    excluir: { pt: 'Excluir', en: 'Delete', es: 'Eliminar' },
    semLancamentos: { pt: 'Nenhum lançamento neste ano.', en: 'No entries this year.', es: 'Sin movimientos este año.' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const mx = meiT(lang)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('receitas').select('*').order('data', { ascending: false })
    setReceitas((data || []) as Receita[])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  async function alternarContaTeto(r: Receita) {
    const novoValor = r.considera_teto_mei === false ? true : false
    setReceitas(prev => prev.map(x => x.id === r.id ? { ...x, considera_teto_mei: novoValor } : x))
    const { error } = await supabase.from('receitas').update({ considera_teto_mei: novoValor }).eq('id', r.id)
    if (error) { showToast(error.message); carregar() }
  }

  function abrirEdicao(r: Receita) {
    setEditando(r)
    setForm({ descricao: r.descricao, valor: String(r.valor), data: r.data, categoria: r.categoria || CATEGORIAS[0], status: r.status || 'recebido' })
  }

  async function salvarEdicao() {
    if (!editando || !form.descricao || !form.valor) return
    setSalvando(true)
    const { error } = await supabase.from('receitas').update({
      descricao: form.descricao, valor: parseFloat(form.valor), data: form.data, categoria: form.categoria, status: form.status,
    }).eq('id', editando.id)
    setSalvando(false)
    if (error) { showToast(error.message); return }
    setEditando(null)
    carregar()
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    const { error } = await supabase.from('receitas').delete().eq('id', excluindo.id)
    setExcluindo(null)
    if (error) { showToast(error.message); return }
    carregar()
  }

  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth()
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const faturamentoAnual = faturamentoAnoMEI(receitas, anoAtual)
  const percentualLimiteAtual = percentualLimite(faturamentoAnual)
  const restanteLimite = limiteRestante(faturamentoAnual)
  const { mesesParaEstourar } = projecaoTeto(receitas, anoAtual, mesAtual, 6)
  const receitasAno = receitas.filter(r => new Date(r.data).getFullYear() === anoAtual)

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
      pdf.setTextColor(212, 175, 55); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold')
      pdf.text('AXIOMA AI.TECH — MEI Faturamento', 14, 13)
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
      pdf.save(`axioma-mei-faturamento-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  return (
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {toast && (
          <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm text-sm"
            style={{ background: 'rgba(248,113,113,0.95)', color: '#020810', fontWeight: 600 }}>
            {toast}
          </div>
        )}

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `${t('faturamento')} ${anoAtual}`, value: fmt(faturamentoAnual), cor: OURO },
            { label: t('limiteRestante'), value: fmt(restanteLimite), cor: VERDE },
            { label: t('limiteUsado'), value: `${percentualLimiteAtual.toFixed(1)}%`, cor: AMBAR },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-xl md:text-2xl font-black" style={{ color: card.cor, ...FONTE }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        <p className="text-xs px-1" style={{ color: '#5a7a9a' }}>{mx.considerandoTodasReceitas}</p>

        {/* Velocímetro */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0', ...FONTE }}>{t('velocimetro')} {anoAtual}</p>
          <div className="w-full h-4 rounded-full mb-2" style={{ background: 'rgba(106,176,255,0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentualLimiteAtual}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-4 rounded-full"
              style={{ background: percentualLimiteAtual >= 90 ? VERMELHO : percentualLimiteAtual >= 70 ? AMBAR : OURO }}
            />
          </div>
          <div className="flex justify-between text-xs mb-4" style={{ color: '#5a7a9a' }}>
            <span>{fmt(faturamentoAnual)}</span>
            <span className="font-bold" style={{ color: percentualLimiteAtual >= 90 ? VERMELHO : percentualLimiteAtual >= 70 ? AMBAR : OURO }}>{percentualLimiteAtual.toFixed(1)}%</span>
            <span>{fmt(LIMITE_ANUAL_MEI)}</span>
          </div>
          {mesesParaEstourar !== null && mesesParaEstourar <= 6 && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: VERMELHO }}>
              <AlertTriangle size={16} />
              {t('alerta')} {mesesParaEstourar} {t('meses')}.
            </div>
          )}
        </CanvasBox>

        {/* Faturamento por mês */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('faturamentoMensal')} — {anoAtual}</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${OURO} transparent transparent transparent` }} />
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 12 }, (_, i) => {
                const nomeMes = new Date(anoAtual, i, 1).toLocaleDateString(
                  idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR', { month: 'long' }
                )
                const valor = faturamentoAnoMEI(receitasAno.filter(r => new Date(r.data).getMonth() === i), anoAtual)
                const perc = (valor / (LIMITE_ANUAL_MEI / 12)) * 100
                const ehMesAtual = i === mesAtual
                return (
                  <div key={i} className="flex items-center gap-3">
                    <p className="text-xs w-24 capitalize" style={{ color: ehMesAtual ? OURO : '#5a7a9a', fontWeight: ehMesAtual ? 700 : 400 }}>{nomeMes}</p>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(106,176,255,0.1)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${Math.min(100, perc)}%`, background: OURO }} />
                    </div>
                    <p className="text-xs w-28 text-right font-semibold" style={{ color: valor > 0 ? OURO : '#3a5a7a' }}>{fmt(valor)}</p>
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-4 pt-4 flex justify-between" style={{ borderTop: '1px solid rgba(106,176,255,0.15)' }}>
            <span className="text-sm font-semibold" style={{ color: '#c8d8f0' }}>{t('total')} {anoAtual}</span>
            <span className="text-sm font-black" style={{ color: OURO }}>{fmt(faturamentoAnual)}</span>
          </div>
        </CanvasBox>

        {/* Lançamentos — lápis/lixeira/toggle */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('lancamentos')}</p>
          {receitasAno.length === 0 ? (
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('semLancamentos')}</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {receitasAno.map((r) => {
                const conta = r.considera_teto_mei !== false
                return (
                  <div key={r.id} className="flex items-center gap-2 p-3 rounded-xl flex-wrap"
                    style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(106,176,255,0.1)' }}>
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-xs font-semibold" style={{ color: '#c8d8f0' }}>{r.descricao}</p>
                      <p className="text-[10px]" style={{ color: '#5a7a9a' }}>
                        {new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')} · {r.categoria}
                      </p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: OURO }}>{fmt(r.valor)}</span>
                    <button onClick={() => alternarContaTeto(r)}
                      className="text-[9px] px-2 py-1 rounded-full font-semibold"
                      style={{
                        background: conta ? `${VERDE}15` : 'rgba(106,176,255,0.08)',
                        color: conta ? VERDE : '#5a7a9a',
                        border: `1px solid ${conta ? VERDE : '#5a7a9a'}30`,
                      }}>
                      {conta ? '✓ ' : '✕ '}{txt.contaTeto[lang]}
                    </button>
                    <button onClick={() => abrirEdicao(r)} style={{ color: AZUL }}><Pencil size={14} /></button>
                    <button onClick={() => setExcluindo(r)} style={{ color: VERMELHO }}><Trash2 size={14} /></button>
                  </div>
                )
              })}
            </div>
          )}
        </CanvasBox>

      </div>

      {/* Modal editar */}
      <AnimatePresence>
        {editando && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-8 px-4 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md">
              <CanvasBox cor={OURO}>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold" style={{ color: '#c8d8f0', ...FONTE }}>{t('lancamentos')}</h3>
                  <button onClick={() => setEditando(null)} style={{ color: '#5a7a9a' }}><X size={20} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: '#5a7a9a' }}>{t('descricao')}</label>
                    <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: '#5a7a9a' }}>{t('valor')}</label>
                      <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: '#5a7a9a' }}>{t('data')}</label>
                      <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: '#5a7a9a' }}>{t('categoria')}</label>
                      <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }}>
                        {CATEGORIAS.map(c => <option key={c} value={c} style={{ background: '#020810' }}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: '#5a7a9a' }}>{t('status')}</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }}>
                        <option value="recebido" style={{ background: '#020810' }}>{t('recebido')}</option>
                        <option value="pendente" style={{ background: '#020810' }}>{t('pendente')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditando(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(106,176,255,0.1)', color: '#5a7a9a' }}>{t('cancelar')}</button>
                    <button onClick={salvarEdicao} disabled={salvando} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: OURO, color: '#020810' }}>{salvando ? '...' : t('salvar')}</button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal excluir */}
      <AnimatePresence>
        {excluindo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm">
              <CanvasBox cor={VERMELHO}>
                <p className="text-sm mb-5" style={{ color: '#c8d8f0' }}>{t('confirmarExcluir')}</p>
                <div className="flex gap-3">
                  <button onClick={() => setExcluindo(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(106,176,255,0.1)', color: '#5a7a9a' }}>{t('cancelar')}</button>
                  <button onClick={confirmarExclusao} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: VERMELHO, color: '#020810' }}>{t('excluir')}</button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  )
}
