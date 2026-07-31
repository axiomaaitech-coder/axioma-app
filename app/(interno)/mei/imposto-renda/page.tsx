'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

const FAIXAS_IRPF = [
  { limite: 2259.20, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896.00 },
]

function calcularIRPF(rendaMensal: number): { imposto: number; aliquota: number; aliquotaEfetiva: number } {
  const faixa = FAIXAS_IRPF.find(f => rendaMensal <= f.limite)!
  const imposto = Math.max(0, rendaMensal * faixa.aliquota - faixa.deducao)
  const aliquotaEfetiva = rendaMensal > 0 ? (imposto / rendaMensal) * 100 : 0
  return { imposto, aliquota: faixa.aliquota * 100, aliquotaEfetiva }
}

export default function ImpostoRendaMEI() {
  const { idioma } = useLanguage()
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [outraRenda, setOutraRenda] = useState('')
  const [exportando, setExportando] = useState(false)
  const [checklistMarcado, setChecklistMarcado] = useState<boolean[]>([false, false, false, false, false, false])
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — Imposto de Renda', en: 'MEI — Income Tax', es: 'MEI — Impuesto a la Renta' },
    subtitulo: { pt: 'Calcule e planeje seu IRPF com dados reais', en: 'Calculate and plan your IRPF with real data', es: 'Calcule y planifique su IRPF con datos reales' },
    resumo: { pt: 'Resumo IRPF MEI', en: 'MEI IRPF Summary', es: 'Resumen IRPF MEI' },
    receitaBruta: { pt: 'Receita Bruta MEI', en: 'MEI Gross Revenue', es: 'Ingresos Brutos MEI' },
    isencao: { pt: 'Parcela Isenta MEI', en: 'MEI Exempt Portion', es: 'Porción Exenta MEI' },
    rendaTributavel: { pt: 'Renda Tributável', en: 'Taxable Income', es: 'Renta Tributable' },
    outraRenda: { pt: 'Outra renda mensal (salário, aluguel, etc.)', en: 'Other monthly income (salary, rent, etc.)', es: 'Otros ingresos mensuales (salario, alquiler, etc.)' },
    tabela: { pt: 'Tabela Progressiva IRPF 2025', en: 'Progressive IRPF Table 2025', es: 'Tabla Progresiva IRPF 2025' },
    checklist: { pt: 'Checklist Declaração IRPF MEI', en: 'MEI IRPF Declaration Checklist', es: 'Checklist Declaración IRPF MEI' },
    abrirReceita: { pt: 'Acessar Receita Federal', en: 'Access Federal Revenue', es: 'Acceder a Receita Federal' },
    obrigatorio: { pt: 'Declaração OBRIGATÓRIA', en: 'MANDATORY Declaration', es: 'Declaración OBLIGATORIA' },
    naoObrigatorio: { pt: 'Declaração não obrigatória', en: 'Declaration not required', es: 'Declaración no obligatoria' },
    progresso: { pt: 'itens concluídos', en: 'items completed', es: 'elementos completados' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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

    const salvo = localStorage.getItem(`axioma-irpf-checklist-${user.id}`)
    if (salvo) {
      try { setChecklistMarcado(JSON.parse(salvo)) } catch {}
    }
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas
    .filter(r => new Date(r.data).getFullYear() === anoAtual)
    .reduce((acc, r) => acc + (r.valor || 0), 0)

  const percentualIsento = meiDados?.categoria_mei === 'Comércio' ? 0.08
    : meiDados?.categoria_mei === 'Indústria' ? 0.08
    : meiDados?.categoria_mei === 'Transporte' ? 0.16 : 0.32

  const isencaoMEI = faturamentoAnual * percentualIsento
  const rendaTributavelMEI = faturamentoAnual - isencaoMEI
  const outraRendaAnual = parseFloat(outraRenda || '0') * 12
  const rendaTotalAnual = rendaTributavelMEI + outraRendaAnual
  const rendaMensalMedia = rendaTotalAnual / 12

  const { imposto, aliquotaEfetiva } = calcularIRPF(rendaMensalMedia)
  const impostoAnual = imposto * 12
  const obrigado = rendaTotalAnual > 33888 || faturamentoAnual > 0

  const checklistItens = [
    { pt: 'CNPJ MEI ativo e em dia com DAS', en: 'Active MEI CNPJ with DAS up to date', es: 'CNPJ MEI activo y al día con DAS', auto: !!meiDados },
    { pt: 'DASN-SIMEI declarada (receita bruta anual)', en: 'DASN-SIMEI declared (annual gross revenue)', es: 'DASN-SIMEI declarada (ingresos brutos anuales)', auto: faturamentoAnual > 0 },
    { pt: 'Comprovante de rendimentos MEI separado', en: 'MEI income proof separated', es: 'Comprobante de ingresos MEI separado', auto: false },
    { pt: 'Recibos e notas fiscais do ano organizados', en: 'Receipts and invoices for the year organized', es: 'Recibos y facturas del año organizados', auto: receitas.length > 0 },
    { pt: 'Informes de outras fontes de renda (se houver)', en: 'Reports from other income sources (if any)', es: 'Informes de otras fuentes de ingresos (si hay)', auto: false },
    { pt: 'Programa IRPF Receita Federal instalado', en: 'Receita Federal IRPF Program installed', es: 'Programa IRPF Receita Federal instalado', auto: false },
  ]

  function toggleChecklist(index: number) {
    if (checklistItens[index].auto) return
    const novo = [...checklistMarcado]
    novo[index] = !novo[index]
    setChecklistMarcado(novo)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) localStorage.setItem(`axioma-irpf-checklist-${user.id}`, JSON.stringify(novo))
    })
  }

  const itensConcluidos = checklistItens.filter((item, i) => item.auto || checklistMarcado[i]).length
  const totalItens = checklistItens.length

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
      pdf.text('AXIOMA AI.TECH — MEI Imposto de Renda', 14, 13)
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
      pdf.save(`axioma-mei-irpf-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  return (
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Status obrigatoriedade */}
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{
            background: obrigado ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
            border: `1px solid ${obrigado ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
          }}>
          {obrigado
            ? <AlertTriangle size={22} style={{ color: VERMELHO, flexShrink: 0 }} />
            : <CheckCircle size={22} style={{ color: VERDE, flexShrink: 0 }} />}
          <div>
            <p className="text-sm font-black" style={{ color: obrigado ? VERMELHO : VERDE }}>
              {obrigado ? t('obrigatorio') : t('naoObrigatorio')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#7a9aba' }}>
              {obrigado
                ? (lang === 'pt' ? `Sua renda tributável (${fmt(rendaTotalAnual)}/ano) supera o limite de isenção de R$ 33.888/ano.`
                  : lang === 'en' ? `Your taxable income (${fmt(rendaTotalAnual)}/year) exceeds the exemption limit of R$ 33,888/year.`
                  : `Su renta tributable (${fmt(rendaTotalAnual)}/año) supera el límite de exención de R$ 33.888/año.`)
                : (lang === 'pt' ? '✅ Você está dentro do limite de isenção.'
                  : lang === 'en' ? '✅ You are within the exemption limit.'
                  : '✅ Está dentro del límite de exención.')}
            </p>
          </div>
        </div>

        {/* Cards principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('receitaBruta'), value: fmt(faturamentoAnual), cor: OURO },
            { label: t('isencao'), value: fmt(isencaoMEI), cor: VERDE },
            { label: t('rendaTributavel'), value: fmt(rendaTributavelMEI), cor: AMBAR },
            { label: lang === 'pt' ? 'IRPF estimado/ano' : lang === 'en' ? 'Estimated IRPF/year' : 'IRPF estimado/año', value: fmt(impostoAnual), cor: obrigado ? VERMELHO : '#5a7a9a' },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-base md:text-lg font-black" style={{ color: card.cor, ...FONTE }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Calculadora */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('resumo')}</p>
          <div className="mb-4">
            <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
              {t('outraRenda')}
            </label>
            <input type="number" value={outraRenda} onChange={e => setOutraRenda(e.target.value)}
              placeholder="0,00" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}20`, color: '#c8d8f0' }} />
          </div>
          <div className="space-y-2">
            {[
              { label: lang === 'pt' ? `Receita Bruta MEI ${anoAtual}` : lang === 'en' ? `MEI Gross Revenue ${anoAtual}` : `Ingresos Brutos MEI ${anoAtual}`, value: fmt(faturamentoAnual), cor: OURO },
              { label: lang === 'pt' ? `Isenção MEI (${(percentualIsento * 100).toFixed(0)}% — ${meiDados?.categoria_mei || 'Serviços'})` : lang === 'en' ? `MEI Exemption (${(percentualIsento * 100).toFixed(0)}%)` : `Exención MEI (${(percentualIsento * 100).toFixed(0)}%)`, value: `- ${fmt(isencaoMEI)}`, cor: VERDE },
              { label: lang === 'pt' ? 'Renda tributável MEI' : lang === 'en' ? 'MEI taxable income' : 'Renta tributable MEI', value: fmt(rendaTributavelMEI), cor: AMBAR },
              { label: lang === 'pt' ? 'Outra renda (anual)' : lang === 'en' ? 'Other income (annual)' : 'Otros ingresos (anual)', value: fmt(outraRendaAnual), cor: AZUL },
              { label: lang === 'pt' ? 'Renda total tributável/ano' : lang === 'en' ? 'Total taxable income/year' : 'Renta total tributable/año', value: fmt(rendaTotalAnual), cor: AZUL },
              { label: lang === 'pt' ? 'Alíquota efetiva IRPF' : lang === 'en' ? 'Effective IRPF rate' : 'Alícuota efectiva IRPF', value: `${aliquotaEfetiva.toFixed(1)}%`, cor: obrigado ? VERMELHO : VERDE },
              { label: lang === 'pt' ? '💰 IRPF total estimado/ano' : lang === 'en' ? '💰 Estimated total IRPF/year' : '💰 IRPF total estimado/año', value: fmt(impostoAnual), cor: obrigado ? VERMELHO : VERDE },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl" style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}15` }}>
                <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                <span className="text-sm font-black" style={{ color: item.cor }}>{item.value}</span>
              </div>
            ))}
          </div>
        </CanvasBox>

        {/* Tabela progressiva */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('tabela')}</p>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  lang === 'pt' ? 'Base de Cálculo Mensal' : lang === 'en' ? 'Monthly Calculation Base' : 'Base de Cálculo Mensual',
                  lang === 'pt' ? 'Alíquota' : lang === 'en' ? 'Rate' : 'Alícuota',
                  lang === 'pt' ? 'Dedução' : lang === 'en' ? 'Deduction' : 'Deducción',
                ].map((h, i) => (
                  <p key={i} className="text-xs font-bold uppercase tracking-wider px-2" style={{ color: '#5a7a9a' }}>{h}</p>
                ))}
              </div>
              {[
                { faixa: lang === 'pt' ? 'Até R$ 2.259,20' : lang === 'en' ? 'Up to R$ 2,259.20' : 'Hasta R$ 2.259,20', aliquota: 'Isento', deducao: '—', cor: VERDE },
                { faixa: 'R$ 2.259,21 – R$ 2.826,65', aliquota: '7,5%', deducao: 'R$ 169,44', cor: AZUL },
                { faixa: 'R$ 2.826,66 – R$ 3.751,05', aliquota: '15%', deducao: 'R$ 381,44', cor: AMBAR },
                { faixa: 'R$ 3.751,06 – R$ 4.664,68', aliquota: '22,5%', deducao: 'R$ 662,77', cor: OURO },
                { faixa: lang === 'pt' ? 'Acima de R$ 4.664,68' : lang === 'en' ? 'Above R$ 4,664.68' : 'Por encima de R$ 4.664,68', aliquota: '27,5%', deducao: 'R$ 896,00', cor: VERMELHO },
              ].map((row, i) => {
                const ehFaixaAtual = rendaMensalMedia > 0 && (
                  (i === 0 && rendaMensalMedia <= 2259.20) ||
                  (i === 1 && rendaMensalMedia > 2259.20 && rendaMensalMedia <= 2826.65) ||
                  (i === 2 && rendaMensalMedia > 2826.65 && rendaMensalMedia <= 3751.05) ||
                  (i === 3 && rendaMensalMedia > 3751.05 && rendaMensalMedia <= 4664.68) ||
                  (i === 4 && rendaMensalMedia > 4664.68)
                )
                return (
                  <div key={i} className="grid grid-cols-3 gap-2 p-2 rounded-xl"
                    style={{
                      background: ehFaixaAtual ? `${row.cor}15` : `${row.cor}05`,
                      border: `1px solid ${ehFaixaAtual ? row.cor + '40' : row.cor + '15'}`,
                    }}>
                    <p className="text-xs" style={{ color: ehFaixaAtual ? '#c8d8f0' : '#5a7a9a' }}>{ehFaixaAtual ? '👉 ' : ''}{row.faixa}</p>
                    <p className="text-xs font-bold text-center" style={{ color: row.cor }}>{row.aliquota}</p>
                    <p className="text-xs text-right" style={{ color: ehFaixaAtual ? '#c8d8f0' : '#5a7a9a' }}>{row.deducao}</p>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: '#5a7a9a' }}>
            {lang === 'pt' ? '* Tabela IRPF 2025, calculada automaticamente com base nos seus dados reais.'
              : lang === 'en' ? '* IRPF 2025 table, calculated automatically based on your real data.'
              : '* Tabla IRPF 2025, calculada automáticamente con base en sus datos reales.'}
          </p>
        </CanvasBox>

        {/* Checklist clicável */}
        <CanvasBox cor={OURO}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm font-semibold" style={{ color: '#c8d8f0', ...FONTE }}>{t('checklist')}</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full overflow-hidden" style={{ background: 'rgba(106,176,255,0.15)' }}>
                <div className="h-2 rounded-full" style={{ width: `${(itensConcluidos / totalItens) * 100}%`, background: `linear-gradient(90deg, ${VERDE}, ${AZUL})` }} />
              </div>
              <span className="text-xs font-bold" style={{ color: VERDE }}>
                {itensConcluidos}/{totalItens} {t('progresso')}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {checklistItens.map((item, i) => {
              const marcado = item.auto || checklistMarcado[i]
              const clicavel = !item.auto
              return (
                <div
                  key={i}
                  onClick={() => toggleChecklist(i)}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{
                    background: marcado ? 'rgba(52,211,153,0.08)' : 'rgba(106,176,255,0.05)',
                    border: `1px solid ${marcado ? 'rgba(52,211,153,0.25)' : 'rgba(106,176,255,0.12)'}`,
                    cursor: clicavel ? 'pointer' : 'default',
                  }}>
                  <div className="flex-shrink-0">
                    {marcado ? (
                      <CheckCircle size={18} style={{ color: VERDE }} />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2" style={{ borderColor: clicavel ? '#5a7a9a' : '#2a4060' }} />
                    )}
                  </div>
                  <p className="text-xs flex-1" style={{ color: marcado ? '#c8d8f0' : '#5a7a9a' }}>
                    {item[lang]}
                  </p>
                  {item.auto && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(52,211,153,0.15)', color: VERDE, fontSize: 10 }}>
                      auto
                    </span>
                  )}
                  {clicavel && !marcado && (
                    <span className="text-xs flex-shrink-0" style={{ color: '#5a7a9a', fontSize: 10 }}>
                      {lang === 'pt' ? 'clique para marcar' : lang === 'en' ? 'click to check' : 'clic para marcar'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {itensConcluidos === totalItens && (
            <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <p className="text-sm font-bold" style={{ color: VERDE }}>
                🎉 {lang === 'pt' ? 'Checklist completo! Você está pronto para declarar.' : lang === 'en' ? 'Checklist complete! You are ready to file.' : '¡Checklist completo! Está listo para declarar.'}
              </p>
            </div>
          )}

          <a href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold mt-4"
            style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
            <FileText size={16} />{t('abrirReceita')}
          </a>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}
