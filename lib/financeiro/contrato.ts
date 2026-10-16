// ═══════════════════════════════════════════════════════════════
// CONTRATO DE RESULTADO das consultas financeiras (Plano 3, Tarefa 1). Toda ferramenta nova devolve isto,
// para a IA (e a auditoria) saberem: qual indicador, de qual período, por qual critério de data, de quais
// fontes, com quantos registros, em que estado e com quais limitações. "Veio do banco" não basta para ser
// `verificado`: o filtro, a definição (lib/financeiro/semantica.ts) e a fórmula também precisam estar certos.
// ═══════════════════════════════════════════════════════════════
import type { Periodo } from './periodos'

export type EstadoResultado = 'verificado' | 'parcial' | 'indisponivel' | 'erro' | 'nao_aplicavel'
export type ResultadoFinanceiro<T = unknown> = {
  indicador: string                 // id do catálogo semântico (ex.: 'contas_receber_aberto')
  definicao: string                 // definição curta, a mesma do catálogo
  estado: EstadoResultado
  valor?: number | null             // valor principal (quando houver um)
  unidade: 'BRL' | 'PCT' | 'QTD' | 'DIAS' | 'LISTA'
  moeda: 'BRL'
  periodo: { inicio: string; fim: string; rotulo: string; parcial: boolean } | null
  criterio_data: string             // ex.: 'data de vencimento', 'competência', 'data do recebimento'
  fontes: string[]                  // tabelas/telas do Axioma lidas
  registros: number                 // quantos registros entraram no cálculo
  detalhes?: T                      // listas, agrupamentos, comparações
  limitacoes: string[]              // o que pode mudar a conclusão
  ref: string                       // referência para rastrear (indicador + período + critério)
}

// Centavos: soma em inteiros para não acumular erro de ponto flutuante (0,1 + 0,2)
export const centavos = (v: unknown) => Math.round((Number(v) || 0) * 100)
export const reais = (c: number) => c / 100
export const somaReais = (valores: unknown[]) => reais(valores.reduce<number>((s, v) => s + centavos(v), 0))

export function resultado<T>(p: Omit<ResultadoFinanceiro<T>, 'moeda' | 'ref' | 'periodo'> & { periodo: Periodo | null }): ResultadoFinanceiro<T> {
  const per = p.periodo ? { inicio: p.periodo.inicio, fim: p.periodo.fim, rotulo: p.periodo.rotulo, parcial: p.periodo.parcial } : null
  const limitacoes = [...p.limitacoes]
  if (per?.parcial) limitacoes.push('período ainda em andamento: valor parcial, não comparável a período fechado')
  return { ...p, moeda: 'BRL', periodo: per, limitacoes, ref: `${p.indicador}|${per ? `${per.inicio}..${per.fim}` : 'sem período'}|${p.criterio_data}` }
}
export const falhou = (indicador: string, motivo: string): ResultadoFinanceiro => ({
  indicador, definicao: '', estado: 'erro', valor: null, unidade: 'BRL', moeda: 'BRL', periodo: null, criterio_data: '', fontes: [], registros: 0,
  limitacoes: [`não foi possível consultar agora: ${motivo}`], ref: `${indicador}|erro`,
})
