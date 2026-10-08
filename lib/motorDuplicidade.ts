// 🦅 MOTOR ANTIDUPLICIDADE (Elias 2026-10-08)
//
// Porta única que decide se uma conta/lançamento que está ENTRANDO (Contas a Pagar,
// Importar Documentos) já existe no Axioma. Três camadas:
//
//   1) REGRA (prova documental, sem custo, auditável):
//        chave de acesso da NF-e igual ............................ MESMA (certeza)
//        mesmo nº de nota + mesmo fornecedor/cliente + mesmo valor ... MESMA
//        chave/nº diferente, fornecedor diferente, parcela/vencimento
//        diferente, FORMA DE PAGAMENTO diferente (cartão × boleto × Pix),
//        datas longe ................................................ DIFERENTE
//        o resto (mesmo valor, data perto, nada prova nem desprova) . DÚVIDA
//   2) INTELIGÊNCIA: só a DÚVIDA vai para a IA, com alerta para ler datas, horário,
//      forma de pagamento, parcela e texto com atenção. Só decide sozinha quando tem
//      confiança alta.
//   3) HUMANO: o que continua em dúvida vira pergunta para o operador/contador.
//      Nada é descartado sem ele ver.
//
// Linhas criadas pelo próprio Motor de Rastreabilidade (rastreio_id) são CÓPIAS da
// conta de origem: não contam como "outra conta" (a origem já é candidata), exceto
// no Fluxo de Caixa quando o que entra é extrato — aí a cópia é o pagamento já lançado.
import { createBrowserClient } from "@supabase/ssr";
import { normalizarTexto } from "./cfoCore";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type Idioma = "pt" | "en" | "es";
type Texto = { pt: string; en: string; es: string };

export type Lancamento = {
  valor: number;
  data?: string | null; // emissão/competência (YYYY-MM-DD)
  dataHora?: string | null; // ISO com hora, quando o documento traz
  vencimento?: string | null;
  descricao?: string | null;
  documento?: string | null; // nº da nota / documento / FITID do extrato
  chaveAcesso?: string | null; // 44 dígitos da NF-e
  forma?: string | null; // forma de pagamento como veio (texto livre)
  contraparteId?: string | null;
  contraparteDoc?: string | null; // CNPJ/CPF
  contraparteNome?: string | null;
  entrada: boolean; // true = dinheiro entrando (receber), false = saindo (pagar)
  destino?: string; // tabela onde vai ser gravado
  ignorarId?: string; // a própria linha, ao editar
};

export type Candidato = Lancamento & { tabela: string; id: string; modulo: Texto; copiaDoMotor: boolean };
type Veredicto = "mesma" | "diferente" | "duvida";
export type ResultadoPar = { veredicto: Veredicto; certeza: number; inclinacao: "mesma" | "diferente" | null; motivo: Texto };

// ============================================================================
// NORMALIZAÇÃO
// ============================================================================
const digitos = (s?: string | null) => (s || "").replace(/\D/g, "");
const docNorm = (s?: string | null) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^0+/, "");
const valorIgual = (a: number, b: number) => Math.abs(Math.round(a * 100) - Math.round(b * 100)) <= 1;
const diaUTC = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).getTime();
const diasEntre = (a: string, b: string) => Math.abs(diaUTC(a) - diaUTC(b)) / 86400000;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Forma de pagamento em grupos que nunca se confundem. Pix, TED e depósito são trilhos
// diferentes; "Outros"/vazio = não sabemos (não serve de prova).
export type Forma = "pix" | "boleto" | "cartao_credito" | "cartao_debito" | "dinheiro" | "transferencia" | "cheque" | "credito_loja" | "vale";
const NOME_FORMA: Record<Forma, Texto> = {
  pix: { pt: "Pix", en: "Pix", es: "Pix" },
  boleto: { pt: "boleto", en: "bank slip (boleto)", es: "boleto" },
  cartao_credito: { pt: "cartão de crédito", en: "credit card", es: "tarjeta de crédito" },
  cartao_debito: { pt: "cartão de débito", en: "debit card", es: "tarjeta de débito" },
  dinheiro: { pt: "dinheiro", en: "cash", es: "efectivo" },
  transferencia: { pt: "transferência/depósito", en: "transfer/deposit", es: "transferencia/depósito" },
  cheque: { pt: "cheque", en: "check", es: "cheque" },
  credito_loja: { pt: "crédito da loja", en: "store credit", es: "crédito de la tienda" },
  vale: { pt: "vale", en: "voucher", es: "vale" },
};
export function normalizarForma(texto?: string | null): Forma | null {
  const t = normalizarTexto(texto || "");
  if (!t || /^(outros?|other|otro|sem pagamento|-)$/.test(t)) return null;
  if (/\bpix\b/.test(t)) return "pix";
  if (/boleto|bloqueto|bank slip/.test(t)) return "boleto";
  if (/credito (da )?loja|store credit|credito de la tienda/.test(t)) return "credito_loja";
  if (/debito|debit/.test(t)) return "cartao_debito";
  if (/credito|credit|cartao|card|tarjeta/.test(t)) return "cartao_credito";
  if (/dinheiro|especie|cash|efectivo/.test(t)) return "dinheiro";
  if (/transf|\bted\b|\bdoc\b|deposito|deposit/.test(t)) return "transferencia";
  if (/cheque|check/.test(t)) return "cheque";
  if (/vale|voucher/.test(t)) return "vale";
  return null;
}

// "parcela 2/3", "parc. 2 de 3" — mesma nota, parcelas diferentes NUNCA são duplicata.
function parcela(descricao?: string | null): string | null {
  const m = normalizarTexto(descricao || "").match(/parc(?:ela)?\.?\s*(\d+)\s*(?:\/|de)\s*(\d+)/);
  return m ? `${Number(m[1])}/${Number(m[2])}` : null;
}

function tokens(t?: string | null): string[] {
  return normalizarTexto(t || "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter((x) => x.length > 2 && !/^\d+$/.test(x) && !["nota", "fiscal", "pagamento", "compra", "conta", "parcela"].includes(x));
}
function textoParecido(a?: string | null, b?: string | null): boolean | null {
  const ta = tokens(a), tb = new Set(tokens(b));
  if (!ta.length || !tb.size) return null; // sem texto pra comparar
  return ta.filter((x) => tb.has(x)).length / Math.min(ta.length, tb.size) >= 0.5;
}

// ============================================================================
// CAMADA 1 — REGRA: compara 1 conta nova com 1 existente
// ============================================================================
const R = (veredicto: Veredicto, certeza: number, motivo: Texto, inclinacao: ResultadoPar["inclinacao"] = null): ResultadoPar => ({ veredicto, certeza, motivo, inclinacao });

export function compararPar(n: Lancamento, e: Lancamento): ResultadoPar {
  const mesmoValor = valorIgual(n.valor, e.valor);
  const vencDif = !!(n.vencimento && e.vencimento && n.vencimento.slice(0, 10) !== e.vencimento.slice(0, 10));
  const pN = parcela(n.descricao), pE = parcela(e.descricao);
  const parcelaDif = !!(pN && pE && pN !== pE);

  // 1) Chave de acesso da NF-e: identidade única do documento na SEFAZ.
  const cN = digitos(n.chaveAcesso), cE = digitos(e.chaveAcesso);
  if (cN.length === 44 && cE.length === 44) {
    if (cN !== cE) return R("diferente", 1, { pt: "Notas fiscais diferentes (chave de acesso não é a mesma).", en: "Different invoices (access key differs).", es: "Facturas diferentes (la clave de acceso no coincide)." });
    if (vencDif || parcelaDif) return R("diferente", 0.97, { pt: "Mesma nota, mas outra parcela (vencimento diferente).", en: "Same invoice, but another installment (different due date).", es: "Misma factura, pero otra cuota (vencimiento diferente)." });
    if (mesmoValor) return R("mesma", 1, { pt: "Mesma nota fiscal: a chave de acesso é idêntica.", en: "Same invoice: the access key is identical.", es: "Misma factura: la clave de acceso es idéntica." });
    return R("duvida", 0.5, { pt: `Mesma nota fiscal, mas com valor diferente (${brl(n.valor)} × ${brl(e.valor)}). Pode ser parcela, correção ou pagamento parcial.`, en: `Same invoice, but a different amount (${brl(n.valor)} × ${brl(e.valor)}). It may be an installment, a correction or a partial payment.`, es: `Misma factura, pero con valor diferente (${brl(n.valor)} × ${brl(e.valor)}). Puede ser cuota, corrección o pago parcial.` });
  }

  // 2) Fornecedor/cliente diferente = dinheiro de outra relação.
  const dN = digitos(n.contraparteDoc), dE = digitos(e.contraparteDoc);
  const contraparteDif = (dN && dE) ? dN !== dE : !!(n.contraparteId && e.contraparteId && n.contraparteId !== e.contraparteId);
  const contraparteIgual = (dN && dE) ? dN === dE : !!(n.contraparteId && e.contraparteId && n.contraparteId === e.contraparteId);
  if (contraparteDif) return R("diferente", 0.95, { pt: "Fornecedor/cliente diferente.", en: "Different supplier/customer.", es: "Proveedor/cliente diferente." });

  // 3) Número do documento (nota, boleto, FITID do extrato).
  const docN = docNorm(n.documento), docE = docNorm(e.documento);
  if (docN && docE) {
    if (docN !== docE) return R("diferente", 0.9, { pt: `Documentos diferentes (nº ${n.documento} × nº ${e.documento}).`, en: `Different documents (no. ${n.documento} × no. ${e.documento}).`, es: `Documentos diferentes (nº ${n.documento} × nº ${e.documento}).` });
    if (vencDif || parcelaDif) return R("diferente", 0.95, { pt: "Mesma nota, mas outra parcela (vencimento diferente).", en: "Same invoice, but another installment (different due date).", es: "Misma factura, pero otra cuota (vencimiento diferente)." });
    if (!mesmoValor) return R("duvida", 0.5, { pt: `Mesmo nº de documento (${n.documento}), mas valor diferente (${brl(n.valor)} × ${brl(e.valor)}).`, en: `Same document no. (${n.documento}), but a different amount (${brl(n.valor)} × ${brl(e.valor)}).`, es: `Mismo nº de documento (${n.documento}), pero valor diferente (${brl(n.valor)} × ${brl(e.valor)}).` });
    if (contraparteIgual) return R("mesma", 0.97, { pt: `Mesmo nº de nota (${n.documento}), mesmo fornecedor/cliente e mesmo valor.`, en: `Same invoice no. (${n.documento}), same supplier/customer and same amount.`, es: `Mismo nº de factura (${n.documento}), mismo proveedor/cliente y mismo valor.` });
    return R("duvida", 0.8, { pt: `Mesmo nº de documento (${n.documento}) e mesmo valor, mas o fornecedor/cliente não está informado nos dois para confirmar.`, en: `Same document no. (${n.documento}) and amount, but the supplier/customer is not on both to confirm.`, es: `Mismo nº de documento (${n.documento}) y valor, pero el proveedor/cliente no está en ambos para confirmar.` }, "mesma");
  }

  if (!mesmoValor) return R("diferente", 0.9, { pt: "Valores diferentes.", en: "Different amounts.", es: "Valores diferentes." });
  if (vencDif) return R("diferente", 0.85, { pt: "Mesmo valor, mas vencimentos diferentes: são contas/parcelas distintas.", en: "Same amount, but different due dates: separate bills/installments.", es: "Mismo valor, pero vencimientos diferentes: cuentas/cuotas distintas." });
  if (parcelaDif) return R("diferente", 0.9, { pt: `Parcelas diferentes (${pN} × ${pE}).`, en: `Different installments (${pN} × ${pE}).`, es: `Cuotas diferentes (${pN} × ${pE}).` });

  // 4) Forma de pagamento: mesmo valor, mesmo dia e até quase o mesmo horário, mas
  // uma no cartão e outra no boleto/Pix = dois pagamentos de verdade (regra do Elias).
  const fN = normalizarForma(n.forma), fE = normalizarForma(e.forma);
  if (fN && fE && fN !== fE) {
    return R("diferente", 0.88, {
      pt: `Formas de pagamento diferentes (${NOME_FORMA[fN].pt} × ${NOME_FORMA[fE].pt}): são dois pagamentos distintos, mesmo com valor e data iguais.`,
      en: `Different payment methods (${NOME_FORMA[fN].en} × ${NOME_FORMA[fE].en}): two separate payments, even with the same amount and date.`,
      es: `Formas de pago diferentes (${NOME_FORMA[fN].es} × ${NOME_FORMA[fE].es}): son dos pagos distintos, aun con valor y fecha iguales.`,
    });
  }

  // 5) Datas longe = recorrência ou outra compra.
  const dtN = n.data || n.vencimento, dtE = e.data || e.vencimento;
  if (dtN && dtE && diasEntre(dtN, dtE) > 3) return R("diferente", 0.8, { pt: "Mesmo valor, mas em datas distantes (outra compra ou conta recorrente).", en: "Same amount, but on distant dates (another purchase or a recurring bill).", es: "Mismo valor, pero en fechas distantes (otra compra o cuenta recurrente)." });

  // Daqui pra baixo nada PROVA — vira dúvida, com a inclinação para a IA/humano.
  if (n.dataHora && e.dataHora) {
    const min = Math.abs(new Date(n.dataHora).getTime() - new Date(e.dataHora).getTime()) / 60000;
    if (min <= 1) return R("duvida", 0.85, { pt: "Mesmo valor, mesma data e mesmo horário, sem documento que diferencie.", en: "Same amount, same date and same time, with no document to tell them apart.", es: "Mismo valor, misma fecha y misma hora, sin documento que los diferencie." }, "mesma");
    return R("duvida", 0.6, { pt: `Mesmo valor e data, mas ${Math.round(min)} min de diferença no horário. Pode ser um segundo pagamento real ou o mesmo lançado duas vezes.`, en: `Same amount and date, but ${Math.round(min)} min apart. It may be a real second payment or the same one entered twice.`, es: `Mismo valor y fecha, pero ${Math.round(min)} min de diferencia. Puede ser un segundo pago real o el mismo registrado dos veces.` }, "diferente");
  }
  const parecido = textoParecido(`${n.descricao || ""} ${n.contraparteNome || ""}`, `${e.descricao || ""} ${e.contraparteNome || ""}`);
  if (parecido === true) return R("duvida", 0.8, { pt: "Mesmo valor, data próxima e descrição parecida.", en: "Same amount, close date and similar description.", es: "Mismo valor, fecha cercana y descripción parecida." }, "mesma");
  if (parecido === false) return R("duvida", 0.6, { pt: "Mesmo valor e data próxima, mas descrições diferentes.", en: "Same amount and close date, but different descriptions.", es: "Mismo valor y fecha cercana, pero descripciones diferentes." }, "diferente");
  return R("duvida", 0.5, { pt: "Mesmo valor e data próxima, sem nenhum dado que prove se é a mesma conta.", en: "Same amount and close date, with no data proving whether it is the same bill.", es: "Mismo valor y fecha cercana, sin ningún dato que pruebe si es la misma cuenta." });
}

// ============================================================================
// CANDIDATOS — o que já existe no Axioma (1 consulta por tabela, nunca por linha)
// ============================================================================
type CfgTabela = {
  tabela: string; lado: "pagar" | "receber" | "ambos"; modulo: Texto;
  colValor: string; colData: string; colVenc?: string; colDoc?: string; colChave?: string; colForma?: string;
  colContraparte?: string; tabContraparte?: "fornecedores" | "clientes";
};
const TABELAS: CfgTabela[] = [
  { tabela: "contas_pagar", lado: "pagar", modulo: { pt: "Contas a Pagar", en: "Accounts Payable", es: "Cuentas por Pagar" }, colValor: "valor_total", colData: "data_emissao", colVenc: "data_vencimento", colDoc: "numero_nota", colChave: "chave_acesso", colForma: "forma_pagamento", colContraparte: "fornecedor_id", tabContraparte: "fornecedores" },
  { tabela: "custos_variaveis", lado: "pagar", modulo: { pt: "Custos Variáveis", en: "Variable Costs", es: "Costos Variables" }, colValor: "valor", colData: "data", colDoc: "documento", colForma: "forma_pagamento" },
  { tabela: "contas_receber", lado: "receber", modulo: { pt: "Contas a Receber", en: "Accounts Receivable", es: "Cuentas por Cobrar" }, colValor: "valor", colData: "data_emissao", colVenc: "data_vencimento", colDoc: "numero_documento", colForma: "forma_recebimento", colContraparte: "cliente_id", tabContraparte: "clientes" },
  { tabela: "receitas", lado: "receber", modulo: { pt: "Receitas", en: "Revenue", es: "Ingresos" }, colValor: "valor", colData: "data", colDoc: "documento", colForma: "forma_recebimento", colContraparte: "cliente_id", tabContraparte: "clientes" },
  { tabela: "fluxo_caixa", lado: "ambos", modulo: { pt: "Fluxo de Caixa", en: "Cash Flow", es: "Flujo de Caja" }, colValor: "valor", colData: "data", colDoc: "documento", colForma: "forma_pagamento" },
];
const JANELA_DIAS = 3;
const somaDias = (iso: string, d: number) => new Date(diaUTC(iso) + d * 86400000).toISOString().slice(0, 10);

async function buscarCandidatos(empresaId: string, novos: Lancamento[]): Promise<Candidato[]> {
  const valores = [...new Set(novos.filter((n) => n.valor > 0).map((n) => Math.round(n.valor * 100) / 100))];
  const datas = novos.flatMap((n) => [n.data, n.vencimento].filter(Boolean) as string[]).map((d) => d.slice(0, 10)).sort();
  const docs = [...new Set(novos.map((n) => (n.documento || "").trim()).filter(Boolean))];
  const chaves = [...new Set(novos.map((n) => digitos(n.chaveAcesso)).filter((c) => c.length === 44))];
  const temPagar = novos.some((n) => !n.entrada), temReceber = novos.some((n) => n.entrada);
  const ini = datas.length ? somaDias(datas[0], -JANELA_DIAS) : null;
  const fim = datas.length ? somaDias(datas[datas.length - 1], JANELA_DIAS) : null;

  const linhas: { cfg: CfgTabela; r: Record<string, unknown> }[] = [];
  await Promise.all(TABELAS.filter((c) => c.lado === "ambos" || (c.lado === "pagar" ? temPagar : temReceber)).map(async (cfg) => {
    const consultas = [];
    if (valores.length && ini && fim) {
      let q = supabase.from(cfg.tabela).select("*").eq("empresa_id", empresaId).in(cfg.colValor, valores);
      q = cfg.colVenc
        ? q.or(`and(${cfg.colData}.gte.${ini},${cfg.colData}.lte.${fim}),and(${cfg.colVenc}.gte.${ini},${cfg.colVenc}.lte.${fim})`)
        : q.gte(cfg.colData, ini).lte(cfg.colData, fim);
      consultas.push(q.limit(500));
    }
    // Documento igual pega a mesma nota mesmo com data/valor digitados diferente.
    if (cfg.colDoc && docs.length) consultas.push(supabase.from(cfg.tabela).select("*").eq("empresa_id", empresaId).in(cfg.colDoc, docs).limit(200));
    if (cfg.colChave && chaves.length) consultas.push(supabase.from(cfg.tabela).select("*").eq("empresa_id", empresaId).in(cfg.colChave, chaves).limit(200));
    const vistos = new Set<string>();
    for (const { data } of await Promise.all(consultas)) {
      (data || []).forEach((r: Record<string, unknown>) => { if (!vistos.has(r.id as string)) { vistos.add(r.id as string); linhas.push({ cfg, r }); } });
    }
  }));

  // Nome e CNPJ do fornecedor/cliente (1 consulta por cadastro).
  const cadastros = new Map<string, { documento: string | null; nome: string | null }>();
  for (const tab of ["fornecedores", "clientes"] as const) {
    const ids = [...new Set([
      ...linhas.filter((l) => l.cfg.tabContraparte === tab).map((l) => l.r[l.cfg.colContraparte!] as string),
      ...novos.map((n) => n.contraparteId),
    ].filter(Boolean) as string[])];
    if (!ids.length) continue;
    const { data } = await supabase.from(tab).select("id, nome, documento").eq("empresa_id", empresaId).in("id", ids);
    (data || []).forEach((c: { id: string; nome: string | null; documento: string | null }) => cadastros.set(c.id, { documento: c.documento, nome: c.nome }));
  }
  novos.forEach((n) => {
    const c = n.contraparteId ? cadastros.get(n.contraparteId) : undefined;
    if (c) { n.contraparteDoc ||= c.documento; n.contraparteNome ||= c.nome; }
  });

  return linhas
    .filter(({ r }) => !["cancelado", "cancelada"].includes(String(r.status || "")))
    .map(({ cfg, r }) => {
      const cId = cfg.colContraparte ? (r[cfg.colContraparte] as string | null) : null;
      const cad = cId ? cadastros.get(cId) : undefined;
      const entrada = cfg.lado === "ambos" ? r.tipo === "entrada" : cfg.lado === "receber";
      return {
        tabela: cfg.tabela, id: r.id as string, modulo: cfg.modulo, copiaDoMotor: !!r.rastreio_id, entrada,
        valor: Number(r[cfg.colValor]) || 0,
        data: (r[cfg.colData] as string | null) ?? null,
        dataHora: (r.data_hora as string | null) ?? null,
        vencimento: cfg.colVenc ? (r[cfg.colVenc] as string | null) : null,
        descricao: (r.descricao as string | null) ?? null,
        documento: cfg.colDoc ? (r[cfg.colDoc] as string | null) : null,
        chaveAcesso: cfg.colChave ? (r[cfg.colChave] as string | null) : null,
        forma: cfg.colForma ? (r[cfg.colForma] as string | null) : null,
        contraparteId: cId, contraparteDoc: cad?.documento ?? null, contraparteNome: cad?.nome ?? null,
      };
    });
}

// ============================================================================
// ORQUESTRADOR — regra → inteligência → humano
// ============================================================================
export type Suspeita = { candidato: Candidato; par: ResultadoPar; motivo: string };
export type Avaliacao = {
  decisao: "segue" | "duplicata" | "perguntar";
  suspeitas: Suspeita[]; // a mais forte primeiro
  explicacao: string; // por que o motor decidiu assim (regra ou IA), no idioma da tela
  pergunta: string | null; // o que o humano precisa responder (só em "perguntar")
  porIA: boolean;
};
const CONFIANCA_IA_DIFERENTE = 0.85;
const CONFIANCA_IA_MESMA = 0.9;

// Resumo enxuto de um lançamento para a IA (sem ids internos, sem nada da empresa além do caso).
function paraIA(l: Lancamento | Candidato, lang: Idioma) {
  return {
    modulo: "modulo" in l ? l.modulo[lang] : undefined,
    valor: l.valor, data: l.data ?? null, horario: l.dataHora ? l.dataHora.slice(11, 16) : null, vencimento: l.vencimento ?? null,
    forma_pagamento: l.forma ?? null, documento: l.documento ?? null, chave_final: digitos(l.chaveAcesso).slice(-8) || null,
    fornecedor_ou_cliente: l.contraparteNome ?? null, cnpj: l.contraparteDoc ?? null, descricao: l.descricao ?? null,
    parcela: parcela(l.descricao),
  };
}

type RespostaIA = { id: number; veredicto: "mesma" | "diferente" | "incerto"; confianca: number; explicacao: string; pergunta: string };

export async function avaliarDuplicidade(empresaId: string, novos: Lancamento[], lang: Idioma = "pt"): Promise<Avaliacao[]> {
  const vazio = (): Avaliacao => ({ decisao: "segue", suspeitas: [], explicacao: "", pergunta: null, porIA: false });
  const res = novos.map(vazio);
  if (!empresaId || !novos.length) return res;

  const candidatos = await buscarCandidatos(empresaId, novos);
  const casosIA: { id: number; novo: ReturnType<typeof paraIA>; existentes: ReturnType<typeof paraIA>[]; analise_da_regra: string[] }[] = [];

  novos.forEach((n, i) => {
    const suspeitas: Suspeita[] = candidatos
      .filter((c) => c.entrada === n.entrada && c.id !== n.ignorarId && (!c.copiaDoMotor || (n.destino === "fluxo_caixa" && c.tabela === "fluxo_caixa")))
      .map((c) => ({ candidato: c, par: compararPar(n, c) }))
      .filter((s) => s.par.veredicto !== "diferente")
      .map((s) => ({ ...s, motivo: s.par.motivo[lang] }))
      .sort((a, b) => (a.par.veredicto === "mesma" ? 0 : 1) - (b.par.veredicto === "mesma" ? 0 : 1) || b.par.certeza - a.par.certeza);
    // Duas linhas IGUAIS dentro do mesmo arquivo/lote também são suspeitas entre si
    // (só no mesmo destino: receita + conta a receber da mesma venda é de propósito).
    novos.slice(0, i).forEach((o) => {
      if (o.entrada !== n.entrada || o.destino !== n.destino) return;
      const par = compararPar(n, o);
      if (par.veredicto === "diferente") return;
      suspeitas.push({ candidato: { ...o, tabela: "lote", id: `lote-${novos.indexOf(o)}`, copiaDoMotor: false, modulo: { pt: "Este mesmo arquivo", en: "This same file", es: "Este mismo archivo" } }, par, motivo: par.motivo[lang] });
    });
    if (!suspeitas.length) return;
    const top = suspeitas[0];
    if (top.par.veredicto === "mesma") {
      res[i] = { decisao: "duplicata", suspeitas, explicacao: top.motivo, pergunta: null, porIA: false };
      return;
    }
    res[i] = { decisao: "perguntar", suspeitas, explicacao: top.motivo, pergunta: null, porIA: false };
    casosIA.push({ id: i, novo: paraIA(n, lang), existentes: suspeitas.slice(0, 3).map((s) => paraIA(s.candidato, lang)), analise_da_regra: suspeitas.slice(0, 3).map((s) => s.motivo) });
  });

  // Camada 2 — Inteligência, em lotes de até 15 casos.
  for (let k = 0; k < casosIA.length; k += 15) {
    const lote = casosIA.slice(k, k + 15);
    let respostas: RespostaIA[] = [];
    try {
      const r = await fetch("/api/ia/duplicidade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empresa_id: empresaId, lang, casos: lote }) });
      if (r.ok) respostas = ((await r.json())?.resultados as RespostaIA[]) || [];
    } catch { /* sem IA: o humano decide com a explicação da regra */ }
    respostas.forEach((ia) => {
      const atual = res[ia.id];
      if (!atual || atual.decisao !== "perguntar") return;
      if (ia.veredicto === "diferente" && ia.confianca >= CONFIANCA_IA_DIFERENTE) res[ia.id] = { ...atual, decisao: "segue", explicacao: ia.explicacao, porIA: true };
      else if (ia.veredicto === "mesma" && ia.confianca >= CONFIANCA_IA_MESMA) res[ia.id] = { ...atual, decisao: "duplicata", explicacao: ia.explicacao, porIA: true };
      else res[ia.id] = { ...atual, explicacao: ia.explicacao || atual.explicacao, pergunta: ia.pergunta || null, porIA: true };
    });
  }

  // Sem pergunta da IA: pergunta padrão, clara, para o humano.
  res.forEach((a) => {
    if (a.decisao === "perguntar" && !a.pergunta) a.pergunta = {
      pt: "Esta conta é a mesma que já está lançada, ou é um segundo pagamento de verdade?",
      en: "Is this bill the same one already recorded, or a real second payment?",
      es: "¿Esta cuenta es la misma que ya está registrada, o es un segundo pago real?",
    }[lang];
  });
  return res;
}

// ============================================================================
// MOTOR DE BAIXA — "pagamento não é obrigação" (Financial Core 1.3)
// Um dinheiro que ENTRA no Axioma como pagamento (extrato, comprovante, lançamento
// de caixa) primeiro procura a conta em aberto que ele quita. Achou com certeza →
// dá baixa nela (o Motor de Rastreabilidade leva a baixa a Contabilidade, Fluxo,
// DRE, Inadimplência e Fornecedor) em vez de virar um lançamento solto em dobro.
// ============================================================================
export type EstadoMatch = "MATCHED" | "PARTIALLY_MATCHED" | "OVERPAID" | "POSSIBLE_MATCH" | "UNMATCHED";
export type ObrigacaoAberta = {
  tabela: "contas_pagar" | "contas_receber"; id: string; descricao: string; valorTotal: number; jaPago: number; saldo: number;
  vencimento: string | null; documento: string | null; forma: string | null; contraparteId: string | null;
  contraparteNome: string | null; contraparteDoc: string | null; linha: Record<string, unknown>;
};
export type MatchPagamento = { estado: EstadoMatch; obrigacao: ObrigacaoAberta | null; score: number; motivo: string };

// Pesos do MATCH SCORE (configuráveis aqui; regra, nunca IA).
export const PESOS_MATCH = { valorExato: 50, valorComJuros: 35, valorParcial: 25, contraparte: 30, documento: 20, vencimento3d: 15, vencimento15d: 8, vencimento45d: 3, nomeNoTexto: 15, forma: 5 };
const LIMIAR_MATCH = 80; // com folga de 15 pontos sobre a 2ª melhor
const LIMIAR_POSSIVEL = 50;
const STATUS_ABERTOS_FORA = ["pago", "recebido", "cancelado", "cancelada", "aguardando_aprovacao"];

function pontuar(p: Lancamento, o: ObrigacaoAberta): { score: number; tipoValor: "exato" | "juros" | "parcial" } | null {
  let score = 0;
  let tipoValor: "exato" | "juros" | "parcial";
  if (valorIgual(p.valor, o.saldo)) { score += PESOS_MATCH.valorExato; tipoValor = "exato"; }
  else if (p.valor > o.saldo && p.valor <= o.saldo * 1.1) { score += PESOS_MATCH.valorComJuros; tipoValor = "juros"; }
  else if (p.valor < o.saldo) { score += PESOS_MATCH.valorParcial; tipoValor = "parcial"; }
  else return null;
  const dP = digitos(p.contraparteDoc), dO = digitos(o.contraparteDoc);
  if ((dP && dO && dP !== dO) || (p.contraparteId && o.contraparteId && p.contraparteId !== o.contraparteId)) return null;
  if ((dP && dP === dO) || (p.contraparteId && p.contraparteId === o.contraparteId)) score += PESOS_MATCH.contraparte;
  const docP = docNorm(p.documento), docO = docNorm(o.documento);
  if (docP && docO) { if (docP !== docO) return null; score += PESOS_MATCH.documento; }
  const dt = p.data || p.dataHora?.slice(0, 10);
  if (dt && o.vencimento) {
    const d = diasEntre(dt, o.vencimento);
    score += d <= 3 ? PESOS_MATCH.vencimento3d : d <= 15 ? PESOS_MATCH.vencimento15d : d <= 45 ? PESOS_MATCH.vencimento45d : 0;
  }
  if (o.contraparteNome && textoParecido(p.descricao, o.contraparteNome)) score += PESOS_MATCH.nomeNoTexto;
  const fP = normalizarForma(p.forma), fO = normalizarForma(o.forma);
  if (fP && fO && fP === fO) score += PESOS_MATCH.forma; // forma diferente não elimina: boleto pode ser pago via Pix
  return { score, tipoValor };
}

async function buscarObrigacoesAbertas(empresaId: string, pagamentos: Lancamento[]): Promise<ObrigacaoAberta[]> {
  const datas = pagamentos.map((p) => p.data || p.dataHora?.slice(0, 10)).filter(Boolean).sort() as string[];
  if (!datas.length) return [];
  const ini = somaDias(datas[0], -60), fim = somaDias(datas[datas.length - 1], 60);
  const lados = [
    ...(pagamentos.some((p) => !p.entrada) ? [{ tabela: "contas_pagar" as const, valor: "valor_total", pago: "valor_pago", doc: "numero_nota", forma: "forma_pagamento", contra: "fornecedor_id", cad: "fornecedores" }] : []),
    ...(pagamentos.some((p) => p.entrada) ? [{ tabela: "contas_receber" as const, valor: "valor", pago: "valor_recebido", doc: "numero_documento", forma: "forma_recebimento", contra: "cliente_id", cad: "clientes" }] : []),
  ];
  const saida: ObrigacaoAberta[] = [];
  for (const l of lados) {
    const { data } = await supabase.from(l.tabela).select("*").eq("empresa_id", empresaId)
      .not("status", "in", `(${STATUS_ABERTOS_FORA.join(",")})`).gte("data_vencimento", ini).lte("data_vencimento", fim).limit(1000);
    const linhas = (data || []) as Record<string, unknown>[];
    const ids = [...new Set(linhas.map((r) => r[l.contra] as string).filter(Boolean))];
    const cad = new Map<string, { nome: string | null; documento: string | null }>();
    if (ids.length) {
      const { data: c } = await supabase.from(l.cad).select("id, nome, documento").eq("empresa_id", empresaId).in("id", ids);
      (c || []).forEach((x: { id: string; nome: string | null; documento: string | null }) => cad.set(x.id, x));
    }
    linhas.forEach((r) => {
      const total = Number(r[l.valor]) || 0, pago = Number(r[l.pago]) || 0;
      const desconto = l.tabela === "contas_receber" ? Number(r.valor_desconto) || 0 : 0;
      const saldo = Math.round((total - desconto - pago) * 100) / 100;
      if (saldo <= 0.005) return;
      const cId = (r[l.contra] as string | null) ?? null;
      saida.push({
        tabela: l.tabela, id: r.id as string, descricao: (r.descricao as string) || "", valorTotal: total, jaPago: pago, saldo,
        vencimento: (r.data_vencimento as string | null) ?? null, documento: (r[l.doc] as string | null) ?? null, forma: (r[l.forma] as string | null) ?? null,
        contraparteId: cId, contraparteNome: cId ? cad.get(cId)?.nome ?? null : null, contraparteDoc: cId ? cad.get(cId)?.documento ?? null : null, linha: r,
      });
    });
  }
  return saida;
}

export async function acharObrigacaoParaPagamento(empresaId: string, pagamentos: Lancamento[], lang: Idioma = "pt"): Promise<MatchPagamento[]> {
  const nada = (): MatchPagamento => ({ estado: "UNMATCHED", obrigacao: null, score: 0, motivo: "" });
  if (!empresaId || !pagamentos.length) return pagamentos.map(nada);
  const abertas = await buscarObrigacoesAbertas(empresaId, pagamentos);
  // O mesmo saldo não pode ser usado 2 vezes no mesmo lote (proteção de dupla utilização).
  const saldoRestante = new Map(abertas.map((o) => [o.id, o.saldo]));
  return pagamentos.map((p) => {
    const opcoes = abertas
      .filter((o) => (o.tabela === "contas_receber") === p.entrada && (saldoRestante.get(o.id) ?? 0) > 0.005)
      .map((o) => ({ o: { ...o, saldo: saldoRestante.get(o.id)! }, r: pontuar(p, { ...o, saldo: saldoRestante.get(o.id)! }) }))
      .filter((x) => x.r)
      .sort((a, b) => b.r!.score - a.r!.score);
    const top = opcoes[0];
    if (!top || top.r!.score < LIMIAR_POSSIVEL) return nada();
    const unico = !opcoes[1] || top.r!.score - opcoes[1].r!.score >= 15;
    const certo = top.r!.score >= LIMIAR_MATCH && unico;
    const tv = top.r!.tipoValor;
    const estado: EstadoMatch = !certo ? "POSSIBLE_MATCH" : tv === "parcial" ? "PARTIALLY_MATCHED" : tv === "juros" ? "OVERPAID" : "MATCHED";
    if (certo) saldoRestante.set(top.o.id, Math.max(0, top.o.saldo - p.valor));
    const quem = top.o.contraparteNome ? ` (${top.o.contraparteNome})` : "";
    const venc = top.o.vencimento ? new Date(`${top.o.vencimento}T12:00:00Z`).toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR") : "—";
    const txt: Texto = {
      MATCHED: { pt: `Pagamento da conta "${top.o.descricao}"${quem}, vencimento ${venc}, saldo ${brl(top.o.saldo)}: vou dar baixa nela.`, en: `Payment of the bill "${top.o.descricao}"${quem}, due ${venc}, balance ${brl(top.o.saldo)}: I will settle it.`, es: `Pago de la cuenta "${top.o.descricao}"${quem}, vencimiento ${venc}, saldo ${brl(top.o.saldo)}: voy a darla de baja.` },
      PARTIALLY_MATCHED: { pt: `Pagamento PARCIAL da conta "${top.o.descricao}"${quem}: ${brl(p.valor)} de ${brl(top.o.saldo)}. A conta fica parcial com o restante em aberto.`, en: `PARTIAL payment of "${top.o.descricao}"${quem}: ${brl(p.valor)} of ${brl(top.o.saldo)}. The rest stays open.`, es: `Pago PARCIAL de "${top.o.descricao}"${quem}: ${brl(p.valor)} de ${brl(top.o.saldo)}. El resto queda abierto.` },
      OVERPAID: { pt: `Pagamento da conta "${top.o.descricao}"${quem} com ${brl(p.valor - top.o.saldo)} a mais (juros/multa por atraso).`, en: `Payment of "${top.o.descricao}"${quem} with ${brl(p.valor - top.o.saldo)} extra (late interest/fee).`, es: `Pago de "${top.o.descricao}"${quem} con ${brl(p.valor - top.o.saldo)} de más (intereses/multa por atraso).` },
      POSSIBLE_MATCH: { pt: `Pode ser o pagamento da conta "${top.o.descricao}"${quem}, vencimento ${venc}, saldo ${brl(top.o.saldo)}. Confirme antes de dar baixa.`, en: `It may be the payment of "${top.o.descricao}"${quem}, due ${venc}, balance ${brl(top.o.saldo)}. Confirm before settling.`, es: `Puede ser el pago de "${top.o.descricao}"${quem}, vencimiento ${venc}, saldo ${brl(top.o.saldo)}. Confirme antes de dar de baja.` },
      UNMATCHED: { pt: "", en: "", es: "" },
    }[estado];
    return { estado, obrigacao: top.o, score: top.r!.score, motivo: txt[lang] };
  });
}

// ============================================================================
// Autoteste da regra (rode: npx tsx lib/motorDuplicidade.ts --teste)
// ============================================================================
export function autoteste(): void {
  const base: Lancamento = { valor: 1500, data: "2026-10-05", entrada: false, descricao: "NF 4410 - Papel Info", contraparteDoc: "11222333000181" };
  const ok = (cond: boolean, nome: string) => { if (!cond) throw new Error(`autoteste falhou: ${nome}`); };
  const chave = "35261011222333000181550010000044101000044101";
  ok(compararPar({ ...base, chaveAcesso: chave }, { ...base, chaveAcesso: chave }).veredicto === "mesma", "chave igual");
  ok(compararPar({ ...base, chaveAcesso: chave }, { ...base, chaveAcesso: chave.replace(/1$/, "2") }).veredicto === "diferente", "chave diferente");
  ok(compararPar({ ...base, chaveAcesso: chave, vencimento: "2026-11-05" }, { ...base, chaveAcesso: chave, vencimento: "2026-12-05" }).veredicto === "diferente", "parcelas da mesma nota");
  ok(compararPar({ ...base, documento: "4410" }, { ...base, documento: "004410" }).veredicto === "mesma", "mesmo nº de nota");
  ok(compararPar({ ...base, forma: "Cartão de crédito", dataHora: "2026-10-05T10:00:00Z" }, { ...base, forma: "boleto", dataHora: "2026-10-05T10:01:00Z" }).veredicto === "diferente", "cartão × boleto mesmo horário");
  ok(compararPar({ ...base, forma: "Pix" }, { ...base, forma: "PIX ENVIADO" }).veredicto === "duvida", "mesmo Pix sem prova = dúvida");
  ok(compararPar({ ...base, contraparteDoc: "99888777000166" }, base).veredicto === "diferente", "fornecedor diferente");
  ok(compararPar({ ...base, data: "2026-11-05" }, base).veredicto === "diferente", "mês seguinte");
  ok(compararPar({ ...base, descricao: "Aluguel parcela 2/12" }, { ...base, descricao: "Aluguel parcela 3/12" }).veredicto === "diferente", "parcela no texto");
  ok(normalizarForma("Crédito loja") === "credito_loja" && normalizarForma("Outros") === null, "formas");
  // Motor de Baixa
  const conta: ObrigacaoAberta = { tabela: "contas_pagar", id: "c1", descricao: "NF 4410", valorTotal: 1500, jaPago: 0, saldo: 1500, vencimento: "2026-10-10", documento: null, forma: "Boleto", contraparteId: "f1", contraparteNome: "Papel Info Ltda", contraparteDoc: "11222333000181", linha: {} };
  const pag: Lancamento = { valor: 1500, data: "2026-10-10", descricao: "PAGTO BOLETO PAPEL INFO", entrada: false };
  ok((pontuar(pag, conta)?.score ?? 0) >= LIMIAR_MATCH, "extrato com nome do fornecedor no vencimento = baixa");
  ok(pontuar({ ...pag, valor: 600 }, conta)?.tipoValor === "parcial", "pagamento parcial");
  ok(pontuar({ ...pag, valor: 1530 }, conta)?.tipoValor === "juros", "pagamento com juros");
  ok(pontuar({ ...pag, contraparteDoc: "99888777000166" }, conta) === null, "outro fornecedor não baixa");
  ok(pontuar({ ...pag, valor: 1800 }, conta) === null, "valor muito acima não baixa");
}
if (typeof process !== "undefined" && process.argv?.includes("--teste")) { autoteste(); console.log("motorDuplicidade: autoteste ok"); }
