// 🦅 PORTA ÚNICA DOS LANÇAMENTOS MANUAIS (Elias 2026-10-08)
//
// Receita digitada em Receitas/Faturamento MEI, custo em Custos Variáveis/Importar
// e lançamento no Fluxo de Caixa passam pelo Motor de Rastreabilidade igual às
// contas: chegam na Contabilidade e na porta que falta (Receitas/Custos → Fluxo;
// Fluxo → DRE), com status, conserto automático e sem duplicar.
//
// Editar = desfaz o rastro anterior (esperando terminar) e registra de novo.
// Apagar = desfaz. Linha antiga, de antes do motor, não tem rastro: nada a desfazer.
//
// DUPLICIDADE — o motor decide sozinho, só pergunta no caso extremo:
//   mesmo valor + data a 1 dia + descrição/cliente parecido → DUPLICATA (bloqueia e avisa)
//   mesmo valor + data a 1 dia, texto diferente            → PERGUNTA (caso extremo)
//   mesmo valor em outro mês, ou data longe                → segue (recorrente/outro dinheiro)
import { createBrowserClient } from "@supabase/ssr";
import { registrarMovimentacao, type PayloadRastreio } from "./motor";
import { normalizarTexto } from "../cfoCore";
import { avaliarDuplicidade, type Idioma } from "../motorDuplicidade";
import { hojeISO } from "../datas";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type OrigemManual = "receitas" | "custos_variaveis" | "fluxo_caixa";
export type Natureza = "receita" | "custo" | "aporte" | "emprestimo" | "pag_emprestimo" | "retirada" | "transferencia" | "aplicacao";
export type LancamentoManual = {
  id: string; descricao: string; valor: number; data: string; natureza: Natureza;
  categoria?: string | null; centro_custo_id?: string | null; forma?: string | null; contraparte_id?: string | null;
  modulo?: string; // de qual tela veio (ex.: faturamento_mei)
};

// Natureza do lançamento do Fluxo de Caixa, guardada na própria coluna categoria.
export const NATUREZAS_FLUXO: { natureza: Natureza; entrada: boolean | null; pt: string; en: string; es: string }[] = [
  { natureza: "receita", entrada: true, pt: "Receita (venda/serviço)", en: "Revenue (sale/service)", es: "Ingreso (venta/servicio)" },
  { natureza: "custo", entrada: false, pt: "Custo/Despesa", en: "Cost/Expense", es: "Costo/Gasto" },
  { natureza: "aporte", entrada: true, pt: "Aporte de sócio", en: "Partner contribution", es: "Aporte de socio" },
  { natureza: "emprestimo", entrada: true, pt: "Empréstimo recebido", en: "Loan received", es: "Préstamo recibido" },
  { natureza: "pag_emprestimo", entrada: false, pt: "Pagamento de empréstimo", en: "Loan payment", es: "Pago de préstamo" },
  { natureza: "retirada", entrada: false, pt: "Retirada de sócio", en: "Partner withdrawal", es: "Retiro de socio" },
  { natureza: "transferencia", entrada: null, pt: "Transferência entre contas", en: "Transfer between accounts", es: "Transferencia entre cuentas" },
  { natureza: "aplicacao", entrada: null, pt: "Aplicação/resgate de investimento", en: "Investment/redemption", es: "Inversión/rescate" },
];

// Natureza pelo texto do extrato (regra, sem IA). Só devolve o que NÃO é resultado
// (transferência, aplicação, aporte, empréstimo, retirada) — dinheiro que se move mas
// não é receita nem custo. null = segue como receita/custo comum.
const SINAIS_NATUREZA: [Natureza, RegExp][] = [
  ["aplicacao", /\b(aplic|resgate|cdb|lci|lca|poupanca|invest|fundo|tesouro direto|rdb)/],
  ["transferencia", /(entre contas|mesma titularidade|transf(erencia)? (propria|p\/ conta propria)|conta propria)/],
  ["pag_emprestimo", /(parc(ela)?\.? ?(emprest|financ)|pagto (emprest|financ)|amortiza)/],
  ["emprestimo", /(emprest|financiamento|credito pessoal|capital de giro|\bcdc\b|pronampe)/],
  ["aporte", /(aporte|integraliza|capital social|aumento de capital)/],
  ["retirada", /(retirada (de )?socio|distribuicao de lucro|dividendo)/],
];
export function naturezaPorTexto(texto: string, entrada: boolean): Natureza | null {
  const t = normalizarTexto(texto || "");
  for (const [n, re] of SINAIS_NATUREZA) {
    if (!re.test(t)) continue;
    if (n === "emprestimo" && !entrada) return "pag_emprestimo"; // saída citando empréstimo = pagamento dele
    if ((n === "aporte" && !entrada) || (n === "retirada" && entrada)) continue;
    return n;
  }
  return null;
}
export function naturezaDoFluxo(categoria: string | null | undefined, tipo: string): Natureza {
  const achou = NATUREZAS_FLUXO.find((n) => n.natureza === categoria || n.pt === categoria);
  return achou ? achou.natureza : tipo === "entrada" ? "receita" : "custo";
}

export async function registrarLancamentoManual(empresaId: string, origem: OrigemManual, d: LancamentoManual): Promise<{ erro?: string }> {
  if (!(d.valor > 0)) return {};
  const payload: PayloadRastreio = {
    descricao: d.descricao, categoria: d.categoria ?? null, centro_custo_id: d.centro_custo_id ?? null, forma: d.forma ?? null,
    contraparte_id: d.contraparte_id ?? null, natureza: d.natureza, origem_modulo: d.modulo ?? origem,
    evento_tipo: "MANUAL_ENTRY_RECORDED",
    evento_payload: { natureza: d.natureza, valor: d.valor, categoria: d.categoria ?? null, forma: d.forma ?? null, data: d.data, descricao: d.descricao, centro_custo_id: d.centro_custo_id ?? null },
  };
  const r = await registrarMovimentacao({ empresaId, tipo: "manual", origemTabela: origem, origemId: d.id, valor: d.valor, data: d.data, payload });
  return { erro: r.erro };
}

// Desfaz o último rastro ativo da linha e ESPERA terminar (pra edição nunca correr
// contra o lançamento novo da mesma linha).
export async function desfazerLancamentoManual(empresaId: string, origem: OrigemManual, id: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("rastreio_movimentacao").select("id, tipo, evento_id, valor, payload")
    .eq("empresa_id", empresaId).eq("origem_tabela", origem).eq("origem_id", id).in("tipo", ["manual", "manual_estorno"])
    .order("criado_em", { ascending: false }).limit(1);
  if (error) return { erro: error.message };
  const ult = data?.[0];
  if (!ult || ult.tipo !== "manual") return {}; // linha de antes do motor, ou já desfeita
  const orig = ult.payload as PayloadRastreio;
  const r = await registrarMovimentacao({
    empresaId, tipo: "manual_estorno", origemTabela: origem, origemId: id, valor: Number(ult.valor), data: hojeISO(), aguardar: true,
    payload: {
      descricao: `Desfeito: ${orig.descricao}`, natureza: orig.natureza ?? null, rastreio_original_id: ult.id as string,
      evento_tipo: "MANUAL_ENTRY_REVERSED", evento_payload: { evento_original_id: ult.evento_id ?? null },
    },
  });
  return { erro: r.erro };
}

// ============================================================================
// DUPLICIDADE — porta única: Motor Antiduplicidade (lib/motorDuplicidade.ts).
// Regra (documento, fornecedor, forma de pagamento, datas) → IA só na dúvida →
// pergunta ao humano. Aqui só traduz o resultado para o aviso das telas manuais.
// ============================================================================
export type Suspeita = { modulo: string; descricao: string; valor: number; data: string };
export type VeredictoDuplicidade = { veredicto: "segue" | "duplicata" | "perguntar"; suspeitas: Suspeita[]; explicacao?: string; pergunta?: string | null };

export async function verificarDuplicidade(
  empresaId: string,
  d: { entrada: boolean; valor: number; data: string; descricao: string; contraparteNome?: string | null; forma?: string | null; ignorar?: { tabela: OrigemManual; id: string }; lang?: Idioma },
): Promise<VeredictoDuplicidade> {
  if (!(d.valor > 0)) return { veredicto: "segue", suspeitas: [] };
  const lang = d.lang ?? "pt";
  const [a] = await avaliarDuplicidade(empresaId, [{
    valor: d.valor, data: d.data, descricao: d.descricao, contraparteNome: d.contraparteNome ?? null, forma: d.forma ?? null,
    entrada: d.entrada, destino: d.ignorar?.tabela, ignorarId: d.ignorar?.id,
  }], lang);
  if (a.decisao === "segue") return { veredicto: "segue", suspeitas: [] };
  return {
    veredicto: a.decisao,
    suspeitas: a.suspeitas.slice(0, 5).map((x) => ({ modulo: x.candidato.modulo[lang], descricao: x.candidato.descricao || "—", valor: x.candidato.valor, data: x.candidato.data || x.candidato.vencimento || "" })),
    explicacao: a.explicacao, pergunta: a.pergunta,
  };
}
