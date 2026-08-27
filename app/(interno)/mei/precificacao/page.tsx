'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import * as Sentry from '@sentry/nextjs'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Share2, AlertTriangle, CheckCircle2, Pencil, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { precoPorDivisor, optRosca, ticketMedio } from '../../../../lib/cfoCore'
import {
  dasMensalPorCategoria, tetoProporcionalMEI, horasMensaisCalculadas,
  custoProprioRateado, fracaoDASSobrePreco, fracaoIRPFExposicao, detectarTrabalhoDeGraca,
} from '../../../../lib/meiHelpers'
import { gerarPdfTabela, textoResumoPdf, textoDetalhadoPdf, type ArgsPdfTabela } from '../../../../lib/gerarPdfTabela'
import { CentroCompartilhamento } from '../../../../components/CentroCompartilhamento'
import { LetreiroExecutivo } from '../../../../components/LetreiroExecutivo'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { meiT } from '../../../../lib/meiTextos'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const OURO = '#d4af37'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AZUL = '#6ab0ff'
const FONTE = { fontFamily: "'Georgia','Times New Roman',serif" }

type Modo = 'hora' | 'projeto' | 'produto'

export default function PrecificacaoMEI() {
  const { idioma } = useLanguage()
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const mx = meiT(lang)

  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitasRows, setReceitasRows] = useState<{ valor: number; data: string }[]>([])
  const [modoTocado, setModoTocado] = useState(false)

  const [modo, setModo] = useState<Modo>('hora')
  const [custoFixoMensal, setCustoFixoMensal] = useState('')
  const [custoVariavelMensal, setCustoVariavelMensal] = useState('')
  const [margemDesejada, setMargemDesejada] = useState('30')
  const [horasPorDia, setHorasPorDia] = useState('8')
  const [diasPorSemana, setDiasPorSemana] = useState('5')
  const [pctProdutivo, setPctProdutivo] = useState('100')
  const [horasTrabalhadasMes, setHorasTrabalhadasMes] = useState('')
  const [horasTocado, setHorasTocado] = useState(false)
  const [horasEstimadasProjeto, setHorasEstimadasProjeto] = useState('')
  const [materiaisProjeto, setMateriaisProjeto] = useState('0')
  const [custoUnitarioProduto, setCustoUnitarioProduto] = useState('')
  const [unidadesVendidasMes, setUnidadesVendidasMes] = useState('')
  const [precoCobradoHoje, setPrecoCobradoHoje] = useState('')
  const [urgenciaPct, setUrgenciaPct] = useState('0')

  const [analiseIA, setAnaliseIA] = useState<string | null>(null)
  const [analisandoIA, setAnalisandoIA] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const [precosSalvos, setPrecosSalvos] = useState<{ id: string; nome: string; modo: Modo; dados: any; updated_at: string }[]>([])
  const [nomePrecoSalvo, setNomePrecoSalvo] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvandoPreco, setSalvandoPreco] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(0)
  const ITENS_POR_PAGINA = 10
  const [toast, setToast] = useState<{ msg: string; tipo: 'erro' | 'ok' } | null>(null)
  function showToast(msg: string, tipo: 'erro' | 'ok' = 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }
  function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
    Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } })
  }

  const txt = {
    titulo: { pt: 'MEI — Precificação', en: 'MEI — Pricing', es: 'MEI — Precios' },
    subtitulo: { pt: 'Descubra o preço mínimo real e pare de trabalhar de graça', en: 'Find your real minimum price and stop working for free', es: 'Descubra el precio mínimo real y deje de trabajar gratis' },
    categoria: { pt: 'Categoria MEI', en: 'MEI Category', es: 'Categoría MEI' },
    dasMensalLbl: { pt: 'DAS Mensal', en: 'Monthly DAS', es: 'DAS Mensual' },
    receitaMediaLbl: { pt: 'Receita Mensal Média Real', en: 'Real Average Monthly Revenue', es: 'Ingreso Mensual Promedio Real' },
    modoTitulo: { pt: 'Como você cobra?', en: 'How do you charge?', es: '¿Cómo cobra?' },
    modoHora: { pt: 'Por Hora', en: 'By Hour', es: 'Por Hora' },
    modoProjeto: { pt: 'Por Projeto/Serviço', en: 'By Project/Service', es: 'Por Proyecto/Servicio' },
    modoProduto: { pt: 'Por Produto', en: 'By Product', es: 'Por Producto' },
    porHora: { pt: 'hora', en: 'hour', es: 'hora' },
    porProjeto: { pt: 'projeto', en: 'project', es: 'proyecto' },
    porProduto: { pt: 'produto', en: 'product', es: 'producto' },
    custosReaisTitulo: { pt: 'Seus Custos Reais', en: 'Your Real Costs', es: 'Sus Costos Reales' },
    custosReaisPuxados: { pt: 'Puxamos dos seus lançamentos — ajuste se quiser.', en: 'Pulled from your entries — adjust if you want.', es: 'Extraído de sus registros — ajuste si quiere.' },
    custosReaisVazio: { pt: 'Sem lançamentos suficientes — preencha manualmente.', en: 'Not enough entries yet — fill in manually.', es: 'Sin registros suficientes — complete manualmente.' },
    custoFixoLbl: { pt: 'Custo Fixo Mensal (R$)', en: 'Monthly Fixed Cost (R$)', es: 'Costo Fijo Mensual (R$)' },
    custoVariavelLbl: { pt: 'Custo Variável Mensal (R$)', en: 'Monthly Variable Cost (R$)', es: 'Costo Variable Mensual (R$)' },
    horasTrabalhadasLbl: { pt: 'Horas usadas no cálculo (por mês)', en: 'Hours used in the calculation (per month)', es: 'Horas usadas en el cálculo (por mes)' },
    horasPorDiaLbl: { pt: 'Horas por dia', en: 'Hours per day', es: 'Horas por día' },
    diasPorSemanaLbl: { pt: 'Dias por semana', en: 'Days per week', es: 'Días por semana' },
    pctProdutivoLbl: { pt: '% de horas produtivas (opcional) — desconta reunião/deslocamento', en: '% productive hours (optional) — discounts meetings/commute', es: '% de horas productivas (opcional) — descuenta reunión/traslado' },
    horasCalculadasTexto: { pt: 'Você trabalha ~{v} h/mês', en: 'You work ~{v} h/month', es: 'Usted trabaja ~{v} h/mes' },
    horasOverrideNota: { pt: 'Pré-preenchido pelo cálculo acima — pode sobrescrever com um número exato.', en: 'Pre-filled by the calculation above — you can override with an exact number.', es: 'Prellenado por el cálculo de arriba — puede sobrescribir con un número exacto.' },
    horasEstimadasLbl: { pt: 'Horas estimadas para este projeto', en: 'Estimated hours for this project', es: 'Horas estimadas para este proyecto' },
    materiaisLbl: { pt: 'Materiais/insumos deste projeto (R$)', en: 'Materials/supplies for this project (R$)', es: 'Materiales/insumos de este proyecto (R$)' },
    custoUnitarioLbl: { pt: 'Custo do produto (R$/unidade)', en: 'Product cost (R$/unit)', es: 'Costo del producto (R$/unidad)' },
    unidadesVendidasLbl: { pt: 'Unidades vendidas por mês', en: 'Units sold per month', es: 'Unidades vendidas por mes' },
    margemLbl: { pt: 'Margem de lucro desejada (%)', en: 'Desired profit margin (%)', es: 'Margen de ganancia deseado (%)' },
    custoProprioNota: { pt: 'Inclui seu próprio pró-labore desejado ({v}/mês, configurado em Configurar MEI) rateado pelas horas/unidades — o erro nº 1 é esquecer o valor do seu tempo.', en: 'Includes your own desired pro-labore ({v}/month, set in Configure MEI) split across hours/units — the #1 mistake is forgetting the value of your own time.', es: 'Incluye su propio pro-labore deseado ({v}/mes, configurado en Configurar MEI) prorrateado por horas/unidades — el error nº 1 es olvidar el valor de su propio tiempo.' },
    custoProprioAusente: { pt: 'Configure seu pró-labore desejado em "Configurar MEI" para incluir o custo do seu tempo neste cálculo.', en: 'Set your desired pro-labore in "Configure MEI" to include the cost of your own time in this calculation.', es: 'Configure su pro-labore deseado en "Configurar MEI" para incluir el costo de su propio tiempo en este cálculo.' },
    resultadoTitulo: { pt: 'Resultado', en: 'Result', es: 'Resultado' },
    custoBaseLbl: { pt: 'Custo Base', en: 'Base Cost', es: 'Costo Base' },
    dasLbl: { pt: 'DAS (no preço)', en: 'DAS (in price)', es: 'DAS (en el precio)' },
    irpfLbl: { pt: 'Exposição IRPF (no preço)', en: 'IRPF Exposure (in price)', es: 'Exposición IRPF (en el precio)' },
    margemReaisLbl: { pt: 'Sua Margem em R$', en: 'Your Margin in R$', es: 'Su Margen en R$' },
    precoMinimoLbl: { pt: '⚠️ Preço Mínimo (sem lucro)', en: '⚠️ Minimum Price (no profit)', es: '⚠️ Precio Mínimo (sin ganancia)' },
    precoSugeridoLbl: { pt: '💰 Preço Sugerido', en: '💰 Suggested Price', es: '💰 Precio Sugerido' },
    ticketMedioLbl: { pt: 'Seu ticket médio histórico real', en: 'Your real historical average ticket', es: 'Su ticket promedio histórico real' },
    urgenciaLbl: { pt: 'Adicional de urgência/complexidade (%) — opcional', en: 'Urgency/complexity add-on (%) — optional', es: 'Adicional de urgencia/complejidad (%) — opcional' },
    precoComUrgenciaLbl: { pt: 'Preço com adicional', en: 'Price with add-on', es: 'Precio con adicional' },
    composicaoTitulo: { pt: 'Composição do Preço Sugerido', en: 'Suggested Price Composition', es: 'Composición del Precio Sugerido' },
    detectorTitulo: { pt: 'Você Está Trabalhando de Graça?', en: 'Are You Working for Free?', es: '¿Está Trabajando Gratis?' },
    precoCobradoLbl: { pt: 'Quanto você cobra hoje? (R$)', en: 'How much do you charge today? (R$)', es: '¿Cuánto cobra hoy? (R$)' },
    detectorVazio: { pt: 'Informe o que você cobra hoje pra comparar com o preço mínimo real.', en: 'Enter what you charge today to compare with the real minimum price.', es: 'Informe lo que cobra hoy para comparar con el precio mínimo real.' },
    prejuizoTitulo: { pt: 'Prejuízo Detectado', en: 'Loss Detected', es: 'Pérdida Detectada' },
    prejuizoTexto: { pt: 'Você está tendo prejuízo de {v} por {u} — está pagando pra trabalhar.', en: 'You are losing {v} per {u} — you are paying to work.', es: 'Está teniendo una pérdida de {v} por {u} — está pagando para trabajar.' },
    prejuizoMensal: { pt: 'No ritmo atual, isso é {v} de prejuízo por mês.', en: 'At this pace, that is {v} in losses per month.', es: 'A este ritmo, eso es {v} de pérdida por mes.' },
    margemSaudavel: { pt: 'Sua margem real é {v}% — saudável.', en: 'Your real margin is {v}% — healthy.', es: 'Su margen real es {v}% — saludable.' },
    margemApertada: { pt: 'Sua margem real é {v}% — apertada. Considere subir pro preço sugerido.', en: 'Your real margin is {v}% — tight. Consider raising it to the suggested price.', es: 'Su margen real es {v}% — ajustado. Considere subir al precio sugerido.' },
    analisarIA: { pt: 'Analisar', en: 'Analyze', es: 'Analizar' },
    analisando: { pt: 'Analisando...', en: 'Analyzing...', es: 'Analizando...' },
    analiseIATitulo: { pt: 'Análise Executiva Axioma', en: 'Axioma Executive Analysis', es: 'Análisis Ejecutivo Axioma' },
    analiseIATransparencia: { pt: 'Análise gerada pela inteligência do Axioma com base nos seus dados reais. Se não for possível gerar agora, cai automaticamente para uma análise por regra.', en: 'Analysis generated by Axioma intelligence based on your real data. If it cannot be generated right now, it automatically falls back to a rule-based analysis.', es: 'Análisis generado por la inteligencia de Axioma con base en sus datos reales. Si no se puede generar ahora, cae automáticamente a un análisis por regla.' },
    dicas: { pt: 'Dicas de Precificação MEI', en: 'MEI Pricing Tips', es: 'Consejos de Precios MEI' },
    nomePrecoLbl: { pt: 'Nome deste preço (ex: Corte de cabelo masculino)', en: 'Name for this price (e.g. Men\'s haircut)', es: 'Nombre de este precio (ej: Corte de cabello masculino)' },
    salvarPreco: { pt: 'Salvar Preço', en: 'Save Price', es: 'Guardar Precio' },
    salvando: { pt: 'Salvando...', en: 'Saving...', es: 'Guardando...' },
    atualizarPreco: { pt: 'Atualizar Preço', en: 'Update Price', es: 'Actualizar Precio' },
    cancelarEdicao: { pt: 'Cancelar edição', en: 'Cancel editing', es: 'Cancelar edición' },
    editandoAviso: { pt: 'Editando "{v}" — salvar vai atualizar este preço.', en: 'Editing "{v}" — saving will update this price.', es: 'Editando "{v}" — guardar actualizará este precio.' },
    meusPrecosTitulo: { pt: 'Meus Preços Salvos', en: 'My Saved Prices', es: 'Mis Precios Guardados' },
    meusPrecosVazio: { pt: 'Nenhum preço salvo ainda — calcule acima e clique em "Salvar Preço".', en: 'No saved prices yet — calculate above and click "Save Price".', es: 'Ningún precio guardado todavía — calcule arriba y haga clic en "Guardar Precio".' },
    confirmarExcluir: { pt: 'Excluir "{v}"? Essa ação não pode ser desfeita.', en: 'Delete "{v}"? This action cannot be undone.', es: '¿Eliminar "{v}"? Esta acción no se puede deshacer.' },
    paginaLbl: { pt: 'Página {a} de {b}', en: 'Page {a} of {b}', es: 'Página {a} de {b}' },
    erroSalvarPreco: { pt: 'Não foi possível salvar o preço. Tente novamente.', en: 'Could not save the price. Try again.', es: 'No se pudo guardar el precio. Intente de nuevo.' },
    erroExcluirPreco: { pt: 'Não foi possível excluir o preço. Tente novamente.', en: 'Could not delete the price. Try again.', es: 'No se pudo eliminar el precio. Intente de nuevo.' },
  }
  const t = (key: keyof typeof txt) => txt[key][lang]
  const fmt = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar(); carregarPrecosSalvos() }, [])

  useEffect(() => {
    if (horasTocado) return
    const calc = horasMensaisCalculadas(parseFloat(horasPorDia) || 0, parseFloat(diasPorSemana) || 0, parseFloat(pctProdutivo) || 100)
    setHorasTrabalhadasMes(calc > 0 ? String(Math.round(calc * 10) / 10) : '')
  }, [horasPorDia, diasPorSemana, pctProdutivo, horasTocado])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const inicio12m = new Date(); inicio12m.setMonth(inicio12m.getMonth() - 11)
    const inicioIso = inicio12m.toISOString().slice(0, 10)
    const hoje = new Date().toISOString().slice(0, 10)
    const [{ data: mei }, { data: cf }, { data: cv }, { data: rec }] = await Promise.all([
      supabase.from('mei_dados').select('*').maybeSingle(),
      supabase.from('custos_fixos').select('valor_mensal'),
      supabase.from('custos_variaveis').select('valor, data').gte('data', inicioIso).lte('data', hoje),
      supabase.from('receitas').select('valor, data').gte('data', inicioIso).lte('data', hoje),
    ])
    setMeiDados(mei)
    setReceitasRows(rec || [])
    const somaCF = (cf || []).reduce((s, c) => s + Number(c.valor_mensal || 0), 0)
    const mediaCV = (cv || []).reduce((s, c) => s + Number(c.valor || 0), 0) / 12
    if (somaCF > 0) setCustoFixoMensal(String(Math.round(somaCF * 100) / 100))
    if (mediaCV > 0) setCustoVariavelMensal(String(Math.round(mediaCV * 100) / 100))
    if (!modoTocado) setModo(mei?.categoria_mei === 'Comércio' || mei?.categoria_mei === 'Indústria' ? 'produto' : 'hora')
  }

  async function carregarPrecosSalvos() {
    const { data } = await supabase.from('mei_precos_salvos').select('*').order('updated_at', { ascending: false }).limit(200)
    setPrecosSalvos(data || [])
  }

  function trocarModo(m: Modo) { setModo(m); setModoTocado(true) }

  const anoAtual = new Date().getFullYear()
  const receitaMensalMedia = receitasRows.reduce((s, r) => s + (r.valor || 0), 0) / 12
  const tetoInfo = tetoProporcionalMEI(meiDados?.data_abertura, anoAtual)
  const dasMensal = meiDados?.das_valor || dasMensalPorCategoria(meiDados?.categoria_mei)
  const receitaReferenciaDAS = receitaMensalMedia > 0 ? receitaMensalMedia : tetoInfo.teto / 12
  const fracaoDAS = fracaoDASSobrePreco(dasMensal, receitaReferenciaDAS)
  const fracaoIRPF = fracaoIRPFExposicao(meiDados?.categoria_mei)
  const margemFracao = (parseFloat(margemDesejada) || 0) / 100
  const custoFixoNum = parseFloat(custoFixoMensal) || 0
  const custoVarNum = parseFloat(custoVariavelMensal) || 0
  const horasNum = parseFloat(horasTrabalhadasMes) || 0
  const unidadesNum = parseFloat(unidadesVendidasMes) || 0
  const proLaboreDesejado = meiDados?.pro_labore_desejado ?? null

  const custoPorHoraOperacional = horasNum > 0 ? (custoFixoNum + custoVarNum) / horasNum + custoProprioRateado(proLaboreDesejado, horasNum) : 0
  const custoPorUnidadeOperacional = unidadesNum > 0 ? (custoFixoNum + custoVarNum) / unidadesNum + custoProprioRateado(proLaboreDesejado, unidadesNum) : 0

  let custoBase = 0
  let unidadeLabel = t('porHora')
  let volumeMensal = 1
  if (modo === 'hora') {
    custoBase = custoPorHoraOperacional
    unidadeLabel = t('porHora')
    volumeMensal = horasNum
  } else if (modo === 'projeto') {
    const horasProjeto = parseFloat(horasEstimadasProjeto) || 0
    const materiais = parseFloat(materiaisProjeto) || 0
    custoBase = custoPorHoraOperacional * horasProjeto + materiais
    unidadeLabel = t('porProjeto')
    volumeMensal = 1
  } else {
    const custoUnit = parseFloat(custoUnitarioProduto) || 0
    custoBase = custoUnit + custoPorUnidadeOperacional
    unidadeLabel = t('porProduto')
    volumeMensal = unidadesNum
  }

  const precoSugerido = precoPorDivisor(custoBase, [margemFracao, fracaoDAS, fracaoIRPF])
  const precoMinimo = precoPorDivisor(custoBase, [fracaoDAS, fracaoIRPF])
  const dasReais = precoSugerido * fracaoDAS
  const irpfReais = precoSugerido * fracaoIRPF
  const margemReais = precoSugerido * margemFracao
  const urgenciaFracao = (parseFloat(urgenciaPct) || 0) / 100
  const precoComUrgencia = precoSugerido * (1 + urgenciaFracao)

  const detector = precoCobradoHoje
    ? detectarTrabalhoDeGraca({ precoCobradoHoje: parseFloat(precoCobradoHoje) || 0, custoBase, fracaoDAS, fracaoIRPF })
    : null
  const prejuizoMensalEstimado = detector && detector.situacao === 'prejuizo' ? detector.prejuizoPorUnidade * volumeMensal : 0

  const ticket = ticketMedio(receitasRows.map((r) => ({ valor: r.valor, data: r.data })))

  const marquee = [
    'AXIOMA',
    custoBase > 0 ? `${t('custoBaseLbl')}: ${fmt(custoBase)}` : '',
    precoMinimo > 0 ? `${t('precoMinimoLbl')}: ${fmt(precoMinimo)}` : '',
    margemReais > 0 ? `${t('margemReaisLbl')}: ${fmt(margemReais)}` : '',
    ticket > 0 ? `${t('ticketMedioLbl')}: ${fmt(ticket)}` : '',
  ].filter(Boolean)

  const dadosComposicao = [
    { name: t('custoBaseLbl'), value: Math.max(0, custoBase), color: AZUL },
    { name: t('dasLbl'), value: Math.max(0, dasReais), color: VERDE },
    { name: t('irpfLbl'), value: Math.max(0, irpfReais), color: '#a78bfa' },
    { name: t('margemReaisLbl'), value: Math.max(0, margemReais), color: OURO },
  ]

  const idiomaNome = lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : 'Portuguese (Brazilian)'

  function montarContextoIAPrecificacao(): string {
    const modoTexto = modo === 'hora' ? (lang === 'pt' ? 'por hora' : lang === 'en' ? 'by hour' : 'por hora') : modo === 'projeto' ? (lang === 'pt' ? 'por projeto' : lang === 'en' ? 'by project' : 'por proyecto') : (lang === 'pt' ? 'por produto' : lang === 'en' ? 'by product' : 'por producto')
    return `You are the Axioma MEI pricing consultant. Answer in ${idiomaNome}, direct and practical, in 1st person as a consultant, in up to 6 sentences. Never invent a number outside the data below.

REAL PRICING DATA (mode: ${modoTexto}):
- MEI Category: ${meiDados?.categoria_mei || 'Serviços'}
- Base cost calculated: ${fmt(custoBase)} per ${unidadeLabel}
- Minimum price (breakeven, no profit): ${fmt(precoMinimo)}
- Suggested price (desired margin ${margemDesejada}%): ${fmt(precoSugerido)}
- ${precoCobradoHoje ? `Price currently charged: ${fmt(parseFloat(precoCobradoHoje))} — ${detector?.situacao === 'prejuizo' ? `LOSS of ${fmt(detector.prejuizoPorUnidade)} per ${unidadeLabel}` : `real margin of ${detector?.margemRealPct.toFixed(1)}%`}` : 'Has not informed the current price charged yet'}
- Real historical average ticket: ${fmt(ticket)}
- Monthly DAS: ${fmt(dasMensal)}

Focus on: whether the price is healthy, how much to raise it, how to justify a price increase to the client, and when to refuse a discount.`
  }

  function gerarAnaliseFallback(): string {
    if (detector?.situacao === 'prejuizo') {
      if (lang === 'en') return `You are losing ${fmt(detector.prejuizoPorUnidade)} per ${unidadeLabel} at your current price — you are paying to work. Raise your price to at least ${fmt(precoMinimo)} to break even, or ${fmt(precoSugerido)} to keep your desired ${margemDesejada}% margin.`
      if (lang === 'es') return `Está perdiendo ${fmt(detector.prejuizoPorUnidade)} por ${unidadeLabel} con su precio actual — está pagando para trabajar. Suba su precio a por lo menos ${fmt(precoMinimo)} para no perder, o ${fmt(precoSugerido)} para mantener su margen deseado de ${margemDesejada}%.`
      return `Você está perdendo ${fmt(detector.prejuizoPorUnidade)} por ${unidadeLabel} no preço atual — está pagando pra trabalhar. Suba o preço pra pelo menos ${fmt(precoMinimo)} pra não ter prejuízo, ou ${fmt(precoSugerido)} pra manter sua margem desejada de ${margemDesejada}%.`
    }
    if (lang === 'en') return `Suggested price for this ${unidadeLabel}: ${fmt(precoSugerido)} (${margemDesejada}% margin over a real base cost of ${fmt(custoBase)}). ${detector ? `At your current price, real margin is ${detector.margemRealPct.toFixed(1)}%.` : ''} Your real historical average ticket is ${fmt(ticket)}.`
    if (lang === 'es') return `Precio sugerido para este ${unidadeLabel}: ${fmt(precoSugerido)} (margen de ${margemDesejada}% sobre un costo base real de ${fmt(custoBase)}). ${detector ? `Con su precio actual, el margen real es ${detector.margemRealPct.toFixed(1)}%.` : ''} Su ticket promedio histórico real es ${fmt(ticket)}.`
    return `Preço sugerido para este ${unidadeLabel}: ${fmt(precoSugerido)} (margem de ${margemDesejada}% sobre um custo base real de ${fmt(custoBase)}). ${detector ? `No seu preço atual, a margem real é ${detector.margemRealPct.toFixed(1)}%.` : ''} Seu ticket médio histórico real é ${fmt(ticket)}.`
  }

  async function analisarComIA() {
    setAnalisandoIA(true)
    let resposta = ''
    try {
      const res = await fetch('/api/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: lang === 'en' ? 'Analyze my MEI pricing based on the data below.' : lang === 'es' ? 'Analice mi precificación MEI con base en los datos abajo.' : 'Analise minha precificação MEI com base nos dados abaixo.',
          historico: [],
          contexto: montarContextoIAPrecificacao(),
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

  // ---- Salvar Preço — zero token, nunca chama /api/ia-chat ----
  function montarSnapshotDados() {
    return {
      custoFixoMensal, custoVariavelMensal, margemDesejada,
      horasPorDia, diasPorSemana, pctProdutivo, horasTrabalhadasMes, horasTocado,
      horasEstimadasProjeto, materiaisProjeto,
      custoUnitarioProduto, unidadesVendidasMes,
      precoCobradoHoje, urgenciaPct,
      resultado: { custoBase, precoMinimo, precoSugerido, margemReais, dasReais, irpfReais },
    }
  }

  async function salvarPrecoAtual() {
    if (!nomePrecoSalvo.trim()) return
    setSalvandoPreco(true)
    const dados = montarSnapshotDados()
    let erro: string | undefined
    if (editandoId) {
      const { data, error } = await supabase.from('mei_precos_salvos').update({ nome: nomePrecoSalvo.trim(), modo, dados, updated_at: new Date().toISOString() }).eq('id', editandoId).select('id')
      if (error || !data || data.length === 0) erro = error?.message || '0 linhas afetadas (RLS?)'
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const empresaId = await obterEmpresaAtiva()
      if (user && empresaId) {
        const { data, error } = await supabase.from('mei_precos_salvos').insert({ user_id: user.id, empresa_id: empresaId, nome: nomePrecoSalvo.trim(), modo, dados }).select('id')
        if (error || !data) erro = error?.message || '0 linhas afetadas (RLS?)'
      }
    }
    if (erro) {
      reportarFalhaEscrita('mei_precos_salvos', editandoId ? 'update' : 'insert', erro)
      showToast(t('erroSalvarPreco'), 'erro')
      setSalvandoPreco(false)
      return
    }
    setNomePrecoSalvo(''); setEditandoId(null)
    await carregarPrecosSalvos()
    setSalvandoPreco(false)
  }

  function editarPrecoSalvo(row: typeof precosSalvos[number]) {
    const d = row.dados || {}
    setEditandoId(row.id)
    setNomePrecoSalvo(row.nome)
    setModo(row.modo); setModoTocado(true)
    setCustoFixoMensal(d.custoFixoMensal ?? '')
    setCustoVariavelMensal(d.custoVariavelMensal ?? '')
    setMargemDesejada(d.margemDesejada ?? '30')
    setHorasPorDia(d.horasPorDia ?? '8')
    setDiasPorSemana(d.diasPorSemana ?? '5')
    setPctProdutivo(d.pctProdutivo ?? '100')
    setHorasTrabalhadasMes(d.horasTrabalhadasMes ?? '')
    setHorasTocado(!!d.horasTocado)
    setHorasEstimadasProjeto(d.horasEstimadasProjeto ?? '')
    setMateriaisProjeto(d.materiaisProjeto ?? '0')
    setCustoUnitarioProduto(d.custoUnitarioProduto ?? '')
    setUnidadesVendidasMes(d.unidadesVendidasMes ?? '')
    setPrecoCobradoHoje(d.precoCobradoHoje ?? '')
    setUrgenciaPct(d.urgenciaPct ?? '0')
  }

  async function excluirPrecoSalvo(row: typeof precosSalvos[number]) {
    if (!window.confirm(t('confirmarExcluir').replace('{v}', row.nome))) return
    const { data, error } = await supabase.from('mei_precos_salvos').delete().eq('id', row.id).select('id')
    if (error || !data || data.length === 0) {
      reportarFalhaEscrita('mei_precos_salvos', 'delete', error?.message || '0 linhas afetadas (RLS?)')
      showToast(t('erroExcluirPreco'), 'erro')
      return
    }
    if (editandoId === row.id) { setEditandoId(null); setNomePrecoSalvo('') }
    await carregarPrecosSalvos()
  }

  function cancelarEdicaoPreco() { setEditandoId(null); setNomePrecoSalvo('') }

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
      pdf.text('AXIOMA — MEI Precificação', 14, 13)
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

  function montarArgsPdfAtual(): ArgsPdfTabela {
    const linhas = [
      { label: t('custoBaseLbl'), valor: fmt(custoBase) },
      { label: t('dasLbl'), valor: fmt(dasReais) },
      { label: t('irpfLbl'), valor: fmt(irpfReais) },
      { label: t('margemReaisLbl'), valor: fmt(margemReais) },
      { label: t('precoMinimoLbl'), valor: fmt(precoMinimo) },
      { label: t('precoSugeridoLbl'), valor: fmt(precoSugerido) },
    ]
    return {
      titulo: t('titulo'),
      subtitulo: meiDados?.categoria_mei || 'Serviços',
      colunas: [
        { header: 'Item', key: 'label', width: 3 },
        { header: 'Valor', key: 'valor', width: 2, align: 'right' },
      ],
      linhas,
      nomeArquivo: `axioma-mei-precificacao-${new Date().toISOString().slice(0, 10)}.pdf`,
    }
  }

  const dicas = [
    { pt: 'Nunca precifique abaixo do custo real — inclua DAS, IRPF e o valor do seu próprio tempo.', en: 'Never price below the real cost — include DAS, IRPF and the value of your own time.', es: 'Nunca precios por debajo del costo real — incluya DAS, IRPF y el valor de su propio tiempo.' },
    { pt: 'Adicione 20-30% de margem mínima para cobrir imprevistos e investimentos no negócio.', en: 'Add 20-30% minimum margin to cover unforeseen events and business investments.', es: 'Agregue 20-30% de margen mínimo para cubrir imprevistos e inversiones en el negocio.' },
    { pt: 'Revise seus preços a cada 6 meses considerando inflação e novos custos.', en: 'Review your prices every 6 months considering inflation and new costs.', es: 'Revise sus precios cada 6 meses considerando inflación y nuevos costos.' },
    { pt: 'Serviços MEI têm isenção de 32% de IRPF sobre a receita — use isso no seu cálculo.', en: 'MEI services have a 32% IRPF exemption on revenue — use this in your calculation.', es: 'Servicios MEI tienen exención de 32% de IRPF sobre ingresos — úselo en su cálculo.' },
  ]

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

        <LetreiroExecutivo itens={marquee} cor={AZUL} />

        {/* Info do MEI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t('categoria'), value: meiDados?.categoria_mei || 'Serviços', cor: OURO },
            { label: t('dasMensalLbl'), value: fmt(dasMensal), cor: AZUL },
            { label: t('receitaMediaLbl'), value: fmt(receitaMensalMedia), cor: VERDE },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-lg md:text-xl font-black" style={{ color: card.cor, ...FONTE }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Seletor de modo */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#c8d8f0', ...FONTE }}>{t('modoTitulo')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {([
              { key: 'hora' as Modo, label: t('modoHora') },
              { key: 'projeto' as Modo, label: t('modoProjeto') },
              { key: 'produto' as Modo, label: t('modoProduto') },
            ]).map((op) => (
              <button key={op.key} onClick={() => trocarModo(op.key)}
                className="py-2.5 rounded-xl text-xs font-bold transition-all"
                style={modo === op.key
                  ? { background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }
                  : { background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }}>
                {op.label}
              </button>
            ))}
          </div>
        </CanvasBox>

        {/* Custos reais + inputs do modo */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#c8d8f0', ...FONTE }}>{t('custosReaisTitulo')}</p>
          <p className="text-[10px] mb-4 italic" style={{ color: '#5a7a9a' }}>
            {custoFixoNum > 0 || custoVarNum > 0 ? t('custosReaisPuxados') : t('custosReaisVazio')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('custoFixoLbl')}</label>
              <input type="number" value={custoFixoMensal} onChange={(e) => setCustoFixoMensal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('custoVariavelLbl')}</label>
              <input type="number" value={custoVariavelMensal} onChange={(e) => setCustoVariavelMensal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
            </div>

            {(modo === 'hora' || modo === 'projeto') && (
              <div className="sm:col-span-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${AZUL}15` }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('horasPorDiaLbl')}</label>
                    <input type="number" value={horasPorDia} onChange={(e) => setHorasPorDia(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('diasPorSemanaLbl')}</label>
                    <input type="number" value={diasPorSemana} onChange={(e) => setDiasPorSemana(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('pctProdutivoLbl')}</label>
                    <input type="number" value={pctProdutivo} onChange={(e) => setPctProdutivo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: AZUL }}>
                  {t('horasCalculadasTexto').replace('{v}', (Math.round(horasMensaisCalculadas(parseFloat(horasPorDia) || 0, parseFloat(diasPorSemana) || 0, parseFloat(pctProdutivo) || 100) * 10) / 10).toString())}
                </p>
                <div className="mt-3">
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('horasTrabalhadasLbl')}</label>
                  <input type="number" value={horasTrabalhadasMes} onChange={(e) => { setHorasTrabalhadasMes(e.target.value); setHorasTocado(true) }}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                  <p className="text-[10px] mt-1 italic" style={{ color: '#5a7a9a' }}>{t('horasOverrideNota')}</p>
                </div>
              </div>
            )}
            {modo === 'projeto' && (
              <>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('horasEstimadasLbl')}</label>
                  <input type="number" value={horasEstimadasProjeto} onChange={(e) => setHorasEstimadasProjeto(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('materiaisLbl')}</label>
                  <input type="number" value={materiaisProjeto} onChange={(e) => setMateriaisProjeto(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                </div>
              </>
            )}
            {modo === 'produto' && (
              <>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('custoUnitarioLbl')}</label>
                  <input type="number" value={custoUnitarioProduto} onChange={(e) => setCustoUnitarioProduto(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('unidadesVendidasLbl')}</label>
                  <input type="number" value={unidadesVendidasMes} onChange={(e) => setUnidadesVendidasMes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('margemLbl')}</label>
              <input type="number" value={margemDesejada} onChange={(e) => setMargemDesejada(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
            </div>
          </div>

          <p className="text-[10px] mt-3 italic" style={{ color: proLaboreDesejado ? '#5a7a9a' : VERMELHO }}>
            {proLaboreDesejado ? t('custoProprioNota').replace('{v}', fmt(proLaboreDesejado)) : t('custoProprioAusente')}
          </p>
        </CanvasBox>

        {/* Resultado */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('resultadoTitulo')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: t('custoBaseLbl'), value: fmt(custoBase), cor: '#5a7a9a' },
              { label: t('dasLbl'), value: fmt(dasReais), cor: VERDE },
              { label: t('irpfLbl'), value: fmt(irpfReais), cor: '#a78bfa' },
              { label: t('margemReaisLbl'), value: fmt(margemReais), cor: OURO },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl"
                style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}20` }}>
                <span className="text-xs" style={{ color: '#c8d8f0' }}>{item.label}</span>
                <span className="text-sm font-black" style={{ color: item.cor }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="p-4 rounded-xl" style={{ background: `${VERMELHO}10`, border: `1px solid ${VERMELHO}30` }}>
              <p className="text-xs mb-1" style={{ color: '#c8d8f0' }}>{t('precoMinimoLbl')}</p>
              <p className="text-xl font-black" style={{ color: VERMELHO, ...FONTE }}>{fmt(precoMinimo)}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: `${OURO}12`, border: `1px solid ${OURO}40` }}>
              <p className="text-xs mb-1" style={{ color: '#c8d8f0' }}>{t('precoSugeridoLbl')}</p>
              <p className="text-xl font-black" style={{ color: OURO, ...FONTE }}>{fmt(precoSugerido)}</p>
            </div>
          </div>
          <p className="text-[10px] mt-3" style={{ color: '#5a7a9a' }}>{t('ticketMedioLbl')}: <b style={{ color: '#c8d8f0' }}>{fmt(ticket)}</b></p>

          <div className="mt-4">
            <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('urgenciaLbl')}</label>
            <input type="number" value={urgenciaPct} onChange={(e) => setUrgenciaPct(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
            {urgenciaFracao > 0 && (
              <p className="text-xs mt-2" style={{ color: OURO }}>{t('precoComUrgenciaLbl')}: <b>{fmt(precoComUrgencia)}</b></p>
            )}
          </div>

          <div className="mt-4 pt-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end" style={{ borderTop: `1px solid ${OURO}20` }}>
            <div className="flex-1">
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('nomePrecoLbl')}</label>
              <input type="text" value={nomePrecoSalvo} onChange={(e) => setNomePrecoSalvo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
            </div>
            <button onClick={salvarPrecoAtual} disabled={salvandoPreco || !nomePrecoSalvo.trim()}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
              <Save size={14} /> {salvandoPreco ? t('salvando') : editandoId ? t('atualizarPreco') : t('salvarPreco')}
            </button>
          </div>
          {editandoId && (
            <p className="text-[10px] mt-2 italic flex items-center gap-2" style={{ color: '#5a7a9a' }}>
              {t('editandoAviso').replace('{v}', nomePrecoSalvo)}
              <button onClick={cancelarEdicaoPreco} className="underline" style={{ color: AZUL }}>{t('cancelarEdicao')}</button>
            </p>
          )}
        </CanvasBox>

        {/* Composição do preço */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#c8d8f0', ...FONTE }}>{t('composicaoTitulo')}</p>
          {precoSugerido > 0 ? (
            <ReactECharts option={optRosca(dadosComposicao, OURO, t('precoSugeridoLbl'))} style={{ height: 260, width: '100%' }} notMerge lazyUpdate opts={{ renderer: 'canvas' }} />
          ) : (
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('custosReaisVazio')}</p>
          )}
        </CanvasBox>

        {/* Detector "trabalhando de graça" */}
        <CanvasBox cor={detector?.situacao === 'prejuizo' ? VERMELHO : VERDE}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('detectorTitulo')}</p>
          <div className="mb-4">
            <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('precoCobradoLbl')}</label>
            <input type="number" value={precoCobradoHoje} onChange={(e) => setPrecoCobradoHoje(e.target.value)}
              className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}30`, color: '#c8d8f0' }} />
          </div>
          {!detector && <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('detectorVazio')}</p>}
          {detector && detector.situacao === 'prejuizo' && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: `${VERMELHO}12`, border: `1px solid ${VERMELHO}40` }}>
              <AlertTriangle size={20} style={{ color: VERMELHO, flexShrink: 0 }} />
              <div>
                <p className="text-sm font-black mb-1" style={{ color: VERMELHO }}>{t('prejuizoTitulo')}</p>
                <p className="text-xs" style={{ color: '#c8d8f0' }}>{t('prejuizoTexto').replace('{v}', fmt(detector.prejuizoPorUnidade)).replace('{u}', unidadeLabel)}</p>
                {volumeMensal > 0 && <p className="text-xs mt-1" style={{ color: '#c8d8f0' }}>{t('prejuizoMensal').replace('{v}', fmt(prejuizoMensalEstimado))}</p>}
              </div>
            </div>
          )}
          {detector && detector.situacao !== 'prejuizo' && (
            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: `${VERDE}12`, border: `1px solid ${VERDE}40` }}>
              <CheckCircle2 size={20} style={{ color: VERDE, flexShrink: 0 }} />
              <p className="text-xs" style={{ color: '#c8d8f0' }}>
                {(detector.situacao === 'saudavel' ? t('margemSaudavel') : t('margemApertada')).replace('{v}', detector.margemRealPct.toFixed(1))}
              </p>
            </div>
          )}
        </CanvasBox>

        {/* Análise Axioma */}
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

        {/* Meus Preços Salvos */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', ...FONTE }}>{t('meusPrecosTitulo')}</p>
          {precosSalvos.length === 0 ? (
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('meusPrecosVazio')}</p>
          ) : (
            <>
              <div className="space-y-2">
                {precosSalvos.slice(paginaAtual * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA + ITENS_POR_PAGINA).map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${OURO}20` }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: '#c8d8f0' }}>{row.nome}</p>
                      <p className="text-[10px]" style={{ color: '#5a7a9a' }}>
                        {row.modo === 'hora' ? t('modoHora') : row.modo === 'projeto' ? t('modoProjeto') : t('modoProduto')}
                        {' · '}{fmt(row.dados?.resultado?.precoSugerido || 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => editarPrecoSalvo(row)} className="p-2 rounded-lg" style={{ background: `${AZUL}15`, border: `1px solid ${AZUL}30` }}>
                        <Pencil size={14} style={{ color: AZUL }} />
                      </button>
                      <button onClick={() => excluirPrecoSalvo(row)} className="p-2 rounded-lg" style={{ background: `${VERMELHO}15`, border: `1px solid ${VERMELHO}30` }}>
                        <Trash2 size={14} style={{ color: VERMELHO }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {precosSalvos.length > ITENS_POR_PAGINA && (
                <div className="flex items-center justify-between mt-4">
                  <button onClick={() => setPaginaAtual((p) => Math.max(0, p - 1))} disabled={paginaAtual === 0}
                    className="p-2 rounded-lg disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <ChevronLeft size={16} style={{ color: '#c8d8f0' }} />
                  </button>
                  <p className="text-xs" style={{ color: '#5a7a9a' }}>
                    {t('paginaLbl').replace('{a}', String(paginaAtual + 1)).replace('{b}', String(Math.ceil(precosSalvos.length / ITENS_POR_PAGINA)))}
                  </p>
                  <button onClick={() => setPaginaAtual((p) => Math.min(Math.ceil(precosSalvos.length / ITENS_POR_PAGINA) - 1, p + 1))}
                    disabled={paginaAtual >= Math.ceil(precosSalvos.length / ITENS_POR_PAGINA) - 1}
                    className="p-2 rounded-lg disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <ChevronRight size={16} style={{ color: '#c8d8f0' }} />
                  </button>
                </div>
              )}
            </>
          )}
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

      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{ background: toast.tipo === 'erro' ? 'rgba(248,113,113,0.95)' : 'rgba(52,211,153,0.95)', color: '#020810', fontWeight: 600, fontSize: 13 }}>
          {toast.msg}
        </div>
      )}
    </ModuloLayout>
  )
}
