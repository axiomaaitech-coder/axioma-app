// ═══════════════════════════════════════════════════════════════
// ESTRUTURA PADRÃO DE RELATÓRIO (Plano 3, Tarefa 2). Uma só estrutura alimenta a tela, o PDF e o José —
// nenhum deles recalcula números: todos leem `Relatorio` montado por lib/financeiro/relatorios.ts.
// ═══════════════════════════════════════════════════════════════
import type { EstadoResultado } from './contrato'

export type Lang = 'pt' | 'en' | 'es'
export const TIPOS_RELATORIO = ['executivo', 'dre', 'fluxo_caixa', 'contas_receber', 'contas_pagar', 'receitas', 'despesas', 'endividamento', 'tributario', 'pdv', 'conciliacao'] as const
export type TipoRelatorio = (typeof TIPOS_RELATORIO)[number]
// Fato = observado nos registros; Cálculo = fórmula validada; Estimativa = premissa declarada
export type Classe = 'fato' | 'calculo' | 'estimativa'
export type TipoColuna = 'texto' | 'moeda' | 'pct' | 'data' | 'numero'

export type Indicador = { rotulo: string; valor: number | null; unidade: 'BRL' | 'PCT' | 'QTD' | 'DIAS'; classe: Classe; anterior?: number | null; diferenca?: number | null; variacao_pct?: number | null; nota?: string }
export type Secao =
  | { id: string; titulo: string; tipo: 'indicadores'; itens: Indicador[]; fonte?: string }
  | { id: string; titulo: string; tipo: 'tabela'; colunas: { rotulo: string; tipo: TipoColuna }[]; linhas: (string | number | null)[][]; total?: (string | number | null)[]; fonte?: string; vazio?: string }
  | { id: string; titulo: string; tipo: 'texto'; paragrafos: string[] }
// Achado = risco/atenção com evidência; recomendação separada e proporcional à evidência
export type Achado = { titulo: string; evidencia: string; tipo: 'fato' | 'calculo' | 'interpretacao' | 'hipotese'; prioridade: 'alta' | 'media' | 'baixa'; confianca: 'alta' | 'media' | 'baixa'; recomendacao?: string }

export type PedidoRelatorio = { tipo: TipoRelatorio; periodo: string; inicio?: string | null; fim?: string | null; comparar?: boolean; lang?: Lang }
export type Relatorio = {
  tipo: TipoRelatorio; titulo: string; lang: Lang
  empresa: { nome: string; documento: string | null }
  periodo: { inicio: string; fim: string; rotulo: string; parcial: boolean } | null
  comparado_com: string | null
  gerado_em: string            // ISO (UTC); exibido no fuso da empresa
  fuso: string
  estado: EstadoResultado      // pior estado entre as consultas usadas
  resumo: string[]             // resumo executivo (frases feitas só de fatos/cálculos do relatório)
  secoes: Secao[]
  achados: Achado[]
  limitacoes: string[]
  fontes: string[]
  metodologia: string[]
  refs: string[]               // referências das consultas (rastreio)
}
