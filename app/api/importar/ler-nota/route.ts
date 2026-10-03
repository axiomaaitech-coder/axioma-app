import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { lerDocumentoComVisao, usoZerado, MODELOS, type ArquivoVisao } from '@/lib/ia/motor'

// POST /api/importar/ler-nota (multipart: arquivo, empresa_id) — B3: lê nota
// fiscal, cupom ou recibo em PDF/foto e devolve os dados num formato fixo
// (NotaLidaIA em lib/importarParsers.ts). Só lê: quem grava é a tela, depois
// que o usuário confere e confirma. Login obrigatório; empresa pela RLS.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIPOS: ArquivoVisao['mediaType'][] = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4_000_000
export const maxDuration = 120

const texto = { type: 'string' }
// "ou vazio" com anyOf — a forma que as saídas estruturadas aceitam com certeza.
const textoOuNulo = { anyOf: [{ type: 'string' }, { type: 'null' }] }
const numeroOuNulo = { anyOf: [{ type: 'number' }, { type: 'null' }] }
const objeto = (props: Record<string, unknown>) => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false })
const ESQUEMA = objeto({
  eh_nota: { type: 'boolean' },
  tipo_documento: { type: 'string', enum: ['nfe', 'nfce', 'nfse', 'cupom', 'recibo', 'boleto', 'outro'] },
  numero: textoOuNulo,
  data_emissao: textoOuNulo,
  emitente: objeto({ nome: textoOuNulo, cnpj_cpf: textoOuNulo }),
  destinatario: objeto({ nome: textoOuNulo, cnpj_cpf: textoOuNulo }),
  valor_total: numeroOuNulo,
  itens: { type: 'array', items: objeto({ descricao: texto, quantidade: numeroOuNulo, unidade: textoOuNulo, valor_unitario: numeroOuNulo, valor_total: numeroOuNulo, ncm: textoOuNulo, cfop: textoOuNulo, codigo: textoOuNulo, ean: textoOuNulo }) },
  parcelas: { type: 'array', items: objeto({ numero: textoOuNulo, vencimento: textoOuNulo, valor: { type: 'number' } }) },
  pagamentos: { type: 'array', items: objeto({ codigo_meio: texto, valor: { type: 'number' }, a_prazo: { type: 'boolean' } }) },
  duvidas: { type: 'array', items: objeto({ campo: texto, pergunta: texto }) },
})

const INSTRUCAO = `Você lê documentos fiscais brasileiros (DANFE de NF-e, NFC-e, NFS-e, cupom fiscal, recibo, boleto) e extrai os dados EXATAMENTE como estão impressos. Esses dados viram contas a pagar/receber de uma empresa real: um erro de data, valor ou de quem vendeu/comprou leva dinheiro para o lugar errado. Leia com muito cuidado, campo por campo, e confira antes de responder.
Regras:
- Nunca invente nem complete dado. Se um campo não estiver legível ou não existir, use null (ou lista vazia).
- Datas: não confunda data de EMISSÃO com data de VENCIMENTO, de saída ou de protocolo. data_emissao é a emissão; vencimento de cada parcela vem da fatura/duplicata. Atenção a dia/mês (formato brasileiro DD/MM/AAAA).
- Valores: valor_total é o "VALOR TOTAL DA NOTA" (não o subtotal dos produtos, nem o valor de um imposto). Atenção a vírgula decimal e ponto de milhar brasileiros.
- emitente é quem EMITIU/VENDEU (topo do DANFE); destinatário é quem COMPROU (quadro "destinatário/remetente"). Não troque os dois.
- duvidas: para CADA campo importante (data, valor, parcela, emitente, destinatário, forma de pagamento) que você não leu com certeza — borrado, cortado, ambíguo, ou números que não fecham (parcelas que não somam o total) —, escreva uma pergunta curta em português para um humano conferir, dizendo o que você leu. Ex.: {"campo":"data_emissao","pergunta":"Li a emissão como 03/10/2026, mas o dígito está borrado. Está certo?"}. Sem dúvidas, lista vazia.
- eh_nota = false se o documento não for nota, cupom, recibo ou boleto de compra/venda.
- Datas no formato AAAA-MM-DD. Valores em número decimal com ponto (1234.56), sem "R$".
- cnpj_cpf só com os dígitos.
- itens: cada produto/serviço da nota, com quantidade e valores impressos. NCM com 8 dígitos e CFOP com 4, só se estiverem impressos.
- parcelas: as duplicatas/faturas impressas (número, vencimento, valor). Se não houver, lista vazia.
- pagamentos: forma de pagamento impressa, com codigo_meio pela tabela da SEFAZ: 01 dinheiro, 02 cheque, 03 cartão de crédito, 04 cartão de débito, 05 crédito loja, 15 boleto, 16 depósito, 17 Pix, 18 transferência, 90 sem pagamento, 99 outros. a_prazo = true quando for pagamento a prazo. Se não houver, lista vazia.
- valor_total: o valor total da nota/documento.`

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
  // RLS: só acha a empresa quem tem acesso a ela.
  const { data: emp } = await supabase.from('empresas').select('id').eq('id', empresaId).maybeSingle()
  if (!emp) return NextResponse.json({ error: 'empresa nao encontrada' }, { status: 404 })

  try {
    const uso = usoZerado()
    const base64 = Buffer.from(await arquivo.arrayBuffer()).toString('base64')
    const diag: { motivo?: string } = {}
    const r = await lerDocumentoComVisao({ base64, mediaType }, INSTRUCAO, ESQUEMA, uso, diag)
    if (!r) Sentry.captureMessage(`[importar/ler-nota] IA não leu a nota: ${diag.motivo ?? '?'}`, { level: 'error', extra: { rota: 'importar/ler-nota', mediaType, tamanho: arquivo.size } })
    // Auditoria no mesmo formato do motor (aparece no painel Uso da IA) — nunca o conteúdo.
    after(() => registrarAuditoria({
      empresaId, ator: user.id, acao: 'ia.motor', entidade: 'motor-ia', versaoMotor: 'motor-ia-1',
      parametros: { tela: 'importar-documentos', nivel: 'analise', triagem: 'regra', provedor: r ? 'anthropic' : null, modelo: r?.modelo ?? MODELOS.analise.modelo, escalou: false, valores_nao_conferidos: 0, consultas: 0, setor: null, caracteres_enviados: arquivo.size, respondeu: !!r,
        tokens_entrada: uso.tokensEntrada, tokens_saida: uso.tokensSaida, tokens_cache_leitura: uso.tokensCacheLeitura, tokens_cache_escrita: uso.tokensCacheEscrita,
        tokens_openai: uso.tokensOpenAI, custo_usd_anthropic: Math.round(uso.custoUsdAnthropic * 1e6) / 1e6 },
    }))
    return NextResponse.json({ nota: r?.dados ?? null, ...(r ? {} : { motivo: diag.motivo ?? null }) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[importar/ler-nota]', msg)
    Sentry.captureException(err instanceof Error ? err : new Error(msg), { extra: { rota: 'importar/ler-nota' } })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
