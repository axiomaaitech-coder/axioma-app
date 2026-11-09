// ═══════════════════════════════════════════════════════════════
// RH ↔ Financeiro · Indicadores de CFO para pessoas (2026-11-09, item 4 do plano). Puro e testável:
//   custo de pessoal / faturamento (%), faturamento por pessoa, custo médio por pessoa, lucro por pessoa (médias mensais
//   dos últimos 12 meses completos da DRE) e o headcount de cada centro de custo (digitado à mão, usado no rateio) × o real do RH.
// Nenhum "padrão de mercado" é inventado: só os números da própria Empresa, com a fonte de cada um.
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from './financeiro/contrato'

export function indicadoresPessoas(p: {
  // pessoasComSalario: o custo de pessoal só soma quem tem salário mensal cadastrado — o custo médio divide por eles, não por todos
  pessoas: number; pessoasComSalario?: number; custoPessoalMensal: number | null; receitaMediaMensal: number | null; lucroMedioMensal: number | null
  folhaForaDaDre?: boolean
  centros?: { nome: string; headcountCadastrado: number | null; pessoasRh: number }[]
}) {
  const div = (a: number | null, b: number) => (a == null || !b ? null : reais(Math.round(centavos(a) / b)))
  const pct = p.custoPessoalMensal != null && p.receitaMediaMensal ? Math.round((centavos(p.custoPessoalMensal) / centavos(p.receitaMediaMensal)) * 1000) / 10 : null
  const alertas: string[] = []
  if (pct != null && pct > 100) alertas.push('o custo de pessoal passa do faturamento médio mensal')
  if (p.folhaForaDaDre) alertas.push('a folha não está (toda) lançada em Custos Fixos: o lucro médio da DRE está maior que o real')
  const centros = (p.centros ?? []).map((c) => ({ ...c, confere: c.headcountCadastrado == null ? null : c.headcountCadastrado === c.pessoasRh }))
  const divergentes = centros.filter((c) => c.confere === false)
  if (p.pessoasComSalario != null && p.pessoasComSalario < p.pessoas) alertas.push(`${p.pessoas - p.pessoasComSalario} pessoa(s) sem salário mensal cadastrado: ficaram fora do custo de pessoal`)
  if (divergentes.length) alertas.push(`${divergentes.length} centro(s) de custo com "headcount" diferente do RH: o rateio por pessoas usa o número digitado`)
  return {
    pessoas: p.pessoas,
    pessoal_sobre_faturamento_pct: pct,
    faturamento_por_pessoa: div(p.receitaMediaMensal, p.pessoas),
    custo_medio_por_pessoa: div(p.custoPessoalMensal, p.pessoasComSalario ?? p.pessoas), pessoas_com_salario: p.pessoasComSalario ?? p.pessoas,
    lucro_por_pessoa: div(p.lucroMedioMensal, p.pessoas),
    centros, alertas,
  }
}
