'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { Pencil, Check, X, FileText, Bell } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { meiT } from '../../../../lib/meiTextos'
import {
  faturamentoAnoMEI, dasMensalPorCategoria, carregarObrigacoesAno, salvarObrigacao,
  type StatusObrigacao, type ObrigacaoMEI,
} from '../../../../lib/meiHelpers'

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

function pad(n: number) { return String(n).padStart(2, '0') }

export default function DASObrigacoes() {
  const { idioma } = useLanguage()
  const [receitas, setReceitas] = useState<any[]>([])
  const [meiDados, setMeiDados] = useState<any>(null)
  const [dasValor, setDasValor] = useState(String(dasMensalPorCategoria('Serviços')))
  const [editandoDas, setEditandoDas] = useState(false)
  const [dasValorTemp, setDasValorTemp] = useState('')
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoMEI[]>([])
  const [editandoTipo, setEditandoTipo] = useState<'DAS' | 'DASN' | 'IRPF' | null>(null)
  const [exportando, setExportando] = useState(false)
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — DAS & Obrigações', en: 'MEI — DAS & Obligations', es: 'MEI — DAS & Obligaciones' },
    subtitulo: { pt: 'Central de Obrigações — calendário fiscal do MEI', en: 'Obligations Center — MEI tax calendar', es: 'Central de Obligaciones — calendario fiscal MEI' },
    calendario: { pt: 'Calendário de Obrigações Fiscais', en: 'Tax Obligations Calendar', es: 'Calendario de Obligaciones Fiscales' },
    dasTodo: { pt: 'Todo dia 20 de cada mês', en: 'Every 20th of each month', es: 'Cada día 20 de cada mes' },
    dasnPrazo: { pt: 'Até 31 de maio de cada ano', en: 'By May 31st each year', es: 'Hasta el 31 de mayo de cada año' },
    dasnDesc: { pt: 'Declaração Anual de Faturamento', en: 'Annual Revenue Declaration', es: 'Declaración Anual de Facturación' },
    irpfPrazo: { pt: 'Até 30 de abril de cada ano', en: 'By April 30th each year', es: 'Hasta el 30 de abril de cada año' },
    calculadora: { pt: 'Calculadora DASN-SIMEI', en: 'DASN-SIMEI Calculator', es: 'Calculadora DASN-SIMEI' },
    receitaBruta: { pt: 'Receita Bruta', en: 'Gross Revenue', es: 'Ingresos Brutos' },
    categoria: { pt: 'Categoria', en: 'Category', es: 'Categoría' },
    abrirPortal: { pt: 'Abrir Portal DASN-SIMEI', en: 'Open DASN-SIMEI Portal', es: 'Abrir Portal DASN-SIMEI' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const mx = meiT(lang)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const anoAtual = new Date().getFullYear()
    const [{ data: mei }, { data: rec }, obr] = await Promise.all([
      supabase.from('mei_dados').select('*').maybeSingle(),
      supabase.from('receitas').select('*'),
      carregarObrigacoesAno(anoAtual),
    ])
    setMeiDados(mei)
    setReceitas(rec || [])
    setObrigacoes(obr)
    if (mei) setDasValor(String(mei.das_valor || dasMensalPorCategoria(mei.categoria_mei)))
  }

  async function salvarDasInline() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const novoValor = parseFloat(dasValorTemp)
    if (isNaN(novoValor)) return
    setDasValor(String(novoValor))
    const empresaId = await obterEmpresaAtiva()
    await supabase.from('mei_dados').upsert({
      user_id: user.id, empresa_id: empresaId, das_valor: novoValor,
      categoria_mei: meiDados?.categoria_mei || 'Serviços',
      limite_anual: 81000, regime_tributario: 'mei',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'empresa_id' })
    setEditandoDas(false)
    carregar()
  }

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const competenciaDas = `${anoAtual}-${pad(hoje.getMonth() + 1)}`
  const competenciaAnual = String(anoAtual)
  const vencimentoDas = new Date(anoAtual, hoje.getMonth(), 20)
  const vencimentoDasn = new Date(anoAtual, 4, 31) // 31 de maio
  const vencimentoIrpf = new Date(anoAtual, 3, 30) // 30 de abril

  const obrigacaoDas = obrigacoes.find(o => o.tipo === 'DAS' && o.competencia === competenciaDas)
  const obrigacaoDasn = obrigacoes.find(o => o.tipo === 'DASN' && o.competencia === competenciaAnual)
  const obrigacaoIrpf = obrigacoes.find(o => o.tipo === 'IRPF' && o.competencia === competenciaAnual)

  const statusDas: StatusObrigacao = obrigacaoDas?.status || 'Pendente'
  const statusDasn: StatusObrigacao = obrigacaoDasn?.status || 'Pendente'
  const statusIrpf: StatusObrigacao = obrigacaoIrpf?.status || 'Não obrigatório'

  function diasOuAtraso(vencimento: Date, status: StatusObrigacao): { texto: string; atrasado: boolean } {
    if (status === 'Entregue' || status === 'Não obrigatório') return { texto: '', atrasado: false }
    const dias = Math.ceil((vencimento.getTime() - hoje.getTime()) / 86400000)
    if (dias < 0) return { texto: `${Math.abs(dias)} ${mx.diasAtraso}`, atrasado: true }
    return { texto: `${mx.vencePrazo} ${dias}d`, atrasado: false }
  }

  async function marcarStatus(tipo: 'DAS' | 'DASN' | 'IRPF', status: StatusObrigacao) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSalvandoStatus(true)
    const empresaId = await obterEmpresaAtiva()
    const competencia = tipo === 'DAS' ? competenciaDas : competenciaAnual
    const vencimento = tipo === 'DAS' ? vencimentoDas : tipo === 'DASN' ? vencimentoDasn : vencimentoIrpf
    await salvarObrigacao({
      userId: user.id, empresaId, tipo, competencia, status,
      dataVencimento: vencimento.toISOString().slice(0, 10),
      dataEntrega: status === 'Entregue' ? new Date().toISOString().slice(0, 10) : null,
    })
    setSalvandoStatus(false)
    setEditandoTipo(null)
    carregar()
  }

  const faturamentoAnual = faturamentoAnoMEI(receitas, anoAtual)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const corStatus = (s: StatusObrigacao) =>
    s === 'Entregue' ? VERDE : s === 'Atrasado' ? VERMELHO : s === 'Não obrigatório' ? '#5a7a9a' : AMBAR

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
      pdf.text('AXIOMA AI.TECH — MEI DAS & Obrigações', 14, 13)
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
      pdf.save(`axioma-mei-das-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const linhaObrigacao = (
    tipo: 'DAS' | 'DASN' | 'IRPF',
    nome: string,
    prazo: string,
    desc: string,
    status: StatusObrigacao,
    vencimento: Date,
    opcoes: StatusObrigacao[],
    cor: string,
  ) => {
    const { texto: prazoTexto, atrasado } = diasOuAtraso(vencimento, status)
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl flex-wrap"
        style={{ background: `${cor}08`, border: `1px solid ${cor}20` }}>
        {tipo === 'DAS' ? <Bell size={18} style={{ color: cor, flexShrink: 0 }} /> : <FileText size={18} style={{ color: cor, flexShrink: 0 }} />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>{nome}</p>
          <p className="text-xs" style={{ color: '#5a7a9a' }}>{prazo}</p>
          {desc && <p className="text-xs font-semibold mt-1" style={{ color: cor }}>{desc}</p>}
          {prazoTexto && <p className="text-[10px] mt-1 font-semibold" style={{ color: atrasado ? VERMELHO : AMBAR }}>{prazoTexto}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <AnimatePresence mode="wait">
            {editandoTipo === tipo ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1 flex-wrap">
                {opcoes.map(s => (
                  <button key={s} disabled={salvandoStatus} onClick={() => marcarStatus(tipo, s)}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: `${corStatus(s)}20`, color: corStatus(s), border: `1px solid ${corStatus(s)}40` }}>
                    {s}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${corStatus(status)}15`, color: corStatus(status), border: `1px solid ${corStatus(status)}30` }}>
                  {status}
                </span>
                <button onClick={() => setEditandoTipo(tipo)} style={{ color: AZUL }}><Pencil size={15} /></button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'DAS Mensal', value: fmt(parseFloat(dasValor || String(dasMensalPorCategoria(meiDados?.categoria_mei)))), cor: OURO },
            { label: `DAS Anual ${anoAtual}`, value: fmt(parseFloat(dasValor || String(dasMensalPorCategoria(meiDados?.categoria_mei))) * 12), cor: AZUL },
            { label: `Receita Bruta ${anoAtual}`, value: fmt(faturamentoAnual), cor: VERDE },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-xl md:text-2xl font-black" style={{ color: card.cor, ...FONTE }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Central de Obrigações */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{mx.obrigacoes}</p>
          <div className="space-y-3">

            {/* DAS Mensal — valor editável + status */}
            <div className="flex items-center gap-4 p-4 rounded-xl flex-wrap" style={{ background: `${OURO}08`, border: `1px solid ${OURO}20` }}>
              <Bell size={18} style={{ color: OURO, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>DAS Mensal</p>
                <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('dasTodo')}</p>
                {editandoDas ? (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <input type="number" value={dasValorTemp} onChange={e => setDasValorTemp(e.target.value)}
                      className="w-28 px-2 py-1 rounded-lg text-xs focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${OURO}40`, color: '#c8d8f0' }} autoFocus />
                    <button onClick={salvarDasInline} className="p-1.5 rounded-lg" style={{ background: 'rgba(52,211,153,0.2)', color: VERDE }}><Check size={14} /></button>
                    <button onClick={() => setEditandoDas(false)} className="p-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.2)', color: VERMELHO }}><X size={14} /></button>
                  </div>
                ) : (
                  <p className="text-xs font-semibold mt-1" style={{ color: OURO }}>{fmt(parseFloat(dasValor || String(dasMensalPorCategoria(meiDados?.categoria_mei))))}</p>
                )}
                {(() => { const { texto, atrasado } = diasOuAtraso(vencimentoDas, statusDas); return texto ? <p className="text-[10px] mt-1 font-semibold" style={{ color: atrasado ? VERMELHO : AMBAR }}>{texto}</p> : null })()}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {!editandoDas && (
                  <>
                    <AnimatePresence mode="wait">
                      {editandoTipo === 'DAS' ? (
                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1 flex-wrap">
                          {(['Pendente', 'Entregue', 'Atrasado'] as StatusObrigacao[]).map(s => (
                            <button key={s} disabled={salvandoStatus} onClick={() => marcarStatus('DAS', s)}
                              className="text-xs px-2 py-1 rounded-full" style={{ background: `${corStatus(s)}20`, color: corStatus(s), border: `1px solid ${corStatus(s)}40` }}>
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${corStatus(statusDas)}15`, color: corStatus(statusDas), border: `1px solid ${corStatus(statusDas)}30` }}>{statusDas}</span>
                          <button onClick={() => setEditandoTipo('DAS')} style={{ color: AZUL }}><Pencil size={15} /></button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button onClick={() => { setDasValorTemp(dasValor); setEditandoDas(true) }} style={{ color: AZUL }}><Pencil size={13} /></button>
                  </>
                )}
              </div>
            </div>

            {linhaObrigacao('DASN', 'DASN-SIMEI', t('dasnPrazo'), t('dasnDesc'), statusDasn, vencimentoDasn, ['Pendente', 'Entregue', 'Atrasado'], AMBAR)}
            {linhaObrigacao('IRPF', 'IRPF MEI', t('irpfPrazo'), faturamentoAnual > 33888
              ? (lang === 'pt' ? '⚠️ Sua renda está acima do limite de isenção' : lang === 'en' ? '⚠️ Your income exceeds the exemption limit' : '⚠️ Sus ingresos superan el límite de exención')
              : (lang === 'pt' ? '✅ Dentro do limite de isenção' : lang === 'en' ? '✅ Within the exemption limit' : '✅ Dentro del límite de exención'),
              statusIrpf, vencimentoIrpf, ['Não obrigatório', 'Pendente', 'Entregue'], AZUL)}

          </div>
        </CanvasBox>

        {/* Calculadora DASN */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('calculadora')}</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: `${OURO}08`, border: `1px solid ${OURO}15` }}>
              <span className="text-sm" style={{ color: '#c8d8f0' }}>{t('receitaBruta')} {anoAtual}</span>
              <span className="text-sm font-black" style={{ color: OURO }}>{fmt(faturamentoAnual)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: `${AZUL}08`, border: `1px solid ${AZUL}15` }}>
              <span className="text-sm" style={{ color: '#c8d8f0' }}>{t('categoria')}</span>
              <span className="text-sm font-bold" style={{ color: AZUL }}>{meiDados?.categoria_mei || 'Serviços'}</span>
            </div>
            <a href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/declaracao-anual-de-faturamento-dasn-simei"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: `linear-gradient(135deg, #1a3a8f, ${AZUL})`, color: '#fff' }}>
              <FileText size={16} />{t('abrirPortal')}
            </a>
          </div>
        </CanvasBox>

      </div>
    </ModuloLayout>
  )
}
