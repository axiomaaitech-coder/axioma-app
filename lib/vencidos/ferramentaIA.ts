// Ferramenta de consulta das IAs: "contas_vencidas" (Overdue Intelligence). Mesma análise da tela Contas Vencidas
// (lib/vencidos/dados + motor), com o cliente do usuário (RLS) — a IA lê e explica, quem calcula é o motor.
// Só leitura: nada é gravado, cobrado, negociado ou apagado por aqui. Simulação nunca altera dado real.
import type { SupabaseClient } from '@supabase/supabase-js'
import { carregarAnaliseVencidos, type LerTesouraria } from './dados'
import * as M from './motor'
import { nomeAcao, nomeCausa } from './textos'

export const FERRAMENTA_VENCIDOS = {
  name: 'contas_vencidas', strict: true as const,
  description: 'Contas vencidas da empresa (Overdue Intelligence): a receber e a pagar vencidas, atraso por faixa, maiores devedores, clientes piorando, promessas de pagamento (pendentes e descumpridas), divergências, juros e multa estimados, previsão de recuperação (7 a 90 dias), prioridade de pagamento a fornecedores, impacto no caixa e simulação "se recuperarmos X% em N dias". Use para inadimplência, quem deve, o que está atrasado, cobrança, recuperação, promessas, fornecedores críticos e impacto do atraso na liquidez. Os números já vêm calculados — não recalcule.',
  input_schema: {
    type: 'object' as const, additionalProperties: false as const, required: ['foco', 'percentual', 'prazo_dias', 'limite'],
    properties: {
      foco: { type: 'string', enum: ['resumo', 'receber', 'pagar', 'promessas', 'simular'], description: 'resumo = visão geral; receber/pagar = lista priorizada; promessas = promessas de pagamento; simular = recuperação hipotética.' },
      percentual: { type: 'number', description: 'Só para simular: % do vencido a receber recuperado (0 a 100). Nos demais, 0.' },
      prazo_dias: { type: 'integer', description: 'Só para simular: prazo em dias (ex.: 30). Nos demais, 0.' },
      limite: { type: 'integer', description: 'Quantos itens nas listas (1 a 30).' },
    },
  },
}

// Caixa pela Tesouraria com o cliente do servidor (mesma RPC e mesma reserva mínima da tela Tesouraria)
const tesourariaServidor = (sb: SupabaseClient): LerTesouraria => async (empresaId, hoje) => {
  const [cfg, pos] = await Promise.all([
    sb.from('tesouraria_config').select('reserva_minima').eq('empresa_id', empresaId).maybeSingle(),
    sb.rpc('tesouraria_posicao', { p_empresa_id: empresaId, p_data: hoje }),
  ])
  const linhas = (pos.data as { tipo_liquidez: string; saldo: number }[] | null) ?? []
  return { caixa: linhas.filter((l) => l.tipo_liquidez === 'disponivel').reduce((s, l) => s + Number(l.saldo), 0), reserva: Number(cfg.data?.reserva_minima ?? 0), giro: null, falhou: !!pos.error }
}

export async function consultarVencidosIA(sb: SupabaseClient, empresaId: string, input: Record<string, unknown>, hoje: string) {
  const a = await carregarAnaliseVencidos(empresaId, { sb, hoje, tesouraria: tesourariaServidor(sb) })
  if (a.falhou) return { erro: 'não foi possível consultar as contas agora' }
  const limite = Math.min(30, Math.max(1, Math.floor(Number(input.limite)) || 10))
  const foco = String(input.foco ?? 'resumo')
  const item = (i: (typeof a.receber)[number]) => ({
    contraparte: i.titulo.contraparteNome, descricao: i.titulo.descricao, vencimento: i.titulo.vencimento, dias_atraso: i.encargos.dias,
    saldo: i.saldo, juros_multa_estimados: Math.round((i.encargos.total - i.saldo) * 100) / 100,
    risco_0_1000: i.risco.score, sem_historico: i.risco.score == null, prioridade_0_1000: i.prioridade.score,
    motivos_prioridade: i.prioridade.fatores.map((f) => f.texto), proxima_acao: nomeAcao('pt', i.acao.acao),
    causa_provavel: nomeCausa('pt', i.causaSugerida.causa), causa_e_fato: i.causaSugerida.tipo === 'fato',
    promessa: i.promessa, divergencia_contestado: i.disputa.aberta ? i.disputa.contestado : 0, ultimo_contato: i.ultimoContato?.data ?? null,
  })
  const faixas = (g: typeof a.agingReceber) => ({ a_vencer: g.aVencer.saldo, faixas: g.faixas.filter((f) => f.qtd).map((f) => ({ dias: f.rotulo, saldo: f.saldo, qtd: f.qtd, juros_multa: f.encargos })), maior_devedor_pct: g.maiorPct })
  const base = { hoje: a.hoje, metodologia: a.versao, observacao: 'Vencido a receber e promessa NÃO são caixa disponível. Cálculos do motor do Axioma; juros pela Lei 14.905/2024 e CDC (conferência, nada é cobrado sozinho).' }
  if (foco === 'simular') {
    const pct = Math.min(100, Math.max(0, Number(input.percentual) || 0)), prazo = Math.max(1, Math.floor(Number(input.prazo_dias)) || 30)
    return { ...base, simulacao: M.simularRecuperacao(a.tesouraria, pct, prazo), base_tesouraria: a.tesouraria, aviso: 'Simulação: não altera nenhum dado real.' }
  }
  if (foco === 'receber') return { ...base, total: a.agingReceber.total, itens: a.receber.slice(0, limite).map(item) }
  if (foco === 'pagar') return { ...base, total: a.agingPagar.total, itens: a.pagar.slice(0, limite).map(item) }
  if (foco === 'promessas') {
    const com = a.receber.filter((i) => i.promessa)
    return { ...base, descumpridas: com.filter((i) => i.promessa === 'descumprida').map(item), em_aberto: com.filter((i) => ['pendente', 'confirmada', 'parcialmente_cumprida'].includes(i.promessa!)).map((i) => ({ ...item(i), falta_pagar: i.promessaFalta })) }
  }
  const piorando = [...new Map(a.receber.filter((i) => i.dna.tendencia === 'piora').map((i) => [i.titulo.contraparteNome, { cliente: i.titulo.contraparteNome, prazo_antes: i.dna.anteriorPrazo ?? i.dna.anteriorAtraso, prazo_recente: i.dna.recentePrazo ?? i.dna.recenteAtraso }])).values()]
  return {
    ...base,
    receber: { total: a.agingReceber.total, qtd: a.receber.length, ...faixas(a.agingReceber) },
    pagar: { total: a.agingPagar.total, qtd: a.pagar.length, ...faixas(a.agingPagar) },
    maiores_prioridades_receber: a.receber.slice(0, Math.min(5, limite)).map(item),
    fornecedores_prioritarios: a.pagar.slice(0, Math.min(5, limite)).map(item),
    clientes_piorando: piorando, previsao_recuperacao: { ...a.previsao.horizontes.reduce((o, h) => ({ ...o, [`d${h.horizonteDias}`]: h.valor }), {}), composicao: a.previsao.composicao, confianca: a.previsao.confianca },
    impacto_caixa: a.impacto, alertas: a.alertas.map((x) => x.texto), migracao_30_dias: a.migracao30,
  }
}
