// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 5: "E se...?" macroeconômico.
// Traduz um choque da economia (dólar, Selic, inflação, petróleo, receita)
// no MESMO ChoqueSimulador do módulo Simulações (lib/cfoCore.ts →
// simularCenariosExecutivos) — um motor de conta só no Axioma inteiro.
//
// Toda exposição (quanto do custo é em dólar, quanto da dívida é pós-fixada,
// peso do combustível/frete, repasse de preço) é informada pelo usuário,
// nunca estimada: sem exposição declarada, o choque não afeta o resultado.
// Função pura, sem import — testada em scripts/check-nexus-simulacao.mjs.
// ═══════════════════════════════════════════════════════════════
import type { ChoqueSimulador } from './cfoCore'

export type VariaveisMacro = {
  receitaPct: number          // variação direta de receita (%)
  dolarPct: number            // variação do dólar (%)
  exposicaoCambialPct: number // % do custo variável atrelado ao dólar
  selicPontos: number         // variação da Selic (pontos percentuais ao ano)
  dividaPosFixadaPct: number  // % da dívida que acompanha a Selic
  ipcaPontos: number          // inflação extra no período (pontos percentuais)
  repassePrecoPct: number     // % da inflação repassada ao preço de venda
  petroleoPct: number         // variação do petróleo (%)
  pesoCombustivelPct: number  // % do custo variável em combustível/frete
}

export const VARIAVEIS_ZERO: VariaveisMacro = {
  receitaPct: 0, dolarPct: 0, exposicaoCambialPct: 0, selicPontos: 0, dividaPosFixadaPct: 100,
  ipcaPontos: 0, repassePrecoPct: 0, petroleoPct: 0, pesoCombustivelPct: 0,
}

const arred = (n: number) => Math.round(n * 100) / 100

export function macroParaChoque(v: VariaveisMacro): ChoqueSimulador {
  const inflacaoNosCustos = v.ipcaPontos
  const inflacaoNoPreco = v.ipcaPontos * (v.repassePrecoPct / 100)
  return {
    receitaPct: arred(v.receitaPct + inflacaoNoPreco),
    custoFixoPct: arred(inflacaoNosCustos),
    custoVariavelPct: arred(
      inflacaoNosCustos
      + v.dolarPct * (v.exposicaoCambialPct / 100)
      + v.petroleoPct * (v.pesoCombustivelPct / 100),
    ),
    jurosDividaPontos: arred(v.selicPontos * (v.dividaPosFixadaPct / 100)),
    aporteCapital: 0,
    retornoMensalAporte: 0,
  }
}

export type PresetMacro = { id: string; emoji: string; nome: [string, string, string]; variaveis: Partial<VariaveisMacro> }

// Presets só preenchem o CHOQUE; a exposição da empresa continua sendo dela.
export const PRESETS_MACRO: PresetMacro[] = [
  { id: 'dolar20', emoji: '💵', nome: ['Dólar +20%', 'Dollar +20%', 'Dólar +20%'], variaveis: { dolarPct: 20 } },
  { id: 'selic2', emoji: '🏦', nome: ['Selic +2 pontos', 'Selic +2 pts', 'Selic +2 puntos'], variaveis: { selicPontos: 2 } },
  { id: 'selicCorte', emoji: '📉', nome: ['Selic −1 ponto', 'Selic −1 pt', 'Selic −1 punto'], variaveis: { selicPontos: -1 } },
  { id: 'inflacao3', emoji: '📈', nome: ['Inflação +3 pontos', 'Inflation +3 pts', 'Inflación +3 puntos'], variaveis: { ipcaPontos: 3 } },
  { id: 'petroleo30', emoji: '🛢️', nome: ['Petróleo +30%', 'Oil +30%', 'Petróleo +30%'], variaveis: { petroleoPct: 30 } },
  { id: 'receitaMenos10', emoji: '🔻', nome: ['Receita −10%', 'Revenue −10%', 'Ingresos −10%'], variaveis: { receitaPct: -10 } },
  { id: 'receitaMais15', emoji: '🚀', nome: ['Receita +15%', 'Revenue +15%', 'Ingresos +15%'], variaveis: { receitaPct: 15 } },
]

// Evento do Joseph → preset do "E se...?" (botão "Simular na minha empresa").
// Só séries que têm tradução direta; o resto abre o simulador em branco.
export function variaveisDoEvento(serie: string, variacao: number): Partial<VariaveisMacro> | null {
  if (serie === '432') return { selicPontos: arred(variacao) }
  if (serie === '1') return { dolarPct: arred(variacao) } // euro/libra/iene ≠ dólar: sem tradução direta
  if (serie === '433') return { ipcaPontos: arred(variacao) }
  if (serie === 'IPEA:BRENT') return { petroleoPct: arred(variacao) }
  if (serie === '24363') return { receitaPct: arred(variacao) }
  return null
}
