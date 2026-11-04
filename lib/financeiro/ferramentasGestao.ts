// ═══════════════════════════════════════════════════════════════
// PORTAS DE GESTÃO da Central Intelligence (Etapa 3): Tesouraria, Fiscal, Cadastros e Estoque. Leem com o
// cliente do USUÁRIO (RLS) e usam as MESMAS contas das telas: a IA nunca dá número diferente do módulo.
// Só leitura. Devolvem o contrato padrão (lib/financeiro/contrato).
// As funções das telas só carregam quando a pergunta precisa (import sob demanda).
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { lerTodas } from '../lerTodas'
import { hojeISO, somarDiasISO } from '../datas'
import { falhou, resultado, reais, centavos, type ResultadoFinanceiro } from './contrato'
import { saldoReceber, type TituloReceber } from './calculos'
import { definicao } from './semantica'

type Esquema = { type: 'object'; additionalProperties: false; properties: Record<string, unknown>; required: string[] }
const obj = (properties: Record<string, unknown>): Esquema => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) })

export const FERRAMENTAS_GESTAO: { name: string; description: string; input_schema: Esquema; strict: true }[] = [
  { name: 'caixa_tesouraria', strict: true, description: 'Tesouraria: saldo de hoje por conta (disponível, aplicado, restrito), reserva mínima, caixa livre acima da reserva e previsão de caixa em 7, 30, 60 e 90 dias (cenários base, otimista e estressado). Use para "quanto tenho em cada banco", "caixa livre", "reserva" e "como fica o caixa em X dias". É diferente do caixa realizado do Fluxo de Caixa: diga qual usou.', input_schema: obj({}) },
  { name: 'obrigacoes_fiscais', strict: true, description: 'Obrigações fiscais em aberto da empresa (DAS, DCTF e demais) vencendo até N dias, incluindo as atrasadas, com valor estimado; e as do MEI, quando houver. Use para "que impostos ou obrigações vencem" e "o que está atrasado no fiscal".',
    input_schema: obj({ dias: { type: 'integer', description: 'Janela em dias a partir de hoje (1 a 365; padrão 30). Atrasadas sempre entram.' } }) },
  { name: 'cadastros', strict: true, description: 'Quantidade de clientes ou fornecedores cadastrados: ativos e por situação; em clientes, também quantos estão inadimplentes (com saldo vencido). Use para "quantos clientes ativos eu tenho". Para nomes de quem deve, use maiores_devedores.',
    input_schema: obj({ tipo: { type: 'string', enum: ['clientes', 'fornecedores'] } }) },
  { name: 'estoque_resumo', strict: true, description: 'Estoque: valor total (saldo × preço médio), produtos ativos e inativos e quantos estão em ruptura, baixo estoque, capital parado ou custo subindo. Para ver quais produtos, use estoque_avisos.', input_schema: obj({}) },
]
export const NOMES_FERRAMENTAS_GESTAO = new Set(FERRAMENTAS_GESTAO.map((f) => f.name))

type Ctx = { supabase: SupabaseClient; empresaId: string; fuso: string }
const r2 = (v: unknown) => reais(centavos(v))
const exigir = async <T>(nome: string, p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> => {
  const r = await p
  if (r.error) throw new Error(`${nome}: ${r.error.message}`)
  return r.data
}
const contarPor = (linhas: { status?: string | null }[]) => linhas.reduce<Record<string, number>>((m, l) => { const k = String(l.status ?? 'sem status'); m[k] = (m[k] ?? 0) + 1; return m }, {})

export async function executarFerramentaGestao(ctx: Ctx, nome: string, input: Record<string, unknown>): Promise<ResultadoFinanceiro> {
  const { supabase, empresaId, fuso } = ctx
  const hoje = hojeISO(new Date(), fuso)
  try {
    switch (nome) {
      case 'caixa_tesouraria': {
        const { obterPosicaoCaixa, obterFluxoProjetado } = await import('../tesourariaHelpers')
        const cfg = await exigir('tesouraria_config', supabase.from('tesouraria_config').select('reserva_minima').eq('empresa_id', empresaId).maybeSingle())
        const reserva = Number((cfg as { reserva_minima?: number } | null)?.reserva_minima ?? 0)
        const pos = await obterPosicaoCaixa(empresaId, hoje, reserva, supabase)
        if (pos.falhou) return falhou('caixa_posicao', 'posição de caixa da Tesouraria')
        const flx = await obterFluxoProjetado(empresaId, reserva, supabase)
        const limitacoes = ['vem do razão contábil: pode diferir do caixa realizado do Fluxo de Caixa', 'previsão não é certeza: depende de os clientes pagarem como no histórico']
        if (!cfg) limitacoes.push('reserva mínima não cadastrada: vale zero')
        if (flx.falhou) limitacoes.push('a previsão de caixa não pôde ser lida agora: não use estes horizontes')
        return resultado({ indicador: 'caixa_posicao', definicao: definicao('caixa_posicao'), estado: flx.falhou ? 'parcial' : 'verificado', valor: r2(pos.totalGeral), unidade: 'BRL', periodo: null,
          criterio_data: 'posição de hoje; previsão a partir de hoje', fontes: ['tesouraria_posicao', 'tesouraria_fluxo_projetado', 'tesouraria_config'], registros: pos.linhas.length, limitacoes,
          detalhes: { hoje, disponivel: r2(pos.totalDisponivel), aplicado: r2(pos.totalAplicado), restrito: r2(pos.totalRestrito), reserva_minima: r2(reserva), caixa_livre: r2(pos.totalLivre),
            contas: pos.linhas.map((l) => ({ conta: l.conta_nome, banco: l.banco_nome, liquidez: l.tipo_liquidez, saldo: r2(l.saldo) })),
            previsao: flx.falhou ? [] : flx.pontos.map((p) => ({ dias: p.horizonteDias, entradas_base: r2(p.entradasPrevistas.base), saidas_base: r2(p.saidasPrevistas.base), saldo_base: r2(p.saldoProjetado.base), saldo_otimista: r2(p.saldoProjetado.otimista), saldo_estressado: r2(p.saldoProjetado.estressado), abaixo_da_reserva_base: p.abaixoDaReserva.base })) } })
      }
      case 'obrigacoes_fiscais': {
        const dias = Math.min(365, Math.max(1, Math.floor(Number(input.dias)) || 30))
        const { obrigacoesEmAberto, corRiscoObrigacao } = await import('../fiscalHelpers')
        const linhas = await exigir('fiscal_obrigacoes_proximas', supabase.rpc('fiscal_obrigacoes_proximas', { p_empresa_id: empresaId, p_dias: dias }))
        const abertas = obrigacoesEmAberto((linhas ?? []) as Parameters<typeof obrigacoesEmAberto>[0])
        const ate = somarDiasISO(hoje, dias)
        const mei = await exigir('mei_obrigacoes', lerTodas<{ tipo: string; competencia: string | null; data_vencimento: string | null; valor: number | null; valor_esperado: number | null }>(() => supabase.from('mei_obrigacoes').select('tipo, competencia, data_vencimento, valor, valor_esperado').eq('empresa_id', empresaId).eq('status', 'Pendente').lte('data_vencimento', ate).order('id')))
        const atrasadas = abertas.filter((o) => corRiscoObrigacao(o) === 'atrasada').length
        return resultado({ indicador: 'obrigacoes_fiscais_abertas', definicao: definicao('obrigacoes_fiscais_abertas'), estado: 'verificado', valor: abertas.length + mei.length, unidade: 'QTD', periodo: null,
          criterio_data: `vencimento até ${ate}, atrasadas incluídas`, fontes: ['empresa_obrigacoes', 'mei_obrigacoes'], registros: abertas.length + mei.length,
          limitacoes: ['o valor é estimado, não o da guia oficial', 'só existe o que foi gerado ou cadastrado em Empresa, aba Compliance'],
          detalhes: { hoje, dias, total_estimado: r2(abertas.reduce((s, o) => s + Number(o.valor_estimado || 0), 0)), atrasadas, itens: abertas.slice(0, 30).map((o) => ({ nome: o.nome, tipo: o.tipo, vencimento: o.data_vencimento, dias_restantes: o.dias_restantes, valor_estimado: o.valor_estimado, status: o.status })),
            mei: { pendentes: mei.length, atrasadas: mei.filter((m) => !!m.data_vencimento && m.data_vencimento < hoje).length, itens: mei.slice(0, 30).map((m) => ({ tipo: m.tipo, competencia: m.competencia, vencimento: m.data_vencimento, valor: m.valor ?? m.valor_esperado })) } } })
      }
      case 'cadastros': {
        if (input.tipo === 'fornecedores') {
          const l = await exigir('fornecedores', lerTodas<{ status: string | null }>(() => supabase.from('fornecedores').select('id, status').eq('empresa_id', empresaId).order('id')))
          const porStatus = contarPor(l)
          return resultado({ indicador: 'fornecedores_ativos', definicao: definicao('fornecedores_ativos'), estado: 'verificado', valor: porStatus.ativo ?? 0, unidade: 'QTD', periodo: null, criterio_data: 'posição de hoje', fontes: ['fornecedores'], registros: l.length, limitacoes: [], detalhes: { total_cadastrados: l.length, por_status: porStatus } })
        }
        const [cli, cr] = await Promise.all([
          exigir('clientes', lerTodas<{ status: string | null }>(() => supabase.from('clientes').select('id, status').eq('empresa_id', empresaId).order('id'))),
          exigir('contas_receber', lerTodas<TituloReceber>(() => supabase.from('contas_receber').select('id, cliente_id, valor, valor_recebido, valor_desconto, taxa_multa, taxa_juros, data_vencimento, status').eq('empresa_id', empresaId).lt('data_vencimento', hoje).order('id'))),
        ])
        const vencidas = cr.filter((c) => !/cancel/i.test(String(c.status)) && saldoReceber(c, hoje).principal > 0)
        const porStatus = contarPor(cli)
        const semCliente = vencidas.filter((c) => !c.cliente_id).length
        return resultado({ indicador: 'clientes_ativos', definicao: definicao('clientes_ativos'), estado: 'verificado', valor: porStatus.ativo ?? 0, unidade: 'QTD', periodo: null, criterio_data: 'posição de hoje; inadimplente = saldo com vencimento antes de hoje', fontes: ['clientes', 'contas_receber'], registros: cli.length,
          limitacoes: semCliente ? [`${semCliente} conta(s) vencida(s) sem cliente informado não entram na contagem de inadimplentes`] : [],
          detalhes: { total_cadastrados: cli.length, por_status: porStatus, inadimplentes: new Set(vencidas.map((c) => c.cliente_id).filter(Boolean)).size, contas_vencidas_sem_cliente: semCliente } })
      }
      case 'estoque_resumo': {
        const k = await exigir('vw_estoque_kpis', supabase.from('vw_estoque_kpis').select('valor_total_estoque, produtos_ativos, produtos_inativos, qtd_ruptura, qtd_baixo_estoque, qtd_capital_parado, qtd_custo_subindo').eq('empresa_id', empresaId).maybeSingle()) as Record<string, number> | null
        const prods = await exigir('produtos', lerTodas<{ saldo_disponivel: number; preco_medio: number | null }>(() => supabase.from('produtos').select('saldo_disponivel, preco_medio').eq('empresa_id', empresaId).eq('status', 'ativo').eq('controla_estoque', true).order('id')))
        const semEntrada = prods.filter((p) => Number(p.saldo_disponivel) < 0 || (Number(p.saldo_disponivel) > 0 && !Number(p.preco_medio))).length
        const ativos = Number(k?.produtos_ativos ?? 0)
        return resultado({ indicador: 'estoque_valor', definicao: definicao('estoque_valor'), estado: semEntrada ? 'parcial' : 'verificado', valor: r2(k?.valor_total_estoque), unidade: 'BRL', periodo: null, criterio_data: 'posição de hoje', fontes: ['vw_estoque_kpis', 'produtos'], registros: ativos,
          limitacoes: semEntrada ? [`${semEntrada} produto(s) com saldo negativo ou sem preço médio (venda sem entrada registrada): o valor real pode ser maior. Registre a entrada em Estoque, Movimentações`] : [],
          detalhes: { produtos_ativos: ativos, produtos_inativos: Number(k?.produtos_inativos ?? 0), em_ruptura: Number(k?.qtd_ruptura ?? 0), baixo_estoque: Number(k?.qtd_baixo_estoque ?? 0), capital_parado: Number(k?.qtd_capital_parado ?? 0), custo_subindo: Number(k?.qtd_custo_subindo ?? 0), produtos_sem_entrada_registrada: semEntrada } })
      }
      default: return falhou(nome, 'ferramenta desconhecida')
    }
  } catch (err) {
    return falhou(nome, err instanceof Error ? err.message : String(err))
  }
}
