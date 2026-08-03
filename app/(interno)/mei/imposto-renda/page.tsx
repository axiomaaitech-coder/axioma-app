'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { FileText, AlertTriangle, CheckCircle, Share2, Upload, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { gerarPdfTabela, textoResumoPdf, textoDetalhadoPdf, type ArgsPdfTabela } from '../../../../lib/gerarPdfTabela'
import { CentroCompartilhamento } from '../../../../components/CentroCompartilhamento'
import { LetreiroExecutivo } from '../../../../components/LetreiroExecutivo'
import { calcularIRPF, percentualIsentoPorCategoria } from '../../../../lib/meiHelpers'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import {
  listarDocumentosFiscais, uploadDocumentoFiscal, atualizarDocumentoFiscal, excluirDocumentoFiscal, urlDocumentoFiscal,
  TIPOS_DOCUMENTO_FISCAL, TIPOS_ESPERADOS_IRPF, type TipoDocumentoFiscal, type DocumentoFiscal,
} from '../../../../lib/documentosFiscaisHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const OURO = '#d4af37'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AZUL = '#6ab0ff'
const AMBAR = '#f59e0b'
const TEAL = '#2dd4bf'
const FONTE = { fontFamily: "'Georgia','Times New Roman',serif" }

export default function ImpostoRendaMEI() {
  const { idioma } = useLanguage()
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [outraRenda, setOutraRenda] = useState('')
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)
  const [checklistMarcado, setChecklistMarcado] = useState<boolean[]>([false, false, false, false, false, false])
  const conteudoRef = useRef<HTMLDivElement>(null)

  const [documentos, setDocumentos] = useState<DocumentoFiscal[]>([])
  const [anoDocSelecionado, setAnoDocSelecionado] = useState(new Date().getFullYear())
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<TipoDocumentoFiscal | 'todos'>('todos')
  const [arquivoDoc, setArquivoDoc] = useState<File | null>(null)
  const [tipoUploadDoc, setTipoUploadDoc] = useState<TipoDocumentoFiscal>('outro')
  const [descricaoUploadDoc, setDescricaoUploadDoc] = useState('')
  const [etapaUpload, setEtapaUpload] = useState<'idle' | 'enviando' | 'concluido'>('idle')
  const [editandoDocId, setEditandoDocId] = useState<string | null>(null)
  const [editTipoDoc, setEditTipoDoc] = useState<TipoDocumentoFiscal>('outro')
  const [editDescricaoDoc, setEditDescricaoDoc] = useState('')
  const [paginaDocumentos, setPaginaDocumentos] = useState(0)
  const [toastDoc, setToastDoc] = useState<{ msg: string; tipo: 'ok' | 'erro' | 'info' } | null>(null)
  const fileInputDocRef = useRef<HTMLInputElement>(null)
  const ITENS_POR_PAGINA_DOC = 10

  const [analiseIA, setAnaliseIA] = useState<string | null>(null)
  const [analisandoIA, setAnalisandoIA] = useState(false)

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
    compartilhar: { pt: 'Compartilhar', en: 'Share', es: 'Compartir' },
    toastBaixado: { pt: 'PDF pronto — baixado.', en: 'PDF ready — downloaded.', es: 'PDF listo — descargado.' },

    docTitulo: { pt: 'Documentos Fiscais', en: 'Tax Documents', es: 'Documentos Fiscales' },
    docSub: { pt: 'Guarde seus comprovantes organizados por ano — acesso privado, só você vê.', en: 'Keep your receipts organized by year — private access, only you can see them.', es: 'Guarde sus comprobantes organizados por año — acceso privado, solo usted los ve.' },
    docEnviarTitulo: { pt: 'Enviar Documento', en: 'Upload Document', es: 'Subir Documento' },
    docSelecionarArquivo: { pt: 'Escolher arquivo (PDF ou imagem, até 10 MB)', en: 'Choose file (PDF or image, up to 10 MB)', es: 'Elegir archivo (PDF o imagen, hasta 10 MB)' },
    docTipoLbl: { pt: 'Tipo de documento', en: 'Document type', es: 'Tipo de documento' },
    docDescricaoLbl: { pt: 'Descrição (opcional)', en: 'Description (optional)', es: 'Descripción (opcional)' },
    docEnviar: { pt: 'Enviar', en: 'Upload', es: 'Subir' },
    docEnviando: { pt: 'Enviando...', en: 'Uploading...', es: 'Enviando...' },
    docEnviado: { pt: 'Enviado!', en: 'Uploaded!', es: 'Enviado!' },
    docAno: { pt: 'Ano', en: 'Year', es: 'Año' },
    docFiltroTipo: { pt: 'Filtrar por tipo', en: 'Filter by type', es: 'Filtrar por tipo' },
    docTodos: { pt: 'Todos', en: 'All', es: 'Todos' },
    docListaVazia: { pt: 'Nenhum documento neste ano ainda — envie o primeiro acima.', en: 'No documents for this year yet — upload the first one above.', es: 'Ningún documento en este año todavía — suba el primero arriba.' },
    docVisualizar: { pt: 'Visualizar', en: 'View', es: 'Ver' },
    docEditar: { pt: 'Editar', en: 'Edit', es: 'Editar' },
    docExcluir: { pt: 'Excluir', en: 'Delete', es: 'Eliminar' },
    docSalvar: { pt: 'Salvar', en: 'Save', es: 'Guardar' },
    docCancelar: { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar' },
    docPaginaLbl: { pt: 'Página {a} de {b}', en: 'Page {a} of {b}', es: 'Página {a} de {b}' },
    docChecklistTitulo: { pt: 'Você já subiu o que o IRPF precisa?', en: 'Have you uploaded what the IRPF needs?', es: '¿Ya subió lo que el IRPF necesita?' },
    docConfirmarExcluir: { pt: 'Excluir "{v}"? Essa ação apaga o arquivo e não pode ser desfeita.', en: 'Delete "{v}"? This removes the file and cannot be undone.', es: '¿Eliminar "{v}"? Esta acción borra el archivo y no se puede deshacer.' },
    toastSemEmpresa: { pt: 'Não foi possível identificar sua empresa — recarregue a página.', en: 'Could not identify your company — reload the page.', es: 'No fue posible identificar su empresa — recargue la página.' },
    toastTipoInvalido: { pt: 'Arquivo inválido — envie um PDF ou uma imagem.', en: 'Invalid file — upload a PDF or an image.', es: 'Archivo inválido — suba un PDF o una imagen.' },
    toastTamanhoExcedido: { pt: 'Arquivo maior que 10 MB — reduza o tamanho e tente de novo.', en: 'File larger than 10 MB — reduce the size and try again.', es: 'Archivo mayor a 10 MB — reduzca el tamaño e intente de nuevo.' },
    toastDocumentoEnviado: { pt: 'Documento enviado com sucesso.', en: 'Document uploaded successfully.', es: 'Documento enviado con éxito.' },
    toastDocumentoAtualizado: { pt: 'Documento atualizado.', en: 'Document updated.', es: 'Documento actualizado.' },
    toastDocumentoExcluido: { pt: 'Documento excluído.', en: 'Document deleted.', es: 'Documento eliminado.' },
    toastFalhaAbrir: { pt: 'Não foi possível abrir o documento agora — tente de novo.', en: 'Could not open the document right now — try again.', es: 'No fue posible abrir el documento ahora — intente de nuevo.' },
    docArquivoSelecionado: { pt: 'Arquivo selecionado', en: 'File selected', es: 'Archivo seleccionado' },

    marqueeObrigatorio: { pt: 'DECLARAÇÃO OBRIGATÓRIA', en: 'MANDATORY DECLARATION', es: 'DECLARACIÓN OBLIGATORIA' },
    marqueeNaoObrigatorio: { pt: 'declaração não obrigatória', en: 'declaration not required', es: 'declaración no obligatoria' },
    marqueeIrpfAno: { pt: 'IRPF estimado/ano', en: 'Estimated IRPF/year', es: 'IRPF estimado/año' },
    marqueeAliquota: { pt: 'alíquota efetiva', en: 'effective rate', es: 'alícuota efectiva' },

    analiseIATitulo: { pt: 'Análise Executiva Axioma', en: 'Axioma Executive Analysis', es: 'Análisis Ejecutivo Axioma' },
    analisarIA: { pt: 'Analisar', en: 'Analyze', es: 'Analizar' },
    analisando: { pt: 'Analisando...', en: 'Analyzing...', es: 'Analizando...' },
    analiseIATransparencia: { pt: 'Análise gerada pela inteligência do Axioma com base nos seus dados reais. Se não for possível gerar agora, cai automaticamente para uma análise por regra.', en: 'Analysis generated by Axioma intelligence based on your real data. If it cannot be generated right now, it automatically falls back to a rule-based analysis.', es: 'Análisis generado por la inteligencia de Axioma con base en sus datos reales. Si no se puede generar ahora, cae automáticamente a un análisis por regla.' },
  }

  const TIPO_DOC_LABEL: Record<TipoDocumentoFiscal, { pt: string; en: string; es: string }> = {
    comprovante_despesa: { pt: 'Comprovante de Despesa', en: 'Expense Receipt', es: 'Comprobante de Gasto' },
    recibo: { pt: 'Recibo', en: 'Receipt', es: 'Recibo' },
    informe_rendimento: { pt: 'Informe de Rendimento', en: 'Income Report', es: 'Informe de Rendimientos' },
    nota_fiscal: { pt: 'Nota Fiscal', en: 'Invoice', es: 'Factura' },
    das_pago: { pt: 'DAS Pago', en: 'Paid DAS', es: 'DAS Pagado' },
    outro: { pt: 'Outro', en: 'Other', es: 'Otro' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar(); carregarDocumentos() }, [])
  useEffect(() => { setPaginaDocumentos(0) }, [anoDocSelecionado, filtroTipoDoc])

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

  async function carregarDocumentos() {
    setDocumentos(await listarDocumentosFiscais())
  }

  function mostrarToastDoc(msg: string, tipo: 'ok' | 'erro' | 'info' = 'ok') {
    setToastDoc({ msg, tipo })
    setTimeout(() => setToastDoc(null), 3500)
  }

  function fmtBytes(n: number): string {
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
    return `${(n / 1024 / 1024).toFixed(1)} MB`
  }

  async function handleEnviarDocumento() {
    if (!arquivoDoc) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const empresaId = await obterEmpresaAtiva()
    if (!empresaId) { mostrarToastDoc(t('toastSemEmpresa'), 'erro'); return }

    setEtapaUpload('enviando')
    const { erro } = await uploadDocumentoFiscal({
      file: arquivoDoc, empresaId, userId: user.id, ano: anoDocSelecionado, tipo: tipoUploadDoc, descricao: descricaoUploadDoc || undefined,
    })

    if (erro === 'tipo_invalido') { mostrarToastDoc(t('toastTipoInvalido'), 'erro'); setEtapaUpload('idle'); return }
    if (erro === 'tamanho_excedido') { mostrarToastDoc(t('toastTamanhoExcedido'), 'erro'); setEtapaUpload('idle'); return }
    if (erro) { mostrarToastDoc(erro, 'erro'); setEtapaUpload('idle'); return }

    setEtapaUpload('concluido')
    mostrarToastDoc(t('toastDocumentoEnviado'), 'ok')
    setArquivoDoc(null); setDescricaoUploadDoc(''); setTipoUploadDoc('outro')
    if (fileInputDocRef.current) fileInputDocRef.current.value = ''
    await carregarDocumentos()
    setTimeout(() => setEtapaUpload('idle'), 1500)
  }

  function iniciarEdicaoDoc(doc: DocumentoFiscal) {
    setEditandoDocId(doc.id); setEditTipoDoc(doc.tipo); setEditDescricaoDoc(doc.descricao || '')
  }
  function cancelarEdicaoDoc() { setEditandoDocId(null) }

  async function salvarEdicaoDoc(id: string) {
    const { erro } = await atualizarDocumentoFiscal(id, { tipo: editTipoDoc, descricao: editDescricaoDoc || undefined })
    if (erro) { mostrarToastDoc(erro, 'erro'); return }
    setEditandoDocId(null)
    mostrarToastDoc(t('toastDocumentoAtualizado'), 'ok')
    await carregarDocumentos()
  }

  async function excluirDocumento(doc: DocumentoFiscal) {
    if (!window.confirm(t('docConfirmarExcluir').replace('{v}', doc.nome_arquivo))) return
    const { erro } = await excluirDocumentoFiscal(doc)
    if (erro) { mostrarToastDoc(erro, 'erro'); return }
    mostrarToastDoc(t('toastDocumentoExcluido'), 'info')
    await carregarDocumentos()
  }

  async function visualizarDocumento(doc: DocumentoFiscal) {
    const url = await urlDocumentoFiscal(doc.path_storage)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    else mostrarToastDoc(t('toastFalhaAbrir'), 'erro')
  }

  const idiomaNome = lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : 'Portuguese (Brazilian)'

  function montarContextoIAIRPF(): string {
    return `You are the Axioma MEI tax consultant. Answer in ${idiomaNome}, direct and practical, in 1st person as a consultant, in up to 6 sentences. Never invent a number outside the data below.

REAL IRPF DATA (year ${anoAtual}):
- MEI Category: ${meiDados?.categoria_mei || 'Serviços'}
- Gross Revenue: ${fmt(faturamentoAnual)}
- Exempt portion (${(percentualIsento * 100).toFixed(0)}%): ${fmt(isencaoMEI)}
- Taxable MEI income: ${fmt(rendaTributavelMEI)}
- Other monthly income informed: ${fmt(parseFloat(outraRenda || '0'))}
- Total taxable income/year: ${fmt(rendaTotalAnual)}
- Effective IRPF rate: ${aliquotaEfetiva.toFixed(1)}%
- Estimated IRPF/year: ${fmt(impostoAnual)}
- Obligation status: ${obrigado ? 'MANDATORY to file' : 'not mandatory to file'}

Focus on: whether they must file and why, how to declare correctly (exempt vs taxable portion — prevent falling into "malha fina"/audit flags), what to set aside for tax payment, and what documents to keep organized.`
  }

  function gerarAnaliseFallbackIRPF(): string {
    if (lang === 'en') return `${obrigado ? 'You are required to file' : 'You are not required to file'} — your taxable income is ${fmt(rendaTotalAnual)}/year (exemption limit: R$ 33,888/year). Exempt MEI portion: ${fmt(isencaoMEI)}, taxable: ${fmt(rendaTributavelMEI)}. Estimated IRPF: ${fmt(impostoAnual)}/year at an effective rate of ${aliquotaEfetiva.toFixed(1)}%. Keep your income report and expense receipts organized to declare correctly.`
    if (lang === 'es') return `${obrigado ? 'Usted está obligado a declarar' : 'Usted no está obligado a declarar'} — su renta tributable es ${fmt(rendaTotalAnual)}/año (límite de exención: R$ 33.888/año). Porción exenta MEI: ${fmt(isencaoMEI)}, tributable: ${fmt(rendaTributavelMEI)}. IRPF estimado: ${fmt(impostoAnual)}/año a una alícuota efectiva de ${aliquotaEfetiva.toFixed(1)}%. Mantenga organizados su informe de rendimientos y comprobantes de gastos para declarar correctamente.`
    return `${obrigado ? 'Você é obrigado a declarar' : 'Você não é obrigado a declarar'} — sua renda tributável é ${fmt(rendaTotalAnual)}/ano (limite de isenção: R$ 33.888/ano). Parcela isenta MEI: ${fmt(isencaoMEI)}, tributável: ${fmt(rendaTributavelMEI)}. IRPF estimado: ${fmt(impostoAnual)}/ano numa alíquota efetiva de ${aliquotaEfetiva.toFixed(1)}%. Mantenha seu informe de rendimentos e comprovantes de despesa organizados pra declarar certo.`
  }

  async function analisarComIA() {
    setAnalisandoIA(true)
    let resposta = ''
    try {
      const res = await fetch('/api/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: lang === 'en' ? 'Analyze my MEI IRPF situation based on the data below.' : lang === 'es' ? 'Analice mi situación de IRPF MEI con base en los datos abajo.' : 'Analise minha situação de IRPF MEI com base nos dados abaixo.',
          historico: [],
          contexto: montarContextoIAIRPF(),
          modelo: 'claude-sonnet-5',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.resposta) resposta = data.resposta
      }
    } catch {}
    if (!resposta) resposta = gerarAnaliseFallbackIRPF()
    setAnaliseIA(resposta)
    setAnalisandoIA(false)
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas
    .filter(r => new Date(r.data).getFullYear() === anoAtual)
    .reduce((acc, r) => acc + (r.valor || 0), 0)

  const percentualIsento = percentualIsentoPorCategoria(meiDados?.categoria_mei)

  const isencaoMEI = faturamentoAnual * percentualIsento
  const rendaTributavelMEI = faturamentoAnual - isencaoMEI
  const outraRendaAnual = parseFloat(outraRenda || '0') * 12
  const rendaTotalAnual = rendaTributavelMEI + outraRendaAnual
  const rendaMensalMedia = rendaTotalAnual / 12

  const { imposto, aliquotaEfetiva } = calcularIRPF(rendaMensalMedia)
  const impostoAnual = imposto * 12
  const obrigado = rendaTotalAnual > 33888 || faturamentoAnual > 0

  const marquee = [
    'AXIOMA',
    `${t('receitaBruta')} ${fmt(faturamentoAnual)}`,
    `${t('isencao')} ${fmt(isencaoMEI)}`,
    `${t('rendaTributavel')} ${fmt(rendaTributavelMEI)}`,
    `${t('marqueeIrpfAno')} ${fmt(impostoAnual)}`,
    `${t('marqueeAliquota')} ${aliquotaEfetiva.toFixed(1)}%`,
    faturamentoAnual > 0 ? (obrigado ? `⚠️ ${t('marqueeObrigatorio')}` : `✅ ${t('marqueeNaoObrigatorio')}`) : '',
  ].filter(Boolean)

  const checklistItens = [
    { pt: 'CNPJ MEI ativo e em dia com DAS', en: 'Active MEI CNPJ with DAS up to date', es: 'CNPJ MEI activo y al día con DAS', auto: !!meiDados },
    { pt: 'DASN-SIMEI declarada (receita bruta anual)', en: 'DASN-SIMEI declared (annual gross revenue)', es: 'DASN-SIMEI declarada (ingresos brutos anuales)', auto: faturamentoAnual > 0 },
    { pt: 'Comprovante de rendimentos MEI separado', en: 'MEI income proof separated', es: 'Comprobante de ingresos MEI separado', auto: false },
    { pt: 'Recibos e notas fiscais do ano organizados', en: 'Receipts and invoices for the year organized', es: 'Recibos y facturas del año organizados', auto: receitas.length > 0 },
    { pt: 'Informes de outras fontes de renda (se houver)', en: 'Reports from other income sources (if any)', es: 'Informes de otras fuentes de ingresos (si hay)', auto: false },
    { pt: 'Programa IRPF Receita Federal instalado', en: 'Receita Federal IRPF Program installed', es: 'Programa IRPF Receita Federal instalado', auto: false },
  ]

  const anosComDocumentos = Array.from(new Set([anoAtual, ...documentos.map((d) => d.ano)])).sort((a, b) => b - a)
  const documentosDoAno = documentos.filter((d) => d.ano === anoDocSelecionado)
  const documentosFiltrados = filtroTipoDoc === 'todos' ? documentosDoAno : documentosDoAno.filter((d) => d.tipo === filtroTipoDoc)
  const totalPaginasDoc = Math.max(1, Math.ceil(documentosFiltrados.length / ITENS_POR_PAGINA_DOC))
  const documentosPaginaAtual = documentosFiltrados.slice(paginaDocumentos * ITENS_POR_PAGINA_DOC, paginaDocumentos * ITENS_POR_PAGINA_DOC + ITENS_POR_PAGINA_DOC)
  const tiposPresentesNoAno = new Set(documentosDoAno.map((d) => d.tipo))
  const checklistDocItens = TIPOS_ESPERADOS_IRPF.map((tp) => ({ tipo: tp, presente: tiposPresentesNoAno.has(tp) }))

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

  function montarArgsPdfAtual(): ArgsPdfTabela {
    return {
      titulo: `${t('titulo')} — ${anoAtual}`,
      subtitulo: obrigado ? t('obrigatorio') : t('naoObrigatorio'),
      colunas: [
        { header: t('receitaBruta'), key: 'label', width: 3 },
        { header: 'Valor', key: 'valor', width: 2, align: 'right' },
      ],
      linhas: [
        { label: t('receitaBruta'), valor: fmt(faturamentoAnual) },
        { label: t('isencao'), valor: fmt(isencaoMEI) },
        { label: t('rendaTributavel'), valor: fmt(rendaTributavelMEI) },
        { label: lang === 'pt' ? 'IRPF estimado/ano' : lang === 'en' ? 'Estimated IRPF/year' : 'IRPF estimado/año', valor: fmt(impostoAnual) },
      ],
      nomeArquivo: `axioma-mei-irpf-${new Date().toISOString().slice(0, 10)}.pdf`,
    }
  }

  return (
    <>
    {toastDoc && (
      <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
        style={{ background: toastDoc.tipo === 'erro' ? 'rgba(248,113,113,0.95)' : toastDoc.tipo === 'ok' ? 'rgba(52,211,153,0.95)' : 'rgba(106,176,255,0.95)', color: '#020810', fontWeight: 600, fontSize: 13 }}>
        {toastDoc.msg}
      </div>
    )}
    <ModuloLayout titulo={t('titulo')} subtitulo={t('subtitulo')} onExportarPDF={exportarPDF} exportando={exportando}
      botaoExtra={
        <button onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
          <Share2 size={16} /> {t('compartilhar')}
        </button>
      }>
      <div ref={conteudoRef} className="space-y-4">

        <LetreiroExecutivo itens={marquee} cor={TEAL} />

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

        {/* Documentos Fiscais */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#c8d8f0', ...FONTE }}>{t('docTitulo')}</p>
          <p className="text-xs mb-4" style={{ color: '#5a7a9a' }}>{t('docSub')}</p>

          <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${AZUL}20` }}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#5a7a9a' }}>{t('docEnviarTitulo')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('docAno')}</label>
                <select value={anoDocSelecionado} onChange={(e) => setAnoDocSelecionado(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }}>
                  {anosComDocumentos.map((a) => <option key={a} value={a} style={{ background: '#020810', color: '#c8d8f0' }}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('docTipoLbl')}</label>
                <select value={tipoUploadDoc} onChange={(e) => setTipoUploadDoc(e.target.value as TipoDocumentoFiscal)}
                  className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }}>
                  {TIPOS_DOCUMENTO_FISCAL.map((tp) => <option key={tp} value={tp} style={{ background: '#020810', color: '#c8d8f0' }}>{TIPO_DOC_LABEL[tp][lang]}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('docDescricaoLbl')}</label>
              <input type="text" value={descricaoUploadDoc} onChange={(e) => setDescricaoUploadDoc(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
            </div>
            <div className="mb-3">
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#5a7a9a' }}>{t('docSelecionarArquivo')}</label>
              <input ref={fileInputDocRef} type="file" accept="application/pdf,image/*" onChange={(e) => setArquivoDoc(e.target.files?.[0] || null)}
                className="w-full text-xs" style={{ color: '#c8d8f0', colorScheme: 'dark' }} />
              {arquivoDoc && (
                <p className="text-xs mt-2 font-semibold" style={{ color: VERDE }}>✓ {t('docArquivoSelecionado')}: {arquivoDoc.name}</p>
              )}
            </div>
            <button onClick={handleEnviarDocumento} disabled={!arquivoDoc || etapaUpload === 'enviando'}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, #1a3a8f, ${AZUL})`, color: '#fff' }}>
              <Upload size={16} />
              {etapaUpload === 'enviando' ? t('docEnviando') : etapaUpload === 'concluido' ? t('docEnviado') : t('docEnviar')}
            </button>
          </div>

          <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#5a7a9a' }}>{t('docChecklistTitulo')} ({anoDocSelecionado})</p>
            <div className="flex flex-wrap gap-2">
              {checklistDocItens.map((item) => (
                <div key={item.tipo} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: item.presente ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.1)', border: `1px solid ${item.presente ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.25)'}`, color: item.presente ? VERDE : VERMELHO }}>
                  {item.presente ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  {TIPO_DOC_LABEL[item.tipo][lang]}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {anosComDocumentos.map((a) => (
                <button key={a} onClick={() => setAnoDocSelecionado(a)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={a === anoDocSelecionado ? { background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' } : { background: 'rgba(255,255,255,0.04)', color: '#5a7a9a' }}>
                  {a}
                </button>
              ))}
            </div>
            <select value={filtroTipoDoc} onChange={(e) => setFiltroTipoDoc(e.target.value as TipoDocumentoFiscal | 'todos')}
              className="px-3 py-1.5 rounded-lg text-xs ml-auto" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }}>
              <option value="todos" style={{ background: '#020810', color: '#c8d8f0' }}>{t('docTodos')}</option>
              {TIPOS_DOCUMENTO_FISCAL.map((tp) => <option key={tp} value={tp} style={{ background: '#020810', color: '#c8d8f0' }}>{TIPO_DOC_LABEL[tp][lang]}</option>)}
            </select>
          </div>

          {documentosFiltrados.length === 0 ? (
            <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('docListaVazia')}</p>
          ) : (
            <>
              <div className="space-y-2">
                {documentosPaginaAtual.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${AZUL}20` }}>
                    {editandoDocId === doc.id ? (
                      <div className="space-y-2">
                        <select value={editTipoDoc} onChange={(e) => setEditTipoDoc(e.target.value as TipoDocumentoFiscal)}
                          className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }}>
                          {TIPOS_DOCUMENTO_FISCAL.map((tp) => <option key={tp} value={tp} style={{ background: '#020810', color: '#c8d8f0' }}>{TIPO_DOC_LABEL[tp][lang]}</option>)}
                        </select>
                        <input type="text" value={editDescricaoDoc} onChange={(e) => setEditDescricaoDoc(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${AZUL}30`, color: '#c8d8f0' }} />
                        <div className="flex gap-2">
                          <button onClick={() => salvarEdicaoDoc(doc.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: VERDE, color: '#020810' }}>
                            <Check size={12} /> {t('docSalvar')}
                          </button>
                          <button onClick={cancelarEdicaoDoc} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#c8d8f0' }}>
                            <X size={12} /> {t('docCancelar')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate" style={{ color: '#c8d8f0' }}>{doc.nome_arquivo}</p>
                          <p className="text-[10px]" style={{ color: '#5a7a9a' }}>
                            {TIPO_DOC_LABEL[doc.tipo][lang]}{doc.descricao ? ` · ${doc.descricao}` : ''} · {fmtBytes(doc.tamanho_bytes)} · {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => visualizarDocumento(doc)} className="p-2 rounded-lg" style={{ background: `${VERDE}15`, border: `1px solid ${VERDE}30` }} title={t('docVisualizar')}>
                            <Eye size={14} style={{ color: VERDE }} />
                          </button>
                          <button onClick={() => iniciarEdicaoDoc(doc)} className="p-2 rounded-lg" style={{ background: `${AZUL}15`, border: `1px solid ${AZUL}30` }} title={t('docEditar')}>
                            <Pencil size={14} style={{ color: AZUL }} />
                          </button>
                          <button onClick={() => excluirDocumento(doc)} className="p-2 rounded-lg" style={{ background: `${VERMELHO}15`, border: `1px solid ${VERMELHO}30` }} title={t('docExcluir')}>
                            <Trash2 size={14} style={{ color: VERMELHO }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {documentosFiltrados.length > ITENS_POR_PAGINA_DOC && (
                <div className="flex items-center justify-between mt-4">
                  <button onClick={() => setPaginaDocumentos((p) => Math.max(0, p - 1))} disabled={paginaDocumentos === 0}
                    className="p-2 rounded-lg disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <ChevronLeft size={16} style={{ color: '#c8d8f0' }} />
                  </button>
                  <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('docPaginaLbl').replace('{a}', String(paginaDocumentos + 1)).replace('{b}', String(totalPaginasDoc))}</p>
                  <button onClick={() => setPaginaDocumentos((p) => Math.min(totalPaginasDoc - 1, p + 1))} disabled={paginaDocumentos >= totalPaginasDoc - 1}
                    className="p-2 rounded-lg disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <ChevronRight size={16} style={{ color: '#c8d8f0' }} />
                  </button>
                </div>
              )}
            </>
          )}
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
    </>
  )
}
