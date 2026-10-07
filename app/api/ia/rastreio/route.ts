import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { tarefaDeRotina, type Idioma } from '@/lib/ia/motor'

// POST /api/ia/rastreio { empresa_id, lang }
// Botão "Houve falha?" do Motor de Rastreabilidade: o navegador JÁ refez o caminho
// (Guardião); aqui a Inteligência do Axioma lê o que ainda ficou com falha e explica
// em linguagem simples — onde quebrou, o que o Axioma já fez e o que a pessoa faz.
// Lê só os rastros da empresa (RLS do próprio usuário) e nunca altera dado.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const maxDuration = 60

const NOME_DESTINO: Record<string, Record<Idioma, string>> = {
  contabilidade: { pt: 'Contabilidade (Razão/Balancete)', en: 'Accounting (Ledger/Trial Balance)', es: 'Contabilidad (Mayor/Balance)' },
  fluxo_caixa: { pt: 'Fluxo de Caixa', en: 'Cash Flow', es: 'Flujo de Caja' },
  dre_gerencial: { pt: 'Receitas/Custos e DRE', en: 'Revenue/Costs and P&L', es: 'Ingresos/Costos y Estado de Resultados' },
  inadimplencia: { pt: 'Inadimplência', en: 'Delinquency', es: 'Morosidad' },
}

type Item = { rastreio_id: string; titulo: string; explicacao: string; acao: string }

// Explicação por regra — usada quando a IA não responde (o botão nunca fica mudo).
function explicarPorRegra(erro: string, lang: Idioma): { explicacao: string; acao: string } {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  if (erro.includes('REVISAO_HUMANA')) return {
    explicacao: L('Depois deste estorno houve uma nova baixa na mesma conta. Refazer o estorno sozinho desfaria a baixa nova, então o Axioma parou para proteger o dinheiro.',
      'After this reversal there was a new payment on the same bill. Redoing the reversal automatically would undo the new payment, so Axioma stopped to protect the money.',
      'Después de esta reversión hubo un nuevo pago en la misma cuenta. Rehacer la reversión sola desharía el pago nuevo, así que Axioma se detuvo para proteger el dinero.'),
    acao: L('Peça ao contador para conferir a conta no Livro Razão e estornar manualmente só o lançamento antigo.', 'Ask your accountant to check the bill in the General Ledger and manually reverse only the old entry.', 'Pida al contador que revise la cuenta en el Libro Mayor y revierta manualmente solo el asiento antiguo.'),
  }
  if (/permission|RLS|0 linhas|row-level/i.test(erro)) return {
    explicacao: L('O usuário que fez a baixa não tem permissão para gravar neste módulo.', 'The user who made the payment lacks permission to write to this module.', 'El usuario que registró el pago no tiene permiso para escribir en este módulo.'),
    acao: L('Um dono ou administrador da empresa clica em "Resolver" de novo: o Axioma refaz com a permissão dele.', 'An owner or admin clicks "Resolve" again: Axioma redoes it with their permission.', 'Un dueño o administrador hace clic en "Resolver" de nuevo: Axioma lo rehace con su permiso.'),
  }
  if (/não encontrado|nao encontrado|código/i.test(erro)) return {
    explicacao: L('Falta uma conta no plano de contas desta empresa para receber o lançamento.', 'An account is missing from this company\'s chart of accounts to receive the entry.', 'Falta una cuenta en el plan de cuentas de esta empresa para recibir el asiento.'),
    acao: L('Avise o suporte do Axioma: a conta será criada e o caminho refeito sem perder nada.', 'Contact Axioma support: the account will be created and the path redone without losing anything.', 'Avise al soporte de Axioma: se creará la cuenta y se rehará el camino sin perder nada.'),
  }
  return {
    explicacao: L('A conexão com o banco de dados falhou no meio do caminho (internet ou servidor lento).', 'The database connection failed midway (internet or slow server).', 'La conexión con la base de datos falló a mitad del camino (internet o servidor lento).'),
    acao: L('Clique em "Resolver" novamente em alguns minutos. Nada foi duplicado e nada se perdeu: o rastro guarda tudo.', 'Click "Resolve" again in a few minutes. Nothing was duplicated or lost: the trail keeps everything.', 'Haga clic en "Resolver" de nuevo en unos minutos. Nada se duplicó ni se perdió: el rastro guarda todo.'),
  }
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
  const lang: Idioma = corpo?.lang === 'en' || corpo?.lang === 'es' ? corpo.lang : 'pt'
  const empresaId = typeof corpo?.empresa_id === 'string' && UUID.test(corpo.empresa_id) ? corpo.empresa_id : null
  if (!empresaId) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })

  const { data: rastros, error } = await supabase.from('rastreio_movimentacao')
    .select('id, tipo, descricao, valor, data_movimento, criado_em, rastreio_destino(destino, status, ultimo_erro, tentativas)')
    .eq('empresa_id', empresaId).eq('status', 'falhou').order('criado_em', { ascending: false }).limit(20)
  if (error) return NextResponse.json({ error: 'leitura' }, { status: 500 })
  if (!rastros?.length) return NextResponse.json({ itens: [], resumo: null })

  type Linha = { id: string; tipo: string; descricao: string | null; valor: number; data_movimento: string; rastreio_destino: { destino: string; status: string; ultimo_erro: string | null; tentativas: number }[] }
  const falhas = (rastros as unknown as Linha[]).map((r) => ({
    rastreio_id: r.id, tipo: r.tipo, descricao: r.descricao, valor: Number(r.valor), data: r.data_movimento,
    destinos_com_falha: r.rastreio_destino.filter((d) => d.status === 'falhou').map((d) => ({ destino: NOME_DESTINO[d.destino]?.[lang] ?? d.destino, erro: (d.ultimo_erro || '').slice(0, 300), tentativas: d.tentativas })),
    destinos_ok: r.rastreio_destino.filter((d) => d.status === 'ok').map((d) => NOME_DESTINO[d.destino]?.[lang] ?? d.destino),
  }))

  const porRegra: Item[] = falhas.map((f) => {
    const e = explicarPorRegra(f.destinos_com_falha.map((d) => d.erro).join(' '), lang)
    return { rastreio_id: f.rastreio_id, titulo: `${f.descricao ?? ''} — R$ ${f.valor.toFixed(2).replace('.', ',')}`, ...e }
  })

  const idioma = lang === 'en' ? 'English' : lang === 'es' ? 'español' : 'português do Brasil'
  const sistema = `Você é a Inteligência do Axioma, CFO digital. O Motor de Rastreabilidade leva cada pagamento/recebimento a vários módulos (destinos). Alguns destinos falharam MESMO depois do Axioma refazer o caminho automaticamente.
Para cada rastro, explique em ${idioma}, para um dono de empresa sem conhecimento técnico:
- "explicacao": onde parou e por quê (traduza o erro técnico em linguagem simples, sem nomes de tabela/coluna/código), deixando claro que nada foi duplicado e que o rastro guarda tudo;
- "acao": o que a pessoa faz agora, em uma frase.
Nunca invente valor nem módulo que não esteja nos dados. Se o erro contém REVISAO_HUMANA, diga que o Axioma parou de propósito para proteger o dinheiro e que o contador precisa revisar.
Responda SOMENTE JSON: {"itens":[{"rastreio_id":"...","explicacao":"...","acao":"..."}]}`

  let itens = porRegra
  let porIA = false
  try {
    const bruto = await tarefaDeRotina(sistema, JSON.stringify(falhas), { maxTokens: 1500, timeoutMs: 25000 })
    const j = bruto ? JSON.parse(bruto) : null
    if (Array.isArray(j?.itens)) {
      const mapa = new Map<string, { explicacao?: string; acao?: string }>(j.itens.map((i: { rastreio_id: string; explicacao?: string; acao?: string }) => [i.rastreio_id, i]))
      itens = porRegra.map((p) => {
        const ia = mapa.get(p.rastreio_id)
        return ia?.explicacao && ia?.acao ? { ...p, explicacao: String(ia.explicacao), acao: String(ia.acao) } : p
      })
      porIA = true
    }
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: 'ia/rastreio' } })
  }

  after(() => registrarAuditoria({
    empresaId, ator: user.id, acao: 'ia.rastreio', entidade: 'motor-rastreabilidade', versaoMotor: 'rastreio-1',
    parametros: { falhas: falhas.length, por_ia: porIA, lang },
  }))
  return NextResponse.json({ itens, porIA })
}
