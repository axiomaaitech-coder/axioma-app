'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { LIMITE_ANUAL_MEI, dasMensalPorCategoria } from '../../../../lib/meiHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const OURO = '#d4af37'
const VERDE = '#34d399'
const AZUL = '#6ab0ff'
const AMBAR = '#f59e0b'
const FONTE = { fontFamily: "'Georgia','Times New Roman',serif" }

export default function PrecificacaoMEI() {
  const { idioma } = useLanguage()
  const [meiDados, setMeiDados] = useState<any>(null)
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoHoras, setPrecoHoras] = useState('')
  const [precoMargem, setPrecoMargem] = useState('30')
  const [precoResultado, setPrecoResultado] = useState<any>(null)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — Precificação', en: 'MEI — Pricing', es: 'MEI — Precios' },
    subtitulo: { pt: 'Calcule o preço justo dos seus produtos e serviços', en: 'Calculate the fair price for your products and services', es: 'Calcule el precio justo de sus productos y servicios' },
    calculadora: { pt: 'Calculadora de Preço Justo MEI', en: 'MEI Fair Price Calculator', es: 'Calculadora de Precio Justo MEI' },
    custo: { pt: 'Custo total mensal (R$)', en: 'Total monthly cost (R$)', es: 'Costo total mensual (R$)' },
    horas: { pt: 'Horas trabalhadas por mês', en: 'Hours worked per month', es: 'Horas trabajadas por mes' },
    margem: { pt: 'Margem de lucro desejada (%)', en: 'Desired profit margin (%)', es: 'Margen de ganancia deseado (%)' },
    calcular: { pt: 'Calcular Preço Justo', en: 'Calculate Fair Price', es: 'Calcular Precio Justo' },
    custoHora: { pt: 'Custo por hora', en: 'Cost per hour', es: 'Costo por hora' },
    impostos: { pt: 'Impostos estimados/hora', en: 'Estimated taxes/hour', es: 'Impuestos estimados/hora' },
    margemReais: { pt: 'Margem de lucro/hora', en: 'Profit margin/hour', es: 'Margen de ganancia/hora' },
    precoMinimo: { pt: '💰 Preço mínimo/hora', en: '💰 Minimum price/hour', es: '💰 Precio mínimo/hora' },
    dicas: { pt: 'Dicas de Precificação MEI', en: 'MEI Pricing Tips', es: 'Consejos de Precios MEI' },
    categoria: { pt: 'Categoria MEI', en: 'MEI Category', es: 'Categoría MEI' },
    aliquota: { pt: 'Alíquota de isenção IRPF', en: 'IRPF exemption rate', es: 'Alícuota de exención IRPF' },
    dasAnual: { pt: 'DAS anual estimado', en: 'Estimated annual DAS', es: 'DAS anual estimado' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: mei } = await supabase.from('mei_dados').select('*').maybeSingle()
    setMeiDados(mei)
  }

  const percentualIsento = meiDados?.categoria_mei === 'Comércio' ? 0.08
    : meiDados?.categoria_mei === 'Indústria' ? 0.08
    : meiDados?.categoria_mei === 'Transporte' ? 0.16 : 0.32

  function calcularPreco() {
    if (!precoCusto) return
    const custo = parseFloat(precoCusto)
    const horas = parseFloat(precoHoras) || 1
    const margem = parseFloat(precoMargem) / 100
    const dasPerc = meiDados?.das_valor ? (meiDados.das_valor * 12) / LIMITE_ANUAL_MEI : 0.011
    const custoTotal = custo / horas
    const precoMinimo = custoTotal / (1 - margem - dasPerc - percentualIsento * 0.275)
    setPrecoResultado({
      custoHora: custoTotal,
      precoMinimo,
      margemReais: precoMinimo * margem,
      impostos: precoMinimo * (dasPerc + percentualIsento * 0.275)
    })
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
      pdf.setTextColor(212, 175, 55); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold')
      pdf.text('AXIOMA AI.TECH — MEI Precificação', 14, 13)
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
      pdf.save(`axioma-mei-precificacao-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const dicas = [
    { pt: 'Nunca precifique abaixo do custo real por hora — inclua DAS, IRPF e tempo improdutivo.', en: 'Never price below the real hourly cost — include DAS, IRPF and unproductive time.', es: 'Nunca precios por debajo del costo real por hora — incluya DAS, IRPF y tiempo improductivo.' },
    { pt: 'Adicione 20-30% de margem mínima para cobrir imprevistos e investimentos no negócio.', en: 'Add 20-30% minimum margin to cover unforeseen events and business investments.', es: 'Agregue 20-30% de margen mínimo para cubrir imprevistos e inversiones en el negocio.' },
    { pt: 'Revise seus preços a cada 6 meses considerando inflação e novos custos.', en: 'Review your prices every 6 months considering inflation and new costs.', es: 'Revise sus precios cada 6 meses considerando inflación y nuevos costos.' },
    { pt: 'Serviços MEI têm isenção de 32% de IRPF sobre a receita — use isso no seu cálculo.', en: 'MEI services have a 32% IRPF exemption on revenue — use this in your calculation.', es: 'Servicios MEI tienen exención de 32% de IRPF sobre ingresos — úselo en su cálculo.' },
  ]

  return (
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Info do MEI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t('categoria'), value: meiDados?.categoria_mei || 'Serviços', cor: OURO },
            { label: t('aliquota'), value: `${(percentualIsento * 100).toFixed(0)}%`, cor: VERDE },
            { label: t('dasAnual'), value: fmt((meiDados?.das_valor || dasMensalPorCategoria(meiDados?.categoria_mei)) * 12), cor: AZUL },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-lg md:text-xl font-black" style={{ color: card.cor, ...FONTE }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Calculadora */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('calculadora')}</p>
          <div className="space-y-4">
            {[
              { label: t('custo'), value: precoCusto, set: setPrecoCusto },
              { label: t('horas'), value: precoHoras, set: setPrecoHoras },
              { label: t('margem'), value: precoMargem, set: setPrecoMargem },
            ].map((campo, i) => (
              <div key={i}>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{campo.label}</label>
                <input
                  type="number"
                  value={campo.value}
                  onChange={e => campo.set(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }}
                />
              </div>
            ))}
            <button onClick={calcularPreco}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
              {t('calcular')}
            </button>

            <AnimatePresence>
              {precoResultado && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2 mt-2">
                  {[
                    { label: t('custoHora'), value: fmt(precoResultado.custoHora), cor: '#5a7a9a' },
                    { label: t('impostos'), value: fmt(precoResultado.impostos), cor: AMBAR },
                    { label: t('margemReais'), value: fmt(precoResultado.margemReais), cor: VERDE },
                    { label: t('precoMinimo'), value: fmt(precoResultado.precoMinimo), cor: OURO },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl"
                      style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}20` }}>
                      <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                      <span className="text-sm font-black" style={{ color: item.cor }}>{item.value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CanvasBox>

        {/* Dicas */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('dicas')}</p>
          <div className="space-y-3">
            {dicas.map((dica, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${AZUL}06`, border: `1px solid ${AZUL}15` }}>
                <span className="text-sm flex-shrink-0" style={{ color: AZUL }}>💡</span>
                <p className="text-xs" style={{ color: '#7a9aba' }}>{dica[lang]}</p>
              </div>
            ))}
          </div>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}
