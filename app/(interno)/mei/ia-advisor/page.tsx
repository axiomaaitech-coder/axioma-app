'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import ModuloLayout from '../../../../components/ModuloLayout'
import { CanvasBox } from '../../../../components/CanvasBox'
import { Bot, Share2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  LIMITE_ANUAL_MEI, dasMensalPorCategoria, fluxoMesMEI, montarCofre, projecaoTeto,
  type ContaPagarMEI,
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
const FONTE = { fontFamily: "'Georgia','Times New Roman',serif" }

// Respostas por regra baseadas nos dados reais — ver gancho de IA generativa
// no fim do arquivo (chamaria app/api/ia-chat/route.ts quando a chave
// ANTHROPIC_API_KEY for ativada; hoje a explicação é 100% por regra).
function gerarResposta(pergunta: string, dados: {
  faturamento: number, limite: number, percentual: number,
  restante: number, das: string, categoria: string, lang: string
}): string {
  const p = pergunta.toLowerCase()
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const { faturamento, limite, percentual, restante, das, categoria, lang } = dados

  if (p.includes('limit') || p.includes('estourar') || p.includes('81') || p.includes('faturamento')) {
    if (percentual >= 90) return lang === 'pt'
      ? `⚠️ Atenção! Você já usou ${percentual.toFixed(1)}% do limite MEI (${fmt(faturamento)} de ${fmt(limite)}). Só restam ${fmt(restante)}. Você está em zona de risco — considere urgentemente migrar para ME Simples Nacional antes de ultrapassar o limite e ter problemas com a Receita Federal.`
      : `⚠️ Warning! You have used ${percentual.toFixed(1)}% of the MEI limit. Only ${fmt(restante)} remaining. Consider urgently migrating to ME Simples Nacional.`
    if (percentual >= 70) return lang === 'pt'
      ? `📊 Seu faturamento atual é ${fmt(faturamento)}, representando ${percentual.toFixed(1)}% do limite de ${fmt(limite)}. Você ainda tem ${fmt(restante)} disponíveis. No ritmo atual, monitore de perto os próximos meses para não ultrapassar o limite.`
      : `📊 Your current revenue is ${fmt(faturamento)}, representing ${percentual.toFixed(1)}% of the limit. You still have ${fmt(restante)} available.`
    return lang === 'pt'
      ? `✅ Seu faturamento está tranquilo! Você usou apenas ${percentual.toFixed(1)}% do limite (${fmt(faturamento)} de ${fmt(limite)}). Ainda tem ${fmt(restante)} disponíveis para faturar no ano.`
      : `✅ Your revenue is fine! You've used only ${percentual.toFixed(1)}% of the limit. ${fmt(restante)} still available.`
  }

  if (p.includes('das') || p.includes('imposto') || p.includes('pagar') || p.includes('boleto')) {
    return lang === 'pt'
      ? `💡 Seu DAS mensal é de R$ ${das}. O pagamento vence todo dia 20 de cada mês. O DAS cobre INSS, ISS e ICMS de forma simplificada. Nunca atrase — o atraso gera multa de 0,33% ao dia (máximo 20%) mais juros Selic. Para ${categoria}, a alíquota do SIMEI é calculada automaticamente pelo Axioma.`
      : `💡 Your monthly DAS is R$ ${das}. Payment is due every 20th of the month. Never be late — late payment generates a fine of 0.33% per day.`
  }

  if (p.includes('irpf') || p.includes('imposto de renda') || p.includes('declarar') || p.includes('declaração')) {
    const obrigado = faturamento > 33888
    return lang === 'pt'
      ? obrigado
        ? `📋 Com base no seu faturamento de ${fmt(faturamento)}, o Axioma identificou que você pode estar obrigado a declarar IRPF. Acesse o módulo "Imposto de Renda MEI" para ver o cálculo completo personalizado com seus dados reais.`
        : `✅ Com base no seu faturamento atual de ${fmt(faturamento)}, o Axioma calculou que você provavelmente não é obrigado a declarar IRPF (limite de isenção: R$ 33.888/ano). Mas use o módulo "Imposto de Renda MEI" para uma análise completa incluindo outras rendas.`
      : obrigado
        ? `📋 Based on your revenue of ${fmt(faturamento)}, Axioma identified you may be required to file IRPF. Check the Income Tax MEI module for complete calculation.`
        : `✅ Based on your current revenue of ${fmt(faturamento)}, Axioma calculated you are likely not required to file IRPF.`
  }

  if (p.includes('mei ou me') || p.includes('simples') || p.includes('migrar') || p.includes('2027')) {
    return lang === 'pt'
      ? `🔄 A Reforma Tributária 2026 exige uma decisão importante até setembro de 2026. Como MEI ${categoria}, você paga R$ ${das}/mês (DAS fixo). Se migrar para ME Simples Nacional, o imposto seria variável (~6% do faturamento = ${fmt(faturamento * 0.06 / 12)}/mês estimado). O MEI é mais barato se você não ultrapassar R$ 81k/ano. Use o módulo "Reforma Tributária" para ver a simulação completa.`
      : `🔄 The 2026 Tax Reform requires an important decision by September 2026. As MEI ${categoria}, you pay R$ ${das}/month. If you migrate to ME Simples Nacional, the tax would be variable (~6% of revenue).`
  }

  if (p.includes('preço') || p.includes('precific') || p.includes('cobrar') || p.includes('valor') || p.includes('hora')) {
    return lang === 'pt'
      ? `💰 Para ${categoria}, o Axioma recomenda incluir no seu preço: custo real por hora + DAS proporcional + isenção IRPF + margem de lucro mínima de 30%. Use o módulo "Precificação MEI" para calcular exatamente quanto cobrar pelos seus produtos e serviços com base nos seus custos reais.`
      : `💰 For ${categoria}, Axioma recommends including in your price: real hourly cost + proportional DAS + IRPF exemption + minimum profit margin of 30%.`
  }

  if (p.includes('dasn') || p.includes('declaração anual') || p.includes('anual')) {
    return lang === 'pt'
      ? `📄 A DASN-SIMEI é a declaração anual do MEI que deve ser entregue até 31 de maio de cada ano. Você declara o faturamento bruto do ano anterior. Para ${new Date().getFullYear()}, seu faturamento acumulado é de ${fmt(faturamento)}. Acesse o módulo "DAS & Obrigações" para verificar o status da sua declaração.`
      : `📄 DASN-SIMEI is the annual MEI declaration due by May 31st each year. Your current accumulated revenue is ${fmt(faturamento)}.`
  }

  if (p.includes('reforma') || p.includes('ibs') || p.includes('cbs')) {
    return lang === 'pt'
      ? `⚠️ A Reforma Tributária 2026 está em andamento. Os principais impactos para o MEI ${categoria}: IBS e CBS substituem gradualmente PIS, COFINS e ICMS até 2033. O MEI está isento durante a transição. A decisão mais urgente é: continuar como MEI ou migrar para ME em 2027? Acesse o módulo "Reforma Tributária" para a simulação completa.`
      : `⚠️ The 2026 Tax Reform is underway. MEI is exempt during the transition period. The most urgent decision is whether to continue as MEI or migrate to ME in 2027.`
  }

  // Resposta padrão
  return lang === 'pt'
    ? `🤖 Olá! Sou o MEI Advisor da Axioma. Aqui estão seus dados atuais:\n\n📊 Faturamento ${new Date().getFullYear()}: ${fmt(faturamento)}\n📈 Limite usado: ${percentual.toFixed(1)}%\n💰 DAS mensal: R$ ${das}\n🏷️ Categoria: ${categoria}\n\nPosso te ajudar com: limite MEI, DAS, IRPF, Reforma Tributária 2026, precificação e DASN-SIMEI. O que você precisa saber?`
    : `🤖 Hello! I'm the Axioma MEI Advisor. Your current data:\n\nRevenue ${new Date().getFullYear()}: ${fmt(faturamento)}\nLimit used: ${percentual.toFixed(1)}%\nMonthly DAS: R$ ${das}\nCategory: ${categoria}\n\nI can help with: MEI limit, DAS, IRPF, Tax Reform 2026, pricing and DASN-SIMEI.`
}

export default function IAMEIAdvisor() {
  const { idioma } = useLanguage()
  const [meiDados, setMeiDados] = useState<any>(null)
  const [receitas, setReceitas] = useState<any[]>([])
  const [custosVariaveis, setCustosVariaveis] = useState<any[]>([])
  const [custosFixos, setCustosFixos] = useState<any[]>([])
  const [contasPagar, setContasPagar] = useState<ContaPagarMEI[]>([])
  const [chatMensagens, setChatMensagens] = useState<{ role: string; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const conteudoRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const txt = {
    titulo: { pt: 'IA MEI Advisor', en: 'AI MEI Advisor', es: 'IA MEI Advisor' },
    subtitulo: { pt: 'Seu consultor financeiro e fiscal MEI', en: 'Your MEI financial and tax advisor', es: 'Su asesor financiero y fiscal MEI' },
    placeholder: { pt: 'Pergunte sobre seu MEI...', en: 'Ask about your MEI...', es: 'Pregunte sobre su MEI...' },
    enviar: { pt: 'Enviar', en: 'Send', es: 'Enviar' },
    bemvindo: { pt: 'Olá! Sou o MEI Advisor da Axioma. Conheço seus dados reais. Pergunte sobre DAS, limite, IRPF, Reforma Tributária ou precificação.', en: 'Hello! I am the Axioma MEI Advisor. I know your real data. Ask about DAS, limit, IRPF, Tax Reform or pricing.', es: 'Hola! Soy el MEI Advisor de Axioma. Conozco sus datos reales. Pregunte sobre DAS, límite, IRPF, Reforma Tributaria o precios.' },
    transparencia: {
      pt: 'Respostas geradas por IA (Claude) com base nos seus dados reais. Se a IA não responder, cai automaticamente para respostas por regra.',
      en: 'Answers generated by AI (Claude) based on your real data. If the AI fails to respond, it automatically falls back to rule-based answers.',
      es: 'Respuestas generadas por IA (Claude) con base en sus datos reales. Si la IA no responde, cae automáticamente a respuestas por reglas.',
    },
    sugestoes: {
      pt: ['Vou estourar o limite?', 'Preciso declarar IRPF?', 'MEI ou ME em 2027?', 'Como reduzir meus impostos?', 'Qual meu DAS correto?'],
      en: ['Will I exceed the limit?', 'Do I need to declare IRPF?', 'MEI or ME in 2027?', 'How to reduce my taxes?', 'What is my correct DAS?'],
      es: ['¿Superaré el límite?', '¿Necesito declarar IRPF?', '¿MEI o ME en 2027?', '¿Cómo reducir mis impuestos?', '¿Cuál es mi DAS correcto?'],
    },
  }

  const lang = (idioma as 'pt' | 'en' | 'es') || 'pt'
  const mx = meiT(lang)
  const t = (key: keyof typeof txt) => {
    const val = txt[key]
    if (typeof val === 'object' && !Array.isArray(val)) return (val as any)[lang] ?? (val as any).pt
    return val
  }
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => { carregar() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMensagens])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
    const [{ data: mei }, { data: rec }, { data: cv }, { data: cf }, { data: cp }] = await Promise.all([
      supabase.from('mei_dados').select('*').maybeSingle(),
      supabase.from('receitas').select('*'),
      supabase.from('custos_variaveis').select('valor, data, descricao'),
      supabase.from('custos_fixos').select('valor_mensal, descricao'),
      supabase.from('contas_pagar').select('valor_total, valor_pago').neq('status', 'pago').gte('data_vencimento', inicioMes).lte('data_vencimento', fimMes),
    ])
    setMeiDados(mei)
    setReceitas(rec || [])
    setCustosVariaveis(cv || [])
    setCustosFixos(cf || [])
    setContasPagar((cp || []) as ContaPagarMEI[])
  }

  const anoAtual = new Date().getFullYear()
  const faturamentoAnual = receitas.filter(r => new Date(r.data).getFullYear() === anoAtual).reduce((acc, r) => acc + (r.valor || 0), 0)
  const percentualLimite = Math.min(100, (faturamentoAnual / LIMITE_ANUAL_MEI) * 100)
  const restanteLimite = Math.max(0, LIMITE_ANUAL_MEI - faturamentoAnual)
  const categoria = meiDados?.categoria_mei || 'Serviços'
  const dasValor = meiDados?.das_valor || dasMensalPorCategoria(categoria)

  // ---- Cofre Inteligente (mesmo motor do Painel MEI) — dá à IA real o "o que já tem dono" ----
  const mesAtual = new Date().getMonth()
  const receitasMes = receitas.filter(r => { const d = new Date(r.data); return d.getFullYear() === anoAtual && d.getMonth() === mesAtual })
  const custosVarMes = custosVariaveis.filter(c => { if (!c.data) return false; const d = new Date(c.data); return d.getFullYear() === anoAtual && d.getMonth() === mesAtual })
  const fluxo = fluxoMesMEI(receitasMes, custosVarMes, custosFixos)
  const { mediaMensal } = projecaoTeto(receitas, anoAtual, mesAtual, 6)
  const cofre = montarCofre({
    sobraMes: fluxo.sobra,
    receitaMensalMedia: mediaMensal,
    faturamentoAnual,
    categoriaMei: categoria,
    dasValor: parseFloat(String(dasValor)),
    contasPagarAbertas: contasPagar,
    reservaEmergenciaPct: meiDados?.reserva_emergencia_pct ?? null,
  })

  function montarContextoIA(): string {
    const idiomaNome = lang === 'pt' ? 'português' : lang === 'en' ? 'inglês' : 'espanhol'
    return `Você é o MEI Advisor da Axioma AI.Tech — consultor financeiro e fiscal para Microempreendedores Individuais brasileiros. Responda em ${idiomaNome}, direto, prático e acolhedor, em 1ª pessoa como consultor. Nunca invente número fora dos dados abaixo — se faltar dado, diga que não tem essa informação.

DADOS REAIS DESTE MEI:
- Categoria: ${categoria}
- Faturamento acumulado ${anoAtual}: ${fmt(faturamentoAnual)} (${percentualLimite.toFixed(1)}% do limite anual de ${fmt(LIMITE_ANUAL_MEI)}, restam ${fmt(restanteLimite)})
- DAS mensal: ${fmt(dasValor)}
- Cofre Inteligente deste mês (o que já tem dono antes do pró-labore): DAS ${fmt(cofre.das)}, reserva IRPF ${fmt(cofre.irpfReserva)}, compromissos ${fmt(cofre.compromissos)}, reserva de emergência ${fmt(cofre.reservaEmergencia)} — pró-labore seguro real: ${fmt(cofre.proLaboreSeguro)}.`
  }

  async function enviarMensagem() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput
    const historicoAntes = chatMensagens
    setChatMensagens(prev => [...prev, { role: 'user', content: msg }])
    setChatInput('')
    setChatLoading(true)

    let resposta = ''
    try {
      const res = await fetch('/api/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: msg,
          historico: historicoAntes.slice(-10).map(m => ({ role: m.role, content: m.content })),
          contexto: montarContextoIA(),
          modelo: 'claude-sonnet-5',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.resposta) resposta = data.resposta
      }
    } catch {}

    if (!resposta) {
      setToast(mx.iaRespondendoPorRegra)
      setTimeout(() => setToast(null), 4000)
      resposta = gerarResposta(msg, {
        faturamento: faturamentoAnual,
        limite: LIMITE_ANUAL_MEI,
        percentual: percentualLimite,
        restante: restanteLimite,
        das: String(dasValor),
        categoria,
        lang,
      })
    }

    setChatMensagens(prev => [...prev, { role: 'assistant', content: resposta }])
    setChatLoading(false)
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
      pdf.text('AXIOMA AI.TECH — IA MEI Advisor', 14, 13)
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
      pdf.save(`axioma-mei-ia-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  function montarArgsPdfAtual(): ArgsPdfTabela {
    return {
      titulo: t('titulo') as string,
      subtitulo: t('subtitulo') as string,
      colunas: [
        { header: lang === 'pt' ? 'Quem' : lang === 'en' ? 'Who' : 'Quién', key: 'role', width: 1 },
        { header: lang === 'pt' ? 'Mensagem' : lang === 'en' ? 'Message' : 'Mensaje', key: 'content', width: 4 },
      ],
      linhas: chatMensagens.map((m) => ({
        role: m.role === 'user' ? (lang === 'pt' ? 'Você' : lang === 'en' ? 'You' : 'Usted') : 'MEI Advisor',
        content: m.content,
      })),
      nomeArquivo: `axioma-mei-ia-${new Date().toISOString().slice(0, 10)}.pdf`,
    }
  }

  return (
    <ModuloLayout titulo={t('titulo') as string} subtitulo={t('subtitulo') as string} onExportarPDF={exportarPDF} exportando={exportando}
      botaoExtra={
        <button onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
          <Share2 size={16} /> {mx.compartilhar}
        </button>
      }>
      <div ref={conteudoRef} className="space-y-4">

        {toast && (
          <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm text-sm"
            style={{ background: 'rgba(52,211,153,0.95)', color: '#020810', fontWeight: 600 }}>
            {toast}
          </div>
        )}

        {/* Cards contexto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `Faturamento ${anoAtual}`, value: fmt(faturamentoAnual), cor: OURO },
            { label: lang === 'pt' ? 'Limite usado' : lang === 'en' ? 'Limit used' : 'Límite usado', value: `${percentualLimite.toFixed(1)}%`, cor: percentualLimite >= 80 ? VERMELHO : VERDE },
            { label: lang === 'pt' ? 'Categoria MEI' : lang === 'en' ? 'MEI Category' : 'Categoría MEI', value: categoria, cor: AZUL },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#5a7a9a' }}>{card.label}</p>
              <p className="text-lg md:text-xl font-black" style={{ color: card.cor, ...FONTE }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Chat */}
        <CanvasBox cor={OURO}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#c8d8f0', ...FONTE }}>{t('titulo') as string}</p>
          <p className="text-[10px] mb-4" style={{ color: '#5a7a9a' }}>{t('transparencia') as string}</p>

          <div className="h-96 overflow-y-auto rounded-xl p-3 mb-3 space-y-3"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(106,176,255,0.1)' }}>
            {chatMensagens.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Bot size={40} style={{ color: `${OURO}60` }} />
                <p className="text-xs text-center px-4" style={{ color: '#5a7a9a' }}>
                  {(t('bemvindo') as string)}
                </p>
              </div>
            )}
            {chatMensagens.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-3 rounded-xl text-sm whitespace-pre-line"
                  style={{
                    background: msg.role === 'user' ? `${OURO}20` : 'rgba(255,255,255,0.05)',
                    color: '#c8d8f0',
                    border: `1px solid ${msg.role === 'user' ? OURO + '30' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full" style={{ background: OURO }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
              placeholder={t('placeholder') as string}
              className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OURO}20`, color: '#c8d8f0' }} />
            <button onClick={enviarMensagem} disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, #1a3a8f, ${OURO})`, color: '#fff' }}>
              {t('enviar')}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap mt-3">
            {((txt.sugestoes as any)[lang] as string[]).map((q: string, i: number) => (
              <button key={i} onClick={() => setChatInput(q)}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: `${OURO}10`, color: OURO, border: `1px solid ${OURO}25` }}>
                {q}
              </button>
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
        assunto={`${t('titulo') as string} — Axioma`}
        onExportarPDF={() => gerarPdfTabela(montarArgsPdfAtual())}
        cor={OURO}
      />
    </ModuloLayout>
  )
}
