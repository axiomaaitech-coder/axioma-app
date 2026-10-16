'use client'
// ═══════════════════════════════════════════════════════════════
// "Converse com o José" — chat do Nexus, logo acima da TV.
// Conversa é uso frequente → OpenAI (regra de roteamento de IA do Axioma),
// via o motor de IA (lib/ia/cliente.ts) (só logado). O José só pode usar o contexto montado aqui:
// indicadores oficiais, eventos detectados, as leituras que ele já fez e os
// números da empresa (ponto de partida do simulador). Nada inventado.
// Histórico fica só na tela (sessão); "Nova conversa" zera.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cinzel } from './fonteJose'
import { Send, RotateCcw, Headphones } from 'lucide-react'
import { JosephAvatar } from '../../../components/JosephAvatar'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import { obterLeiturasRecentes, obterManchetesRecentes, obterHorizontesPainel, obterResumoPlacar, type EventoNexus, type IndicadorNexus, type EconomiaMundial } from '../../../lib/nexusHelpers'
import { textoEvento, nomeSerie } from '../../../lib/nexusEventDetector'
import { ramoDoCnae } from '../../../lib/ia/setores'
import { carregarPontoPartida, type PontoPartida } from '../../../lib/nexusSimulacaoHelpers'
import { PlanoJose } from './PlanoJose'
import { perguntarAoAxioma } from '../../../lib/ia/cliente'
import { hojeISO } from '../../../lib/datas'
import BotaoVoz from '../../../components/BotaoVoz'
import OuvirResposta from '../../../components/OuvirResposta'
import { BotaoAbrirRelatorio, type PedidoTela } from '../../../components/RelatorioCFO'
import ConversaAoVivo from '../../../components/ConversaAoVivo'
import { juntarTexto } from '../../../lib/voz/gravador'
import { falar, pararFala, situacaoVoz } from '../../../lib/voz/reprodutor'

type Lang = 'pt' | 'en' | 'es'

// Fonte de personagem, SÓ na apresentação do José (pedido do Elias): letra de
// forma de inscrição antiga (Cinzel). O resto do Axioma continua em Geist.

// "Grifado" animado: marca-texto verde-menta que corre por baixo do texto.
function Grifo({ children, cor }: { children: React.ReactNode; cor: string }) {
  return (
    <motion.span
      initial={{ backgroundSize: '0% 42%' }} animate={{ backgroundSize: '100% 42%' }}
      transition={{ duration: 1.1, delay: 0.3, ease: 'easeOut' }}
      style={{ backgroundImage: `linear-gradient(${cor}, ${cor})`, backgroundRepeat: 'no-repeat', backgroundPosition: '0 88%', padding: '0 2px' }}
    >
      {children}
    </motion.span>
  )
}
type Msg = { role: 'user' | 'assistant'; content: string; assinatura?: string; ressalva?: boolean; relatorio?: PedidoTela | null }
const BARRA = <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
const fBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
const MAX_HISTORICO = 10

const SUGESTOES: [string, string, string][] = [
  ['O que o último corte da Selic muda para a minha empresa?', 'What does the latest Selic cut change for my company?', '¿Qué cambia el último recorte de la Selic para mi empresa?'],
  ['Devo me preocupar com o dólar agora?', 'Should I worry about the dollar now?', '¿Debo preocuparme por el dólar ahora?'],
  ['Como proteger meu caixa nos próximos 12 meses?', 'How do I protect my cash over the next 12 months?', '¿Cómo protejo mi caja en los próximos 12 meses?'],
  ['Resuma o cenário econômico desta semana', "Summarize this week's economic picture", 'Resuma el panorama económico de esta semana'],
]

export function JosephChat({ lang, temaClaro, indicadores, eventos, mundo }: { lang: Lang; temaClaro: boolean; indicadores: IndicadorNexus[]; eventos: EventoNexus[]; mundo: EconomiaMundial | null }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG, NESTED_BG } = PALETA[temaClaro ? 'xms' : 'dark']
  const [mensagens, setMensagens] = useState<Msg[]>([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [leituras, setLeituras] = useState<{ titulo: string; data: string | null; leitura: string | null }[]>([])
  const [ponto, setPonto] = useState<PontoPartida | null>(null)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [manchetes, setManchetes] = useState<{ titulo: string; canal: string | null; data: string | null }[]>([])
  const [horizontes, setHorizontes] = useState<{ data: string; texto: string } | null>(null)
  const [placar, setPlacar] = useState('')
  const fimRef = useRef<HTMLDivElement>(null)
  // Conversa (Voice Intelligence, Fase B): id só para agrupar na auditoria; pedido em andamento para
  // poder ser abandonado quando a pessoa corrige ("na verdade, quero setembro").
  const conversaId = useRef<string>('')
  const pedidoRef = useRef<AbortController | null>(null)
  const [vozLiberada, setVozLiberada] = useState(false)
  const [modoConversa, setModoConversa] = useState(false)
  useEffect(() => { if (!conversaId.current) conversaId.current = crypto.randomUUID() }, [])
  useEffect(() => {
    if (!empresaId) return
    let vivo = true
    situacaoVoz(empresaId).then((s) => { if (vivo) setVozLiberada(s.ativa) })
    return () => { vivo = false }
  }, [empresaId])
  // Saiu da tela: abandona a pergunta digitada pendente (a voz e a conversa ao vivo continuam — barra fixa)
  useEffect(() => () => { pedidoRef.current?.abort() }, [])

  useEffect(() => {
    obterLeiturasRecentes(lang).then(setLeituras)
    obterManchetesRecentes().then(setManchetes)
    obterHorizontesPainel(lang).then(setHorizontes)
    obterResumoPlacar().then(setPlacar)
    carregarPontoPartida().then((r) => { setPonto(r.ponto); setEmpresaId(r.empresaId) }).catch(() => setPonto(null))
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
    const ramo = ramoDoCnae(ponto?.cnae)
    const empRamo = ponto?.cnae
      ? `Atividade (CNAE): ${ponto.cnae}${ramo ? `. Ramo: ${ramo.nome}; indicadores que mais pesam nele: ${ramo.series.map((s) => nomeSerie(s, 'pt')).join(', ')}.` : '.'}`
      : 'Atividade (CNAE) não cadastrada na tela Empresa — fale do impacto para uma empresa típica e sugira cadastrar o CNAE.'
    return `Você é José, a inteligência do Radar Global do Axioma Nexus — inspirado em José do Egito, que interpretou os sinais e preparou o Egito para os anos de fartura e de seca. Você conversa com o dono de uma pequena ou média empresa brasileira, como um CFO experiente, calmo e prático.

Regras:
- PRECISÃO NO TEMA: comece respondendo, em 1 ou 2 frases, EXATAMENTE o que foi perguntado e no assunto da pergunta. Depois traga só o contexto que tem ligação direta com ela — não troque o assunto por outro indicador, notícia ou evento que não foi perguntado.
- Se a pergunta parecer incompleta ou com palavra estranha (pode ter vindo do ditado por voz), diga em uma frase o que você entendeu e responda a isso; se não der para entender, peça para a pessoa repetir.
- Use SOMENTE os dados abaixo. Nunca invente número, data, notícia, lei ou fonte. Se a pergunta pedir algo que não está aqui, diga com clareza que o Axioma ainda não tem esse dado.
- Nunca afirme certeza sobre o futuro; fale em cenário mais provável e no que pode mudar.
- Não recomende compra ou venda de investimento específico.
- Respostas curtas (até 3 parágrafos curtos), linguagem simples, e termine com uma ação prática para a empresa.
- Pode usar a imagem de José do Egito (celeiros, anos de fartura e de seca) de vez em quando, sem exagero.
- Manchetes são "relatado por fonte jornalística": use para citar conflitos, acordos comerciais, sanções ou movimentos de mercado no mundo, sempre dizendo que é notícia, não dado oficial.
- PERGUNTAS DE FUTURO ("como a economia pode afetar minha empresa em N anos"): responda em até 5 parágrafos curtos, nesta ordem: (1) cenário mais provável para o período; (2) o que isso tende a fazer com o caixa e o lucro DESTA empresa, usando os números dela (direção e ordem de grandeza — sem inventar número exato); (3) fatores do mundo e do Brasil que mais pesam (câmbio, juros, inflação, conflitos, acordos comerciais), só os que aparecem nos dados; (4) o que fazer agora para chegar bem lá; (5) "Confiança: X/100" — cai com o prazo (cerca de 70 em 1 ano, 50 em 3, 35 em 5, 20 em 10) — e o que falta na base para enxergar melhor (ex.: preço do petróleo, dados de outros países).
- Para prazos de 5 anos ou mais, fale de tendências estruturais como hipótese, nunca como previsão.
- PESO POR RAMO: ao falar de eventos e cenários, dê prioridade aos indicadores que mais pesam no ramo desta empresa (abaixo) e diga por que eles importam para esse tipo de negócio; os demais, cite só se forem relevantes.
- Se perguntarem se dá pra confiar em você ou quanto você acerta, responda com o SEU PLACAR abaixo, com honestidade (inclusive os erros).
- Nunca diga que é uma IA, modelo de linguagem, OpenAI, ChatGPT, Claude ou Anthropic. Você é o José, do Axioma.
- Responda em ${lang === 'en' ? 'English' : lang === 'es' ? 'español' : 'português do Brasil'}.

INDICADORES OFICIAIS (Banco Central, IBGE; yuan via Banco Central Europeu):
${ind || '- indisponíveis'}

ECONOMIA MUNDIAL (fontes oficiais gratuitas):
${mundo?.brent?.valor != null ? `- Petróleo Brent: US$ ${mundo.brent.valor} (ref. ${mundo.brent.dataReferencia}; ~30 pregões antes: US$ ${mundo.brent.historico[0]?.valor ?? '?'}) — IPEA/EIA` : '- Petróleo: ainda sem dado'}
${(mundo?.paises ?? []).filter((p) => p.ano).map((p) => `- ${p.iso}: PIB ${p.pib ?? '?'}% e inflação ${p.inflacao ?? '?'}% em ${p.ano} — Banco Mundial`).join('\n') || '- Parceiros: ainda sem dado'}
${(mundo?.materias ?? []).filter((m) => m.valor != null).map((m) => `- ${m.nome.pt}: ${m.valor} ${m.codigo === 'FMI:CAFE' ? 'US¢/lb' : 'US$/t'} (média de ${m.dataReferencia?.slice(0, 7)}; 12 meses antes: ${m.historico.at(-13)?.valor ?? '?'}) — FMI`).join('\n') || '- Matérias-primas: ainda sem dado'}
${(mundo?.combustiveis ?? []).filter((m) => m.valor != null).map((m) => `- ${m.nome.pt} nos postos: R$ ${m.valor} (semana até ${m.dataReferencia}; 4 semanas antes: ${m.historico.at(-5)?.valor ?? '?'}) — ANP`).join('\n') || '- Combustíveis: ainda sem dado'}
${(mundo?.comercio ?? []).filter((m) => m.valor != null).map((m) => `- ${m.nome.pt}: ${m.valor}${m.codigo.startsWith('COMEX:') ? ' US$ bi no mês' : ' (100 = tendência; acima = aceleração à frente)'} (ref. ${m.dataReferencia?.slice(0, 7)}; 12 meses antes: ${m.historico.at(-13)?.valor ?? '?'}) — ${m.codigo.startsWith('COMEX:') ? 'Comex Stat' : 'OCDE'}`).join('\n') || '- Comércio exterior: ainda sem dado'}

EVENTOS DETECTADOS PELO RADAR GLOBAL:
${evs || '- nenhum'}

LEITURAS QUE VOCÊ JÁ FEZ:
${leit || '- nenhuma ainda'}

MANCHETES RECENTES (fonte jornalística, não confirmado oficialmente):
${manchetes.map((m) => `- ${m.data ?? ''} (${m.canal ?? 'geral'}): ${m.titulo}`).join('\n') || '- nenhuma'}

HORIZONTES DO PAINEL EXECUTIVO DE HOJE${horizontes ? ` (${horizontes.data})` : ''}:
${horizontes?.texto || '- ainda não gerado'}

SEU PLACAR DE PREVISÕES (conferido com o dado oficial):
${placar || '- carregando'}

EMPRESA DO USUÁRIO (média dos últimos 12 meses):
${emp}
${empRamo}

Hoje: ${hojeISO()}.`
  }

  async function enviar(pergunta: string) {
    const p = pergunta.trim()
    if (!p) return
    // Pergunta nova durante a análise = correção: a anterior é abandonada (a resposta dela não aparece nem
    // é falada) e continua no histórico, para o José entender "na verdade, quero setembro".
    pedidoRef.current?.abort()
    pararFala()
    const ctrl = new AbortController()
    pedidoRef.current = ctrl
    const historico = mensagens.slice(-MAX_HISTORICO).map(({ role, content }) => ({ role, content }))
    setMensagens((m) => [...m, { role: 'user', content: p }])
    setTexto('')
    setPensando(true)
    // Motor de IA (docs/MOTOR-IA.md): retrato da empresa + tudo que o José vê nesta tela
    // (indicadores, eventos, leituras, manchetes, placar). Pergunta de futuro/plano sobe sozinha pra Anthropic.
    const ia = await perguntarAoAxioma({ pergunta: p, empresaId, tela: 'nexus', lang, historico, contextoTela: montarContexto(), conversaId: conversaId.current, signal: ctrl.signal })
    if (ctrl.signal.aborted) return // corrigida ou saiu da tela: a pergunta mais nova cuida do resto
    const resposta = ia?.resposta ?? L('Não consegui interpretar agora — tente de novo em instantes.', "I couldn't interpret that right now — try again in a moment.", 'No pude interpretar ahora — intente de nuevo en unos instantes.')
    setMensagens((m) => [...m, { role: 'assistant', content: resposta, assinatura: ia?.assinatura, ressalva: !!ia?.ressalva, relatorio: ia?.relatorio ?? null }])
    setPensando(false)
    pedidoRef.current = null
    // Modo conversa: o José responde falando (a pessoa ligou o modo; o microfone só reabre no toque dela)
    if (modoConversa && ia?.resposta && empresaId) void falar({ chave: resposta, texto: resposta, lang, empresaId, assinatura: ia.assinatura, ressalva: !!ia.ressalva })
  }

  // Conversa ao vivo (PoC): cada pergunta de dado que a voz em tempo real faz passa pelo MESMO motor
  // (RLS, consulta obrigatória, avisos, saldo). Resposta curta, própria para ser falada.
  const mensagensRef = useRef(mensagens)
  useEffect(() => { mensagensRef.current = mensagens }, [mensagens])
  async function consultarAoVivo(pergunta: string): Promise<string> {
    const historico = mensagensRef.current.slice(-MAX_HISTORICO).map(({ role, content }) => ({ role, content }))
    const formato = L('FORMATO: resposta para ser FALADA numa conversa ao vivo — no máximo 4 frases curtas, sem listas, valores e período claros; mantenha os rótulos Fato/Estimativa/Cenário e os avisos.', 'FORMAT: answer to be SPOKEN in a live conversation — at most 4 short sentences, no lists, clear amounts and period; keep the Fact/Estimate/Scenario labels and the notes.', 'FORMATO: respuesta para ser HABLADA en una conversación en vivo — máximo 4 frases cortas, sin listas, valores y período claros; mantenga las etiquetas Hecho/Estimación/Escenario y los avisos.')
    const ia = await perguntarAoAxioma({ pergunta, empresaId, tela: 'nexus', lang, historico, contextoTela: `${formato}

${montarContexto()}`, conversaId: conversaId.current })
    return ia?.resposta ?? L('Não foi possível consultar os dados agora.', 'It was not possible to check the data right now.', 'No fue posible consultar los datos ahora.')
  }

  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(texto) }
  }

  const bolhaUser: CSSProperties = temaClaro ? { background: '#101b3d', color: '#ffffff' } : { background: `${CIANO}22`, color: '#e2ecf7', border: `1px solid ${CIANO}40` }
  const bolhaJoseph: CSSProperties = temaClaro ? { background: 'rgba(255,255,255,0.7)', color: '#101b3d', border: '1px solid rgba(16,27,61,0.12)' } : { background: NESTED_BG, color: TEXTO, border: '1px solid rgba(255,255,255,0.08)' }
  const chip: CSSProperties = temaClaro ? { background: '#101b3d', color: '#ffffff', border: '1px solid #101b3d' } : { background: 'rgba(255,255,255,0.05)', color: TEXTO, border: '1px solid rgba(255,255,255,0.1)' }
  const qtdLeituras = leituras.filter((l) => l.leitura).length

  return (
    <section className="relative overflow-hidden rounded-2xl axi-card-premium3d" style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
      {BARRA}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Identidade do José + o que ele sabe agora */}
        {/* Barra lateral isolada do chat: verde-menta forte + letras azul-marinho (Elias 2026-10-15, provisório até decidir a cor) */}
        <aside className="p-5 flex flex-col items-center text-center lg:border-r" style={{ background: '#2ecc9b', borderColor: 'rgba(16,27,61,0.18)' }}>
          <JosephAvatar tamanho={104} estado={pensando ? 'pensando' : 'parado'} />
          <h2 className={`${cinzel.className} text-xl md:text-2xl font-bold mt-3 tracking-wide`} style={{ color: '#101b3d' }}>{L('Converse com o José', 'Talk to José', 'Converse con José')}</h2>
          <p className={`${cinzel.className} text-sm md:text-[15px] font-semibold mt-2 leading-relaxed tracking-wide`} style={{ color: '#101b3d' }}>
            {L('Como José no Egito: ler os sinais de hoje para se preparar para as vacas magras.', 'Like José in Egypt: read today’s signs to prepare for the lean years.', 'Como José en Egipto: leer las señales de hoy para prepararse para las vacas flacas.')}
          </p>
          <div className="w-full mt-4 text-left rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(16,27,61,0.15)' }}>
            <p className="text-[11px] font-bold mb-1.5" style={{ color: '#101b3d' }}>{L('O que o José está vendo agora', 'What José sees right now', 'Lo que José ve ahora')}</p>
            <ul className="space-y-1 text-[11px] font-medium" style={{ color: '#101b3d' }}>
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

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[260px] max-h-[620px]" aria-live="polite">
            {mensagens.length === 0 && !pensando && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-2xl p-4 sm:p-5 flex items-start gap-3 axi-card-premium3d"
                style={{ background: temaClaro ? 'rgba(255,255,255,0.75)' : 'rgba(10,22,40,0.85)', border: '1px solid rgba(46,204,155,0.45)' }}>
                <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
                <JosephAvatar tamanho={52} />
                <div className={`${cinzel.className} min-w-0 tracking-wide`}>
                  <p className="text-xl sm:text-2xl font-bold leading-snug mb-2" style={{ color: TITULO }}>
                    <Grifo cor={temaClaro ? 'rgba(46,204,155,0.45)' : 'rgba(46,204,155,0.35)'}>{L('Olá! Eu sou o José.', "Hi! I'm José.", '¡Hola! Soy José.')}</Grifo>
                  </p>
                  <p className="text-sm sm:text-base font-semibold leading-relaxed" style={{ color: TEXTO }}>
                    {L('Acompanho os indicadores oficiais e os acontecimentos da economia para dizer o que eles significam para a sua empresa. Pergunte o que quiser — ou escolha uma das sugestões abaixo.', 'I follow official indicators and economic events to tell you what they mean for your company. Ask anything — or pick a suggestion below.', 'Sigo los indicadores oficiales y los hechos de la economía para decirle qué significan para su empresa. Pregunte lo que quiera — o elija una sugerencia abajo.')}
                  </p>
                </div>
              </motion.div>
            )}
            {mensagens.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={m.role === 'user' ? 'flex justify-end' : 'flex items-start gap-2.5'}>
                {m.role === 'assistant' && <JosephAvatar tamanho={32} />}
                <div className={`px-4 py-3 text-[15px] md:text-base leading-relaxed whitespace-pre-wrap max-w-[92%] rounded-2xl ${m.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                  style={m.role === 'user' ? bolhaUser : bolhaJoseph}>
                  {m.content}
                  {m.role === 'assistant' && <div><OuvirResposta texto={m.content} lang={lang} assinatura={m.assinatura} ressalva={m.ressalva} empresaId={empresaId} claro={temaClaro} /><BotaoAbrirRelatorio pedido={m.relatorio} lang={lang} /></div>}
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
                      <motion.span key={k} className="w-1 rounded-full" style={{ background: '#2ecc9b' }}
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

          {/* Plano do José pra empresa: 1-3, 4-7, 8-10 anos (análise completa, Etapa 8) */}
          <PlanoJose lang={lang} temaClaro={temaClaro} empresaId={empresaId} />

          <div className="flex items-end gap-2 mt-3">
            <textarea
              value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={aoTeclar} rows={3} maxLength={600}
              placeholder={L('Pergunte ao José… (Enter envia)', 'Ask José… (Enter sends)', 'Pregunte a José… (Enter envía)')}
              aria-label={L('Mensagem para o José', 'Message to José', 'Mensaje para José')}
              className="flex-1 resize-y px-4 py-3 rounded-xl text-[15px] leading-relaxed min-h-[92px] max-h-64"
              style={temaClaro ? { background: '#ffffff', border: '1px solid rgba(16,27,61,0.18)', color: '#101b3d' } : { background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(46,204,155,0.2)', color: '#e2ecf7' }}
            />
            {/* Ditado (Voice Fase 1): só preenche o campo — a pessoa revisa e envia */}
            <BotaoVoz lang={lang} tela="nexus" empresaId={empresaId} claro={temaClaro} onTexto={(x) => (modoConversa ? enviar(x.slice(0, 600)) : setTexto((a) => juntarTexto(a, x).slice(0, 600)))} />
            <button onClick={() => enviar(texto)} disabled={!texto.trim()} aria-label={L('Enviar', 'Send', 'Enviar')}
              className="shrink-0 flex items-center justify-center rounded-xl disabled:opacity-50" style={{ ...VERDE_SOLIDO, width: 44, height: 44 }}>
              <Send size={17} aria-hidden />
            </button>
          </div>
          {/* Conversa ao vivo (PoC tempo real): só com fornecedor liberado para a empresa */}
          <ConversaAoVivo empresaId={empresaId} lang={lang} claro={temaClaro} consultar={consultarAoVivo}
            aoFalar={(quem, t) => setMensagens((m) => [...m, { role: quem === 'voce' ? 'user' : 'assistant', content: t }])} />
          {/* Conversa por voz (Voice Intelligence, Fase B): a fala vai direto para o José e ele responde falando */}
          {vozLiberada && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button type="button" onClick={() => { if (modoConversa) pararFala(); setModoConversa((v) => !v) }} aria-pressed={modoConversa}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold text-white axi-card-premium3d axi-card-faixa"
                style={{ background: modoConversa ? '#0f7a5a' : '#101b3d', border: `1px solid ${modoConversa ? '#2ecc9b' : 'rgba(46,204,155,0.35)'}` }}>
                <Headphones size={14} aria-hidden />
                {modoConversa ? L('Conversa por voz: ligada', 'Voice conversation: on', 'Conversación por voz: activada') : L('Conversa por voz: desligada', 'Voice conversation: off', 'Conversación por voz: desactivada')}
              </button>
              <span className="text-[11px] font-medium" style={{ color: TEXTO }}>
                {modoConversa
                  ? L('Toque em Falar e faça a pergunta: ela vai direto ao José e ele responde falando. Tocar em Falar enquanto ele fala interrompe. Para corrigir, é só perguntar de novo.', 'Tap Speak and ask: it goes straight to José and he answers out loud. Tapping Speak while he talks interrupts him. To correct, just ask again.', 'Toque Hablar y pregunte: va directo a José y él responde hablando. Tocar Hablar mientras habla lo interrumpe. Para corregir, solo pregunte de nuevo.')
                  : L('Ligue para conversar com o José por voz, como numa reunião.', 'Turn on to talk with José by voice, like in a meeting.', 'Actívela para conversar con José por voz, como en una reunión.')}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
