// ═══════════════════════════════════════════════════════════════
// RH ↔ Fluxo de Caixa · Calendário da folha (2026-11-09). Saídas PREVISTAS da folha atual, sem gravar nada:
//   salário da competência até o 5º dia útil do mês seguinte (CLT art. 459, § 1º; sábado conta como dia útil, domingo não —
//     IN SRT/MTE nº 1/1989; feriados não são considerados aqui);
//   FGTS e INSS patronal da competência no dia 20 do mês seguinte, antecipados para o dia útil anterior se cair no fim de semana;
//   13º: 1ª parcela até 30/11 e 2ª até 20/12 (Lei 4.749/1965), antecipadas se caírem no fim de semana; encargos da 1ª parcela
//     no dia 20/12 e da 2ª no dia 20/01.
// Contra contar duas vezes: se a folha já está lançada em Custos Fixos (o Fluxo projeta esse custo fixo), o RH projeta SÓ o 13º.
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from './financeiro/contrato'

export type SaidaFolha = { data: string; valor: number; rotulo: string }
const iso = (a: number, m: number, d: number) => new Date(Date.UTC(a, m - 1, d)).toISOString().slice(0, 10)
const diaSemana = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay() // 0 = domingo, 6 = sábado

// 5º dia útil do mês (sábado conta; domingo não)
export function quintoDiaUtil(ano: number, mes: number): string {
  let n = 0
  for (let d = 1; d <= 31; d++) { const x = iso(ano, mes, d); if (diaSemana(x) !== 0 && ++n === 5) return x }
  return iso(ano, mes, 5)
}
// vencimento que cai no fim de semana é antecipado para a sexta-feira
export function anteciparDiaUtil(data: string): string {
  const w = diaSemana(data)
  return w === 6 ? iso(+data.slice(0, 4), +data.slice(5, 7), +data.slice(8, 10) - 1) : w === 0 ? iso(+data.slice(0, 4), +data.slice(5, 7), +data.slice(8, 10) - 2) : data
}

export function previsaoFolhaCaixa(p: { salarioMensal: number; encargosMensais: number; decimoTerceiroAno: number | null; hoje: string; horizonteDias?: number; folhaJaNosCustosFixos: boolean }): SaidaFolha[] {
  const limite = new Date(Date.parse(`${p.hoje}T12:00:00Z`) + (p.horizonteDias ?? 120) * 86400000).toISOString().slice(0, 10)
  const out: SaidaFolha[] = []
  const add = (data: string, valor: number, rotulo: string) => { if (data >= p.hoje && data <= limite && valor > 0) out.push({ data, valor: reais(valor), rotulo }) }
  const sal = centavos(p.salarioMensal), enc = centavos(p.encargosMensais)
  const [a0, m0] = [Number(p.hoje.slice(0, 4)), Number(p.hoje.slice(5, 7))]
  // competência do mês passado (paga neste mês) até a que o horizonte alcança
  for (let i = -1; i <= Math.ceil((p.horizonteDias ?? 120) / 30); i++) {
    const t = a0 * 12 + (m0 - 1) + i, ca = Math.floor(t / 12), cm = (t % 12) + 1
    const pa = Math.floor((t + 1) / 12), pm = ((t + 1) % 12) + 1
    const comp = `${String(cm).padStart(2, '0')}/${ca}`
    if (!p.folhaJaNosCustosFixos) {
      add(quintoDiaUtil(pa, pm), sal, `Salários de ${comp} (5º dia útil)`)
      add(anteciparDiaUtil(iso(pa, pm, 20)), enc, `FGTS e INSS de ${comp} (dia 20)`)
    }
  }
  if (p.decimoTerceiroAno) {
    const d13 = centavos(p.decimoTerceiroAno), p1 = Math.round(d13 / 2), p2 = d13 - p1
    const pct = sal ? enc / sal : 0
    for (const ano of [a0, a0 + 1]) {
      add(anteciparDiaUtil(iso(ano, 11, 30)), p1, `13º ${ano} — 1ª parcela (até 30/11)`)
      add(anteciparDiaUtil(iso(ano, 12, 20)), p2 + Math.round(p1 * pct), `13º ${ano} — 2ª parcela e encargos da 1ª (20/12)`)
      add(anteciparDiaUtil(iso(ano + 1, 1, 20)), Math.round(p2 * pct), `13º ${ano} — encargos da 2ª parcela (20/01)`)
    }
  }
  return out.sort((x, y) => x.data.localeCompare(y.data))
}
