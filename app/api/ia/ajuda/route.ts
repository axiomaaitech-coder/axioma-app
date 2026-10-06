import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { respostaDeAjuda, usoZerado, type Idioma, type MensagemHistorico } from '@/lib/ia/motor'
import { MANUAIS, manualDaRota, manualEmTexto, nomeManual, type ManualAxioma } from '@/lib/documentos/manual'

// POST /api/ia/ajuda { pergunta, lang?, caminho?, historico?, empresa_id? }
// Assistente de Ajuda: explica como usar as telas a partir do Manual de Uso.
// Recebe só a pergunta e a tela aberta — nunca os números da empresa.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_POR_MANUAL = 14000
export const maxDuration = 60

const NOME_IDIOMA: Record<Idioma, string> = { pt: 'português do Brasil', en: 'English', es: 'español' }
const SEM_IA: Record<Idioma, string> = {
  pt: 'Não consegui responder agora. Abra o manual indicado abaixo: ele explica cada botão desta tela, passo a passo.',
  en: 'I could not answer right now. Open the manual below: it explains every button on this screen, step by step.',
  es: 'No pude responder ahora. Abra el manual indicado abajo: explica cada botón de esta pantalla, paso a paso.',
}

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Manual da tela aberta + os 2 que mais combinam com as palavras da pergunta.
function escolherManuais(pergunta: string, caminho: string, lang: Idioma): ManualAxioma[] {
  const daTela = manualDaRota(caminho)
  const palavras = [...new Set(normalizar(pergunta).split(/[^a-z0-9]+/).filter((p) => p.length >= 4))]
  const pontos = MANUAIS.filter((m) => m.numero !== daTela?.numero && m.numero !== '00').map((m) => {
    const texto = normalizar(`${m.nome} ${manualEmTexto(m.doc.pt)} ${lang === 'pt' ? '' : manualEmTexto(m.doc[lang])}`)
    const titulo = normalizar(`${m.nome} ${m.doc[lang].titulo}`)
    let s = 0
    for (const p of palavras) { if (titulo.includes(p)) s += 10; s += Math.min(texto.split(p).length - 1, 5) }
    return { m, s }
  }).filter((x) => x.s >= 3).sort((a, b) => b.s - a.s).slice(0, 2).map((x) => x.m)
  return [...(daTela ? [daTela] : []), ...pontos]
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const corpo = await request.json().catch(() => null)
  const pergunta = typeof corpo?.pergunta === 'string' ? corpo.pergunta.trim().slice(0, 1500) : ''
  const lang: Idioma = corpo?.lang === 'en' || corpo?.lang === 'es' ? corpo.lang : 'pt'
  const caminho = typeof corpo?.caminho === 'string' ? corpo.caminho.slice(0, 120) : ''
  const empresaId = typeof corpo?.empresa_id === 'string' && UUID.test(corpo.empresa_id) ? corpo.empresa_id : null
  const historico: MensagemHistorico[] = (Array.isArray(corpo?.historico) ? corpo.historico : [])
    .filter((m: { role?: unknown; content?: unknown }) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
    .slice(-8).map((m: MensagemHistorico) => ({ role: m.role, content: m.content.slice(0, 2000) }))
  if (!pergunta) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })

  const manuais = escolherManuais(pergunta, caminho, lang)
  const refs = manuais.map((m) => ({ numero: m.numero, nome: nomeManual(m, lang) }))
  const daTela = manualDaRota(caminho)
  const trechos = manuais.map((m) => `=== MANUAL ${m.numero} ===\n${manualEmTexto(m.doc[lang]).slice(0, MAX_POR_MANUAL)}`).join('\n\n')
  const indice = MANUAIS.map((m) => `${m.numero} — ${nomeManual(m, lang)}`).join('\n')

  const sistema = `Você é o Assistente de Ajuda do Axioma, plataforma de gestão financeira e contábil com inteligência embutida. Seu papel: ajudar o usuário a se achar no sistema — onde fica cada função, o que cada botão faz, para onde leva e o que acontece depois de clicar.
Regras:
- Responda SOMENTE com base nos trechos do Manual de Uso abaixo. Nunca invente botão, aba, tela ou regra que não esteja neles.
- Dê o caminho exato (Menu → tela → aba → botão) e o passo a passo numerado quando for uma tarefa.
- Diga o que acontece depois: se salva, se apaga (e se dá para desfazer), se abre outra tela ou janela.
- Se a resposta não estiver nos trechos, diga isso com honestidade e indique, pelo índice, o manual mais provável.
- Você NÃO vê os números da empresa. Para análise dos números (por que o lucro caiu, quanto vou pagar), indique a IA Financeira ou a IA Tributária.
- Texto simples, sem markdown (nada de **, # ou tabelas). Listas com "1." ou "-" em linhas separadas. Seja direto e curto.
- Responda em ${NOME_IDIOMA[lang]}.
Tela aberta agora: ${daTela ? `${daTela.numero} — ${nomeManual(daTela, lang)}` : caminho || 'desconhecida'}.

ÍNDICE DOS MANUAIS:
${indice}

TRECHOS DO MANUAL:
${trechos || '(nenhum manual combinou com a pergunta — use o índice para indicar onde procurar)'}`

  try {
    const uso = usoZerado()
    const resposta = await respostaDeAjuda(sistema, [...historico, { role: 'user', content: pergunta }], uso)
    // Auditoria: quem, qual tela e quanto saiu — nunca o conteúdo.
    after(() => registrarAuditoria({
      empresaId, ator: user.id, acao: 'ia.ajuda', entidade: 'assistente-ajuda', versaoMotor: 'ajuda-1',
      parametros: { caminho, manuais: refs.map((r) => r.numero), lang, respondeu: !!resposta, caracteres_enviados: sistema.length + pergunta.length, tokens_openai: uso.tokensOpenAI },
    }))
    return NextResponse.json({ resposta: resposta ?? SEM_IA[lang], manuais: refs, semIA: !resposta })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ia/ajuda]', msg)
    Sentry.captureException(err instanceof Error ? err : new Error(msg), { extra: { rota: 'ia/ajuda' } })
    return NextResponse.json({ resposta: SEM_IA[lang], manuais: refs, semIA: true })
  }
}
