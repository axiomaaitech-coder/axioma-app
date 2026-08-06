import type { FaseRiscoDAS } from "./meiHelpers";

// Camada proativa do Cockpit MEI (Fase 2A, Peça 2) — motor de regras
// determinístico, zero IA. Recebe os MESMOS valores que os 4 cards do
// Cockpit já calculam (nunca recalcula nada aqui), pra nunca divergir do
// que a tela mostra. Não sabe idioma nem cor — só severidade + dados; quem
// traduz e pinta é a tela.

export type SeveridadeAviso = "risco" | "neutro" | "positivo";

export type ChaveAvisoCockpit =
  | "das_atrasado"
  | "das_vence_em"
  | "teto_risco"
  | "teto_neutro"
  | "cofre_negativo"
  | "sobra_insuficiente"
  | "trabalho_gratis_prejuizo"
  | "trabalho_gratis_apertada"
  | "faturamento_queda"
  | "tudo_em_ordem";

export type AvisoCockpit = {
  severidade: SeveridadeAviso;
  chaveI18n: ChaveAvisoCockpit;
  valores: Record<string, number | string>;
  ctaPath: string | null;
};

export type InputAvisosCockpitMEI = {
  faseAtualDas: FaseRiscoDAS;
  diasAtrasoDas: number;
  diasAteVencimentoDas: number;
  percentualLimiteTeto: number;
  mesEstouroLabel: string | null;
  proLaboreSeguro: number;
  sobraMes: number;
  reservaNecessaria: number;
  situacaoTrabalhoGraca: "prejuizo" | "apertada" | "saudavel" | null;
  prejuizoPorUnidade: number;
  margemRealPct: number;
  crescimentoMoM: number;
  temHistoricoMesAnterior: boolean;
};

const PESO_SEVERIDADE: Record<SeveridadeAviso, number> = { risco: 0, neutro: 1, positivo: 2 };
const LIMITE_AVISOS_LETREIRO = 4;
const DIAS_JANELA_VENCIMENTO_DAS = 5;
const PCT_TETO_RISCO = 90;
const PCT_TETO_NEUTRO = 70;

export function montarAvisosCockpitMEI(input: InputAvisosCockpitMEI): AvisoCockpit[] {
  const avisos: AvisoCockpit[] = [];

  if (input.faseAtualDas !== "em_dia") {
    avisos.push({ severidade: "risco", chaveI18n: "das_atrasado", valores: { dias: input.diasAtrasoDas }, ctaPath: "/mei/das" });
  } else if (input.diasAteVencimentoDas <= DIAS_JANELA_VENCIMENTO_DAS) {
    avisos.push({ severidade: "neutro", chaveI18n: "das_vence_em", valores: { dias: input.diasAteVencimentoDas }, ctaPath: "/mei/das" });
  }

  if (input.mesEstouroLabel !== null || input.percentualLimiteTeto >= PCT_TETO_RISCO) {
    avisos.push({ severidade: "risco", chaveI18n: "teto_risco", valores: { percentual: input.percentualLimiteTeto }, ctaPath: "/mei/faturamento" });
  } else if (input.percentualLimiteTeto >= PCT_TETO_NEUTRO) {
    avisos.push({ severidade: "neutro", chaveI18n: "teto_neutro", valores: { percentual: input.percentualLimiteTeto }, ctaPath: "/mei/faturamento" });
  }

  if (input.proLaboreSeguro < 0) {
    avisos.push({ severidade: "risco", chaveI18n: "cofre_negativo", valores: { valor: input.proLaboreSeguro }, ctaPath: "/mei" });
  }

  if (input.sobraMes < input.reservaNecessaria) {
    avisos.push({ severidade: "risco", chaveI18n: "sobra_insuficiente", valores: { sobra: input.sobraMes, necessario: input.reservaNecessaria }, ctaPath: "/mei" });
  }

  if (input.situacaoTrabalhoGraca === "prejuizo") {
    avisos.push({ severidade: "risco", chaveI18n: "trabalho_gratis_prejuizo", valores: { prejuizo: input.prejuizoPorUnidade }, ctaPath: "/mei/precificacao" });
  } else if (input.situacaoTrabalhoGraca === "apertada") {
    avisos.push({ severidade: "neutro", chaveI18n: "trabalho_gratis_apertada", valores: { margem: input.margemRealPct }, ctaPath: "/mei/precificacao" });
  }

  if (input.temHistoricoMesAnterior && input.crescimentoMoM < 0) {
    avisos.push({ severidade: "risco", chaveI18n: "faturamento_queda", valores: { percentual: Math.abs(input.crescimentoMoM) }, ctaPath: "/mei/faturamento" });
  }

  if (avisos.length === 0) {
    avisos.push({ severidade: "positivo", chaveI18n: "tudo_em_ordem", valores: {}, ctaPath: null });
  }

  return avisos
    .sort((a, b) => PESO_SEVERIDADE[a.severidade] - PESO_SEVERIDADE[b.severidade])
    .slice(0, LIMITE_AVISOS_LETREIRO);
}
