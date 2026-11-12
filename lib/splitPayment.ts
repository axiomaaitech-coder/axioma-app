// ═══════════════════════════════════════════════════════════════
// Simulador do SPLIT PAYMENT da Reforma Tributária (2026-11-12). O IBS e a CBS passam a ser separados e recolhidos
// no momento em que o pagamento é liquidado, antes de o dinheiro chegar à conta da Empresa (LC 214/2025, art. 31).
// Hoje a Empresa recebe o valor cheio e só paga o tributo depois; com o split esse dinheiro nunca passa pelo caixa.
// Fontes conferidas em 12/11/2026 (planalto.gov.br e notícias oficiais):
//   • LC 214/2025, arts. 31–36: split na liquidação; procedimento padrão (retém o destacado menos o que já foi extinto,
//     consulta à RFB/CGIBS; excesso devolvido em 3 dias úteis) e simplificado (percentual fixo, opcional, sem crédito
//     para o adquirente). Art. 35: implantação GRADUAL por ato conjunto — ainda SEM DATA fixada.
//   • EC 132/2023, ADCT arts. 125–129: 2026 teste (CBS 0,9% + IBS 0,1%, compensados); 2027 CBS cheia e fim do
//     PIS/Cofins; 2027–2028 IBS 0,1% e CBS reduzida em 0,1 p.p. (o total de 2027 = alíquota de referência da CBS);
//     2029–2032 ICMS/ISS a 9/10…6/10; 2033 ICMS/ISS extintos.
//   • Alíquota de referência ainda não fixada: TCU calculou 11,3% para a CBS 2027; o Comitê Gestor trabalhou com
//     9,21% (conjunta 27,91%); a Fazenda estimava 26,5% conjunta na regulamentação. O Senado fixa até 15/12/2026.
//   • Simples Nacional no DAS: a regra do split ainda depende de regulamentação. O cenário vale para quem paga
//     IBS/CBS pelo regime regular (Lucro Presumido/Real ou Simples que optar pelo regime regular dessas duas).
// ═══════════════════════════════════════════════════════════════

export type CenarioSplit = { id: string; aliquotaPct: number; nome: { pt: string; en: string; es: string }; fonte: string }
export const CENARIOS_SPLIT: CenarioSplit[] = [
  { id: '2027-tcu', aliquotaPct: 11.3, nome: { pt: '2027 — CBS pelo cálculo do TCU (11,3%)', en: '2027 — CBS per the TCU calculation (11.3%)', es: '2027 — CBS según el cálculo del TCU (11,3%)' }, fonte: 'TCU, cálculo da alíquota de referência da CBS para 2027; vale se o Senado não fixar outra até 15/12/2026' },
  { id: '2027-cgibs', aliquotaPct: 9.21, nome: { pt: '2027 — CBS pela estimativa do Comitê Gestor (9,21%)', en: '2027 — CBS per the Management Committee estimate (9.21%)', es: '2027 — CBS según la estimación del Comité Gestor (9,21%)' }, fonte: 'Comitê Gestor do IBS, estimativa usada nos cálculos para 2027' },
  { id: 'pleno-cgibs', aliquotaPct: 27.91, nome: { pt: 'Regime cheio (2033) — CBS + IBS, Comitê Gestor (27,91%)', en: 'Full regime (2033) — CBS + IBS, Management Committee (27.91%)', es: 'Régimen pleno (2033) — CBS + IBS, Comité Gestor (27,91%)' }, fonte: 'Comitê Gestor do IBS, estimativa da alíquota conjunta' },
  { id: 'pleno-fazenda', aliquotaPct: 26.5, nome: { pt: 'Regime cheio (2033) — estimativa da Fazenda na regulamentação (26,5%)', en: 'Full regime (2033) — Finance Ministry estimate at regulation (26.5%)', es: 'Régimen pleno (2033) — estimación de Hacienda en la reglamentación (26,5%)' }, fonte: 'Ministério da Fazenda, estimativa na regulamentação (LC 214/2025 prevê medida se passar de 26,5%)' },
]

export type EntradaSplit = {
  receitaMensal: number           // receita bruta média mensal (DRE)
  pctTributavel: number           // parte da receita que paga IBS/CBS pelo regime regular (0–100)
  comprasComCreditoMensal: number // compras que geram crédito de IBS/CBS (insumos, mercadorias)
  aliquotaPct: number             // alíquota do cenário (CBS ou CBS + IBS)
  diasImpostoNoCaixa: number      // hoje: quantos dias, em média, o tributo fica no caixa entre receber e recolher
  caixaHoje?: number | null
}

const r2 = (v: number) => Math.round(v * 100) / 100
export function simularSplit(e: EntradaSplit) {
  const t = Math.max(0, e.aliquotaPct) / 100
  const base = Math.max(0, e.receitaMensal) * Math.min(100, Math.max(0, e.pctTributavel)) / 100
  const compras = Math.max(0, e.comprasComCreditoMensal)
  const dias = Math.min(120, Math.max(0, e.diasImpostoNoCaixa))
  // Pior caso: retém tudo o que foi destacado (procedimento simplificado, ou crédito ainda não apurado)
  const retidoBruto = r2(base * t)
  // Procedimento padrão: o crédito das compras já pagas abate o que é retido
  const creditos = r2(Math.min(base, compras) * t)
  const retidoLiquido = r2(Math.max(0, retidoBruto - creditos))
  // Capital de giro: o dinheiro do tributo que hoje fica no caixa por N dias deixa de existir
  const capitalGiroLiquido = r2(retidoLiquido * dias / 30)
  const capitalGiroPiorCaso = r2(retidoBruto * dias / 30)
  const pctReceitaRetida = e.receitaMensal > 0 ? Math.round((retidoBruto / e.receitaMensal) * 1000) / 10 : 0
  const caixa = e.caixaHoje ?? null
  const caixaCobre = caixa != null && capitalGiroPiorCaso > 0 ? caixa >= capitalGiroPiorCaso : null
  const alertas: string[] = []
  if (caixa != null && capitalGiroLiquido > 0 && caixa < capitalGiroLiquido) alertas.push('o caixa de hoje não cobre o capital de giro que o split vai tirar')
  else if (caixa != null && capitalGiroPiorCaso > 0 && caixa < capitalGiroPiorCaso) alertas.push('o caixa cobre o cenário com créditos, mas não o pior caso (retenção cheia)')
  if (compras > base) alertas.push('as compras com crédito passam da receita tributável: confira os valores')
  return { base: r2(base), retidoBruto, creditos, retidoLiquido, capitalGiroLiquido, capitalGiroPiorCaso, pctReceitaRetida, caixaCobre, alertas, diasImpostoNoCaixa: dias }
}
