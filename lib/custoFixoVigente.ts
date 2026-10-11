// Custo fixo VIGENTE HOJE — filtro único aplicado direto na consulta (2026-10-10).
// Antes ~20 telas somavam custo fixo já encerrado (data_fim no passado) ou que ainda vai começar,
// e cada uma dava um número diferente da DRE. Use em toda leitura que quer "o custo fixo de agora".
// Não use onde o histórico importa: tela Custos Fixos (lista tudo), DRE por competência (vigência
// mês a mês em lib/dreCompetencia) e geração da conta do mês (lib/contasPagarHelpers).
import { hojeISO } from "./datas";

// Uma condição só (PostgREST): início vazio ou ≤ dia  E  fim vazio ou ≥ dia.
export function filtroVigente(dia = hojeISO()): string {
  return `and(data_inicio.is.null,data_fim.is.null),and(data_inicio.is.null,data_fim.gte.${dia}),and(data_inicio.lte.${dia},data_fim.is.null),and(data_inicio.lte.${dia},data_fim.gte.${dia})`;
}

export function soVigentes<Q extends { or: (filtro: string) => Q }>(consulta: Q, dia = hojeISO()): Q {
  return consulta.or(filtroVigente(dia));
}
