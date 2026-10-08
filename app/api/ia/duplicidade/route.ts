import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { tarefaDeAnalise, type Idioma } from '@/lib/ia/motor'

// POST /api/ia/duplicidade { empresa_id, lang, casos }
// Camada 2 do Motor Antiduplicidade (lib/motorDuplicidade.ts): só chegam aqui os casos
// que a REGRA não conseguiu provar. A Inteligência do Axioma lê com lupa e devolve
// mesma/diferente/incerto + confiança. Quem decide o que fazer com a resposta é o
// motor (só aplica sozinho com confiança alta; o resto vai para o humano).
// Nunca grava nada; auditoria só com contagens, sem conteúdo.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const maxDuration = 60

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
  const lang: Idioma = corpo?.lang === 'en' || corpo?.lang === 'es' ? corpo.lang : 'pt'
  const empresaId = typeof corpo?.empresa_id === 'string' && UUID.test(corpo.empresa_id) ? corpo.empresa_id : null
  const casos = Array.isArray(corpo?.casos) ? corpo.casos.slice(0, 15) : null
  if (!empresaId || !casos?.length) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })
  // Só quem é da empresa pede análise dela (a RLS só mostra empresas do usuário).
  const { data: minha } = await supabase.from('empresas').select('id').eq('id', empresaId).maybeSingle()
  if (!minha) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })

  const idioma = lang === 'en' ? 'English' : lang === 'es' ? 'español' : 'português do Brasil'
  const sistema = `Você é o auditor antiduplicidade da Inteligência do Axioma, um CFO digital usado por empresas com dinheiro alto. Uma conta/lançamento NOVO está entrando e o Axioma achou lançamentos EXISTENTES parecidos. A regra automática não conseguiu provar se é a mesma conta. Sua tarefa é decidir com precisão cirúrgica.

ALERTA — leia com muita atenção, campo por campo:
- DATAS: emissão × vencimento × data do pagamento são coisas diferentes. Parcelas da mesma nota têm o mesmo valor e a mesma emissão, mas vencimentos diferentes: NÃO são duplicata.
- HORÁRIO: dois pagamentos podem ter a mesma data e quase o mesmo horário e ainda assim serem dois pagamentos reais. Mesmo valor no mesmo minuto, com tudo igual, tende a ser o mesmo lançamento digitado/importado duas vezes.
- FORMA DE PAGAMENTO: cartão de crédito, cartão de débito, boleto, Pix, dinheiro, transferência. Mesmo valor, mesmo dia e mesmo fornecedor, mas uma no cartão e outra no boleto/Pix = DOIS pagamentos diferentes. Atenção: um boleto pode ter sido pago via Pix pelo banco; se um lado diz "boleto" e o outro é um extrato "PIX" do mesmo valor e fornecedor, pode ser o mesmo pagamento.
- VALORES: total × subtotal × parcela × valor pago parcial.
- DOCUMENTO: nº da nota, final da chave de acesso, nº de parcela, identificador do extrato. Números diferentes = documentos diferentes.
- FORNECEDOR/CLIENTE e CNPJ: diferentes = contas diferentes.
- TEXTO: "frete" × "mercadoria", "parcela 2" × "parcela 3", "aluguel outubro" × "aluguel novembro" mostram contas diferentes.
- Contas recorrentes (aluguel, assinatura) repetem o valor todo mês: só são duplicata se forem do MESMO período.

Regras de decisão:
- Responda "mesma" só quando os dados mostrarem que é o MESMO dinheiro lançado duas vezes.
- Responda "diferente" só quando algum dado mostrar que são dois dinheiros diferentes.
- Se faltar dado para ter certeza, responda "incerto" e escreva UMA pergunta curta e objetiva para um humano (operador ou contador) que resolva a dúvida, citando os dados concretos (valor, data, forma) — ex.: "O pagamento de R$ 1.500,00 de 05/10 no Pix e o boleto de R$ 1.500,00 de 05/10 da Papel Info são o mesmo pagamento?".
- "confianca" de 0 a 1. Nunca passe de 0.9 sem um dado concreto que sustente a conclusão.
- Nunca invente dado que não está no caso. Não use nomes de tabela, coluna ou termos técnicos.

Escreva "explicacao" (1 ou 2 frases, para um dono de empresa) e "pergunta" em ${idioma}.
Responda SOMENTE JSON: {"resultados":[{"id":<número do caso>,"veredicto":"mesma"|"diferente"|"incerto","confianca":0.0,"explicacao":"...","pergunta":"..."}]}`

  let resultados: unknown[] = []
  try {
    const bruto = await tarefaDeAnalise(sistema, JSON.stringify(casos), { maxTokens: 2500, timeoutMs: 40000 })
    const j = bruto ? JSON.parse(bruto) : null
    const ids = new Set(casos.map((c: { id?: unknown }) => c?.id))
    if (Array.isArray(j?.resultados)) {
      resultados = j.resultados
        .filter((r: Record<string, unknown>) => ids.has(r?.id) && ['mesma', 'diferente', 'incerto'].includes(String(r?.veredicto)))
        .map((r: Record<string, unknown>) => ({
          id: r.id, veredicto: r.veredicto,
          confianca: Math.max(0, Math.min(1, Number(r.confianca) || 0)),
          explicacao: String(r.explicacao || '').slice(0, 600), pergunta: String(r.pergunta || '').slice(0, 400),
        }))
    }
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: 'ia/duplicidade' } })
  }

  after(() => registrarAuditoria({
    empresaId, ator: user.id, acao: 'ia.duplicidade', entidade: 'motor-antiduplicidade', versaoMotor: 'duplicidade-1',
    parametros: { casos: casos.length, respondidos: resultados.length, lang },
  }))
  return NextResponse.json({ resultados })
}
