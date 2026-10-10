// 🦅 REGRAS OFICIAIS VIGENTES — base única que a IA recebe em pergunta tributária/MEI (2026-10-10).
// Cada regra tem fonte e data da última conferência. Passou de REVISAR_APOS_DIAS sem conferir,
// a IA é avisada para dizer que o valor pode estar desatualizado (nunca afirma lei velha como atual).
// Valores numéricos vêm das constantes que as telas usam — a IA e a tela nunca divergem.
import { LIMITES_MEI, INSS_MEI_2026, INSS_MEI_TAC_2026 } from "./meiHelpers";

export type RegraOficial = { tema: string; regra: string; fonte: string; verificado_em: string };
export const REVISAR_APOS_DIAS = 180;

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const comum = LIMITES_MEI.find((r) => r.tipo === "comum")!;
const tac = LIMITES_MEI.find((r) => r.tipo === "tac")!;

export const REGRAS_OFICIAIS: RegraOficial[] = [
  { tema: "Salário mínimo 2026", regra: "R$ 1.621,00", fonte: "Decreto 12.797/2025", verificado_em: "2026-10-10" },
  { tema: "DAS do MEI 2026", regra: `INSS ${brl(INSS_MEI_2026)} (5% do salário mínimo) + ICMS R$ 1,00 (comércio/indústria) e/ou ISS R$ 5,00 (serviços); caminhoneiro (TAC): INSS ${brl(INSS_MEI_TAC_2026)} (12%). Vence dia 20 do mês seguinte à competência.`, fonte: "LC 123/2006 art. 18-A; gov.br/empresas-e-negocios", verificado_em: "2026-10-10" },
  { tema: "Limite do MEI", regra: `${brl(comum.anual)}/ano (${brl(comum.mensal)}/mês no ano de abertura); caminhoneiro ${brl(tac.anual)}/ano. Excesso até ${comum.tolerancia_pct}%: sai do MEI em 1º de janeiro seguinte e paga a diferença em janeiro; acima de ${comum.tolerancia_pct}%: desenquadramento retroativo ao início do ano.`, fonte: `${comum.fonte}; ${tac.fonte}; LC 123/2006 art. 18-A §7º`, verificado_em: "2026-10-10" },
  { tema: "Projetos de lei sobre o MEI", regra: "Propostas para aumentar o limite do MEI (ex.: PLP 108/2021, PLP 186/2026) NÃO estão aprovadas: não valem até virar lei publicada. Nunca trate projeto como regra vigente.", fonte: "Câmara dos Deputados / Senado — tramitação", verificado_em: "2026-10-10" },
  { tema: "DASN-SIMEI", regra: "Declaração anual do MEI até 31 de maio do ano seguinte; pede receita de comércio/indústria/transporte (ICMS), de serviços (ISS) e se houve empregado.", fonte: "Resolução CGSN 140/2018", verificado_em: "2026-10-10" },
  { tema: "Pagamento do DAS", regra: "Pix, código de barras, débito automático; cartão de crédito no PGMEI (\"Pagar Online\") desde setembro de 2025. Cartão de débito não consta nas regras oficiais.", fonte: "Receita Federal — PGMEI", verificado_em: "2026-10-10" },
  { tema: "Simples Nacional", regra: "ME até R$ 360 mil/ano; EPP até R$ 4,8 milhões/ano. Alíquota efetiva = (RBT12 × alíquota − parcela a deduzir) / RBT12, pelos Anexos I a V. Empresa nova opta em até 30 dias da última inscrição, sem passar de 60 dias da abertura do CNPJ.", fonte: "LC 123/2006 arts. 3º e 18; Resolução CGSN 140/2018 art. 6º", verificado_em: "2026-10-10" },
  { tema: "Reforma Tributária (IBS/CBS)", regra: "Transição de 2026 a 2033 (2026 é ano de teste, com alíquotas simbólicas de CBS 0,9% e IBS 0,1% compensáveis). MEI e Simples continuam com regime próprio; regras de detalhe ainda podem mudar por regulamentação.", fonte: "EC 132/2023; LC 214/2025", verificado_em: "2026-10-10" },
];

const diasEntre = (a: string, b: string) => Math.floor((Date.parse(b) - Date.parse(a)) / 86400000);

export function textoRegrasOficiais(hoje: string): string {
  const linhas = REGRAS_OFICIAIS.map((r) => {
    const velha = diasEntre(r.verificado_em, hoje) > REVISAR_APOS_DIAS;
    return `- ${r.tema}: ${r.regra} (fonte: ${r.fonte}; conferido em ${r.verificado_em}${velha ? " — REVISAR: conferência antiga, avise que o valor pode ter mudado" : ""})`;
  });
  return `REGRAS OFICIAIS VIGENTES (base do Axioma — use estes valores; manchete de jornal não muda lei; projeto de lei não aprovado não vale):\n${linhas.join("\n")}`;
}

export const regrasPrecisamRevisao = (hoje: string) => REGRAS_OFICIAIS.filter((r) => diasEntre(r.verificado_em, hoje) > REVISAR_APOS_DIAS);
