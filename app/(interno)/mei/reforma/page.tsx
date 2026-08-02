'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { AlertTriangle, CheckCircle2, Share2 } from 'lucide-react'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  dasMensalPorCategoria, tetoProporcionalMEI, faturamentoAnoMEI,
  MARCOS_REFORMA_MEI, faseAtualReformaMEI, LIMITE_NANOEMPREENDEDOR,
} from '../../../../lib/meiHelpers'
import { gerarPdfTabela, textoResumoPdf, textoDetalhadoPdf, type ArgsPdfTabela } from '../../../../lib/gerarPdfTabela'
import { CentroCompartilhamento } from '../../../../components/CentroCompartilhamento'
import { meiT } from '../../../../lib/meiTextos'

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
  const [shareAberto, setShareAberto] = useState(false)
  const [analiseIA, setAnaliseIA] = useState<string | null>(null)
  const [analisandoIA, setAnalisandoIA] = useState(false)
  const conteudoRef = useRef<HTMLDivElement>(null)

  const dataHojeStr = new Date().toLocaleDateString(idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR')

  // Fora do `txt` de propósito: valor é array, não string — misturar no
  // mesmo objeto quebra a inferência de tipo do helper t() abaixo.
  const perfilB2BAcoes = {
    pt: ['Conversar com seus principais clientes PJ sobre o que eles esperam a partir de 2027', 'Simular abaixo se migrar pra ME Simples (regime que pode gerar crédito) compensa no seu caso', 'Não decidir sozinho — o crédito de IBS/CBS depende do regime que a EMPRESA cliente também está, vale confirmar com ela'],
    en: ['Talk to your main corporate clients about what they expect from 2027', 'Simulate below whether migrating to ME Simples (a regime that can generate credit) pays off for you', "Don't decide alone — IBS/CBS credit also depends on the CLIENT company's own regime, worth confirming with them"],
    es: ['Conversar con sus principales clientes PJ sobre lo que esperan a partir de 2027', 'Simular abajo si migrar a ME Simples (régimen que puede generar crédito) compensa en su caso', 'No decidir solo — el crédito de IBS/CBS también depende del régimen de la EMPRESA cliente, vale la pena confirmar con ella'],
  }

  const txt = {
    titulo: { pt: 'MEI — Reforma Tributária', en: 'MEI — Tax Reform', es: 'MEI — Reforma Tributaria' },
    subtitulo: { pt: 'O que a Reforma muda no seu MEI — sem pânico, com prazo real', en: "What the Reform changes for your MEI — no panic, with the real deadline", es: 'Lo que la Reforma cambia en su MEI — sin pánico, con el plazo real' },
    impacto: { pt: 'Reforma Tributária — Impacto no MEI', en: 'Tax Reform — MEI Impact', es: 'Reforma Tributaria — Impacto en MEI' },
    simulador: { pt: 'Simulador: MEI vs ME Simples Nacional', en: 'Simulator: MEI vs ME Simples Nacional', es: 'Simulador: MEI vs ME Simples Nacional' },
    porMes: { pt: 'por mês (DAS fixo)', en: 'per month (fixed DAS)', es: 'por mes (DAS fijo)' },
    estimado: { pt: 'estimado/mês (~6%)', en: 'estimated/month (~6%)', es: 'estimado/mes (~6%)' },
    aviso: {
      pt: `* Estimativa com base nas regras vigentes até ${dataHojeStr}, calculada sobre o seu faturamento atual. As alíquotas definitivas do IBS/CBS ainda serão fixadas por lei e podem mudar — este número reflete o melhor entendimento atual, sujeito a regulamentação.`,
      en: `* Estimate based on the rules in effect as of ${dataHojeStr}, calculated from your current revenue. Final IBS/CBS rates are still to be set by law and may change — this figure reflects the best current understanding, subject to regulation.`,
      es: `* Estimación con base en las reglas vigentes hasta ${dataHojeStr}, calculada sobre su facturación actual. Las alícuotas definitivas de IBS/CBS aún serán fijadas por ley y pueden cambiar — este número refleja el mejor entendimiento actual, sujeto a regulación.`,
    },
    timeline: { pt: 'Linha do Tempo — Transição até 2033', en: 'Timeline — Transition until 2033', es: 'Línea de Tiempo — Transición hasta 2033' },
    vocEstaAqui: { pt: 'Você está aqui', en: "You're here", es: 'Usted está aquí' },

    // Tom calmo pra 2026 — diferencial contra concorrentes que assustam o MEI
    calma2026Titulo: { pt: '✅ Boa notícia: em 2026 nada muda no seu bolso', en: '✅ Good news: nothing changes in your pocket in 2026', es: '✅ Buena noticia: en 2026 nada cambia en su bolsillo' },
    calma2026Texto: { pt: 'Em 2026 a Reforma NÃO aumenta seu imposto como MEI — você continua pagando só o DAS, do jeito de sempre. 2026 é um ano-teste: o IBS e a CBS rodam com alíquotas simbólicas (0,9% + 0,1%) só pra ajustar o sistema, sem cobrança real. O MEI fica de fora dessa cobrança de teste.', en: 'In 2026 the Reform does NOT increase your tax as a MEI — you keep paying only the DAS, same as always. 2026 is a test year: IBS and CBS run at symbolic rates (0.9% + 0.1%) just to adjust the system, with no real charge. MEI is not part of this test charge.', es: 'En 2026 la Reforma NO aumenta su impuesto como MEI — usted sigue pagando solo el DAS, como siempre. 2026 es un año de prueba: el IBS y la CBS operan con alícuotas simbólicas (0,9% + 0,1%) solo para ajustar el sistema, sin cobro real. El MEI queda fuera de ese cobro de prueba.' },

    urgencia2027Titulo: { pt: '⚠️ O que pede atenção: a decisão até setembro de 2026', en: '⚠️ What needs attention: the decision by September 2026', es: '⚠️ Lo que requiere atención: la decisión hasta septiembre de 2026' },
    urgencia2027Texto: { pt: 'A urgência real não é 2026 — é a decisão que você precisa tomar ATÉ setembro de 2026 pra valer a partir de 2027: continuar MEI ou migrar pra ME Simples Nacional. Em 2027 a CBS passa a ser cobrada de verdade, o split payment (repasse automático de imposto na hora do pagamento) vira voluntário pra vendas B2B, e a nota fiscal de serviço passa a ser obrigatória.', en: 'The real urgency is not 2026 — it is the decision you must make BY September 2026 to take effect from 2027: stay MEI or migrate to ME Simples Nacional. In 2027 CBS starts being charged for real, split payment (automatic tax remittance at payment time) becomes voluntary for B2B sales, and service invoicing becomes mandatory.', es: 'La urgencia real no es 2026 — es la decisión que debe tomar HASTA septiembre de 2026 para que valga desde 2027: continuar MEI o migrar a ME Simples Nacional. En 2027 la CBS empieza a cobrarse de verdad, el split payment (remesa automática del impuesto al momento del pago) se vuelve voluntario para ventas B2B, y la factura de servicio pasa a ser obligatoria.' },

    perfilTitulo: { pt: 'A Reforma no seu caso específico', en: 'The Reform in your specific case', es: 'La Reforma en su caso específico' },
    perfilNaoConfigurado: { pt: 'Você ainda não configurou o perfil dos seus clientes — o impacto da Reforma é bem diferente se você vende pra empresas ou pra pessoa física. Configure em "Configurar MEI" (tela Painel) pra ver a análise certa pro seu caso. Por ora, aqui estão os dois cenários:', en: 'You haven\'t set your client profile yet — the Reform\'s impact is quite different if you sell to companies or to individuals. Set it in "Configure MEI" (Panel screen) to see the analysis for your case. For now, here are both scenarios:', es: 'Aún no configuró el perfil de sus clientes — el impacto de la Reforma es bastante diferente si vende a empresas o a personas físicas. Configúrelo en "Configurar MEI" (pantalla Panel) para ver el análisis correcto para su caso. Por ahora, aquí están los dos escenarios:' },
    perfilB2BTitulo: { pt: '🏢 Seus clientes são empresas (B2B)', en: '🏢 Your clients are companies (B2B)', es: '🏢 Sus clientes son empresas (B2B)' },
    perfilB2BTexto: { pt: 'Fique de olho no risco de crédito: a partir de 2027, empresas no regime regular preferem fornecedores que geram crédito de IBS/CBS pra elas — e o MEI, no Simples, não gera esse crédito. Isso pode te deixar menos competitivo em cotações contra concorrentes no regime regular.', en: "Watch the credit risk: from 2027, companies in the regular regime prefer suppliers that generate IBS/CBS credit for them — and MEI, under Simples, does not generate that credit. This can make you less competitive in quotes against regular-regime competitors.", es: 'Preste atención al riesgo de crédito: a partir de 2027, las empresas en el régimen regular prefieren proveedores que generen crédito de IBS/CBS para ellas — y el MEI, en el Simples, no genera ese crédito. Esto puede dejarlo menos competitivo en cotizaciones frente a competidores del régimen regular.' },
    perfilB2CTitulo: { pt: '🧑 Seus clientes são pessoa física (B2C)', en: '🧑 Your clients are individuals (B2C)', es: '🧑 Sus clientes son personas físicas (B2C)' },
    perfilB2CTexto: { pt: 'Pode ficar tranquilo: o crédito de IBS/CBS é irrelevante pro consumidor final — ele não usa esse crédito em lugar nenhum. A Reforma quase não afeta o preço que você cobra nem sua competitividade. Seu foco deve ser manter o CNPJ regular, não a Reforma em si.', en: 'You can relax: IBS/CBS credit is irrelevant to the end consumer — they don\'t use that credit anywhere. The Reform barely affects the price you charge or your competitiveness. Your focus should be keeping the CNPJ in good standing, not the Reform itself.', es: 'Puede quedarse tranquilo: el crédito de IBS/CBS es irrelevante para el consumidor final — no lo usa en ningún lugar. La Reforma casi no afecta el precio que cobra ni su competitividad. Su foco debe ser mantener el CNPJ regular, no la Reforma en sí.' },
    perfilAmbosTexto: { pt: 'Como você atende os dois públicos, os dois cenários abaixo se aplicam — o risco de crédito pesa só na fatia B2B da sua carteira.', en: 'Since you serve both audiences, both scenarios below apply — the credit risk only weighs on the B2B slice of your client base.', es: 'Como atiende a ambos públicos, los dos escenarios de abajo se aplican — el riesgo de crédito pesa solo en la parte B2B de su cartera.' },
    configurarPerfil: { pt: 'Configurar perfil de cliente', en: 'Configure client profile', es: 'Configurar perfil de cliente' },

    checklistTitulo: { pt: 'O que fazer agora', en: 'What to do now', es: 'Qué hacer ahora' },
    checklist1: { pt: 'Manter o CNPJ regular — DAS em dia é a base de tudo', en: 'Keep the CNPJ in good standing — an up-to-date DAS is the foundation', es: 'Mantener el CNPJ regular — el DAS al día es la base de todo' },
    checklist2: { pt: 'Manter o cadastro limpo: CNAE e atividade corretos evitam problema na nota fiscal obrigatória de 2027', en: 'Keep your registration clean: correct CNAE and activity avoid trouble with the mandatory 2027 invoicing', es: 'Mantener el registro limpio: CNAE y actividad correctos evitan problemas con la factura obligatoria de 2027' },
    checklist3: { pt: 'Acompanhar o teto anual — estourar o limite muda tudo antes mesmo da Reforma pesar', en: 'Track the annual cap — exceeding the limit changes everything even before the Reform kicks in', es: 'Seguir el límite anual — superarlo cambia todo incluso antes de que la Reforma pese' },
    checklist4: { pt: 'Decidir MEI ou ME até setembro de 2026 — use o simulador abaixo', en: 'Decide MEI or ME by September 2026 — use the simulator below', es: 'Decidir MEI o ME hasta septiembre de 2026 — use el simulador abajo' },
    checklist5: { pt: 'Se seu faturamento é bem baixo (até R$ 40,5 mil/ano), vale conhecer o "Nanoempreendedor" — categoria nova, isenta de IBS/CBS', en: 'If your revenue is quite low (up to R$ 40.5k/year), it\'s worth knowing the "Nanoentrepreneur" — a new category, exempt from IBS/CBS', es: 'Si su facturación es bastante baja (hasta R$ 40,5 mil/año), vale conocer el "Nanoemprendedor" — categoría nueva, exenta de IBS/CBS' },
    verDAS: { pt: 'Ver DAS & Obrigações →', en: 'View DAS & Obligations →', es: 'Ver DAS y Obligaciones →' },
    verFaturamento: { pt: 'Ver Faturamento →', en: 'View Revenue →', es: 'Ver Facturación →' },

    analisarIA: { pt: 'Analisar', en: 'Analyze', es: 'Analizar' },
    analisando: { pt: 'Analisando...', en: 'Analyzing...', es: 'Analizando...' },
    analiseIATitulo: { pt: 'Análise Executiva Axioma', en: 'Axioma Executive Analysis', es: 'Análisis Ejecutivo Axioma' },
    analiseIATransparencia: { pt: 'Análise gerada pela inteligência do Axioma com base nos seus dados reais. Se não for possível gerar agora, cai automaticamente para uma análise por regra.', en: 'Analysis generated by Axioma intelligence based on your real data. If it cannot be generated right now, it automatically falls back to a rule-based analysis.', es: 'Análisis generado por la inteligencia de Axioma con base en sus datos reales. Si no se puede generar ahora, cae automáticamente a un análisis por regla.' },
    creditoAvisoB2B: { pt: 'No seu caso (clientes B2B), o ME Simples pode gerar crédito de IBS/CBS pro seu cliente — um ponto a favor que o MEI não oferece.', en: 'In your case (B2B clients), ME Simples can generate IBS/CBS credit for your client — a point in its favor that MEI does not offer.', es: 'En su caso (clientes B2B), el ME Simples puede generar crédito de IBS/CBS para su cliente — un punto a favor que el MEI no ofrece.' },
  }

  const t = (key: keyof typeof txt) => txt[key][idioma as 'pt' | 'en' | 'es'] ?? txt[key].pt
  const mx = meiT((idioma as 'pt' | 'en' | 'es') || 'pt')

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
  const faturamentoAnual = faturamentoAnoMEI(receitas, anoAtual)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const categoriaMei = meiDados?.categoria_mei || 'Serviços'
  const dasValor = meiDados?.das_valor || dasMensalPorCategoria(categoriaMei)
  const tetoInfo = tetoProporcionalMEI(meiDados?.data_abertura, anoAtual)
  const perfilCliente: 'b2b' | 'b2c' | 'ambos' | null = meiDados?.perfil_cliente || null
  const indiceFaseAtual = faseAtualReformaMEI(anoAtual)

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

  function montarArgsPdfAtual(): ArgsPdfTabela {
    return {
      titulo: t('titulo'),
      subtitulo: `${anoAtual}`,
      colunas: [
        { header: 'Regime', key: 'regime', width: 2 },
        { header: 'Valor/mês', key: 'valor', width: 2, align: 'right' },
      ],
      linhas: [
        { regime: 'MEI (DAS fixo)', valor: fmt(dasValor) },
        { regime: 'ME Simples (estimado ~6%)', valor: fmt((faturamentoAnual * 0.06) / 12) },
      ],
      nomeArquivo: `axioma-mei-reforma-${new Date().toISOString().slice(0, 10)}.pdf`,
    }
  }

  // Timeline honesta, ancorada em MARCOS_REFORMA_MEI (meiHelpers.ts) — datas
  // e regras como constante documentada, fácil de atualizar quando a lei
  // mudar. Cor calma (verde) pro marco 2026 de propósito — nunca vermelho
  // pra algo que ainda não pesa no bolso do MEI.
  const timeline = MARCOS_REFORMA_MEI.map((m) => ({
    ano: String(m.ano),
    cor: m.urgente ? AMBAR : m.ano === 2026 ? VERDE : AZUL,
    urgente: m.urgente,
    desc: m.ano === 2026
      ? { pt: 'Ano-teste: IBS/CBS simbólicos (0,9% + 0,1%). Seu MEI NÃO paga esse imposto — segue só no DAS.', en: 'Test year: symbolic IBS/CBS (0.9% + 0.1%). Your MEI does NOT pay this tax — still only the DAS.', es: 'Año de prueba: IBS/CBS simbólicos (0,9% + 0,1%). Su MEI NO paga ese impuesto — sigue solo con el DAS.' }
      : m.ano === 2027
      ? { pt: 'CBS cobrada de verdade. Split payment vira voluntário pra B2B. Nota fiscal de serviço passa a ser obrigatória.', en: 'CBS charged for real. Split payment becomes voluntary for B2B. Service invoicing becomes mandatory.', es: 'CBS cobrada de verdad. Split payment se vuelve voluntario para B2B. Factura de servicio pasa a ser obligatoria.' }
      : { pt: 'Fim da transição — sistema novo totalmente em vigor.', en: 'End of transition — new system fully in effect.', es: 'Fin de la transición — sistema nuevo totalmente vigente.' },
  }))

  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'

  // ---- Análise Executiva por IA — mesmo padrão funcional e mesmo
  // identificador de modelo ('claude-sonnet-5') confirmados funcionando hoje
  // no IA MEI Advisor e no DAS. Fallback por regra só pra falha real.
  function montarContextoIAReforma(): string {
    const idiomaNome = lang === 'pt' ? 'português' : lang === 'en' ? 'inglês' : 'espanhol'
    const perfilTexto = perfilCliente === 'b2b' ? 'majoritariamente empresas (B2B)' : perfilCliente === 'b2c' ? 'majoritariamente pessoa física (B2C)' : perfilCliente === 'ambos' ? 'mistura de empresas e pessoa física' : 'não informado'
    return `Você é o consultor tributário MEI da Axioma AI.Tech, especialista na Reforma Tributária brasileira (EC 132/2023). Responda em ${idiomaNome}, direto, calmo e prático, em 1ª pessoa como consultor, em até 6 frases. NUNCA alarme sobre 2026 — em 2026 o MEI não paga imposto novo, continua só no DAS. A urgência real é a decisão até setembro de 2026 pra valer em 2027. Nunca invente número fora dos dados abaixo.

DADOS REAIS DESTE MEI:
- Categoria: ${categoriaMei}
- Faturamento acumulado ${anoAtual}: ${fmt(faturamentoAnual)}
- Teto do ano: ${fmt(tetoInfo.teto)}${tetoInfo.proporcional ? ' (proporcional)' : ''}
- DAS mensal: ${fmt(dasValor)}
- Perfil de clientes: ${perfilTexto}

Foque em: o que muda de verdade pro caso dele (considerando o perfil de cliente), o que NÃO muda em 2026, e a decisão prática que precisa tomar até setembro de 2026.`
  }

  function gerarAnaliseFallbackReforma(): string {
    const baseTexto = lang === 'en'
      ? `In 2026, the Reform does not increase your MEI tax — you keep paying only the DAS of ${fmt(dasValor)}/month.`
      : lang === 'es'
      ? `En 2026, la Reforma no aumenta su impuesto MEI — usted sigue pagando solo el DAS de ${fmt(dasValor)}/mes.`
      : `Em 2026, a Reforma não aumenta seu imposto MEI — você continua pagando só o DAS de ${fmt(dasValor)}/mês.`
    const perfilTexto = perfilCliente === 'b2b'
      ? (lang === 'en' ? ' Since your clients are mostly companies, watch the IBS/CBS credit risk from 2027 onward — it may affect your competitiveness.' : lang === 'es' ? ' Como sus clientes son principalmente empresas, esté atento al riesgo de crédito de IBS/CBS desde 2027 — puede afectar su competitividad.' : ' Como seus clientes são principalmente empresas, fique atento ao risco de crédito de IBS/CBS a partir de 2027 — pode afetar sua competitividade.')
      : perfilCliente === 'b2c'
      ? (lang === 'en' ? ' Since your clients are mostly individuals, the credit issue barely affects you — focus on keeping your CNPJ in good standing.' : lang === 'es' ? ' Como sus clientes son principalmente personas físicas, el tema del crédito casi no le afecta — enfóquese en mantener su CNPJ regular.' : ' Como seus clientes são principalmente pessoa física, a questão do crédito quase não te afeta — foque em manter o CNPJ regular.')
      : (lang === 'en' ? " You haven't set your client profile yet — set it to get a more specific analysis." : lang === 'es' ? ' Aún no configuró el perfil de sus clientes — configúrelo para obtener un análisis más específico.' : ' Você ainda não configurou o perfil dos seus clientes — configure pra ter uma análise mais específica.')
    const prazoTexto = lang === 'en'
      ? ` The real deadline is deciding MEI vs ME by September 2026 for it to take effect in 2027.`
      : lang === 'es'
      ? ` El plazo real es decidir MEI vs ME hasta septiembre de 2026 para que valga en 2027.`
      : ` O prazo real é decidir MEI vs ME até setembro de 2026 pra valer em 2027.`
    return baseTexto + perfilTexto + prazoTexto
  }

  async function analisarComIA() {
    setAnalisandoIA(true)
    let resposta = ''
    try {
      const res = await fetch('/api/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: lang === 'en' ? 'Explain how the Tax Reform specifically affects my MEI based on the data below.' : lang === 'es' ? 'Explique cómo la Reforma Tributaria afecta específicamente a mi MEI con base en los datos abajo.' : 'Explique como a Reforma Tributária afeta especificamente o meu MEI com base nos dados abaixo.',
          historico: [],
          contexto: montarContextoIAReforma(),
          modelo: 'claude-sonnet-5',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.resposta) resposta = data.resposta
      }
    } catch {}
    if (!resposta) resposta = gerarAnaliseFallbackReforma()
    setAnaliseIA(resposta)
    setAnalisandoIA(false)
  }

  return (
    <ModuloLayout
      titulo={t('titulo')}
      subtitulo={t('subtitulo')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      botaoExtra={
        <button onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
          <Share2 size={16} /> {mx.compartilhar}
        </button>
      }
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Calmo pra 2026 — diferencial contra concorrente que assusta o MEI */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <CheckCircle2 size={20} style={{ color: VERDE, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: VERDE }}>{t('calma2026Titulo')}</p>
            <p className="text-xs" style={{ color: '#c8d8f0' }}>{t('calma2026Texto')}</p>
          </div>
        </motion.div>

        {/* Urgência real: decisão até setembro/2026 pra valer em 2027 */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={20} style={{ color: AMBAR, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: AMBAR }}>{t('urgencia2027Titulo')}</p>
            <p className="text-xs" style={{ color: '#c8d8f0' }}>{t('urgencia2027Texto')}</p>
          </div>
        </motion.div>

        {/* Reforma personalizada por perfil de cliente */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{t('perfilTitulo')}</p>

          {!perfilCliente && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(106,176,255,0.06)', border: '1px solid rgba(106,176,255,0.15)' }}>
              <p className="text-xs mb-2" style={{ color: '#c8d8f0' }}>{t('perfilNaoConfigurado')}</p>
              <Link href="/mei" className="text-xs font-bold" style={{ color: AZUL }}>{t('configurarPerfil')} →</Link>
            </div>
          )}

          <div className="space-y-4">
            {(perfilCliente === 'b2b' || perfilCliente === 'ambos' || !perfilCliente) && (
              <div className="p-4 rounded-xl" style={{ background: `${AMBAR}08`, border: `1px solid ${AMBAR}20` }}>
                <p className="text-sm font-bold mb-2" style={{ color: '#c8d8f0' }}>{t('perfilB2BTitulo')}</p>
                <p className="text-xs mb-3" style={{ color: '#5a8ab0' }}>{t('perfilB2BTexto')}</p>
                <ul className="space-y-1.5">
                  {perfilB2BAcoes[lang].map((acao, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#c8d8f0' }}>
                      <span style={{ color: AMBAR }}>•</span> {acao}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(perfilCliente === 'b2c' || perfilCliente === 'ambos' || !perfilCliente) && (
              <div className="p-4 rounded-xl" style={{ background: `${VERDE}08`, border: `1px solid ${VERDE}20` }}>
                <p className="text-sm font-bold mb-2" style={{ color: '#c8d8f0' }}>{t('perfilB2CTitulo')}</p>
                <p className="text-xs" style={{ color: '#5a8ab0' }}>{t('perfilB2CTexto')}</p>
              </div>
            )}
            {perfilCliente === 'ambos' && (
              <p className="text-xs" style={{ color: '#5a7a9a' }}>{t('perfilAmbosTexto')}</p>
            )}
          </div>
        </CanvasBox>

        {/* Checklist — o que fazer agora */}
        <CanvasBox cor={AZUL}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{t('checklistTitulo')}</p>
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-3 flex-wrap p-3 rounded-xl" style={{ background: 'rgba(106,176,255,0.05)', border: '1px solid rgba(106,176,255,0.1)' }}>
              <p className="text-xs flex-1" style={{ color: '#c8d8f0' }}>1. {t('checklist1')}</p>
              <Link href="/mei/das" className="text-xs font-bold whitespace-nowrap" style={{ color: AZUL }}>{t('verDAS')}</Link>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(106,176,255,0.05)', border: '1px solid rgba(106,176,255,0.1)' }}>
              <p className="text-xs" style={{ color: '#c8d8f0' }}>2. {t('checklist2')}</p>
            </div>
            <div className="flex items-start justify-between gap-3 flex-wrap p-3 rounded-xl" style={{ background: 'rgba(106,176,255,0.05)', border: '1px solid rgba(106,176,255,0.1)' }}>
              <p className="text-xs flex-1" style={{ color: '#c8d8f0' }}>3. {t('checklist3')}</p>
              <Link href="/mei/faturamento" className="text-xs font-bold whitespace-nowrap" style={{ color: AZUL }}>{t('verFaturamento')}</Link>
            </div>
            <div className="p-3 rounded-xl" style={{ background: `${AMBAR}08`, border: `1px solid ${AMBAR}20` }}>
              <p className="text-xs font-semibold" style={{ color: AMBAR }}>4. {t('checklist4')}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(106,176,255,0.05)', border: '1px solid rgba(106,176,255,0.1)' }}>
              <p className="text-xs" style={{ color: '#c8d8f0' }}>5. {t('checklist5')} ({fmt(LIMITE_NANOEMPREENDEDOR)}/ano)</p>
            </div>
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
          {(perfilCliente === 'b2b' || perfilCliente === 'ambos') && (
            <p className="text-xs text-center mt-3 font-semibold" style={{ color: AMBAR }}>{t('creditoAvisoB2B')}</p>
          )}
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
                    <p className="text-xs font-black mb-0.5" style={{ color: item.cor }}>
                      {item.ano} {i === indiceFaseAtual && <span className="ml-1 px-2 py-0.5 rounded-full text-[9px]" style={{ background: `${item.cor}25`, color: item.cor }}>● {t('vocEstaAqui')}</span>}
                    </p>
                    <p className="text-xs" style={{ color: '#7a9aba' }}>{item.desc[lang]}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CanvasBox>

        {/* Análise Executiva por IA */}
        <CanvasBox cor={OURO}>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-sm font-semibold" style={{ color: '#c8d8f0', fontFamily: "'Georgia','Times New Roman',serif" }}>{t('analiseIATitulo')}</p>
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