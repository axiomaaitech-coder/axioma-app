import { NextRequest, NextResponse, after } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { tarefaDeRotina, MODELOS } from '@/lib/ia/motor'
import { setorDaEmpresa } from '@/lib/ia/setores'
import { CATEGORIAS_DESPESA, NATUREZAS_ITEM, type ItemClassificado } from '@/lib/categoriasDespesa'

// POST /api/importar/classificar-itens { empresa_id, itens: [{ descricao, ncm?, cfop?, valor }] }
// B3 item 3: classifica cada item de uma nota de COMPRA — categoria de despesa
// (lista fechada, a mesma de Contas a Pagar e da contabilidade) e natureza
// (estoque, custo variável, custo fixo, investimento) — pelo ramo da empresa.
// Uma chamada por nota (rotina → OpenAI pelo motor). Só sugere: a tela mostra
// e o usuário confirma. Falha = itens: null e a tela segue sem classificação.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_ITENS = 200

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
  const empresaId = typeof corpo?.empresa_id === 'string' ? corpo.empresa_id : ''
  const itens = Array.isArray(corpo?.itens) ? corpo.itens.slice(0, MAX_ITENS) : []
  if (!UUID.test(empresaId) || !itens.length) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })
  // RLS: só acha a empresa quem tem acesso a ela.
  const { data: emp } = await supabase.from('empresas').select('setor, cnae_principal, cnae_descricao').eq('id', empresaId).maybeSingle()
  if (!emp) return NextResponse.json({ error: 'empresa nao encontrada' }, { status: 404 })

  const setor = setorDaEmpresa(emp.cnae_principal as string | null, emp.setor as string | null)
  const ramo = setor ? `${setor.nome.pt}${emp.cnae_descricao ? ` (CNAE ${emp.cnae_principal} - ${emp.cnae_descricao})` : ''}` : 'não identificado'
  const sistema = `Você classifica os itens de uma nota fiscal de COMPRA de uma empresa brasileira do ramo: ${ramo}.
Para cada item, na mesma ordem, devolva:
- categoria: exatamente uma destas: ${CATEGORIAS_DESPESA.join(', ')}. Mercadoria para revender ou matéria-prima = Produtos.
- natureza: exatamente uma destas: estoque (mercadoria para revenda ou matéria-prima que entra no produto), custo_variavel (gasto que sobe e desce com as vendas: embalagem, frete de venda, comissão), custo_fixo (gasto do funcionamento que não depende das vendas: aluguel, energia, internet, limpeza, material de escritório, assinatura), investimento (bem durável: máquina, móvel, computador, veículo, reforma).
Use o ramo da empresa: o mesmo item pode ser estoque para um ramo e custo fixo para outro (ex.: café é estoque para uma cafeteria e custo fixo para um escritório).
Responda só JSON: {"itens":[{"categoria":"...","natureza":"..."}]} com exatamente ${itens.length} itens.`
  const entrada = itens.map((i: { descricao?: unknown; ncm?: unknown; cfop?: unknown; valor?: unknown }, n: number) =>
    `${n + 1}. ${String(i.descricao ?? '').slice(0, 200)}${i.ncm ? ` | NCM ${String(i.ncm).slice(0, 10)}` : ''}${i.cfop ? ` | CFOP ${String(i.cfop).slice(0, 4)}` : ''}`).join('\n')

  const bruto = await tarefaDeRotina(sistema, entrada, { maxTokens: 4000, timeoutMs: 45000 })
  let classificados: ItemClassificado[] | null = null
  try {
    const lista = JSON.parse(bruto ?? '{}').itens
    if (Array.isArray(lista) && lista.length === itens.length) {
      // Lista fechada: valor fora da lista vira "Outros"/null em vez de passar adiante.
      classificados = lista.map((x: { categoria?: string; natureza?: string }) => ({
        categoria: (CATEGORIAS_DESPESA as readonly string[]).includes(String(x?.categoria)) ? String(x.categoria) : 'Outros',
        natureza: (NATUREZAS_ITEM as readonly string[]).includes(String(x?.natureza)) ? x.natureza as ItemClassificado['natureza'] : null,
      }))
    }
  } catch { classificados = null }

  after(() => registrarAuditoria({
    empresaId, ator: user.id, acao: 'ia.motor', entidade: 'motor-ia', versaoMotor: 'motor-ia-1',
    parametros: { tela: 'importar-documentos', nivel: 'rotina', triagem: 'regra', provedor: classificados ? 'openai' : null, modelo: MODELOS.rotina.modelo, escalou: false, valores_nao_conferidos: 0, consultas: 0, setor: setor?.nome.pt ?? null, caracteres_enviados: sistema.length + entrada.length, respondeu: !!classificados },
  }))
  return NextResponse.json({ itens: classificados })
}
