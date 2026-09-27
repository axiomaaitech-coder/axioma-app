'use client'
// ═══════════════════════════════════════════════════════════════
// "Converse com o José" — chat do Nexus, logo acima da TV.
// Conversa é uso frequente → OpenAI (regra de roteamento de IA do Axioma),
// via /api/ia-chat (só logado). O José só pode usar o contexto montado aqui:
// indicadores oficiais, eventos detectados, as leituras que ele já fez e os
// números da empresa (ponto de partida do simulador). Nada inventado.
// Histórico fica só na tela (sessão); "Nova conversa" zera.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, RotateCcw } from 'lucide-react'
import { JosephAvatar } from '../../../components/JosephAvatar'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import { obterLeiturasRecentes, type EventoNexus, type IndicadorNexus } from '../../../lib/nexusHelpers'
import { textoEvento } from '../../../lib/nexusEventDetector'
import { carregarPontoPartida, type PontoPartida } from '../../../lib/nexusSimulacaoHelpers'

type Lang = 'pt' | 'en' | 'es'
type Msg = { role: 'user' | 'assistant'; content: string }
const BARRA = <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
const fBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
const MAX_HISTORICO = 10

const SUGESTOES: [string, string, string][] = [
  ['O que o último corte da Selic muda para a minha empresa?', 'What does the latest Selic cut change for my company?', '¿Qué cambia el último recorte de la Selic para mi empresa?'],
  ['Devo me preocupar com o dólar agora?', 'Should I worry about the dollar now?', '¿Debo preocuparme por el dólar ahora?'],
  ['Como proteger meu caixa nos próximos 12 meses?', 'How do I protect my cash over the next 12 months?', '¿Cómo protejo mi caja en los próximos 12 meses?'],
  ['Resuma o cenário econômico desta semana', "Summarize this week's economic picture", 'Resuma el panorama económico de esta semana'],
]

export function JosephChat({ lang, temaClaro, indicadores, eventos }: { lang: Lang; temaClaro: boolean; indicadores: IndicadorNexus[]; eventos: EventoNexus[] }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG, NESTED_BG } = PALETA[temaClaro ? 'xms' : 'dark']
  const [mensagens, setMensagens] = useState<Msg[]>([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [leituras, setLeituras] = useState<{ titulo: string; data: string | null; leitura: string | null }[]>([])
  const [ponto, setPonto] = useState<PontoPartida | null>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    obterLeiturasRecentes(lang).then(setLeituras)
    carregarPontoPartida().then((r) => setPonto(r.ponto)).catch(() => setPonto(null))
  }, [lang])

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [mensagens, pensando])

  function montarContexto(): string {
    const ind = indicadores.filter((i) => i.valor != null).map((i) => `- ${i.nome.pt}: ${i.valor} (referência ${i.dataReferencia})`).join('\n')
    const evs = eventos.slice(0, 8).map((e) => {
      const t = e.payload ? textoEvento(e.payload, 'pt') : { titulo: e.tituloPt, descricao: e.descricaoPt ?? '' }
      return `- ${e.publicadoEm?.slice(0, 10) ?? ''}: ${t.titulo}. ${t.descricao}`
    }).join('\n')
    const leit = leituras.filter((l) => l.leitura).map((l) => `- ${l.titulo}: ${l.leitura}`).join('\n')
    const emp = ponto?.temDados
      ? `Receita média/mês ${fBRL(ponto.receitaMensal)}; custos/mês ${fBRL(ponto.custoFixoMensal + ponto.custoVariavelMensal)}; lucro/mês ${fBRL(ponto.lucroMensal)}; dívida ${fBRL(ponto.dividaTotal)}; caixa disponível ${fBRL(ponto.caixaDisponivel)}.`
      : 'A empresa ainda não tem receitas/custos suficientes cadastrados no Axioma.'
    return `Você é José, a inteligência do Radar Global do Axioma Nexus — inspirado em José do Egito, que interpretou os sinais e preparou o Egito para os anos de fartura e de seca. Você conversa com o dono de uma pequena ou média empresa brasileira, como um CFO experiente, calmo e prático.

Regras:
- Use SOMENTE os dados abaixo. Nunca invente número, data, notícia, lei ou fonte. Se a pergunta pedir algo que não está aqui, diga com clareza que o Axioma ainda não tem esse dado.
- Nunca afirme certeza sobre o futuro; fale em cenário mais provável e no que pode mudar.
- Não recomende compra ou venda de investimento específico.
- Respostas curtas (até 3 parágrafos curtos), linguagem simples, e termine com uma ação prática para a empresa.
- Pode usar a imagem de José do Egito (celeiros, anos de fartura e de seca) de vez em quando, sem exagero.
- Nunca diga que é uma IA, modelo de linguagem, OpenAI, ChatGPT, Claude ou Anthropic. Você é o José, do Axioma.
- Responda em ${lang === 'en' ? 'English' : lang === 'es' ? 'español' : 'português do Brasil'}.

INDICADORES OFICIAIS (Banco Central/IBGE):
${ind || '- indisponíveis'}

EVENTOS DETECTADOS PELO RADAR GLOBAL:
${evs || '- nenhum'}

LEITURAS QUE VOCÊ JÁ FEZ:
${leit || '- nenhuma ainda'}

EMPRESA DO USUÁRIO (média dos últimos 12 meses):
${emp}

Hoje: ${new Date().toISOString().slice(0, 10)}.`
  }

  async function enviar(pergunta: string) {
    const p = pergunta.trim()
    if (!p || pensando) return
    const historico = mensagens.slice(-MAX_HISTORICO)
    setMensagens((m) => [...m, { role: 'user', content: p }])
    setTexto('')
    setPensando(true)
    try {
      const res = await fetch('/api/ia-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: p, historico, contexto: montarContexto(), provedor: 'openai' }),
      })
      const json = await res.json().catch(() => null)
      const resposta = res.ok && typeof json?.resposta === 'string' && json.resposta.trim()
        ? json.resposta.trim()
        : L('Não consegui interpretar agora — tente de novo em instantes.', "I couldn't interpret that right now — try again in a moment.", 'No pude interpretar ahora — intente de nuevo en unos instantes.')
      setMensagens((m) => [...m, { role: 'assistant', content: resposta }])
    } catch {
      setMensagens((m) => [...m, { role: 'assistant', content: L('Sem conexão agora — tente de novo em instantes.', 'No connection right now — try again in a moment.', 'Sin conexión ahora — intente de nuevo en unos instantes.') }])
    }
    setPensando(false)
  }

  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(texto) }
  }

  const bolhaUser: CSSProperties = temaClaro ? { background: '#101b3d', color: '#ffffff' } : { background: `${CIANO}22`, color: '#e2ecf7', border: `1px solid ${CIANO}40` }
  const bolhaJoseph: CSSProperties = temaClaro ? { background: 'rgba(255,255,255,0.7)', color: '#101b3d', border: '1px solid rgba(16,27,61,0.12)' } : { background: NESTED_BG, color: TEXTO, border: '1px solid rgba(255,255,255,0.08)' }
  const chip: CSSProperties = temaClaro ? { background: 'rgba(16,27,61,0.06)', color: '#101b3d', border: '1px solid rgba(16,27,61,0.14)' } : { background: 'rgba(255,255,255,0.05)', color: TEXTO, border: '1px solid rgba(255,255,255,0.1)' }
  const qtdLeituras = leituras.filter((l) => l.leitura).length

  return (
    <section className="relative overflow-hidden rounded-2xl axi-card-premium3d" style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
      {BARRA}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Identidade do José + o que ele sabe agora */}
        <aside className="p-5 flex flex-col items-center text-center lg:border-r" style={{ borderColor: temaClaro ? 'rgba(16,27,61,0.1)' : 'rgba(255,255,255,0.06)' }}>
          <JosephAvatar tamanho={104} estado={pensando ? 'pensando' : 'parado'} />
          <h2 className="text-lg font-black mt-3" style={{ color: TITULO }}>{L('Converse com o José', 'Talk to José', 'Converse con José')}</h2>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: TEXTO, opacity: 0.85 }}>
            {L('Como José no Egito: ler os sinais de hoje para se preparar para as vacas magras.', 'Like José in Egypt: read today’s signs to prepare for the lean years.', 'Como José en Egipto: leer las señales de hoy para prepararse para las vacas flacas.')}
          </p>
          <div className="w-full mt-4 text-left rounded-xl p-3" style={{ background: NESTED_BG, border: temaClaro ? '1px solid rgba(16,27,61,0.12)' : '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-bold mb-1.5" style={{ color: CINZA }}>{L('O que o José está vendo agora', 'What José sees right now', 'Lo que José ve ahora')}</p>
            <ul className="space-y-1 text-[11px]" style={{ color: TEXTO }}>
              <li>📊 {indicadores.filter((i) => i.valor != null).length} {L('indicadores oficiais', 'official indicators', 'indicadores oficiales')}</li>
              <li>🌎 {eventos.length} {L('eventos do Radar Global', 'Global Radar events', 'eventos del Radar Global')}</li>
              <li>🧠 {qtdLeituras} {L('leituras já feitas', 'readings done', 'lecturas hechas')}</li>
              <li>🏢 {ponto?.temDados ? L('números da sua empresa', 'your company’s numbers', 'números de su empresa') : L('sua empresa (sem dados ainda)', 'your company (no data yet)', 'su empresa (sin datos aún)')}</li>
            </ul>
          </div>
        </aside>

        {/* Conversa */}
        <div className="flex flex-col p-4 sm:p-5 min-h-[420px]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs" style={{ color: CINZA }}>{L('Ele só usa os dados do Axioma — nada inventado. Não é recomendação de investimento.', 'He only uses Axioma data — nothing made up. Not investment advice.', 'Solo usa datos de Axioma — nada inventado. No es recomendación de inversión.')}</p>
            {mensagens.length > 0 && (
              <button onClick={() => setMensagens([])} className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg" style={chip}>
                <RotateCcw size={11} aria-hidden />{L('Nova conversa', 'New chat', 'Nueva conversación')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px]" aria-live="polite">
            {mensagens.length === 0 && !pensando && (
              <div className="flex items-start gap-2.5">
                <JosephAvatar tamanho={32} />
                <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%]" style={bolhaJoseph}>
                  {L('Olá! Eu sou o José. Acompanho os indicadores oficiais e os acontecimentos da economia para dizer o que eles significam para a sua empresa. Pergunte o que quiser — ou escolha uma das sugestões abaixo.', "Hi! I'm José. I follow official indicators and economic events to tell you what they mean for your company. Ask anything — or pick a suggestion below.", '¡Hola! Soy José. Sigo los indicadores oficiales y los hechos de la economía para decirle qué significan para su empresa. Pregunte lo que quiera — o elija una sugerencia abajo.')}
                </div>
              </div>
            )}
            {mensagens.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={m.role === 'user' ? 'flex justify-end' : 'flex items-start gap-2.5'}>
                {m.role === 'assistant' && <JosephAvatar tamanho={32} />}
                <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] rounded-2xl ${m.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                  style={m.role === 'user' ? bolhaUser : bolhaJoseph}>
                  {m.content}
                </div>
              </motion.div>
            ))}
            <AnimatePresence>
              {pensando && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5" role="status">
                  <JosephAvatar tamanho={32} estado="pensando" />
                  <div className="flex items-end gap-1 px-3.5 py-2.5 rounded-2xl rounded-tl-sm" style={bolhaJoseph}>
                    <span className="text-xs font-semibold mr-1.5">{L('José interpretando os sinais', 'José interpreting the signs', 'José interpretando las señales')}</span>
                    {[0, 1, 2].map((k) => (
                      <motion.span key={k} className="w-1 rounded-full" style={{ background: '#f5a623' }}
                        animate={{ height: [4, 12, 4] }} transition={{ duration: 0.9, repeat: Infinity, delay: k * 0.15 }} aria-hidden />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={fimRef} />
          </div>

          {mensagens.length === 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGESTOES.map((s) => (
                <button key={s[0]} onClick={() => enviar(L(...s))} className="text-xs font-semibold px-3 py-1.5 rounded-full text-left" style={chip}>{L(...s)}</button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 mt-3">
            <textarea
              value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={aoTeclar} rows={1} maxLength={600}
              placeholder={L('Pergunte ao José… (Enter envia)', 'Ask José… (Enter sends)', 'Pregunte a José… (Enter envía)')}
              aria-label={L('Mensagem para o José', 'Message to José', 'Mensaje para José')}
              className="flex-1 resize-none px-3.5 py-2.5 rounded-xl text-sm max-h-32"
              style={temaClaro ? { background: '#ffffff', border: '1px solid rgba(16,27,61,0.18)', color: '#101b3d' } : { background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(106,176,255,0.2)', color: '#e2ecf7' }}
            />
            <button onClick={() => enviar(texto)} disabled={!texto.trim() || pensando} aria-label={L('Enviar', 'Send', 'Enviar')}
              className="shrink-0 flex items-center justify-center rounded-xl disabled:opacity-50" style={{ ...VERDE_SOLIDO, width: 44, height: 44 }}>
              <Send size={17} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
