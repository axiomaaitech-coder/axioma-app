'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import { createBrowserClient } from '@supabase/ssr'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, X, TrendingUp, ShieldAlert, Share2, Clock } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import ReactECharts from 'echarts-for-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'
import { calcularImpostoRegime } from '../../../lib/iaTributariaHelpers'
import { optBarrasV, optRosca, optLinhaMulti } from '../../../lib/cfoCore'
import { buscarIndicadoresMacro } from '../../../lib/bcbApi'
import { gerarPdfTabela, textoResumoPdf, textoDetalhadoPdf, type ArgsPdfTabela } from '../../../lib/gerarPdfTabela'
import { tratarFalhaExportacao } from '../../../lib/erroUiHelpers'
import { CentroCompartilhamento } from '../../../components/CentroCompartilhamento'
import { LetreiroExecutivo } from '../../../components/LetreiroExecutivo'
import { meiT } from '../../../lib/meiTextos'
import {
  LIMITE_ANUAL_MEI, dasMensalPorCategoria, faturamentoAnoMEI, limiteRestante, percentualLimite, tetoProporcionalMEI,
  semaforoTeto, projecaoTeto, fluxoMesMEI, pareceGastoPessoal, scoreMEI, carregarObrigacoesAno,
  serieMensalMEI, montarCofre,
  detectarRetiradaPerigosa, detectarConsumoReserva, calcularPenalidadeDASAtraso, diasParaDAS,
  type StatusObrigacao, type ContaPagarMEI,
} from '../../../lib/meiHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Identidade do módulo: dourado champagne + azul-royal (mesmo tom de
// Investimentos/Contas a Receber) — nunca mais laranja/rosa.
const OURO = '#d4af37'
const ROYAL = '#2a5fd4'
// Cores funcionais (estado), fixas em todo o projeto:
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AZUL = '#6ab0ff'
const AMBAR = '#f59e0b'

export default function PainelMEI() {
  const { idioma } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [custosVariaveis, setCustosVariaveis] = useState<any[]>([])
  const [custosFixos, setCustosFixos] = useState<any[]>([])
  const [contasPagar, setContasPagar] = useState<ContaPagarMEI[]>([])
  const [statusDas, setStatusDas] = useState<StatusObrigacao>('Pendente')
  const [statusDasn, setStatusDasn] = useState<StatusObrigacao>('Pendente')
  const [statusIrpf, setStatusIrpf] = useState<StatusObrigacao>('Não obrigatório')
  const [selicAnual, setSelicAnual] = useState(10.75)
  const [modalConfig, setModalConfig] = useState(false)
  const [categoriaMei, setCategoriaMei] = useState('Serviços')
  const [dasValor, setDasValor] = useState(String(dasMensalPorCategoria('Serviços')))
  const [dataAbertura, setDataAbertura] = useState('')
  const [reservaEmergenciaPctForm, setReservaEmergenciaPctForm] = useState('')
  const [cnpjForm, setCnpjForm] = useState('')
  const [razaoSocialForm, setRazaoSocialForm] = useState('')
  const [cnaeForm, setCnaeForm] = useState('')
  const [proLaboreDesejadoForm, setProLaboreDesejadoForm] = useState('')
  const [diaVencimentoDasForm, setDiaVencimentoDasForm] = useState('20')
  const [perfilClienteForm, setPerfilClienteForm] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'erro' | 'ok' } | null>(null)
  function showToast(msg: string, tipo: 'erro' | 'ok' = 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }
  function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
    Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } })
  }

  const txt = {
    titulo: { pt: 'MEI — Painel', en: 'MEI — Dashboard', es: 'MEI — Panel' },
    subtitulo: { pt: 'Painel executivo para Microempreendedor Individual', en: 'Executive dashboard for Individual Microentrepreneur', es: 'Panel ejecutivo para Microempresario Individual' },
    configurar: { pt: 'Configurar MEI', en: 'Configure MEI', es: 'Configurar MEI' },
    salvar: { pt: 'Salvar', en: 'Save', es: 'Guardar' },
    cancelar: { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar' },
    faturamento: { pt: 'Faturamento', en: 'Revenue', es: 'Facturación' },
    limiteRestante: { pt: 'Limite Restante', en: 'Remaining Limit', es: 'Límite Restante' },
    dasMensal: { pt: 'DAS Mensal', en: 'Monthly DAS', es: 'DAS Mensual' },
    categoriaMei: { pt: 'Categoria MEI', en: 'MEI Category', es: 'Categoría MEI' },
    valorDas: { pt: 'Valor DAS Mensal (R$)', en: 'Monthly DAS Value (R$)', es: 'Valor DAS Mensual (R$)' },
    dataAbertura: { pt: 'Data de Abertura do MEI', en: 'MEI Opening Date', es: 'Fecha de Apertura del MEI' },
    perfilCliente: { pt: 'Seus clientes são principalmente', en: 'Your clients are mostly', es: 'Sus clientes son principalmente' },
    perfilB2B: { pt: 'Empresas (B2B)', en: 'Companies (B2B)', es: 'Empresas (B2B)' },
    perfilB2C: { pt: 'Pessoas físicas (B2C)', en: 'Individuals (B2C)', es: 'Personas físicas (B2C)' },
    perfilAmbos: { pt: 'Ambos', en: 'Both', es: 'Ambos' },
    resumoAnual: { pt: 'Resumo Anual MEI', en: 'MEI Annual Summary', es: 'Resumen Anual MEI' },
    totalReceitas: { pt: 'Total de receitas lançadas', en: 'Total registered revenues', es: 'Total de ingresos registrados' },
    mediaMensal: { pt: 'Média mensal (6m)', en: 'Monthly average (6m)', es: 'Promedio mensual (6m)' },
    projecaoAnual: { pt: 'Projeção anual', en: 'Annual projection', es: 'Proyección anual' },
    reservaEmergencia: { pt: 'Reserva de Emergência (%)', en: 'Emergency Reserve (%)', es: 'Reserva de Emergencia (%)' },
    razaoSocial: { pt: 'Nome / Razão Social', en: 'Name / Legal Name', es: 'Nombre / Razón Social' },
    cnpj: { pt: 'CNPJ', en: 'CNPJ (Tax ID)', es: 'CNPJ' },
    cnae: { pt: 'Atividade Principal (CNAE)', en: 'Main Activity (CNAE)', es: 'Actividad Principal (CNAE)' },
    proLaboreDesejado: { pt: 'Pró-labore Desejado (R$)', en: 'Desired Pro-labore (R$)', es: 'Pro-labore Deseado (R$)' },
    diaVencimentoDas: { pt: 'Dia de Vencimento do DAS', en: 'DAS Due Day', es: 'Día de Vencimiento del DAS' },
    compartilhar: { pt: 'Compartilhar', en: 'Share', es: 'Compartir' },
    toastBaixado: { pt: 'PDF pronto — baixado.', en: 'PDF ready — downloaded.', es: 'PDF listo — descargado.' },
    erroSalvarConfig: { pt: 'Não foi possível salvar a configuração. Tente novamente.', en: 'Could not save the configuration. Try again.', es: 'No se pudo guardar la configuración. Intente de nuevo.' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const mx = meiT(lang)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    const inicioMes = new Date(anoAtual, hoje.getMonth(), 1).toISOString().slice(0, 10)
    const fimMes = new Date(anoAtual, hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
    const competenciaDas = `${anoAtual}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    const empresaId = await obterEmpresaAtiva()
    const [{ data: mei }, { data: rec }, { data: cv }, { data: cf }, { data: cp }, obrigacoes, macro] = await Promise.all([
      empresaId ? supabase.from('mei_dados').select('*').eq('empresa_id', empresaId).maybeSingle() : Promise.resolve({ data: null }),
      empresaId ? supabase.from('receitas').select('*').eq('empresa_id', empresaId).order('data', { ascending: false }) : Promise.resolve({ data: [] }),
      empresaId ? supabase.from('custos_variaveis').select('valor, data, descricao').eq('empresa_id', empresaId).order('data', { ascending: false }) : Promise.resolve({ data: [] }),
      empresaId ? supabase.from('custos_fixos').select('valor_mensal, descricao').eq('empresa_id', empresaId) : Promise.resolve({ data: [] }),
      empresaId ? supabase.from('contas_pagar').select('valor_total, valor_pago').eq('empresa_id', empresaId).neq('status', 'pago').gte('data_vencimento', inicioMes).lte('data_vencimento', fimMes) : Promise.resolve({ data: [] }),
      empresaId ? carregarObrigacoesAno(empresaId, anoAtual) : Promise.resolve([]),
      buscarIndicadoresMacro(),
    ])
    setMeiDados(mei || null)
    setReceitas(rec || [])
    setCustosVariaveis(cv || [])
    setCustosFixos(cf || [])
    setContasPagar((cp || []) as ContaPagarMEI[])
    setSelicAnual(macro.selic)
    const das = obrigacoes.find(o => o.tipo === 'DAS' && o.competencia === competenciaDas)
    const dasn = obrigacoes.find(o => o.tipo === 'DASN' && o.competencia === String(anoAtual))
    const irpf = obrigacoes.find(o => o.tipo === 'IRPF' && o.competencia === String(anoAtual))
    if (das) setStatusDas(das.status)
    if (dasn) setStatusDasn(dasn.status)
    if (irpf) setStatusIrpf(irpf.status)
    if (mei) {
      setCategoriaMei(mei.categoria_mei || 'Serviços')
      setDasValor(String(mei.das_valor || dasMensalPorCategoria(mei.categoria_mei)))
      setDataAbertura(mei.data_abertura || '')
      setReservaEmergenciaPctForm(mei.reserva_emergencia_pct != null ? String(mei.reserva_emergencia_pct) : '')
      setCnpjForm(mei.cnpj || '')
      setRazaoSocialForm(mei.razao_social || '')
      setCnaeForm(mei.cnae || '')
      setProLaboreDesejadoForm(mei.pro_labore_desejado != null ? String(mei.pro_labore_desejado) : '')
      setDiaVencimentoDasForm(mei.dia_vencimento_das != null ? String(mei.dia_vencimento_das) : '20')
      setPerfilClienteForm(mei.perfil_cliente || '')
    }
    setLoading(false)
  }

  async function salvarConfig() {
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSalvando(false); return }
    const empresaId = await obterEmpresaAtiva()
    const { data, error } = await supabase.from('mei_dados').upsert({
      user_id: user.id,
      empresa_id: empresaId,
      categoria_mei: categoriaMei,
      das_valor: parseFloat(dasValor),
      data_abertura: dataAbertura || null,
      reserva_emergencia_pct: reservaEmergenciaPctForm ? parseFloat(reservaEmergenciaPctForm) : null,
      cnpj: cnpjForm || null,
      razao_social: razaoSocialForm || null,
      cnae: cnaeForm || null,
      pro_labore_desejado: proLaboreDesejadoForm ? parseFloat(proLaboreDesejadoForm) : null,
      dia_vencimento_das: diaVencimentoDasForm ? parseInt(diaVencimentoDasForm, 10) : 20,
      perfil_cliente: perfilClienteForm || null,
      limite_anual: LIMITE_ANUAL_MEI,
      regime_tributario: 'mei',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'empresa_id' }).select('id')
    setSalvando(false)
    if (error || !data || data.length === 0) {
      const motivo = error?.message || '0 linhas afetadas (RLS?)'
      reportarFalhaEscrita('mei_dados', 'upsert', motivo)
      showToast(t('erroSalvarConfig'), 'erro')
      return
    }
    setModalConfig(false)
    carregar()
  }

  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth()
  const tetoInfo = tetoProporcionalMEI(meiDados?.data_abertura, anoAtual)
  const teto = tetoInfo.teto
  const faturamentoAnual = faturamentoAnoMEI(receitas, anoAtual)
  const percentualLimiteAtual = percentualLimite(faturamentoAnual, teto)
  const restanteLimite = limiteRestante(faturamentoAnual, teto)
  const semaforo = semaforoTeto(percentualLimiteAtual)
  const corSemaforo = semaforo === 'vermelho' ? VERMELHO : semaforo === 'amarelo' ? AMBAR : VERDE
  const { mediaMensal, mesesParaEstourar, projecaoAnual } = projecaoTeto(receitas, anoAtual, mesAtual, 6)
  const emRisco = percentualLimiteAtual >= 90 || (mesesParaEstourar !== null && mesesParaEstourar <= 6)

  // ---- Fluxo traduzido (custos entram pela 1ª vez no MEI) ----
  const receitasMes = receitas.filter(r => { const d = new Date(r.data); return d.getFullYear() === anoAtual && d.getMonth() === mesAtual })
  const custosVarMes = custosVariaveis.filter(c => { if (!c.data) return false; const d = new Date(c.data); return d.getFullYear() === anoAtual && d.getMonth() === mesAtual })
  const fluxo = fluxoMesMEI(receitasMes, custosVarMes, custosFixos)

  // ---- Detector pessoal x empresa ----
  const gastosPessoais = [...custosVarMes.map(c => ({ ...c, origem: 'variavel' })), ...custosFixos.map(c => ({ ...c, origem: 'fixo' }))]
    .filter(c => pareceGastoPessoal(c.descricao || ''))

  // ---- Score de saúde ----
  const mesAnteriorData = new Date(anoAtual, mesAtual - 1, 1)
  const receitaMesAnterior = receitas.filter(r => { const d = new Date(r.data); return d.getFullYear() === mesAnteriorData.getFullYear() && d.getMonth() === mesAnteriorData.getMonth() }).reduce((s, r) => s + (r.valor || 0), 0)
  const receitaMesAtual = receitasMes.reduce((s, r) => s + (r.valor || 0), 0)
  const crescimentoMoM = receitaMesAnterior > 0 ? ((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 100 : 0
  const score = scoreMEI({
    percentualTeto: percentualLimiteAtual,
    statusDasn, statusIrpf,
    fluxoMensal: fluxo.sobra,
    receitaMensal: receitaMesAtual,
    crescimentoMoM,
  })

  // ---- Consequência do estouro (reaproveita o motor de regimes da IA Tributária) ----
  const impostoAtualMensal = dasMensalPorCategoria(categoriaMei)
  const impostoMEMensal = faturamentoAnual > 0 ? calcularImpostoRegime('simples', faturamentoAnual, faturamentoAnual / 12) : 0

  // ---- Cofre Inteligente (Fase 2) — "o que é seu de verdade" ----
  // Gancho de IA: a explicação de cada fatia é texto fixo por regra hoje;
  // quando ANTHROPIC_API_KEY entrar, trocar por chamada a app/api/ia-chat
  // (mesma rota do IA MEI Advisor) sem mudar os números calculados abaixo.
  const cofre = montarCofre({
    sobraMes: fluxo.sobra,
    receitaMensalMedia: mediaMensal,
    faturamentoAnual,
    categoriaMei,
    dasValor: parseFloat(dasValor || String(impostoAtualMensal)),
    contasPagarAbertas: contasPagar,
    reservaEmergenciaPct: meiDados?.reserva_emergencia_pct ?? null,
  })

  // ---- Detector de retirada perigosa (Fase 2) ----
  const gastosPessoaisMesValor = gastosPessoais.reduce((s, g) => s + (g.valor ?? g.valor_mensal ?? 0), 0)
  const retirada = detectarRetiradaPerigosa({ proLaboreSeguro: cofre.proLaboreSeguro, gastosPessoaisMes: gastosPessoaisMesValor })

  // ---- Guardião da Reserva (Fase 2) ----
  const diaVencimentoDas = meiDados?.dia_vencimento_das || 20
  const guardiao = detectarConsumoReserva({ reservaNecessaria: cofre.das + cofre.irpfReserva, sobraMes: fluxo.sobra })
  const diasAteVencimentoDas = diasParaDAS(new Date(), diaVencimentoDas)
  const vencimentoDasEsteMes = new Date(anoAtual, mesAtual, diaVencimentoDas)
  const diasAtrasoDasReal = statusDas === 'Entregue' ? 0 : Math.max(0, Math.floor((new Date().getTime() - vencimentoDasEsteMes.getTime()) / 86400000))
  const penalidadeAtual = calcularPenalidadeDASAtraso(cofre.das, diasAtrasoDasReal, selicAnual)
  const penalidadeTeto = calcularPenalidadeDASAtraso(cofre.das, 61, selicAnual) // 61 dias = multa satura em 20% (teto legal)

  // ---- Gráficos analíticos (Fase 2) — reaproveita ReactECharts + cfoCore, mesmo padrão de DRE/Investimentos ----
  const evolucaoMensal = serieMensalMEI(receitas, custosVariaveis, custosFixos, anoAtual, mesAtual, mesAtual + 1)
  const fluxoSerie6m = serieMensalMEI(receitas, custosVariaveis, custosFixos, anoAtual, mesAtual, 6)
  const temHistoricoSuficiente = evolucaoMensal.length >= 2
  const mediaEvolucao = temHistoricoSuficiente
    ? evolucaoMensal.slice(0, -1).reduce((s, p) => s + p.entrou, 0) / Math.max(1, evolucaoMensal.length - 1)
    : 0
  const mesAtualPonto = evolucaoMensal[evolucaoMensal.length - 1]
  const variacaoVsMedia = temHistoricoSuficiente && mediaEvolucao > 0 && mesAtualPonto
    ? ((mesAtualPonto.entrou - mediaEvolucao) / mediaEvolucao) * 100
    : 0

  const ticketMedio = receitasMes.length > 0 ? receitaMesAtual / receitasMes.length : 0
  const nRecebimentosMes = receitasMes.length
  const maiorReceitaMes = receitasMes.length > 0 ? Math.max(...receitasMes.map(r => r.valor || 0)) : 0

  const acumuladoTeto: number[] = []
  { let acc = 0; for (const p of evolucaoMensal) { acc += p.entrou; acumuladoTeto.push(acc) } }

  const marquee = [
    'AXIOMA',
    `${t('faturamento')} ${anoAtual}: ${fmt(faturamentoAnual)}`,
    `${t('limiteRestante')}: ${fmt(restanteLimite)} (${percentualLimiteAtual.toFixed(1)}%)`,
    `${mx.cofreProLabore}: ${fmt(cofre.proLaboreSeguro)}`,
    !loading ? `Score ${score.score}/1000 (${score.nivel})` : '',
  ].filter(Boolean)

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
      pdf.text('AXIOMA AI.TECH — MEI Painel', 14, 13)
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
      pdf.save(`axioma-mei-painel-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { showToast(tratarFalhaExportacao('mei.exportarPDF', err, lang), 'erro') }
    setExportando(false)
  }

  function montarArgsPdfAtual(): ArgsPdfTabela {
    return {
      titulo: t('titulo'),
      subtitulo: `${anoAtual} — Score ${score.score}/1000 (${score.nivel})`,
      colunas: [
        { header: 'Item', key: 'label', width: 3 },
        { header: 'Valor', key: 'valor', width: 2, align: 'right' },
      ],
      linhas: [
        { label: t('faturamento'), valor: fmt(faturamentoAnual) },
        { label: mx.cofreDas, valor: fmt(cofre.das) },
        { label: mx.cofreIrpf, valor: fmt(cofre.irpfReserva) },
        { label: mx.cofreCompromissos, valor: fmt(cofre.compromissos) },
        { label: mx.cofreReserva, valor: fmt(cofre.reservaEmergencia) },
        { label: mx.cofreProLabore, valor: fmt(cofre.proLaboreSeguro) },
      ],
      nomeArquivo: `axioma-mei-painel-${new Date().toISOString().slice(0, 10)}.pdf`,
    }
  }

  return (
    <ModuloLayout
      titulo={t('titulo')}
      subtitulo={t('subtitulo')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => setModalConfig(true)}
      labelBotao={t('configurar')}
      botaoExtra={
        <button onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, ${ROYAL}, ${OURO})`, color: '#fff' }}>
          <Share2 size={16} /> {t('compartilhar')}
        </button>
      }
    >
      <div ref={conteudoRef} className="space-y-4">

        <LetreiroExecutivo itens={marquee} cor={ROYAL} />

        {/* Cards principais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `${t('faturamento')} ${anoAtual}`, value: fmt(faturamentoAnual), cor: OURO },
            { label: t('limiteRestante'), value: fmt(restanteLimite), cor: VERDE },
            { label: t('dasMensal'), value: fmt(parseFloat(dasValor || String(impostoAtualMensal))), cor: AZUL },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-xl md:text-2xl font-black" style={{ color: card.cor, fontFamily: "'Georgia','Times New Roman',serif" }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Cofre Inteligente — coração da Fase 2: "o que é seu de verdade" */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{mx.cofreTitulo}</p>
          <p className="text-[10px] mb-4" style={{ color: '#5a7a9a' }}>{mx.cofreExplicacao}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {[
                { label: mx.cofreDas, valor: cofre.das, cor: VERMELHO },
                { label: mx.cofreIrpf, valor: cofre.irpfReserva, cor: AMBAR },
                { label: mx.cofreCompromissos, valor: cofre.compromissos, cor: AZUL },
                { label: `${mx.cofreReserva} (${cofre.reservaEmergenciaPctUsado.toFixed(0)}%)`, valor: cofre.reservaEmergencia, cor: '#a78bfa' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}20` }}>
                  <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: item.cor }}>{fmt(item.valor)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center px-3 py-3 rounded-lg mt-3" style={{ background: `${cofre.proLaboreSeguro >= 0 ? VERDE : VERMELHO}15`, border: `1px solid ${cofre.proLaboreSeguro >= 0 ? VERDE : VERMELHO}40` }}>
                <span className="text-sm font-bold" style={{ color: '#c8d8f0' }}>{mx.cofreProLabore}</span>
                <span className="text-lg font-black" style={{ color: cofre.proLaboreSeguro >= 0 ? VERDE : VERMELHO, fontFamily: "'Georgia','Times New Roman',serif" }}>{fmt(cofre.proLaboreSeguro)}</span>
              </div>
              {meiDados?.pro_labore_desejado != null && (
                <p className="text-[11px] px-1" style={{ color: '#5a7a9a' }}>
                  {mx.proLaboreComparativo
                    .replace('{desejado}', fmt(meiDados.pro_labore_desejado))
                    .replace('{seguro}', fmt(cofre.proLaboreSeguro))}
                </p>
              )}
              {cofre.avisos.map((aviso, i) => (
                <p key={i} className="text-[10px] mt-1" style={{ color: '#5a7a9a' }}>⚠️ {aviso}</p>
              ))}
            </div>
            <div style={{ height: 220 }}>
              <p className="text-[10px] uppercase tracking-wider mb-1 text-center" style={{ color: '#5a7a9a' }}>{mx.composicaoCofre}</p>
              <ReactECharts style={{ height: 200 }} option={optRosca(
                [
                  { name: mx.cofreDas, value: Math.max(0, cofre.das), color: VERMELHO },
                  { name: mx.cofreIrpf, value: Math.max(0, cofre.irpfReserva), color: AMBAR },
                  { name: mx.cofreCompromissos, value: Math.max(0, cofre.compromissos), color: AZUL },
                  { name: mx.cofreReserva, value: Math.max(0, cofre.reservaEmergencia), color: '#a78bfa' },
                  { name: mx.cofreProLabore, value: Math.max(0, cofre.proLaboreSeguro), color: VERDE },
                ],
                OURO, mx.cofreTitulo
              )} notMerge />
            </div>
          </div>
        </CanvasBox>

        {/* Detector de retirada perigosa */}
        {retirada.perigosa && (
          <CanvasBox cor={VERMELHO}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} style={{ color: VERMELHO, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: VERMELHO }}>{mx.retiradaTitulo}</p>
                <p className="text-xs" style={{ color: '#c8d8f0' }}>
                  {retirada.motivo === 'seguro_negativo' ? mx.retiradaAvisoSeguroNegativo : mx.retiradaAvisoGastoAlto}
                </p>
              </div>
            </div>
          </CanvasBox>
        )}

        {/* Guardião da Reserva */}
        {guardiao.consumida && (
          <CanvasBox cor={AMBAR}>
            <div className="flex items-start gap-2 mb-3">
              <Clock size={16} style={{ color: AMBAR, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: AMBAR }}>{mx.guardiaoTitulo}</p>
                <p className="text-xs" style={{ color: '#c8d8f0' }}>
                  {mx.guardiaoConsumiu.replace('X', guardiao.valorConsumido.toFixed(0))} — {diasAteVencimentoDas} {mx.guardiaoDiasRestantes}.
                </p>
                <p className="text-[10px] mt-1" style={{ color: '#5a7a9a' }}>{mx.guardiaoBaseadoEm}</p>
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: `${VERMELHO}08`, border: `1px solid ${VERMELHO}20` }}>
              <p className="text-xs" style={{ color: '#c8d8f0' }}>
                {mx.guardiaoConsequencia} {diasAtrasoDasReal > 0
                  ? <><strong style={{ color: VERMELHO }}>{fmt(penalidadeAtual.multa)}</strong> {lang === 'pt' ? 'de multa' : lang === 'en' ? 'in fines' : 'de multa'} + <strong style={{ color: VERMELHO }}>{fmt(penalidadeAtual.juros)}</strong> {lang === 'pt' ? 'de juros até hoje' : lang === 'en' ? 'in interest so far' : 'de intereses hasta hoy'}.</>
                  : <>{lang === 'pt' ? 'até' : lang === 'en' ? 'up to' : 'hasta'} <strong style={{ color: VERMELHO }}>{fmt(penalidadeTeto.multa)}</strong> {lang === 'pt' ? 'de multa (teto legal) + juros pela Selic' : lang === 'en' ? 'in fines (legal cap) + Selic interest' : 'de multa (tope legal) + intereses Selic'} ({selicAnual.toFixed(2)}% a.a.).</>}
              </p>
              <p className="text-[10px] mt-2" style={{ color: '#5a7a9a' }}>{mx.guardiaoEstimativa}</p>
            </div>
          </CanvasBox>
        )}

        {/* 2a — Radar do Teto */}
        <CanvasBox cor={corSemaforo}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{mx.radarTeto} — {anoAtual}</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${corSemaforo}20`, color: corSemaforo, border: `1px solid ${corSemaforo}40` }}>
              {semaforo === 'vermelho' ? mx.semaforoVermelho : semaforo === 'amarelo' ? mx.semaforoAmarelo : mx.semaforoVerde}
            </span>
          </div>
          <div className="w-full h-4 rounded-full mb-2" style={{ background: 'rgba(106,176,255,0.1)' }}>
            <div className="h-4 rounded-full transition-all" style={{ width: `${percentualLimiteAtual}%`, background: corSemaforo }} />
          </div>
          <div className="flex justify-between text-xs mb-4" style={{ color: '#5a7a9a' }}>
            <span>{fmt(faturamentoAnual)}</span>
            <span className="font-bold" style={{ color: corSemaforo }}>{percentualLimiteAtual.toFixed(1)}%</span>
            <span>{fmt(teto)}</span>
          </div>

          {mesesParaEstourar !== null && (
            <p className="text-xs mb-3" style={{ color: '#5a7a9a' }}>
              {mx.projecaoEstoura} <strong style={{ color: corSemaforo }}>{mesesParaEstourar} {mx.projecaoMeses}</strong> ({t('mediaMensal')}: {fmt(mediaMensal)})
            </p>
          )}

          {emRisco && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: `${VERMELHO}10`, border: `1px solid ${VERMELHO}30` }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} style={{ color: VERMELHO, flexShrink: 0, marginTop: 2 }} />
                <p className="text-xs" style={{ color: '#c8d8f0' }}>
                  {mx.consequenciaEstouro} {impostoMEMensal > 0 && (
                    <>({fmt(impostoAtualMensal)} → ~{fmt(impostoMEMensal)}/mês)</>
                  )}
                </p>
              </div>
              <ul className="text-xs space-y-1 pl-6" style={{ color: '#5a7a9a', listStyle: 'disc' }}>
                <li>{mx.sugestaoSegurar}</li>
                <li>{mx.sugestaoMigrar}</li>
              </ul>
            </div>
          )}
        </CanvasBox>

        {/* Progresso do Teto no Tempo */}
        {temHistoricoSuficiente ? (
          <CanvasBox cor={corSemaforo}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{mx.progressoTeto}</p>
            <ReactECharts style={{ height: 220 }} notMerge option={optLinhaMulti(
              [
                { nome: t('faturamento'), dados: acumuladoTeto, cor: corSemaforo, area: true },
                { nome: 'Limite MEI', dados: evolucaoMensal.map(() => teto), cor: VERMELHO, tipo: 'dashed' },
              ],
              evolucaoMensal.map(p => p.mes), corSemaforo
            )} />
          </CanvasBox>
        ) : (
          <CanvasBox cor={corSemaforo}>
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{mx.semHistoricoSuficiente}</p>
          </CanvasBox>
        )}

        {/* Evolução de Ganhos + Métricas-chave */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{mx.evolucaoGanhos}</p>
          {temHistoricoSuficiente && mediaEvolucao > 0 && (
            <p className="text-xs mb-3" style={{ color: variacaoVsMedia >= 0 ? VERDE : VERMELHO }}>
              {new Date().toLocaleDateString('pt-BR', { month: 'long' })} {Math.abs(variacaoVsMedia).toFixed(0)}% {variacaoVsMedia >= 0 ? mx.acimaMedia : mx.abaixoMedia}
            </p>
          )}
          {temHistoricoSuficiente ? (
            <ReactECharts style={{ height: 220 }} notMerge option={optBarrasV(
              evolucaoMensal.map(p => p.entrou),
              evolucaoMensal.map(p => p.mes),
              OURO, '#f0d878',
              evolucaoMensal.map((_, i) => (i === evolucaoMensal.length - 1 ? ROYAL : null))
            )} />
          ) : (
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{mx.semHistoricoSuficiente}</p>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: mx.ticketMedio, valor: fmt(ticketMedio) },
              { label: mx.nRecebimentos, valor: String(nRecebimentosMes) },
              { label: mx.maiorReceita, valor: fmt(maiorReceitaMes) },
            ].map((m, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(106,176,255,0.15)' }}>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{m.label}</p>
                <p className="text-sm font-bold mt-1" style={{ color: AZUL }}>{m.valor}</p>
              </div>
            ))}
          </div>
        </CanvasBox>

        {/* 2c — Fluxo traduzido */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{mx.fluxoTitulo}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-3" style={{ background: `${VERDE}10`, border: `1px solid ${VERDE}25` }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{mx.entrou}</p>
              <p className="text-lg font-black" style={{ color: VERDE }}>{fmt(fluxo.entrou)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: `${VERMELHO}10`, border: `1px solid ${VERMELHO}25` }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{mx.saiu}</p>
              <p className="text-lg font-black" style={{ color: VERMELHO }}>{fmt(fluxo.saiu)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: `${fluxo.sobra >= 0 ? AZUL : VERMELHO}10`, border: `1px solid ${fluxo.sobra >= 0 ? AZUL : VERMELHO}25` }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{mx.sobra}</p>
              <p className="text-lg font-black" style={{ color: fluxo.sobra >= 0 ? AZUL : VERMELHO }}>{fmt(fluxo.sobra)}</p>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: AMBAR }}>⏰ {mx.atencaoDas}</p>
        </CanvasBox>

        {/* Fluxo de Caixa Visual */}
        {temHistoricoSuficiente ? (
          <CanvasBox cor={AZUL}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{mx.fluxoCaixaVisual}</p>
            <ReactECharts style={{ height: 220 }} notMerge option={optLinhaMulti(
              [
                { nome: mx.entrou, dados: fluxoSerie6m.map(p => p.entrou), cor: VERDE, area: true },
                { nome: mx.saiu, dados: fluxoSerie6m.map(p => p.saiu), cor: VERMELHO },
                { nome: mx.sobra, dados: fluxoSerie6m.map(p => p.sobra), cor: AZUL },
              ],
              fluxoSerie6m.map(p => p.mes), AZUL
            )} />
          </CanvasBox>
        ) : null}

        {/* 2d — Score de Saúde */}
        <CanvasBox cor={score.cor}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-center md:text-left flex-shrink-0">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#5a7a9a' }}>{mx.scoreSaude}</p>
              <div className="flex items-baseline gap-2 justify-center md:justify-start">
                <span className="text-4xl font-black" style={{ color: score.cor, fontFamily: "'Georgia','Times New Roman',serif" }}>{score.score}</span>
                <span className="text-lg" style={{ color: '#5a7a9a' }}>/ 1000</span>
              </div>
              <p className="text-sm font-bold" style={{ color: score.cor }}>{score.nivel}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
              {[
                { label: mx.subFinanceiro, valor: score.subScores.financeiro, desc: mx.subFinanceiroDesc },
                { label: mx.subFiscal, valor: score.subScores.fiscal, desc: mx.subFiscalDesc },
                { label: mx.subTeto, valor: score.subScores.teto, desc: mx.subTetoDesc },
                { label: mx.subFluxo, valor: score.subScores.fluxo, desc: mx.subFluxoDesc },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(106,176,255,0.15)' }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{s.label}</p>
                  <p className="text-base font-bold" style={{ color: AZUL }}>{s.valor}</p>
                  <p className="text-[9px] mt-1" style={{ color: '#5a7a9a' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </CanvasBox>

        {/* 2b — Detector Pessoal x Empresa */}
        <CanvasBox cor={AMBAR}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={16} style={{ color: AMBAR }} />
            <p className="text-sm font-semibold" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{mx.detectorTitulo}</p>
          </div>
          {gastosPessoais.length === 0 ? (
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{mx.detectorVazio}</p>
          ) : (
            <div className="space-y-2 mb-3">
              {gastosPessoais.slice(0, 6).map((g, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: `${AMBAR}08`, border: `1px solid ${AMBAR}20` }}>
                  <span className="text-xs" style={{ color: '#c8d8f0' }}>{g.descricao}</span>
                  <span className="text-xs font-bold" style={{ color: AMBAR }}>{fmt(g.valor ?? g.valor_mensal ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px]" style={{ color: '#5a7a9a' }}>{mx.detectorAviso}</p>
        </CanvasBox>

        {/* Resumo anual */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{t('resumoAnual')} — {anoAtual}</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${OURO} transparent transparent transparent` }} />
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { label: t('totalReceitas'), value: fmt(faturamentoAnual) },
                { label: t('mediaMensal'), value: fmt(mediaMensal) },
                { label: t('projecaoAnual'), value: fmt(projecaoAnual), destaque: projecaoAnual > teto },
                { label: t('categoriaMei'), value: meiDados?.categoria_mei || 'Serviços' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2.5 rounded-xl" style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(106,176,255,0.1)' }}>
                  <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: item.destaque ? VERMELHO : OURO }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </CanvasBox>

        {/* Acesso rápido aos módulos */}
        <CanvasBox cor={ROYAL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>
            {lang === 'pt' ? 'Acesso Rápido' : lang === 'en' ? 'Quick Access' : 'Acceso Rápido'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: lang === 'pt' ? 'Faturamento' : lang === 'en' ? 'Revenue' : 'Facturación', path: '/mei/faturamento' },
              { label: 'DAS & Obrigações', path: '/mei/das' },
              { label: lang === 'pt' ? 'Reforma Tributária' : lang === 'en' ? 'Tax Reform' : 'Reforma Tributaria', path: '/mei/reforma' },
              { label: lang === 'pt' ? 'Precificação' : lang === 'en' ? 'Pricing' : 'Precios', path: '/mei/precificacao' },
              { label: 'IA MEI Advisor', path: '/mei/ia-advisor' },
              { label: lang === 'pt' ? 'Imposto de Renda' : lang === 'en' ? 'Income Tax' : 'Impuesto Renta', path: '/mei/imposto-renda' },
            ].map((item, i) => (
              <a key={i} href={item.path}
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(42,95,212,0.08)', border: `1px solid ${ROYAL}30`, textDecoration: 'none' }}>
                <TrendingUp size={14} style={{ color: ROYAL }} />
                <span className="text-xs font-semibold" style={{ color: '#c8d8f0' }}>{item.label}</span>
              </a>
            ))}
          </div>
        </CanvasBox>

      </div>

      {/* Modal Configurar MEI */}
      <AnimatePresence>
        {modalConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-8 px-4 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="w-full max-w-md">
              <CanvasBox cor={OURO}>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{t('configurar')}</h3>
                  <button onClick={() => setModalConfig(false)} style={{ color: '#5a7a9a' }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                      {t('categoriaMei')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { pt: 'Serviços', en: 'Services', es: 'Servicios' },
                        { pt: 'Comércio', en: 'Commerce', es: 'Comercio' },
                        { pt: 'Indústria', en: 'Industry', es: 'Industria' },
                        { pt: 'Transporte', en: 'Transport', es: 'Transporte' },
                      ].map(cat => (
                        <button key={cat.pt}
                          onClick={() => { setCategoriaMei(cat.pt); setDasValor(String(dasMensalPorCategoria(cat.pt))) }}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{
                            background: categoriaMei === cat.pt ? `${OURO}20` : 'rgba(106,176,255,0.05)',
                            color: categoriaMei === cat.pt ? OURO : '#5a7a9a',
                            border: `1px solid ${categoriaMei === cat.pt ? OURO + '40' : 'rgba(106,176,255,0.1)'}`,
                          }}>
                          {cat[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                      {t('valorDas')}
                    </label>
                    <input type="number" value={dasValor} onChange={e => setDasValor(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                      {t('dataAbertura')}
                    </label>
                    <input type="date" value={dataAbertura} onChange={e => setDataAbertura(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                      {t('reservaEmergencia')}
                    </label>
                    <input type="number" value={reservaEmergenciaPctForm} onChange={e => setReservaEmergenciaPctForm(e.target.value)}
                      placeholder="10" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                      {t('razaoSocial')}
                    </label>
                    <input type="text" value={razaoSocialForm} onChange={e => setRazaoSocialForm(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                        {t('cnpj')}
                      </label>
                      <input type="text" value={cnpjForm} onChange={e => setCnpjForm(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                        {t('cnae')}
                      </label>
                      <input type="text" value={cnaeForm} onChange={e => setCnaeForm(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                        {t('proLaboreDesejado')}
                      </label>
                      <input type="number" value={proLaboreDesejadoForm} onChange={e => setProLaboreDesejadoForm(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                        {t('diaVencimentoDas')}
                      </label>
                      <input type="number" min={1} max={31} value={diaVencimentoDasForm} onChange={e => setDiaVencimentoDasForm(e.target.value)}
                        placeholder="20" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>
                      {t('perfilCliente')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { valor: 'b2b', label: t('perfilB2B') },
                        { valor: 'b2c', label: t('perfilB2C') },
                        { valor: 'ambos', label: t('perfilAmbos') },
                      ].map(op => (
                        <button key={op.valor} onClick={() => setPerfilClienteForm(op.valor)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{
                            background: perfilClienteForm === op.valor ? `${OURO}20` : 'rgba(106,176,255,0.05)',
                            color: perfilClienteForm === op.valor ? OURO : '#5a7a9a',
                            border: `1px solid ${perfilClienteForm === op.valor ? OURO + '40' : 'rgba(106,176,255,0.1)'}`,
                          }}>
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setModalConfig(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(106,176,255,0.1)', color: '#5a7a9a' }}>
                      {t('cancelar')}
                    </button>
                    <button onClick={salvarConfig} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, ${ROYAL}, ${OURO})`, color: '#fff' }}>
                      {salvando ? '...' : t('salvar')}
                    </button>
                  </div>
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
        onExportarPDF={() => gerarPdfTabela(montarArgsPdfAtual(), (msg) => showToast(msg, 'erro'), lang)}
        cor={OURO}
      />

      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{ background: toast.tipo === 'erro' ? 'rgba(248,113,113,0.95)' : 'rgba(52,211,153,0.95)', color: '#020810', fontWeight: 600, fontSize: 13 }}>
          {toast.msg}
        </div>
      )}
    </ModuloLayout>
  )
}
