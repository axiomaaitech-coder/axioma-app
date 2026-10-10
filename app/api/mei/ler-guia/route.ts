import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { lerDocumentoComVisao, usoZerado, MODELOS, type ArquivoVisao } from '@/lib/ia/motor'

// POST /api/mei/ler-guia (multipart: arquivo, empresa_id) — lê a guia do DAS (MEI ou
// Simples Nacional) em PDF/foto e devolve os dados num formato fixo (GuiaLida em
// lib/guiaDas.ts). Só lê: a tela confere os códigos (CRC do Pix, dígitos do código de
// barras) e a PESSOA confirma antes de qualquer pagamento. Login obrigatório; empresa pela RLS.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIPOS: ArquivoVisao['mediaType'][] = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4_000_000
export const maxDuration = 120

const textoOuNulo = { anyOf: [{ type: 'string' }, { type: 'null' }] }
const numeroOuNulo = { anyOf: [{ type: 'number' }, { type: 'null' }] }
const objeto = (props: Record<string, unknown>) => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false })
const ESQUEMA = objeto({
  eh_das: { type: 'boolean' },
  tipo: { type: 'string', enum: ['DAS_MEI', 'DAS_SIMPLES', 'outro'] },
  numero_documento: textoOuNulo,
  cnpj: textoOuNulo,
  valor_total: numeroOuNulo,
  data_vencimento: textoOuNulo,
  competencias: { type: 'array', items: { type: 'string' } },
  codigo_barras: textoOuNulo,
  pix_copia_cola: textoOuNulo,
  duvidas: { type: 'array', items: objeto({ campo: { type: 'string' }, pergunta: { type: 'string' } }) },
})

const INSTRUCAO = `Você lê guias de pagamento do Simples Nacional: DAS do MEI (gerado no PGMEI) ou DAS do Simples Nacional (gerado no PGDAS-D). Esses dados viram um PAGAMENTO real de imposto: um dígito errado manda dinheiro para o lugar errado. Leia com muito cuidado e confira antes de responder.
Regras:
- Nunca invente nem complete dado. Ilegível ou ausente = null (ou lista vazia).
- eh_das = true só se for um Documento de Arrecadação do Simples Nacional. tipo: DAS_MEI se mencionar MEI/SIMEI/PGMEI; DAS_SIMPLES se for do PGDAS-D (Simples Nacional de ME/EPP); senão "outro".
- numero_documento: o "Número do Documento" impresso (só dígitos e pontos/traços como estão).
- cnpj: CNPJ do contribuinte, só dígitos.
- valor_total: o "Valor Total do Documento" (com multa e juros, se houver). Número decimal com ponto, sem R$.
- data_vencimento: "Pagar este documento até" (AAAA-MM-DD). Não confunda com a data de vencimento original do período.
- competencias: TODOS os períodos de apuração da guia no formato AAAA-MM (ex.: "Período de Apuração 10/2026" → "2026-10"). Uma guia pode ter vários meses.
- codigo_barras: a linha digitável numérica (48 dígitos, começa com 8), só dígitos.
- pix_copia_cola: o texto do Pix copia e cola se estiver impresso (começa com 000201). Se só houver o QR Code em imagem, tente ler o texto do QR; se não der, null.
- duvidas: para cada campo importante (valor, vencimento, períodos, códigos, CNPJ) que você não leu com certeza, uma pergunta curta em português dizendo o que leu. Sem dúvidas, lista vazia.`

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const form = await request.formData().catch(() => null)
  const arquivo = form?.get('arquivo')
  const empresaId = String(form?.get('empresa_id') ?? '')
  if (!(arquivo instanceof Blob) || !UUID.test(empresaId)) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })
  const mediaType = arquivo.type as ArquivoVisao['mediaType']
  if (!TIPOS.includes(mediaType) || arquivo.size > MAX_BYTES) return NextResponse.json({ error: 'arquivo invalido' }, { status: 400 })
  const { data: emp } = await supabase.from('empresas').select('id').eq('id', empresaId).maybeSingle()
  if (!emp) return NextResponse.json({ error: 'empresa nao encontrada' }, { status: 404 })

  try {
    const uso = usoZerado()
    const base64 = Buffer.from(await arquivo.arrayBuffer()).toString('base64')
    const diag: { motivo?: string } = {}
    const r = await lerDocumentoComVisao({ base64, mediaType }, INSTRUCAO, ESQUEMA, uso, diag)
    if (!r) Sentry.captureMessage(`[mei/ler-guia] IA não leu a guia: ${diag.motivo ?? '?'}`, { level: 'error', extra: { rota: 'mei/ler-guia', mediaType, tamanho: arquivo.size } })
    after(() => registrarAuditoria({
      empresaId, ator: user.id, acao: 'ia.motor', entidade: 'motor-ia', versaoMotor: 'motor-ia-1',
      parametros: { tela: 'mei-das', nivel: 'analise', triagem: 'regra', provedor: r ? (r.modelo.startsWith('claude') ? 'anthropic' : 'openai') : null, modelo: r?.modelo ?? MODELOS.analise.modelo, escalou: false, valores_nao_conferidos: 0, consultas: 0, setor: null, caracteres_enviados: arquivo.size, respondeu: !!r,
        tokens_entrada: uso.tokensEntrada, tokens_saida: uso.tokensSaida, tokens_cache_leitura: uso.tokensCacheLeitura, tokens_cache_escrita: uso.tokensCacheEscrita,
        tokens_openai: uso.tokensOpenAI, custo_usd_anthropic: Math.round(uso.custoUsdAnthropic * 1e6) / 1e6 },
    }))
    if (!r) return NextResponse.json({ error: 'nao_leu' }, { status: 422 })
    return NextResponse.json({ guia: r.dados })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    Sentry.captureException(err instanceof Error ? err : new Error(msg), { extra: { rota: 'mei/ler-guia' } })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
