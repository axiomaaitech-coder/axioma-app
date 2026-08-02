'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { Pencil, Check, X, FileText, Bell, Share2, AlertTriangle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { gerarPdfTabela, textoResumoPdf, textoDetalhadoPdf, type ArgsPdfTabela } from '../../../../lib/gerarPdfTabela'
import { CentroCompartilhamento } from '../../../../components/CentroCompartilhamento'
import { meiT } from '../../../../lib/meiTextos'
import ReactECharts from 'echarts-for-react'
import { optLinhaMulti } from '../../../../lib/cfoCore'
import { buscarIndicadoresMacro, type IndicadoresMacro } from '../../../../lib/bcbApi'
import {
  faturamentoAnoMEI, dasMensalPorCategoria, carregarObrigacoesAno, salvarObrigacao,
  competenciasDASDoAno, calcularDividaDASAcumulada, projecaoBolaDeNeveDAS, faseRiscoDAS,
  maxParcelasDAS, DIAS_MULTA_TETO, DIAS_CNPJ_INAPTO, DIAS_DIVIDA_ATIVA,
  type StatusObrigacao, type ObrigacaoMEI, type FaseRiscoDAS,
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
  const [shareAberto, setShareAberto] = useState(false)
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const [indicadores, setIndicadores] = useState<IndicadoresMacro | null>(null)
  const [analiseIA, setAnaliseIA] = useState<string | null>(null)
  const [analisandoIA, setAnalisandoIA] = useState(false)
  const [numParcelas, setNumParcelas] = useState(1)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'MEI — DAS & Obrigações', en: 'MEI — DAS & Obligations', es: 'MEI — DAS & Obligaciones' },
    subtitulo: { pt: 'Central de Obrigações — calendário fiscal do MEI', en: 'Obligations Center — MEI tax calendar', es: 'Central de Obligaciones — calendario fiscal MEI' },
    calendario: { pt: 'Calendário de Obrigações Fiscais', en: 'Tax Obligations Calendar', es: 'Calendario de Obligaciones Fiscales' },
    dasnPrazo: { pt: 'Até 31 de maio de cada ano', en: 'By May 31st each year', es: 'Hasta el 31 de mayo de cada año' },
    dasnDesc: { pt: 'Declaração Anual de Faturamento', en: 'Annual Revenue Declaration', es: 'Declaración Anual de Facturación' },
    irpfPrazo: { pt: 'Até 30 de abril de cada ano', en: 'By April 30th each year', es: 'Hasta el 30 de abril de cada año' },
    calculadora: { pt: 'Calculadora DASN-SIMEI', en: 'DASN-SIMEI Calculator', es: 'Calculadora DASN-SIMEI' },
    receitaBruta: { pt: 'Receita Bruta', en: 'Gross Revenue', es: 'Ingresos Brutos' },
    categoria: { pt: 'Categoria', en: 'Category', es: 'Categoría' },
    abrirPortal: { pt: 'Abrir Portal DASN-SIMEI', en: 'Open DASN-SIMEI Portal', es: 'Abrir Portal DASN-SIMEI' },
    dasTodoDia: { pt: 'Todo dia {d} de cada mês', en: 'Every day {d} of each month', es: 'Cada día {d} de cada mes' },
    mapaConsequencias: { pt: 'Mapa de Consequências — DAS em Atraso', en: 'Consequences Map — Overdue DAS', es: 'Mapa de Consecuencias — DAS Atrasado' },
    dividaAtualizada: { pt: 'Dívida atualizada hoje', en: 'Debt updated today', es: 'Deuda actualizada hoy' },
    diasEmAtraso: { pt: 'dias em atraso (pior competência)', en: 'days overdue (worst competence)', es: 'días de atraso (peor competencia)' },
    fase_em_dia: { pt: 'Em dia', en: 'Up to date', es: 'Al día' },
    fase_atrasado: { pt: 'Atrasado', en: 'Overdue', es: 'Atrasado' },
    fase_multa_teto: { pt: 'Multa no teto (20%)', en: 'Fine at cap (20%)', es: 'Multa al tope (20%)' },
    fase_inapto: { pt: 'CNPJ Inapto', en: 'CNPJ Inactive', es: 'CNPJ Inapto' },
    fase_divida_ativa: { pt: 'Dívida Ativa da União', en: 'Federal Active Debt', es: 'Deuda Activa de la Unión' },
    marcoHoje: { pt: 'Hoje', en: 'Today', es: 'Hoy' },
    marcoVencimento: { pt: 'Vencimento', en: 'Due date', es: 'Vencimiento' },
    marco61: { pt: '61 dias — multa no teto', en: '61 days — fine at cap', es: '61 días — multa al tope' },
    marco12m: { pt: '12 meses — CNPJ Inapto', en: '12 months — CNPJ Inactive', es: '12 meses — CNPJ Inapto' },
    marco24m: { pt: '24 meses — Dívida Ativa', en: '24 months — Active Debt', es: '24 meses — Deuda Activa' },
    alertaINSS: { pt: 'DAS em atraso suspende sua contribuição — você perde tempo de aposentadoria e auxílio-doença neste período.', en: 'Overdue DAS suspends your contribution — you lose retirement and sick-leave credit time during this period.', es: 'El DAS atrasado suspende su contribución — usted pierde tiempo de jubilación y baja por enfermedad durante este período.' },
    bolaDeNeveTitulo: { pt: 'Se não pagar, sua dívida vira', en: 'If unpaid, your debt becomes', es: 'Si no paga, su deuda se convierte en' },
    simuladorTitulo: { pt: 'Simulador de Parcelamento (PGMEI)', en: 'Installment Simulator (PGMEI)', es: 'Simulador de Cuotas (PGMEI)' },
    numeroParcelas: { pt: 'Número de parcelas', en: 'Number of installments', es: 'Número de cuotas' },
    valorParcela: { pt: 'Valor de cada parcela', en: 'Value of each installment', es: 'Valor de cada cuota' },
    avisoParcela1: { pt: '⚠️ A 1ª parcela precisa ser paga pra ativar o acordo de parcelamento.', en: '⚠️ The 1st installment must be paid to activate the installment agreement.', es: '⚠️ La 1ª cuota debe pagarse para activar el acuerdo de cuotas.' },
    avisoParcela2: { pt: '⚠️ 3 parcelas atrasadas cancelam o acordo — a dívida volta inteira, com juros.', en: '⚠️ 3 missed installments cancel the agreement — the full debt returns, with interest.', es: '⚠️ 3 cuotas atrasadas cancelan el acuerdo — la deuda completa vuelve, con intereses.' },
    abrirPortalParcelamento: { pt: 'Abrir Portal do Simples Nacional (PGMEI)', en: 'Open Simples Nacional Portal (PGMEI)', es: 'Abrir Portal del Simples Nacional (PGMEI)' },
    historicoAno: { pt: 'Histórico do Ano', en: 'Year History', es: 'Historial del Año' },
    analisarIA: { pt: 'Analisar com IA', en: 'Analyze with AI', es: 'Analizar con IA' },
    analisando: { pt: 'Analisando...', en: 'Analyzing...', es: 'Analizando...' },
    analiseIATitulo: { pt: 'Análise Executiva — IA', en: 'Executive Analysis — AI', es: 'Análisis Ejecutivo — IA' },
    analiseIATransparencia: { pt: 'Análise gerada por IA (Claude) com base nos seus dados reais. Se a IA não responder, cai automaticamente para análise por regra.', en: 'Analysis generated by AI (Claude) based on your real data. If the AI fails to respond, it automatically falls back to rule-based analysis.', es: 'Análisis generado por IA (Claude) con base en sus datos reales. Si la IA no responde, cae automáticamente a análisis por regla.' },
    estimativaAviso: { pt: 'Estimativa pelas regras vigentes (multa 0,33%/dia até 20%, juros Selic). Não substitui o extrato oficial da Receita Federal.', en: 'Estimate under current rules (0.33%/day fine up to 20%, Selic interest). Does not replace the official Federal Revenue statement.', es: 'Estimación según las reglas vigentes (multa 0,33%/día hasta 20%, intereses Selic). No sustituye el extracto oficial de la Receita Federal.' },
    historicoVazio: { pt: 'Ainda não há competência de DAS vencida este ano.', en: 'No DAS competence has come due this year yet.', es: 'Aún no hay ninguna competencia de DAS vencida este año.' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const mx = meiT(lang)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const anoAtual = new Date().getFullYear()
    const [{ data: mei }, { data: rec }, obr, macro] = await Promise.all([
      supabase.from('mei_dados').select('*').maybeSingle(),
      supabase.from('receitas').select('*'),
      carregarObrigacoesAno(anoAtual),
      buscarIndicadoresMacro(),
    ])
    setMeiDados(mei)
    setReceitas(rec || [])
    setObrigacoes(obr)
    setIndicadores(macro)
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
  const diaVencimentoDas = meiDados?.dia_vencimento_das || 20
  const competenciaDas = `${anoAtual}-${pad(hoje.getMonth() + 1)}`
  const competenciaAnual = String(anoAtual)
  const vencimentoDas = new Date(anoAtual, hoje.getMonth(), diaVencimentoDas)
  const vencimentoDasn = new Date(anoAtual, 4, 31) // 31 de maio
  const vencimentoIrpf = new Date(anoAtual, 3, 30) // 30 de abril

  const obrigacaoDas = obrigacoes.find(o => o.tipo === 'DAS' && o.competencia === competenciaDas)
  const obrigacaoDasn = obrigacoes.find(o => o.tipo === 'DASN' && o.competencia === competenciaAnual)
  const obrigacaoIrpf = obrigacoes.find(o => o.tipo === 'IRPF' && o.competencia === competenciaAnual)

  const statusDas: StatusObrigacao = obrigacaoDas?.status || 'Pendente'
  const statusDasn: StatusObrigacao = obrigacaoDasn?.status || 'Pendente'
  const statusIrpf: StatusObrigacao = obrigacaoIrpf?.status || 'Não obrigatório'

  const dasValorNum = parseFloat(dasValor || String(dasMensalPorCategoria(meiDados?.categoria_mei))) || 0
  const selicAnual = indicadores?.selic ?? 10.75

  // ---- Mapa de Consequências: detecção de atraso sempre por DATA, nunca só por status manual ----
  const competenciasAno = competenciasDASDoAno(obrigacoes, anoAtual, diaVencimentoDas, meiDados?.data_abertura, hoje)
  const divida = calcularDividaDASAcumulada(competenciasAno, dasValorNum, selicAnual, hoje)
  const temAtrasoReal = divida.atrasos.length > 0
  const faseAtual: FaseRiscoDAS = faseRiscoDAS(divida.piorDiasAtraso)
  const bolaDeNeve = temAtrasoReal ? projecaoBolaDeNeveDAS(divida.atrasos, selicAnual) : []

  const corFase = (f: FaseRiscoDAS) =>
    f === 'em_dia' ? VERDE : f === 'atrasado' ? AMBAR : f === 'multa_teto' ? '#fb923c' : VERMELHO

  // ---- Simulador de Parcelamento (PGMEI) ----
  const maxParcelas = maxParcelasDAS(divida.totalAtualizado)
  const parcelasEscolhidas = Math.min(Math.max(1, numParcelas), Math.max(1, maxParcelas))
  const valorPorParcela = parcelasEscolhidas > 0 ? divida.totalAtualizado / parcelasEscolhidas : 0

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

  // ---- Análise Executiva por IA — mesmo padrão funcional do IA MEI Advisor
  // e do Faturamento MEI (já validados em produção com Claude real): mesmo
  // identificador de modelo confirmado funcionando nos dois, 'claude-sonnet-5',
  // passado explícito no fetch. Fallback por regra só como rede de segurança
  // pra falha real (rede, rate limit, resposta vazia).
  function montarContextoIADas(): string {
    const idiomaNome = lang === 'pt' ? 'português' : lang === 'en' ? 'inglês' : 'espanhol'
    const nomeFase = lang === 'pt' ? txt[`fase_${faseAtual}` as keyof typeof txt].pt
      : lang === 'en' ? txt[`fase_${faseAtual}` as keyof typeof txt].en : txt[`fase_${faseAtual}` as keyof typeof txt].es
    return `Você é o consultor financeiro e fiscal MEI da Axioma AI.Tech. Responda em ${idiomaNome}, direto e prático, em 1ª pessoa como consultor, em até 6 frases. Nunca invente número fora dos dados abaixo.

DADOS REAIS DESTE MEI:
- DAS mensal: ${fmt(dasValorNum)}, vencimento todo dia ${diaVencimentoDas}
- Status DAS deste mês: ${statusDas} · DASN-SIMEI: ${statusDasn} · IRPF: ${statusIrpf}
- Competências em atraso este ano: ${divida.atrasos.length} (${divida.atrasos.map(a => a.competencia).join(', ') || 'nenhuma'})
- Dívida de DAS atualizada hoje (multa + juros Selic real de ${selicAnual.toFixed(2)}% a.a.): ${fmt(divida.totalAtualizado)}
- Pior atraso: ${divida.piorDiasAtraso} dias — fase de risco: ${nomeFase}
- Faturamento acumulado ${anoAtual}: ${fmt(faturamentoAnual)}

Foque em: o que resolver primeiro, a urgência real (sem exagerar nem minimizar), e as consequências práticas (multa, CNPJ inapto, Dívida Ativa, perda de tempo de contribuição do INSS) se aplicável.`
  }

  function gerarAnaliseFallbackDas(): string {
    if (!temAtrasoReal) {
      if (lang === 'en') return `Everything is up to date. Your monthly DAS is ${fmt(dasValorNum)}, due on day ${diaVencimentoDas}. Keep an eye on DASN-SIMEI (by May 31) and IRPF (by April 30) if applicable.`
      if (lang === 'es') return `Todo está al día. Su DAS mensual es ${fmt(dasValorNum)}, vence el día ${diaVencimentoDas}. Esté atento a la DASN-SIMEI (hasta el 31 de mayo) y al IRPF (hasta el 30 de abril) si aplica.`
      return `Está tudo em dia. Seu DAS mensal é ${fmt(dasValorNum)}, vence dia ${diaVencimentoDas}. Fique de olho na DASN-SIMEI (até 31/05) e no IRPF (até 30/04) se for o caso.`
    }
    if (lang === 'en') return `You have ${divida.atrasos.length} overdue DAS competence(s), updated debt of ${fmt(divida.totalAtualizado)} (worst delay: ${divida.piorDiasAtraso} days). Priority: pay or negotiate installments now — the fine caps at 20% after ${DIAS_MULTA_TETO} days, but the risk grows to CNPJ inactivation after 12 months and Federal Active Debt after 24 months.`
    if (lang === 'es') return `Tiene ${divida.atrasos.length} competencia(s) de DAS atrasadas, deuda actualizada de ${fmt(divida.totalAtualizado)} (peor atraso: ${divida.piorDiasAtraso} días). Prioridad: pagar o negociar cuotas ahora — la multa se topa en 20% después de ${DIAS_MULTA_TETO} días, pero el riesgo crece hasta CNPJ inapto tras 12 meses y Deuda Activa tras 24 meses.`
    return `Você tem ${divida.atrasos.length} competência(s) de DAS em atraso, dívida atualizada de ${fmt(divida.totalAtualizado)} (pior atraso: ${divida.piorDiasAtraso} dias). Prioridade: pagar ou negociar parcelamento agora — a multa trava em 20% depois de ${DIAS_MULTA_TETO} dias, mas o risco cresce até CNPJ inapto com 12 meses e Dívida Ativa com 24 meses.`
  }

  async function analisarComIA() {
    setAnalisandoIA(true)
    let resposta = ''
    try {
      const res = await fetch('/api/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: lang === 'en' ? 'Analyze my MEI DAS and obligations situation based on the data below.' : lang === 'es' ? 'Analice mi situación de DAS y obligaciones MEI con base en los datos abajo.' : 'Analise minha situação de DAS e obrigações MEI com base nos dados abaixo.',
          historico: [],
          contexto: montarContextoIADas(),
          modelo: 'claude-sonnet-5',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.resposta) resposta = data.resposta
      }
    } catch {}
    if (!resposta) resposta = gerarAnaliseFallbackDas()
    setAnaliseIA(resposta)
    setAnalisandoIA(false)
  }

  function montarArgsPdfAtual(): ArgsPdfTabela {
    return {
      titulo: t('titulo'),
      subtitulo: `DAS/DASN/IRPF — ${anoAtual}`,
      colunas: [
        { header: 'Obrigação', key: 'nome', width: 2 },
        { header: 'Status', key: 'status', width: 2 },
      ],
      linhas: [
        { nome: 'DAS Mensal', status: statusDas },
        { nome: 'DASN-SIMEI', status: statusDasn },
        { nome: 'IRPF MEI', status: statusIrpf },
      ],
      resumo: [{ label: 'DAS Mensal', valor: fmt(parseFloat(dasValor || '0')) }],
      nomeArquivo: `axioma-mei-das-${new Date().toISOString().slice(0, 10)}.pdf`,
    }
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
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}
      botaoExtra={
        <button onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
          <Share2 size={16} /> {mx.compartilhar}
        </button>
      }>
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

        {/* Mapa de Consequências — só aparece com atraso real, detectado por data */}
        {temAtrasoReal && (
          <CanvasBox cor={corFase(faseAtual)}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} style={{ color: corFase(faseAtual) }} />
              <p className="text-sm font-semibold" style={{ color: '#c8d8f0', ...FONTE }}>{t('mapaConsequencias')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl p-3" style={{ background: `${corFase(faseAtual)}10`, border: `1px solid ${corFase(faseAtual)}30` }}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{t('dividaAtualizada')}</p>
                <p className="text-xl font-black" style={{ color: corFase(faseAtual), ...FONTE }}>{fmt(divida.totalAtualizado)}</p>
                <p className="text-[10px] mt-1" style={{ color: '#5a7a9a' }}>{divida.piorDiasAtraso} {t('diasEmAtraso')}</p>
              </div>
              <div className="rounded-xl p-3 flex flex-col justify-center" style={{ background: `${corFase(faseAtual)}10`, border: `1px solid ${corFase(faseAtual)}30` }}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{lang === 'pt' ? 'Fase de risco' : lang === 'en' ? 'Risk phase' : 'Fase de riesgo'}</p>
                <p className="text-lg font-black" style={{ color: corFase(faseAtual), ...FONTE }}>{t(`fase_${faseAtual}` as keyof typeof txt)}</p>
              </div>
            </div>

            {/* Linha do tempo horizontal — cores do gradiente alinhadas aos marcos reais (não uniformes) */}
            <div className="mb-5">
              {(() => {
                const pctMulta = (DIAS_MULTA_TETO / DIAS_DIVIDA_ATIVA) * 100
                const pctInapto = (DIAS_CNPJ_INAPTO / DIAS_DIVIDA_ATIVA) * 100
                const pctHoje = Math.min(97, (divida.piorDiasAtraso / DIAS_DIVIDA_ATIVA) * 100)
                return (
                  <div className="relative h-2 rounded-full mb-6"
                    style={{ background: `linear-gradient(90deg, #34d399 0%, #f59e0b ${pctMulta}%, #fb923c ${pctInapto}%, #f87171 100%)` }}>
                    <div className="absolute -top-1.5 flex flex-col items-center" style={{ left: `${pctHoje}%` }}>
                      <div className="w-5 h-5 rounded-full border-2" style={{ background: corFase(faseAtual), borderColor: '#020810' }} />
                      <span className="text-[9px] font-bold mt-1 whitespace-nowrap" style={{ color: corFase(faseAtual) }}>{t('marcoHoje')}</span>
                    </div>
                    <div className="absolute -top-1" style={{ left: `${pctMulta}%` }}><div className="w-0.5 h-4" style={{ background: 'rgba(2,8,16,0.4)' }} /></div>
                    <div className="absolute -top-1" style={{ left: `${pctInapto}%` }}><div className="w-0.5 h-4" style={{ background: 'rgba(2,8,16,0.4)' }} /></div>
                  </div>
                )
              })()}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]" style={{ color: '#5a7a9a' }}>
                <div><span className="font-bold" style={{ color: AMBAR }}>0d</span> — {t('marcoVencimento')}</div>
                <div><span className="font-bold" style={{ color: '#fb923c' }}>{DIAS_MULTA_TETO}d</span> — {t('marco61')}</div>
                <div><span className="font-bold" style={{ color: VERMELHO }}>12m</span> — {t('marco12m')}</div>
                <div><span className="font-bold" style={{ color: VERMELHO }}>24m</span> — {t('marco24m')}</div>
              </div>
            </div>

            {/* Bola de neve */}
            {bolaDeNeve.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold mb-3" style={{ color: '#c8d8f0' }}>{t('bolaDeNeveTitulo')}</p>
                <ReactECharts
                  option={optLinhaMulti(
                    [{ nome: t('dividaAtualizada'), dados: [divida.totalAtualizado, ...bolaDeNeve.map(b => b.valorTotal)], cor: VERMELHO, area: true }],
                    [t('marcoHoje'), ...bolaDeNeve.map(b => `+${b.dias}d`)],
                    VERMELHO
                  )}
                  style={{ height: 200, width: '100%' }}
                  notMerge lazyUpdate opts={{ renderer: 'canvas' }}
                />
              </div>
            )}

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: VERMELHO }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {t('alertaINSS')}
            </div>
            <p className="text-[9px] mt-2" style={{ color: '#5a7a9a' }}>{t('estimativaAviso')}</p>
          </CanvasBox>
        )}

        {/* Simulador de Parcelamento (PGMEI) */}
        {temAtrasoReal && (
          <CanvasBox cor={AZUL}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('simuladorTitulo')}</p>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#5a7a9a' }}>{t('numeroParcelas')} (1-{maxParcelas})</label>
                <input type="range" min={1} max={Math.max(1, maxParcelas)} value={parcelasEscolhidas}
                  onChange={e => setNumParcelas(parseInt(e.target.value, 10))} className="w-full" />
              </div>
              <div className="rounded-xl px-4 py-2 text-center" style={{ background: `${AZUL}10`, border: `1px solid ${AZUL}30` }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{parcelasEscolhidas}x — {t('valorParcela')}</p>
                <p className="text-lg font-black" style={{ color: AZUL, ...FONTE }}>{fmt(valorPorParcela)}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-[10px]" style={{ color: AMBAR }}>{t('avisoParcela1')}</p>
              <p className="text-[10px]" style={{ color: VERMELHO }}>{t('avisoParcela2')}</p>
            </div>
            <a href="https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: `linear-gradient(135deg, #1a3a8f, ${AZUL})`, color: '#fff' }}>
              <FileText size={16} />{t('abrirPortalParcelamento')}
            </a>
          </CanvasBox>
        )}

        {/* Análise Executiva por IA */}
        <CanvasBox cor={OURO}>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-sm font-semibold" style={{ color: '#c8d8f0', ...FONTE }}>{t('analiseIATitulo')}</p>
            <button onClick={analisarComIA} disabled={analisandoIA}
              className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
              {analisandoIA ? t('analisando') : t('analisarIA')}
            </button>
          </div>
          <p className="text-[10px] mb-3" style={{ color: '#5a7a9a' }}>{t('analiseIATransparencia')}</p>
          {analiseIA && (
            <div className="rounded-xl p-4 text-sm whitespace-pre-line" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(106,176,255,0.1)', color: '#c8d8f0' }}>
              {analiseIA}
            </div>
          )}
        </CanvasBox>

        {/* Central de Obrigações */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{mx.obrigacoes}</p>
          <div className="space-y-3">

            {/* DAS Mensal — valor editável + status */}
            <div className="flex items-center gap-4 p-4 rounded-xl flex-wrap" style={{ background: `${OURO}08`, border: `1px solid ${OURO}20` }}>
              <Bell size={18} style={{ color: OURO, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#c8d8f0' }}>DAS Mensal</p>
                <p className="text-xs" style={{ color: '#5a7a9a' }}>{txt.dasTodoDia[lang].replace('{d}', String(diaVencimentoDas))}</p>
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

        {/* Histórico do Ano — mesma lista que alimenta o cálculo da dívida, fonte única */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('historicoAno')} — {anoAtual}</p>
          {competenciasAno.length === 0 ? (
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('historicoVazio')}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {competenciasAno.map((c) => {
                const nomeMesCurto = new Date(c.dataVencimento).toLocaleDateString(
                  idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR', { month: 'short' }
                )
                return (
                  <div key={c.competencia} className="rounded-xl p-2.5 text-center"
                    style={{ background: `${corStatus(c.status)}10`, border: `1px solid ${corStatus(c.status)}30` }}>
                    <p className="text-xs font-bold capitalize" style={{ color: '#c8d8f0' }}>{nomeMesCurto}</p>
                    <p className="text-[9px] font-semibold mt-1" style={{ color: corStatus(c.status) }}>{c.status}</p>
                  </div>
                )
              })}
            </div>
          )}
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

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={lang}
        textoResumo={textoResumoPdf(montarArgsPdfAtual())}
        textoDetalhado={textoDetalhadoPdf(montarArgsPdfAtual())}
        assunto={`${t('titulo')} — Axioma`}
        onExportarPDF={() => gerarPdfTabela(montarArgsPdfAtual())}
        cor={OURO}
      />
    </ModuloLayout>
  )
}
