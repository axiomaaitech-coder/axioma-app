'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { AlertTriangle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { dasMensalPorCategoria } from '../../../../lib/meiHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const OURO = '#d4af37'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AZUL = '#6ab0ff'
const AMBAR = '#f59e0b'

export default function ReformaTributaria() {
  const { idioma } = useLanguage()
  const [receitas, setReceitas] = useState<any[]>([])
  const [meiDados, setMeiDados] = useState<any>(null)
  const [exportando, setExportando] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const dataHojeStr = new Date().toLocaleDateString(idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR')

  const txt = {
    titulo: { pt: 'MEI — Reforma Tributária', en: 'MEI — Tax Reform', es: 'MEI — Reforma Tributaria' },
    subtitulo: { pt: 'Entenda o impacto da Reforma Tributária 2026 no seu MEI', en: 'Understand the impact of the 2026 Tax Reform on your MEI', es: 'Entienda el impacto de la Reforma Tributaria 2026 en su MEI' },
    impacto: { pt: 'Reforma Tributária 2026 — Impacto no MEI', en: '2026 Tax Reform — MEI Impact', es: 'Reforma Tributaria 2026 — Impacto en MEI' },
    simulador: { pt: 'Simulador: MEI vs ME Simples Nacional', en: 'Simulator: MEI vs ME Simples Nacional', es: 'Simulador: MEI vs ME Simples Nacional' },
    porMes: { pt: 'por mês (DAS fixo)', en: 'per month (fixed DAS)', es: 'por mes (DAS fijo)' },
    estimado: { pt: 'estimado/mês (~6%)', en: 'estimated/month (~6%)', es: 'estimado/mes (~6%)' },
    aviso: {
      pt: `* Estimativa com base nas regras vigentes até ${dataHojeStr}, calculada sobre o seu faturamento atual. A Reforma Tributária ainda está em andamento e pode sofrer alterações — este número reflete o melhor entendimento atual.`,
      en: `* Estimate based on the rules in effect as of ${dataHojeStr}, calculated from your current revenue. The Tax Reform is still in progress and may change — this figure reflects the best current understanding.`,
      es: `* Estimación con base en las reglas vigentes hasta ${dataHojeStr}, calculada sobre su facturación actual. La Reforma Tributaria sigue en curso y puede sufrir cambios — este número refleja el mejor entendimiento actual.`,
    },
    timeline: { pt: 'Linha do Tempo — Transição até 2033', en: 'Timeline — Transition until 2033', es: 'Línea de Tiempo — Transición hasta 2033' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: mei }, { data: rec }] = await Promise.all([
      supabase.from('mei_dados').select('*').maybeSingle(),
      supabase.from('receitas').select('*'),
    ])
    setMeiDados(mei)
    setReceitas(rec || [])
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas
    .filter(r => new Date(r.data).getFullYear() === anoAtual)
    .reduce((acc, r) => acc + (r.valor || 0), 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dasValor = meiDados?.das_valor || dasMensalPorCategoria(meiDados?.categoria_mei)

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
      pdf.text('AXIOMA AI.TECH — MEI Reforma Tributária', 14, 13)
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
      pdf.save(`axioma-mei-reforma-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const itensReforma = [
    { titulo: { pt: 'IBS e CBS já em vigor', en: 'IBS and CBS already in effect', es: 'IBS y CBS ya en vigor' }, desc: { pt: 'Substituem PIS, COFINS e ICMS gradualmente até 2033. MEI está isento durante a transição.', en: 'Replace PIS, COFINS and ICMS gradually until 2033. MEI is exempt during the transition.', es: 'Reemplazan PIS, COFINS e ICMS gradualmente hasta 2033. MEI está exento durante la transición.' }, cor: '#34d399', status: '✅' },
    { titulo: { pt: 'Prazo decisão: setembro 2026', en: 'Decision deadline: September 2026', es: 'Plazo decisión: septiembre 2026' }, desc: { pt: 'MEI precisa decidir se continua no regime simplificado ou migra para ME em 2027.', en: 'MEI needs to decide whether to stay in the simplified regime or migrate to ME in 2027.', es: 'MEI debe decidir si continúa en el régimen simplificado o migra a ME en 2027.' }, cor: AMBAR, status: '⚠️' },
    { titulo: { pt: 'Limite MEI pode subir em 2027', en: 'MEI limit may increase in 2027', es: 'Límite MEI puede subir en 2027' }, desc: { pt: 'Proposta de aumento do limite para R$ 130.000/ano está em discussão no Congresso.', en: 'Proposal to increase the limit to R$ 130,000/year is under discussion in Congress.', es: 'Propuesta de aumento del límite a R$ 130.000/año está en discusión en el Congreso.' }, cor: OURO, status: '📋' },
    { titulo: { pt: 'Nota Fiscal obrigatória em 2027', en: 'Invoice mandatory in 2027', es: 'Factura obligatoria en 2027' }, desc: { pt: 'MEI prestador de serviços terá obrigatoriedade de emitir NFS-e pelo sistema nacional unificado.', en: 'MEI service providers will be required to issue NFS-e through the unified national system.', es: 'MEI prestadores de servicios deberán emitir NFS-e a través del sistema nacional unificado.' }, cor: AZUL, status: '📌' },
  ]

  const timeline = [
    { ano: '2024', desc: { pt: 'IBS e CBS criados — alíquotas zero', en: 'IBS and CBS created — zero rates', es: 'IBS y CBS creados — alícuotas cero' }, cor: '#34d399' },
    { ano: '2025', desc: { pt: 'Teste com alíquotas mínimas (0,1%)', en: 'Test with minimum rates (0.1%)', es: 'Prueba con alícuotas mínimas (0,1%)' }, cor: '#6ab0ff' },
    { ano: '2026', desc: { pt: 'Decisão: MEI ou ME Simples para 2027', en: 'Decision: MEI or ME Simples for 2027', es: 'Decisión: MEI o ME Simples para 2027' }, cor: OURO },
    { ano: '2027', desc: { pt: 'Redução progressiva PIS/COFINS começa', en: 'Progressive PIS/COFINS reduction begins', es: 'Reducción progresiva PIS/COFINS comienza' }, cor: AMBAR },
    { ano: '2033', desc: { pt: 'Transição completa — novo sistema vigente', en: 'Full transition — new system in effect', es: 'Transición completa — nuevo sistema vigente' }, cor: VERMELHO },
  ]

  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'

  return (
    <ModuloLayout
      titulo={t('titulo')}
      subtitulo={t('subtitulo')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Alerta destaque */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={20} style={{ color: AMBAR, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: AMBAR }}>
              {lang === 'pt' ? '⚠️ Ação necessária até setembro 2026' : lang === 'en' ? '⚠️ Action required by September 2026' : '⚠️ Acción necesaria antes de septiembre 2026'}
            </p>
            <p className="text-xs" style={{ color: '#c8d8f0' }}>
              {lang === 'pt' ? 'Você precisa decidir se continuará como MEI ou migrará para ME Simples Nacional em 2027. Use o simulador abaixo para comparar.' : lang === 'en' ? 'You need to decide whether to continue as MEI or migrate to ME Simples Nacional in 2027. Use the simulator below to compare.' : 'Necesita decidir si continuará como MEI o migrará a ME Simples Nacional en 2027. Use el simulador a continuación para comparar.'}
            </p>
          </div>
        </motion.div>

        {/* Impactos */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{t('impacto')}</p>
          <div className="space-y-3">
            {itensReforma.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl" style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}20` }}>
                <p className="text-sm font-bold mb-1" style={{ color: '#c8d8f0' }}>{item.status} {item.titulo[lang]}</p>
                <p className="text-xs" style={{ color: '#5a8ab0' }}>{item.desc[lang]}</p>
              </motion.div>
            ))}
          </div>
        </CanvasBox>

        {/* Simulador MEI vs ME */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{t('simulador')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl text-center" style={{ background: `${OURO}10`, border: `1px solid ${OURO}30` }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: OURO }}>MEI 2027</p>
              <p className="text-lg font-black mb-1" style={{ color: OURO }}>{fmt(dasValor)}</p>
              <p className="text-xs mb-3" style={{ color: '#5a7a9a' }}>{t('porMes')}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: VERDE }}>✓ {lang === 'pt' ? 'Simples e barato' : lang === 'en' ? 'Simple and cheap' : 'Simple y barato'}</p>
                <p className="text-xs font-semibold" style={{ color: VERDE }}>✓ {lang === 'pt' ? 'Sem contador obrigatório' : lang === 'en' ? 'No accountant required' : 'Sin contador obligatorio'}</p>
                <p className="text-xs" style={{ color: VERMELHO }}>✗ {lang === 'pt' ? 'Limite R$ 81k/ano' : lang === 'en' ? 'Limit R$ 81k/year' : 'Límite R$ 81k/año'}</p>
                <p className="text-xs" style={{ color: VERMELHO }}>✗ {lang === 'pt' ? 'Sem sócios' : lang === 'en' ? 'No partners' : 'Sin socios'}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: `${AZUL}10`, border: `1px solid ${AZUL}30` }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: AZUL }}>ME Simples</p>
              <p className="text-lg font-black mb-1" style={{ color: AZUL }}>{fmt(faturamentoAnual * 0.06 / 12)}</p>
              <p className="text-xs mb-3" style={{ color: '#5a7a9a' }}>{t('estimado')}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: VERDE }}>✓ {lang === 'pt' ? 'Limite R$ 4,8M/ano' : lang === 'en' ? 'Limit R$ 4.8M/year' : 'Límite R$ 4,8M/año'}</p>
                <p className="text-xs font-semibold" style={{ color: VERDE }}>✓ {lang === 'pt' ? 'Pode ter sócios' : lang === 'en' ? 'Can have partners' : 'Puede tener socios'}</p>
                <p className="text-xs" style={{ color: VERMELHO }}>✗ {lang === 'pt' ? 'Mais obrigações' : lang === 'en' ? 'More obligations' : 'Más obligaciones'}</p>
                <p className="text-xs" style={{ color: VERMELHO }}>✗ {lang === 'pt' ? 'Contador obrigatório' : lang === 'en' ? 'Accountant required' : 'Contador obligatorio'}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: '#5a7a9a' }}>{t('aviso')}</p>
        </CanvasBox>

        {/* Timeline */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{t('timeline')}</p>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ background: `linear-gradient(180deg, ${OURO}, ${AZUL})` }} />
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 pl-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                    style={{ background: `${item.cor}20`, border: `2px solid ${item.cor}`, boxShadow: `0 0 12px ${item.cor}40` }}>
                    <span className="text-xs font-black" style={{ color: item.cor }}>{item.ano.slice(2)}</span>
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-xs font-black mb-0.5" style={{ color: item.cor }}>{item.ano}</p>
                    <p className="text-xs" style={{ color: '#7a9aba' }}>{item.desc[lang]}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}