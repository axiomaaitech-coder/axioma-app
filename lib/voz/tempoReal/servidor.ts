// ═══════════════════════════════════════════════════════════════
// AXIOMA VOICE INTELLIGENCE — Prova de conceito: CONVERSA AO VIVO (voz em tempo real).
// Ouvido e boca = fornecedor de tempo real (Gemini Live ou Qwen Omni Realtime).
// Cérebro = o motor do Axioma: a sessão tem UMA ferramenta, `perguntar_ao_axioma`, que o navegador
// atende chamando /api/ia/motor com a sessão do usuário (RLS, consulta obrigatória, avisos, saldo).
// Aqui: regra de início de sessão e configuração (sem Next/banco/rede → testada em
// scripts/check-voz-tempo-real.mts). A chave do fornecedor nunca sai do servidor:
//   • Gemini: o servidor cria um TOKEN EFÊMERO com a configuração TRAVADA (modelo, instruções,
//     ferramenta, voz) — o navegador não consegue trocar instruções nem ferramentas.
//   • Qwen: o servidor faz a ponte da troca SDP do WebRTC (a chave vai só nessa chamada).
// Liberação: VOZ_TEMPO_REAL=gemini,qwen (fornecedores ligados) E empresa liberada na voz
// (VOZ_EMPRESAS_TESTE/VOZ_ATIVA). Sem microfone permanente e sem palavra-chave (só no toque).
// ═══════════════════════════════════════════════════════════════
import type { IdiomaFala } from '../textoFala'
import { identidadeDaTela } from '../../ia/identidade'

export type FornecedorTR = 'gemini' | 'qwen'
export const FORNECEDORES_TR: FornecedorTR[] = ['gemini', 'qwen']
export const DURACAO_MAX_S = 600 // 10 minutos por sessão
export const SILENCIO_MAX_S = 60 // encerra sozinha depois de 60 s sem ninguém falar
// Telas com conversa ao vivo
export const TELAS_TR = ['nexus', 'ia-financeira', 'ia-tributaria', 'mei-ia-advisor'] as const
export type TelaTR = (typeof TELAS_TR)[number]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type EnvTR = { VOZ_TEMPO_REAL?: string; GEMINI_API_KEY?: string; QWEN_API_KEY?: string }
// Fornecedores ligados por variável E com chave presente
export function fornecedoresTR(env: EnvTR): FornecedorTR[] {
  const ligados = String(env.VOZ_TEMPO_REAL ?? '').toLowerCase().split(/[\s,;]+/)
  return FORNECEDORES_TR.filter((f) => ligados.includes(f) && (f === 'gemini' ? !!env.GEMINI_API_KEY : !!env.QWEN_API_KEY))
}

// ─── Instruções da conversa ao vivo (iguais nos dois fornecedores) ───
// Nexus: o José (texto aprovado pelo CEO em 2026-10-16, mantido). IA Financeira e Tributária: a Inteligência
// Axioma com o título da especialidade (Opção A, lib/ia/identidade.ts) e o foco de cada tela.
const NOME_IDIOMA: Record<IdiomaFala, string> = { pt: 'português do Brasil', en: 'English', es: 'español' }
function apresentacao(tela: TelaTR, nome: string): { abertura: string; foco: string; eu: string } {
  const com = nome || 'o dono da empresa'
  if (tela === 'nexus') return { abertura: `Você é José, o diretor financeiro digital do Axioma, conversando AO VIVO, por voz, com ${com} numa reunião.`, foco: '', eu: 'o José, do Axioma' }
  const titulo = identidadeDaTela(tela).titulo.pt.toLowerCase().replace(/\bmei\b/, 'MEI')
  const foco = tela === 'ia-tributaria'
    ? 'Foco: impostos, regime tributário, alíquota efetiva, obrigações e Reforma Tributária. Lei, limite, alíquota ou prazo só com a regra oficial que vier da ferramenta, com a data; avise que a lei pode mudar; nunca diga apenas "consulte um contador".'
    : tela === 'mei-ia-advisor'
      ? 'Foco: MEI — limite de faturamento, DAS, declaração anual (DASN-SIMEI), nota fiscal e quando é hora de virar ME; linguagem simples, sem jargão. Valor, limite ou prazo só com a regra oficial que vier da ferramenta, com a data.'
      : 'Foco: caixa, margem, contas, recebimentos, custos, dívidas e riscos, com visão de dono e prioridade para a decisão.'
  return { abertura: `Você é o ${titulo} da Inteligência Axioma, conversando AO VIVO, por voz, com ${com} ${tela === 'mei-ia-advisor' ? 'numa conversa de consultoria' : 'numa reunião de diretoria'}. Se perguntarem quem você é: "Sou o ${titulo} da Inteligência Axioma".`, foco: `\n${foco}`, eu: `o ${titulo} da Inteligência Axioma` }
}
export function instrucoesJose(lang: IdiomaFala, nome: string, tela: TelaTR = 'nexus'): string {
  const a = apresentacao(tela, nome)
  return `${a.abertura}
Fale sempre em ${NOME_IDIOMA[lang]}, com voz calma, formal, educada e executiva. Frases curtas; no máximo 4 frases por vez; ofereça detalhar se fizer sentido.${a.foco}
REGRA ABSOLUTA: qualquer dado da empresa (valores, contas, vencimentos, clientes, fornecedores, custos, dívidas, estoque, faturamento, caixa, impostos, riscos) você só obtém chamando a ferramenta perguntar_ao_axioma com a pergunta completa e clara (inclua o período e o assunto da conversa, ex.: "contas a receber desta semana que estão vencidas"). Nunca diga um número que não veio dessa ferramenta nesta conversa. Enquanto espera, diga só algo curto como "um instante, vou consultar".
Ao receber o resultado, transmita o conteúdo com fidelidade: os valores exatamente como vieram, as palavras Fato/Estimativa/Cenário quando existirem, e TODOS os avisos (consulta que falhou, valor não conferido, dado que não está disponível). Não acrescente número nem conclusão própria.
Simulação ("e se…") também vai para a ferramenta; deixe claro que é um cenário hipotético. Correção ("na verdade, setembro") = nova consulta com o dado corrigido.
Perguntas gerais (cumprimento, o que é um termo financeiro) você responde direto, sem ferramenta. Nunca execute nem prometa pagamento, transferência, exclusão ou alteração de dados.
Nunca diga que é uma IA de outra empresa (Google, Alibaba, OpenAI etc.): você é ${a.eu}.`
}

export const FERRAMENTA_AXIOMA = {
  name: 'perguntar_ao_axioma',
  description: 'Consulta o motor financeiro do Axioma (dados reais e conferidos da empresa do usuário). Use para QUALQUER pergunta sobre números, contas, vencimentos, clientes, fornecedores, custos, dívidas, estoque, faturamento, caixa, riscos ou simulações.',
  parameters: { type: 'object', properties: { pergunta: { type: 'string', description: 'Pergunta completa, com período e assunto (sem pronomes soltos como "isso").' } }, required: ['pergunta'] },
}

// ─── Gemini Live: configuração TRAVADA no token efêmero ───
const VOZ_GEMINI_PADRAO = 'Charon' // masculina, tom informativo (trocável por GEMINI_VOZ)
export function setupGemini(p: { lang: IdiomaFala; nome: string; modelo: string; voz?: string; tela?: TelaTR }) {
  return {
    model: p.modelo.startsWith('models/') ? p.modelo : `models/${p.modelo}`,
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: p.voz || VOZ_GEMINI_PADRAO } }, languageCode: { pt: 'pt-BR', en: 'en-US', es: 'es-US' }[p.lang] },
    },
    systemInstruction: { parts: [{ text: instrucoesJose(p.lang, p.nome, p.tela) }] },
    tools: [{ functionDeclarations: [FERRAMENTA_AXIOMA] }],
    realtimeInputConfig: { automaticActivityDetection: { silenceDurationMs: 700 } },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  }
}
// Corpo do pedido de token: 1 uso, começa em até 60 s, vale até o fim da sessão; setup inteiro do servidor
export function corpoTokenGemini(setup: ReturnType<typeof setupGemini>, agora = Date.now()) {
  return {
    uses: 1,
    expireTime: new Date(agora + (DURACAO_MAX_S + 60) * 1000).toISOString(),
    newSessionExpireTime: new Date(agora + 60 * 1000).toISOString(),
    bidiGenerateContentSetup: setup,
    // fieldMask vazio + setup presente = a configuração vem INTEIRA do token (o navegador não muda nada)
  }
}

// ─── Qwen Omni Realtime: session.update que o navegador envia (WebRTC) ───
export function sessaoQwen(p: { lang: IdiomaFala; nome: string; voz?: string; tela?: TelaTR }) {
  return {
    modalities: ['text', 'audio'],
    ...(p.voz ? { voice: p.voz } : {}),
    instructions: instrucoesJose(p.lang, p.nome, p.tela),
    input_audio_transcription: { model: 'qwen3-asr-flash-realtime' },
    turn_detection: { type: 'server_vad', threshold: 0.5, silence_duration_ms: 700 },
    tools: [{ type: 'function', function: FERRAMENTA_AXIOMA }],
  }
}

// ─── Regra de início de sessão ───
export type EntradaInicio = { usuario: string | null; empresaId: string; lang: string; fornecedor: string }
export type DepsInicio = {
  ativa: (empresaId: string) => boolean // voz liberada para a empresa
  disponiveis: FornecedorTR[]
  acesso: (empresaId: string) => Promise<{ restante: number; ilimitada: boolean } | null> // null = empresa alheia (RLS); lança = falha
  papel: (empresaId: string) => Promise<string | null>
}
export type CodigoInicio = 'ok' | 'nao_autorizado' | 'parametros_invalidos' | 'voz_desativada' | 'fornecedor_indisponivel' | 'sem_acesso' | 'sem_acesso_voz' | 'sem_saldo' | 'falha_leitura'
export async function processarInicio(e: EntradaInicio, deps: DepsInicio): Promise<{ status: number; codigo: CodigoInicio }> {
  if (!e.usuario) return { status: 401, codigo: 'nao_autorizado' }
  if (!UUID.test(e.empresaId) || !['pt', 'en', 'es'].includes(e.lang) || !FORNECEDORES_TR.includes(e.fornecedor as FornecedorTR)) return { status: 400, codigo: 'parametros_invalidos' }
  if (!deps.ativa(e.empresaId)) return { status: 403, codigo: 'voz_desativada' }
  if (!deps.disponiveis.includes(e.fornecedor as FornecedorTR)) return { status: 409, codigo: 'fornecedor_indisponivel' }
  try {
    const sit = await deps.acesso(e.empresaId)
    if (!sit) return { status: 404, codigo: 'sem_acesso' }
    if ((await deps.papel(e.empresaId)) === 'operador') return { status: 403, codigo: 'sem_acesso_voz' }
    // Sem saldo para nenhuma pergunta: nem abre a conversa (cada consulta ao motor cobra 1)
    if (!sit.ilimitada && sit.restante <= 0) return { status: 402, codigo: 'sem_saldo' }
  } catch { return { status: 503, codigo: 'falha_leitura' } }
  return { status: 200, codigo: 'ok' }
}

export const MENSAGENS_INICIO: Record<CodigoInicio, Record<IdiomaFala, string>> = {
  ok: { pt: '', en: '', es: '' },
  nao_autorizado: { pt: 'Entre na sua conta para conversar.', en: 'Sign in to talk.', es: 'Inicie sesión para conversar.' },
  parametros_invalidos: { pt: 'Não foi possível iniciar a conversa.', en: 'Could not start the conversation.', es: 'No fue posible iniciar la conversación.' },
  voz_desativada: { pt: 'A conversa ao vivo não está liberada para esta Empresa.', en: 'Live conversation is not enabled for this Company.', es: 'La conversación en vivo no está habilitada para esta Empresa.' },
  fornecedor_indisponivel: { pt: 'Esta voz ao vivo não está configurada agora.', en: 'This live voice is not configured right now.', es: 'Esta voz en vivo no está configurada ahora.' },
  sem_acesso: { pt: 'Empresa não encontrada.', en: 'Company not found.', es: 'Empresa no encontrada.' },
  sem_acesso_voz: { pt: 'O seu acesso nesta Empresa é de operador de caixa: a conversa financeira fica com o dono, sócios e administradores.', en: 'Your access in this Company is cashier operator: the financial conversation is for owners, partners and administrators.', es: 'Su acceso en esta Empresa es de operador de caja: la conversación financiera es para el dueño, socios y administradores.' },
  sem_saldo: { pt: 'O saldo de IA acabou. Recarregue em Config → Uso da IA.', en: 'The AI balance has run out. Top up in Settings → AI Usage.', es: 'El saldo de IA se agotó. Recargue en Config → Uso de la IA.' },
  falha_leitura: { pt: 'Não foi possível conferir o acesso agora. Tente de novo.', en: 'Could not check access right now. Try again.', es: 'No fue posible verificar el acceso ahora. Intente de nuevo.' },
}
