'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion, AnimatePresence } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { AlertTriangle, Pencil, Trash2, X, Share2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { gerarPdfTabela, textoResumoPdf, textoDetalhadoPdf, type ArgsPdfTabela } from '../../../../lib/gerarPdfTabela'
import { CentroCompartilhamento } from '../../../../components/CentroCompartilhamento'
import { meiT } from '../../../../lib/meiTextos'
import ReactECharts from 'echarts-for-react'
import { optLinhaMulti } from '../../../../lib/cfoCore'
import {
  faturamentoAnoMEI, limiteRestante, percentualLimite,
  dasMensalPorCategoria, percentualIsentoPorCategoria, calcularIRPF, percentualReservaImposto, valorASepararPorReceita,
  tetoProporcionalMEI, percentualDeTeto, semaforoTetoDetalhado, projecaoTetoDetalhada, receitasBrutasPorMes,
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
const CATEGORIAS = ["Vendas de produtos", "Prestação de serviços", "Recorrentes", "Eventuais", "Outras"]

type Receita = { id: string; descricao: string; valor: number; data: string; categoria: string; status: string; considera_teto_mei?: boolean | null }

export default function FaturamentoMEI() {
  const { idioma } = useLanguage()
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [meiDados, setMeiDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)
  const [editando, setEditando] = useState<Receita | null>(null)
  const [excluindo, setExcluindo] = useState<Receita | null>(null)
  const [form, setForm] = useState({ descricao: '', valor: '', data: '', categoria: CATEGORIAS[0], status: 'recebido' })
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [analiseIA, setAnaliseIA] = useState<string | null>(null)
  const [analisandoIA, setAnalisandoIA] = useState(false)
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
    compartilhar: { pt: 'Compartilhar', en: 'Share', es: 'Compartir' },
    toastBaixado: { pt: 'PDF pronto — baixado.', en: 'PDF ready — downloaded.', es: 'PDF listo — descargado.' },
    tetoCheioTexto: { pt: 'teto cheio — ano completo de atividade', en: 'full cap — full year of activity', es: 'límite completo — año completo de actividad' },
    seuTetoEm: { pt: 'Seu teto em', en: 'Your cap in', es: 'Su límite en' },
    margemMesTitulo: { pt: 'Quanto ainda pode faturar por mês até dezembro', en: 'How much you can still invoice per month until December', es: 'Cuánto aún puede facturar por mes hasta diciembre' },
    mesEstouroTitulo: { pt: 'Mês provável de estouro', en: 'Likely month to exceed the cap', es: 'Mes probable de superar el límite' },
    mesEstouroNenhum: { pt: 'No ritmo atual, não estoura este ano.', en: 'At the current pace, you will not exceed it this year.', es: 'Al ritmo actual, no lo superará este año.' },
    faixaLaranja: { pt: 'Acima do teto, mas ainda dá até dezembro (DAS complementar).', en: 'Above the cap, but still manageable until December (supplementary DAS).', es: 'Por encima del límite, pero aún manejable hasta diciembre (DAS complementario).' },
    faixaVermelha: { pt: 'Risco de desenquadramento retroativo — mais de 120% do teto.', en: 'Risk of retroactive reclassification — over 120% of the cap.', es: 'Riesgo de reclasificación retroactiva — más del 120% del límite.' },
    vsMedia: { pt: 'vs. sua média', en: 'vs. your average', es: 'vs. su promedio' },
    vsAnterior: { pt: 'vs. mês anterior', en: 'vs. previous month', es: 'vs. mes anterior' },
    analisarIA: { pt: 'Analisar', en: 'Analyze', es: 'Analizar' },
    analisando: { pt: 'Analisando...', en: 'Analyzing...', es: 'Analizando...' },
    analiseIATitulo: { pt: 'Análise Executiva Axioma', en: 'Axioma Executive Analysis', es: 'Análisis Ejecutivo Axioma' },
    analiseIATransparencia: { pt: 'Análise gerada pela inteligência do Axioma com base no seu faturamento real. Se não for possível gerar agora, cai automaticamente para uma análise por regra.', en: 'Analysis generated by Axioma intelligence based on your real revenue. If it cannot be generated right now, it automatically falls back to a rule-based analysis.', es: 'Análisis generado por la inteligencia de Axioma con base en su facturación real. Si no se puede generar ahora, cae automáticamente a un análisis por regla.' },
    relatorioBrutas: { pt: 'Relatório Mensal de Receitas Brutas', en: 'Monthly Gross Revenue Report', es: 'Informe Mensual de Ingresos Brutos' },
    graficoTitulo: { pt: 'Faturamento vs. Teto e Média', en: 'Revenue vs. Cap and Average', es: 'Facturación vs. Límite y Promedio' },
    serieFaturamento: { pt: 'Faturamento real', en: 'Real revenue', es: 'Facturación real' },
    serieTeto: { pt: 'Teto mensal recomendado', en: 'Recommended monthly cap', es: 'Límite mensual recomendado' },
    serieMedia: { pt: 'Sua média', en: 'Your average', es: 'Su promedio' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const mx = meiT(lang)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [{ data }, { data: mei }] = await Promise.all([
      supabase.from('receitas').select('*').order('data', { ascending: false }),
      supabase.from('mei_dados').select('*').maybeSingle(),
    ])
    setReceitas((data || []) as Receita[])
    setMeiDados(mei || null)
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

  const tetoInfo = tetoProporcionalMEI(meiDados?.data_abertura, anoAtual)
  const teto = tetoInfo.teto
  const faturamentoAnual = faturamentoAnoMEI(receitas, anoAtual)
  const percentualLimiteAtual = percentualLimite(faturamentoAnual, teto) // capped em 100, só pra largura da barra
  const percentualReal = percentualDeTeto(faturamentoAnual, teto) // sem teto, pra distinguir 100-120% de >120%
  const restanteLimite = limiteRestante(faturamentoAnual, teto)
  const semaforo4 = semaforoTetoDetalhado(percentualReal)
  const proj = projecaoTetoDetalhada(receitas, anoAtual, mesAtual, teto, 6)
  const { mediaMensal, mesIndexEstouro, margemRecomendadaMes, projecaoAnual } = proj
  const receitasAno = receitas.filter(r => new Date(r.data).getFullYear() === anoAtual)

  const formatarNomeMes = (idx: number) => new Date(anoAtual, idx, 1).toLocaleDateString(
    idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR', { month: 'long' }
  )
  const nomeMesEstouro = mesIndexEstouro !== null ? formatarNomeMes(mesIndexEstouro) : null
  const dataAberturaObj = meiDados?.data_abertura ? new Date(String(meiDados.data_abertura).slice(0, 10) + 'T00:00:00') : null
  const nomeMesAbertura = dataAberturaObj ? `${formatarNomeMes(dataAberturaObj.getMonth())}/${dataAberturaObj.getFullYear()}` : ''

  const valorMesAtual = faturamentoAnoMEI(receitasAno.filter(r => new Date(r.data).getMonth() === mesAtual), anoAtual)
  const valorMesAnterior = mesAtual > 0 ? faturamentoAnoMEI(receitasAno.filter(r => new Date(r.data).getMonth() === mesAtual - 1), anoAtual) : 0
  const deltaVsMedia = mediaMensal > 0 ? ((valorMesAtual - mediaMensal) / mediaMensal) * 100 : 0
  const deltaVsAnterior = valorMesAnterior > 0 ? ((valorMesAtual - valorMesAnterior) / valorMesAnterior) * 100 : 0

  const corSemaforo4 = semaforo4 === 'vermelho' ? VERMELHO : semaforo4 === 'laranja' ? '#fb923c' : semaforo4 === 'amarelo' ? AMBAR : VERDE

  // ---- Séries do gráfico (mesmo critério de "conta pro teto MEI" usado no resto da tela) ----
  const receitasBrutasMensais = receitasBrutasPorMes(receitas, anoAtual)
  const serieFaturamentoMensal: number[] = receitasBrutasMensais.map(m => m.total)
  const tetoMensalRecomendado = tetoInfo.mesesAtivos > 0 ? teto / tetoInfo.mesesAtivos : 0
  const mesInicioAtivo = tetoInfo.proporcional && dataAberturaObj ? dataAberturaObj.getMonth() : 0
  const serieTetoMensal: (number | null)[] = Array.from({ length: 12 }, (_, i) => (i >= mesInicioAtivo ? tetoMensalRecomendado : null))
  const serieMediaMensal: (number | null)[] = Array.from({ length: 12 }, () => (mediaMensal > 0 ? mediaMensal : null))

  // ---- Reserva automática de imposto (Fase 2): quanto separar por lançamento ----
  const categoriaMei = meiDados?.categoria_mei || 'Serviços'
  const dasMensal = meiDados?.das_valor || dasMensalPorCategoria(categoriaMei)
  const irpfMensal = calcularIRPF(mediaMensal * (1 - percentualIsentoPorCategoria(categoriaMei))).imposto
  const percentualReserva = percentualReservaImposto(dasMensal, mediaMensal, irpfMensal)
  const reservaAcumulada = valorASepararPorReceita(faturamentoAnual, percentualReserva)

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

  // ---- Análise Executiva por IA — mesmo padrão funcional do IA MEI Advisor
  // (já validado em produção com Claude real): fetch('/api/ia-chat') com
  // modelo 'claude-sonnet-5' explícito. Fallback por regra só como rede de
  // segurança pra falha real (rede, rate limit, resposta vazia) — não é o
  // caminho esperado, já que a chave está ativa.
  function montarContextoIAFaturamento(): string {
    const idiomaNome = lang === 'pt' ? 'português' : lang === 'en' ? 'inglês' : 'espanhol'
    const mesesTexto = receitasBrutasMensais
      .map((m, i) => `${formatarNomeMes(i)}: ${fmt(m.total)}`)
      .filter((_, i) => receitasBrutasMensais[i].total > 0 || i <= mesAtual)
      .join(', ')
    return `Você é o consultor financeiro MEI da Axioma AI.Tech. Responda em ${idiomaNome}, direto e prático, em 1ª pessoa como consultor, em até 6 frases. Nunca invente número fora dos dados abaixo.

DADOS REAIS DO FATURAMENTO ${anoAtual}:
- Categoria MEI: ${categoriaMei}
- Faturamento por mês: ${mesesTexto}
- Teto do ano: ${fmt(teto)}${tetoInfo.proporcional ? ` (proporcional, MEI aberto em ${nomeMesAbertura})` : ' (ano completo)'}
- Faturamento acumulado: ${fmt(faturamentoAnual)} (${percentualReal.toFixed(1)}% do teto)
- Média móvel dos últimos meses: ${fmt(mediaMensal)}/mês
- Projeção pro fim do ano no ritmo atual: ${fmt(projecaoAnual)}
- ${nomeMesEstouro ? `Mês provável de estourar o teto: ${nomeMesEstouro}` : 'No ritmo atual, não estoura o teto este ano'}
- Margem recomendada por mês até dezembro pra não estourar: ${fmt(Math.max(0, margemRecomendadaMes))}

Foque em: ritmo de faturamento, risco real de estourar o teto, sazonalidade percebida entre os meses, e uma recomendação prática do que fazer agora.`
  }

  function gerarAnaliseFallback(): string {
    const risco = semaforo4 === 'vermelho' ? (lang === 'pt' ? 'crítico' : lang === 'en' ? 'critical' : 'crítico')
      : semaforo4 === 'laranja' ? (lang === 'pt' ? 'de atenção' : lang === 'en' ? 'concerning' : 'de atención')
      : (lang === 'pt' ? 'sob controle' : lang === 'en' ? 'under control' : 'bajo control')
    if (lang === 'en') {
      return `Your revenue is at ${percentualReal.toFixed(1)}% of your ${fmt(teto)} cap — risk is ${risco}. Monthly average: ${fmt(mediaMensal)}. ${nomeMesEstouro ? `At this pace you would exceed the cap around ${nomeMesEstouro}.` : 'At this pace you should not exceed the cap this year.'} Recommended safe monthly ceiling from now on: ${fmt(Math.max(0, margemRecomendadaMes))}.`
    }
    if (lang === 'es') {
      return `Su facturación está en ${percentualReal.toFixed(1)}% de su límite de ${fmt(teto)} — riesgo ${risco}. Promedio mensual: ${fmt(mediaMensal)}. ${nomeMesEstouro ? `A este ritmo superaría el límite alrededor de ${nomeMesEstouro}.` : 'A este ritmo no debería superar el límite este año.'} Techo mensual seguro recomendado de ahora en adelante: ${fmt(Math.max(0, margemRecomendadaMes))}.`
    }
    return `Seu faturamento está em ${percentualReal.toFixed(1)}% do seu teto de ${fmt(teto)} — risco ${risco}. Média mensal: ${fmt(mediaMensal)}. ${nomeMesEstouro ? `No ritmo atual, você estouraria o teto perto de ${nomeMesEstouro}.` : 'No ritmo atual, você não deve estourar o teto este ano.'} Teto mensal seguro recomendado daqui pra frente: ${fmt(Math.max(0, margemRecomendadaMes))}.`
  }

  async function analisarComIA() {
    setAnalisandoIA(true)
    let resposta = ''
    try {
      const res = await fetch('/api/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: lang === 'en' ? 'Analyze my MEI revenue this year based on the data below.' : lang === 'es' ? 'Analice mi facturación MEI de este año con base en los datos abajo.' : 'Analise meu faturamento MEI deste ano com base nos dados abaixo.',
          historico: [],
          contexto: montarContextoIAFaturamento(),
          modelo: 'claude-sonnet-5',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.resposta) resposta = data.resposta
      }
    } catch {}
    if (!resposta) resposta = gerarAnaliseFallback()
    setAnaliseIA(resposta)
    setAnalisandoIA(false)
  }

  // ---- Relatório Mensal de Receitas Brutas (obrigação oficial do MEI) ----
  function montarArgsRelatorioReceitasBrutas(): ArgsPdfTabela {
    return {
      titulo: t('relatorioBrutas'),
      subtitulo: `${anoAtual}`,
      colunas: [
        { header: lang === 'pt' ? 'Mês' : lang === 'en' ? 'Month' : 'Mes', key: 'mes', width: 3 },
        { header: t('valor'), key: 'valor', width: 2, align: 'right' },
      ],
      linhas: receitasBrutasMensais
        .filter(m => m.total > 0)
        .map(m => ({ mes: formatarNomeMes(m.mesNum), valor: fmt(m.total) })),
      resumo: [{ label: t('faturamento'), valor: fmt(faturamentoAnual) }],
      nomeArquivo: `axioma-mei-receitas-brutas-${anoAtual}.pdf`,
    }
  }

  function montarArgsPdfAtual(): ArgsPdfTabela {
    return {
      titulo: t('titulo'),
      subtitulo: `${anoAtual}`,
      colunas: [
        { header: t('descricao'), key: 'descricao', width: 3 },
        { header: t('data'), key: 'data', width: 2 },
        { header: t('valor'), key: 'valor', width: 2, align: 'right' },
      ],
      linhas: receitasAno.map((r) => ({
        descricao: r.descricao,
        data: new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        valor: fmt(r.valor),
      })),
      resumo: [{ label: t('faturamento'), valor: fmt(faturamentoAnual) }],
      nomeArquivo: `axioma-mei-faturamento-${new Date().toISOString().slice(0, 10)}.pdf`,
    }
  }

  return (
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}
      botaoExtra={
        <button onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
          <Share2 size={16} /> {t('compartilhar')}
        </button>
      }>
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
            { label: t('limiteUsado'), value: `${percentualReal.toFixed(1)}%`, cor: semaforo4 === 'vermelho' ? VERMELHO : semaforo4 === 'laranja' ? '#fb923c' : semaforo4 === 'amarelo' ? AMBAR : VERDE },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-xl md:text-2xl font-black" style={{ color: card.cor, ...FONTE }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        <p className="text-xs px-1" style={{ color: '#5a7a9a' }}>
          {t('seuTetoEm')} {anoAtual}: <strong style={{ color: OURO }}>{fmt(teto)}</strong> — {tetoInfo.proporcional
            ? (lang === 'pt' ? `proporcional a ${tetoInfo.mesesAtivos} meses de atividade (abriu em ${nomeMesAbertura})`
              : lang === 'en' ? `proportional to ${tetoInfo.mesesAtivos} months of activity (opened ${nomeMesAbertura})`
              : `proporcional a ${tetoInfo.mesesAtivos} meses de actividad (abrió en ${nomeMesAbertura})`)
            : t('tetoCheioTexto')}
        </p>
        <p className="text-xs px-1" style={{ color: '#5a7a9a' }}>{mx.considerandoTodasReceitas}</p>

        {/* Reserva automática de imposto (Fase 2) */}
        {percentualReserva > 0 && (
          <CanvasBox cor={AMBAR}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{mx.reservaAcumuladaTitulo}</p>
            <p className="text-xl font-black" style={{ color: AMBAR, ...FONTE }}>{fmt(reservaAcumulada)}</p>
            <p className="text-[10px] mt-1" style={{ color: '#5a7a9a' }}>
              {mx.reservarDeste} {percentualReserva.toFixed(1)}% {lang === 'pt' ? 'de cada receita nova (DAS + IRPF proporcional).' : lang === 'en' ? 'of every new revenue (DAS + proportional IRPF).' : 'de cada nuevo ingreso (DAS + IRPF proporcional).'}
            </p>
          </CanvasBox>
        )}

        {/* Velocímetro */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0', ...FONTE }}>{t('velocimetro')} {anoAtual}</p>
          <div className="w-full h-4 rounded-full mb-2" style={{ background: 'rgba(106,176,255,0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentualLimiteAtual}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-4 rounded-full"
              style={{ background: corSemaforo4 }}
            />
          </div>
          <div className="flex justify-between text-xs mb-4" style={{ color: '#5a7a9a' }}>
            <span>{fmt(faturamentoAnual)}</span>
            <span className="font-bold" style={{ color: corSemaforo4 }}>{percentualReal.toFixed(1)}%</span>
            <span>{fmt(teto)}</span>
          </div>

          {semaforo4 === 'laranja' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-2"
              style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', color: '#fb923c' }}>
              <AlertTriangle size={16} /> {t('faixaLaranja')}
            </div>
          )}
          {semaforo4 === 'vermelho' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-2"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: VERMELHO }}>
              <AlertTriangle size={16} /> {t('faixaVermelha')}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="rounded-xl p-3" style={{ background: 'rgba(106,176,255,0.06)', border: '1px solid rgba(106,176,255,0.12)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{t('margemMesTitulo')}</p>
              <p className="text-lg font-black" style={{ color: VERDE, ...FONTE }}>{fmt(Math.max(0, margemRecomendadaMes))}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(106,176,255,0.06)', border: '1px solid rgba(106,176,255,0.12)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{t('mesEstouroTitulo')}</p>
              <p className="text-lg font-black capitalize" style={{ color: nomeMesEstouro ? VERMELHO : VERDE, ...FONTE }}>
                {nomeMesEstouro || t('mesEstouroNenhum')}
              </p>
            </div>
          </div>
        </CanvasBox>

        {/* Gráfico + comparação */}
        <CanvasBox cor={AZUL}>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-sm font-semibold" style={{ color: '#c8d8f0', ...FONTE }}>{t('graficoTitulo')}</p>
            {mediaMensal > 0 && (
              <div className="flex gap-3 text-xs">
                <span style={{ color: deltaVsMedia >= 0 ? VERDE : VERMELHO }}>
                  {deltaVsMedia >= 0 ? '▲' : '▼'} {Math.abs(deltaVsMedia).toFixed(0)}% {t('vsMedia')}
                </span>
                {valorMesAnterior > 0 && (
                  <span style={{ color: deltaVsAnterior >= 0 ? VERDE : VERMELHO }}>
                    {deltaVsAnterior >= 0 ? '▲' : '▼'} {Math.abs(deltaVsAnterior).toFixed(0)}% {t('vsAnterior')}
                  </span>
                )}
              </div>
            )}
          </div>
          <ReactECharts
            option={optLinhaMulti(
              [
                { nome: t('serieFaturamento'), dados: serieFaturamentoMensal, cor: OURO, area: true },
                { nome: t('serieTeto'), dados: serieTetoMensal, cor: VERMELHO, tipo: 'dashed' },
                { nome: t('serieMedia'), dados: serieMediaMensal, cor: AZUL, tipo: 'dotted' },
              ],
              Array.from({ length: 12 }, (_, i) => formatarNomeMes(i)),
              OURO
            )}
            style={{ height: 280, width: '100%' }}
            notMerge lazyUpdate opts={{ renderer: 'canvas' }}
          />
        </CanvasBox>

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
                const perc = tetoMensalRecomendado > 0 ? (valor / tetoMensalRecomendado) * 100 : 0
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
          <div className="mt-4 pt-4 flex flex-wrap items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(106,176,255,0.15)' }}>
            <span className="text-sm font-semibold" style={{ color: '#c8d8f0' }}>{t('total')} {anoAtual}</span>
            <span className="text-sm font-black" style={{ color: OURO }}>{fmt(faturamentoAnual)}</span>
          </div>
          <button onClick={() => gerarPdfTabela(montarArgsRelatorioReceitasBrutas())}
            className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', color: '#dc2626' }}>
            {t('relatorioBrutas')}
          </button>
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
                      {percentualReserva > 0 && (
                        <p className="text-[10px] mt-0.5" style={{ color: AMBAR }}>
                          {mx.reservarDeste}: {fmt(valorASepararPorReceita(r.valor, percentualReserva))}
                        </p>
                      )}
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
