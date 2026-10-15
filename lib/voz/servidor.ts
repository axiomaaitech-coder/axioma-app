// AXIOMA VOICE INTELLIGENCE — Fase 1: regra do ditado no SERVIDOR (sem Next, sem banco, sem OpenAI:
// tudo chega por `deps`, para ser testado em scripts/check-voz-fase1.mts). A rota
// app/api/voz/transcrever só liga esta regra ao Supabase (sessão do usuário + RLS) e à OpenAI.
//
// Ordem (nada é cobrado antes da transcrição dar certo):
//   login → parâmetros → função liberada para a empresa → arquivo (tipo/vazio/tamanho)
//   → acesso à empresa (RLS: ia_situacao recusa empresa alheia) → papel → saldo disponível
//   → transcrição (OpenAI, duração conferida pelo fornecedor) → texto não vazio
//   → COBRA 1 do saldo comum (ia_consumir, atômico no banco) → devolve o texto.
// Se a cobrança falhar depois da transcrição (saldo acabou no meio), o texto NÃO é entregue:
// nada de uso grátis e nada de cobrança dupla (cada pedido cobra no máximo 1 vez).
// O áudio só existe na memória deste pedido; o texto nunca vai para log/auditoria.

export type Idioma = 'pt' | 'en' | 'es'
export const IDIOMAS: Idioma[] = ['pt', 'en', 'es']
export const MAX_BYTES = 2 * 1024 * 1024
export const MAX_SEGUNDOS = 60
export const TOLERANCIA_SEGUNDOS = 1.5 // o gravador para em 60 s; contêiner/arredondamento passa um pouco
// Telas onde o ditado existe (Fase 1). PDV: só a busca de produto — liberada também ao operador.
export const TELAS_VOZ = ['nexus', 'ia-financeira', 'ia-tributaria', 'mei-ia-advisor', 'contas-pagar', 'importar-documentos', 'pdv', 'contas-receber'] as const
export type TelaVoz = (typeof TELAS_VOZ)[number]
// Formatos que o MediaRecorder grava (Chrome/Edge/Firefox: webm/ogg; Safari/iPhone: mp4) e a OpenAI aceita.
export const TIPOS_AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/mpeg', 'audio/wav']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type EntradaVoz = {
  usuario: string | null
  empresaId: string
  tela: string
  lang: string
  arquivo: { tipo: string; tamanho: number; bytes: Blob } | null
}
export type DepsVoz = {
  ativa: (empresaId: string) => boolean
  // null = sem acesso à empresa (RLS); lança = falha técnica de leitura
  situacao: (empresaId: string) => Promise<{ restante: number; ilimitada: boolean } | null>
  papel: (empresaId: string) => Promise<string | null>
  transcrever: (audio: Blob, tipo: string, lang: Idioma) => Promise<{ texto: string; duracao: number }>
  consumir: (empresaId: string) => Promise<{ ok: true } | { ok: false; motivo: string }>
}
export type Codigo =
  | 'ok' | 'nao_autorizado' | 'parametros_invalidos' | 'voz_desativada' | 'formato_invalido' | 'audio_vazio'
  | 'audio_grande' | 'audio_longo' | 'sem_acesso' | 'sem_acesso_voz' | 'sem_saldo' | 'falha_leitura'
  | 'fornecedor_indisponivel' | 'transcricao_vazia'
export type ResultadoVoz = { status: number; codigo: Codigo; texto?: string; cobrado: boolean; duracao?: number; motivoSaldo?: string }

const r = (status: number, codigo: Codigo, extra: Partial<ResultadoVoz> = {}): ResultadoVoz => ({ status, codigo, cobrado: false, ...extra })
const tipoBase = (t: string) => t.split(';')[0].trim().toLowerCase()

export async function processarDitado(e: EntradaVoz, deps: DepsVoz): Promise<ResultadoVoz> {
  if (!e.usuario) return r(401, 'nao_autorizado')
  if (!UUID.test(e.empresaId) || !IDIOMAS.includes(e.lang as Idioma) || !(TELAS_VOZ as readonly string[]).includes(e.tela)) return r(400, 'parametros_invalidos')
  if (!deps.ativa(e.empresaId)) return r(403, 'voz_desativada')
  if (!e.arquivo) return r(400, 'audio_vazio')
  if (!TIPOS_AUDIO.includes(tipoBase(e.arquivo.tipo))) return r(415, 'formato_invalido')
  if (e.arquivo.tamanho <= 0) return r(400, 'audio_vazio')
  if (e.arquivo.tamanho > MAX_BYTES) return r(413, 'audio_grande')

  let sit: Awaited<ReturnType<DepsVoz['situacao']>>
  try { sit = await deps.situacao(e.empresaId) } catch { return r(503, 'falha_leitura') }
  if (!sit) return r(404, 'sem_acesso')
  let papel: string | null
  try { papel = await deps.papel(e.empresaId) } catch { return r(503, 'falha_leitura') }
  // Operador de caixa: ditado só na busca de produto do PDV (não dá inteligência financeira).
  if (papel === 'operador' && e.tela !== 'pdv') return r(403, 'sem_acesso_voz')
  if (!sit.ilimitada && sit.restante <= 0) return r(402, 'sem_saldo', { motivoSaldo: 'sem_saldo' })

  let res: { texto: string; duracao: number }
  try { res = await deps.transcrever(e.arquivo.bytes, tipoBase(e.arquivo.tipo), e.lang as Idioma) }
  catch { return r(503, 'fornecedor_indisponivel') }
  if (!(res.duracao <= MAX_SEGUNDOS + TOLERANCIA_SEGUNDOS)) return r(413, 'audio_longo', { duracao: res.duracao })
  const texto = (res.texto ?? '').replace(/\s+/g, ' ').trim()
  if (!texto) return r(422, 'transcricao_vazia', { duracao: res.duracao })

  let c: Awaited<ReturnType<DepsVoz['consumir']>>
  try { c = await deps.consumir(e.empresaId) } catch { return r(503, 'falha_leitura', { duracao: res.duracao }) }
  if (!c.ok) return r(402, 'sem_saldo', { duracao: res.duracao, motivoSaldo: c.motivo })
  return { status: 200, codigo: 'ok', texto, cobrado: true, duracao: res.duracao }
}

// Liberação (Fase 1 desligada para clientes até a Política de Privacidade ser aprovada — LEGAL-V01):
// VOZ_ATIVA=on liga para todas; VOZ_EMPRESAS_TESTE=uuid,uuid liga só para empresas de teste internas.
export function vozAtivaPara(empresaId: string, env: { VOZ_ATIVA?: string; VOZ_EMPRESAS_TESTE?: string }): boolean {
  if (env.VOZ_ATIVA === 'on') return true
  return (env.VOZ_EMPRESAS_TESTE ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).includes(empresaId.toLowerCase())
}

// Mensagens para a tela (3 idiomas). Nunca expõem detalhe técnico, chave ou fornecedor.
const MSG: Record<Exclude<Codigo, 'ok'>, Record<Idioma, string>> = {
  nao_autorizado: { pt: 'Sua sessão expirou. Entre de novo para usar o ditado.', en: 'Your session expired. Sign in again to use dictation.', es: 'Su sesión expiró. Ingrese de nuevo para usar el dictado.' },
  parametros_invalidos: { pt: 'Não foi possível usar o ditado nesta tela.', en: 'Dictation is not available on this screen.', es: 'El dictado no está disponible en esta pantalla.' },
  voz_desativada: { pt: 'O ditado ainda não está liberado para a sua empresa.', en: 'Dictation is not yet enabled for your company.', es: 'El dictado aún no está habilitado para su empresa.' },
  formato_invalido: { pt: 'Formato de áudio não aceito por este navegador. Digite o texto.', en: 'Audio format not accepted from this browser. Please type the text.', es: 'Formato de audio no aceptado en este navegador. Escriba el texto.' },
  audio_vazio: { pt: 'Nenhum som foi gravado. Tente de novo.', en: 'No sound was recorded. Try again.', es: 'No se grabó ningún sonido. Intente de nuevo.' },
  audio_grande: { pt: 'A gravação ficou grande demais. Fale em trechos menores.', en: 'The recording is too large. Speak in shorter parts.', es: 'La grabación es demasiado grande. Hable en partes más cortas.' },
  audio_longo: { pt: 'Fale até 60 segundos por vez.', en: 'Speak up to 60 seconds at a time.', es: 'Hable hasta 60 segundos por vez.' },
  sem_acesso: { pt: 'Você não tem acesso a esta Empresa.', en: 'You do not have access to this Company.', es: 'No tiene acceso a esta Empresa.' },
  sem_acesso_voz: { pt: 'Com acesso de operador de caixa, o ditado fica disponível só na busca de produtos do PDV.', en: 'With cashier operator access, dictation is available only in the POS product search.', es: 'Con acceso de operador de caja, el dictado está disponible solo en la búsqueda de productos del PDV.' },
  sem_saldo: { pt: 'O saldo de IA deste mês acabou. Recarregue em Config → Uso da IA.', en: 'This month’s AI balance has run out. Top up in Settings → AI Usage.', es: 'El saldo de IA de este mes se agotó. Recargue en Config → Uso de la IA.' },
  falha_leitura: { pt: 'Não foi possível conferir seu acesso agora. Tente de novo em instantes.', en: 'Could not check your access right now. Try again in a moment.', es: 'No se pudo verificar su acceso ahora. Intente de nuevo en un momento.' },
  fornecedor_indisponivel: { pt: 'O ditado está indisponível agora. Nada foi cobrado — tente de novo ou digite.', en: 'Dictation is unavailable right now. Nothing was charged — try again or type.', es: 'El dictado no está disponible ahora. No se cobró nada — intente de nuevo o escriba.' },
  transcricao_vazia: { pt: 'Não entendi o que foi dito. Nada foi cobrado — tente de novo mais perto do microfone.', en: 'I could not understand what was said. Nothing was charged — try again closer to the microphone.', es: 'No entendí lo que se dijo. No se cobró nada — intente de nuevo más cerca del micrófono.' },
}
export const mensagemVoz = (codigo: Exclude<Codigo, 'ok'>, lang: string) => MSG[codigo][(IDIOMAS.includes(lang as Idioma) ? lang : 'pt') as Idioma]
