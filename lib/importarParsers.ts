// 🦅 AXIOMA AI.TECH - Parsers de Importação
// Suporta: OFX (extrato bancário), XML NF-e, CSV, XLSX/XLS
// Todos os parsers retornam o tipo unificado ResultadoParse

import * as XLSX from "xlsx";
import { XMLParser } from "fast-xml-parser";
import { estimarImpactoSplitPayment } from "./previsaoRecebimentoHelpers";

// ============================================================================
// TIPOS
// ============================================================================

export type Lang = "pt" | "en" | "es";

export type DestinoTabela =
  | "fluxo_caixa"
  | "receitas"
  | "custos_fixos"
  | "custos_variaveis"
  | "fornecedores"
  | "contas_pagar"
  | "contas_receber"
  | "dividas";

export type LinhaImportada = {
  data?: string; // ISO YYYY-MM-DD
  dataHora?: string; // ISO completo (timestamptz) — só quando o documento trouxe hora de verdade
  valor?: number;
  descricao?: string;
  categoria?: string;
  documento?: string;
  cnpj?: string;
  tipo?: "entrada" | "saida";
  // Distribuição automática de destino (por linha, não por arquivo inteiro —
  // um extrato pode ter entrada E saída, uma NF-e pode ser venda OU compra).
  // Sempre uma SUGESTÃO: o usuário decide de verdade, nunca grava sozinho.
  destinoSugerido?: DestinoTabela;
  confiancaDestino?: "alta" | "baixa";
  motivoDestino?: string;
  raw: Record<string, any>;
};

export type ResultadoParse = {
  formato: "ofx" | "xml" | "csv" | "xlsx" | "xls" | "pdf" | "txt";
  linhas: LinhaImportada[];
  metadados: Record<string, any>;
  colunas?: string[]; // headers detectados (CSV/XLSX)
  destinoSugerido: DestinoTabela;
  precisaMapeamento: boolean;
  mapeamentoAuto?: MapeamentoColunas;
};

export type MapeamentoColunas = {
  data?: string;
  hora?: string;
  valor?: string;
  descricao?: string;
  categoria?: string;
  documento?: string;
  cnpj?: string;
};

// ============================================================================
// HELPERS
// ============================================================================

function parseDataBR(texto: string): string | undefined {
  if (!texto) return undefined;
  const limpo = String(texto).trim();

  // ISO YYYY-MM-DD
  let m = limpo.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // DD/MM/YYYY ou DD-MM-YYYY
  m = limpo.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const dia = m[1].padStart(2, "0");
    const mes = m[2].padStart(2, "0");
    let ano = m[3];
    if (ano.length === 2) ano = (parseInt(ano) > 50 ? "19" : "20") + ano;
    return `${ano}-${mes}-${dia}`;
  }

  // OFX YYYYMMDD ou YYYYMMDDHHMMSS
  m = limpo.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // Excel serial number (dias desde 1899-12-30) — só aceita string 100% numérica
  // (sem separador nenhum) e numa faixa de datas plausível (~1970-2100). Faixa
  // ampla demais adivinharia data em cima de qualquer número solto na coluna.
  if (/^\d+$/.test(limpo)) {
    const num = Number(limpo);
    if (num > 25569 && num < 73050) {
      const ms = (num - 25569) * 86400 * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }

  return undefined;
}

// Extrai HH:MM(:SS) de dentro de um texto solto (ex: coluna "hora" tipo
// "14:32" ou uma data que já vem com hora embutida "24/07/2026 14:32:00").
function extrairHoraTexto(texto: string): string | undefined {
  if (!texto) return undefined;
  const m = String(texto).trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return undefined;
  const h = m[1].padStart(2, "0");
  const min = m[2];
  const s = (m[3] || "00").padStart(2, "0");
  if (Number(h) > 23 || Number(min) > 59) return undefined;
  return `${h}:${min}:${s}`;
}

// Junta uma data ISO (YYYY-MM-DD) já parseada com um texto de hora solto —
// só retorna algo quando os dois lados existem de verdade (hora é opcional
// por natureza: nunca inventa 00:00:00 pra um documento que não trouxe hora).
function combinarDataHora(dataISO: string | undefined, horaTexto: string | undefined): string | undefined {
  if (!dataISO || !horaTexto) return undefined;
  const hora = extrairHoraTexto(horaTexto);
  if (!hora) return undefined;
  const d = new Date(`${dataISO}T${hora}`);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

// OFX: DTPOSTED vem como YYYYMMDD (só data) ou YYYYMMDDHHMMSS[.mmm][+TZ] (com
// hora) — só monta timestamp quando os 14 dígitos de data+hora estão de fato
// presentes, nunca completa com meia-noite inventada.
function parseDataHoraOFX(dtPosted: string): string | undefined {
  if (!dtPosted) return undefined;
  const m = String(dtPosted).trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return undefined;
  const [, ano, mes, dia, h, min, s] = m;
  const d = new Date(`${ano}-${mes}-${dia}T${h}:${min}:${s}`);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function parseValorBR(texto: any): number | undefined {
  if (texto === null || texto === undefined || texto === "") return undefined;
  if (typeof texto === "number") return texto;
  let s = String(texto).trim();

  // Remove só "R$" (moeda) e espaços primeiro — se sobrar QUALQUER letra depois
  // disso, o texto não é um valor confiável (ex: "R$ a receber"): recusa em vez
  // de tentar extrair um número escondido no meio de texto sujo.
  s = s.replace(/R\$/gi, "").trim();
  if (/[a-zA-Z]/.test(s)) return undefined;

  s = s.replace(/\s/g, "").replace(/[^\d,.\-+]/g, "");
  if (!s) return undefined;

  // Formato brasileiro: 1.234,56 → 1234.56
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }

  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// ============================================================================
// DISTRIBUIÇÃO AUTOMÁTICA DE DESTINO — sinais estruturais primeiro (sinal do
// valor + natureza da coluna de data), palavra-chave só desempata quando os
// dois sinais estruturais não decidem sozinhos. Nunca finge certeza: quando
// o único sinal é a palavra-chave, a confiança sai "baixa" (a tela mostra
// "destino sugerido — confira"), porque descrição é sinal fraco (ex:
// "recebimento de fornecedor" tem palavra de receita E de custo juntas).
// ============================================================================

function normalizarBusca(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Coluna de "vencimento" = compromisso futuro (ainda não aconteceu) → Contas
// a Pagar/Receber. Coluna de "movimento"/data genérica = lançamento já
// realizado → Fluxo de Caixa (ou Receitas/Custos Variáveis, se a descrição
// ajudar a refinar).
function naturezaColunaData(nomeColuna?: string): "vencimento" | "movimento" {
  const n = normalizarBusca(nomeColuna || "");
  return n.includes("vencimento") || n.includes("vence") ? "vencimento" : "movimento";
}

// Palavras de busca ficam SEM acento (mesmo padrão de normalizarBusca) —
// funcionam pro PT ("venda") e, por coincidência de raiz latina, também
// pegam boa parte do ES ("venta" não bate, mas isso é o motivo de existir
// PALAVRAS_CUSTO/RECEITA por idioma abaixo em vez de uma lista só).
const PALAVRAS_RECEITA: Record<Lang, string[]> = {
  pt: ["venda", "vendas", "recebimento", "recebido", "cliente", "honorario", "honorarios", "mensalidade", "fatura emitida", "servico prestado", "servicos prestados"],
  en: ["sale", "sales", "payment received", "received", "customer", "client", "fee", "fees", "subscription", "invoice issued", "service rendered"],
  es: ["venta", "ventas", "cobro", "recibido", "cliente", "honorario", "honorarios", "mensualidad", "factura emitida", "servicio prestado"],
};
const PALAVRAS_CUSTO: Record<Lang, string[]> = {
  pt: [
    "compra", "compras", "pagamento", "fornecedor", "fornecedores", "insumo", "insumos", "material", "materiais",
    "frete", "comissao", "taxa", "salario", "salarios", "folha de pagamento", "energia", "agua", "aluguel",
    "condominio", "imposto", "tributo", "despesa", "despesas",
  ],
  en: [
    "purchase", "purchases", "payment", "supplier", "suppliers", "vendor", "input", "inputs", "material", "materials",
    "freight", "shipping", "commission", "fee", "salary", "salaries", "payroll", "electricity", "utility", "utilities",
    "rent", "tax", "expense", "expenses",
  ],
  es: [
    "compra", "compras", "pago", "proveedor", "proveedores", "insumo", "insumos", "material", "materiales",
    "flete", "comision", "tasa", "salario", "salarios", "nomina", "energia", "agua", "alquiler", "impuesto",
    "gasto", "gastos",
  ],
};

function contarPalavras(alvo: string, lista: string[]): number {
  return lista.filter((p) => alvo.includes(` ${p} `)).length;
}

// Vocabulário de EXTRATO BANCÁRIO — só palavra que é EXCLUSIVA de
// movimentação de conta corrente, nunca usada num documento de negócio
// comum. "boleto"/"depósito"/"transferência" ficaram de fora de propósito:
// "Boleto fornecedor X" é uma conta a pagar normal, não extrato — incluir
// essas palavras genéricas demais foi o que causou o arquivo misto (venda/
// boleto/recebimento) ser confundido com extrato numa rodada anterior.
const PALAVRAS_EXTRATO: Record<Lang, string[]> = {
  pt: ["ted", "doc", "pix", "tarifa", "saque", "movimento", "extrato"],
  en: ["wire transfer", "ach", "bank fee", "bank charge", "withdrawal", "statement"],
  es: ["transferencia bancaria", "comision bancaria", "retiro", "extracto", "movimiento"],
};

// Decide se o ARQUIVO INTEIRO (não uma linha isolada) tem cara de extrato
// bancário — nesse caso, cada linha vai pra Fluxo de Caixa mesmo que a
// descrição tenha uma palavra de receita/custo isolada ("PIX recebido" tem
// "recebido", mas é so dinheiro entrando na MESMA conta, não uma venda).
// Critério único e rigoroso: vocabulário de extrato na MAIORIA das linhas
// (>50%) — nada de "entrada+saída misturada" sozinho, isso também é
// característica normal de um arquivo misto de negócio (venda + boleto a
// pagar), não é exclusividade de extrato.
function pareceExtrato(
  linhasBase: { descricao?: string; categoria?: string }[],
  lang: Lang
): boolean {
  if (linhasBase.length === 0) return false;
  const palavras = PALAVRAS_EXTRATO[lang] || PALAVRAS_EXTRATO.pt;
  let hits = 0;
  linhasBase.forEach((l) => {
    const alvo = ` ${normalizarBusca(`${l.descricao || ""} ${l.categoria || ""}`)} `;
    if (palavras.some((p) => alvo.includes(` ${p} `))) hits++;
  });
  return hits / linhasBase.length > 0.5;
}

// Motivos exibidos como tooltip na tela ("por que sugeri isso") — sempre no
// idioma ativo, nunca fixo em português (regra do projeto: PT/EN/ES em tudo).
const MOTIVOS_DESTINO: Record<Lang, {
  ofx: string;
  nfeVenda: string;
  nfeCompra: string;
  nfeIndefinido: string;
  nfeNaoBate: string;
  vencimentoPagar: string;
  vencimentoReceber: string;
  vencimentoPagarPadrao: string;
  extratoDetectado: string;
  movimentoReceita: string;
  movimentoCusto: string;
  movimentoFallback: string;
}> = {
  pt: {
    ofx: "Detectado como extrato bancário (OFX) → Fluxo de Caixa.",
    extratoDetectado: "Arquivo com cara de extrato bancário (TED/PIX/tarifa) → Fluxo de Caixa para todas as linhas.",
    nfeVenda: "CNPJ do emitente da nota é o da sua empresa → nota de venda → Receitas.",
    nfeCompra: "CNPJ do destinatário da nota é o da sua empresa → nota de compra de um fornecedor → Contas a Pagar.",
    nfeIndefinido: "Não foi possível confirmar se a nota é de venda ou compra (CNPJ da empresa não está cadastrado em Empresa) — mantido em Contas a Pagar, confira.",
    nfeNaoBate: "CNPJ da nota (emitente e destinatário) não bate com o CNPJ cadastrado da sua empresa — mantido em Contas a Pagar, confira.",
    vencimentoPagar: "Coluna de data é vencimento e a descrição indica despesa/fornecedor → compromisso futuro a pagar.",
    vencimentoReceber: "Coluna de data é vencimento e a descrição indica cliente/recebimento → compromisso futuro a receber.",
    vencimentoPagarPadrao: "Coluna de data é vencimento, sem palavra de cliente/recebimento na descrição → tratado como Contas a Pagar (padrão mais comum pra esse tipo de arquivo), confira.",
    movimentoReceita: "Valor de entrada e palavra na descrição sugerem receita — confira.",
    movimentoCusto: "Valor de saída e palavra na descrição sugerem custo — confira.",
    movimentoFallback: "Lançamento já realizado, sem sinal suficiente para um destino mais específico.",
  },
  en: {
    ofx: "Detected as a bank statement (OFX) → Cash Flow.",
    extratoDetectado: "File looks like a bank statement (wire transfer/PIX/bank fee) → Cash Flow for all rows.",
    nfeVenda: "Invoice issuer's tax ID matches your company → sales invoice → Revenue.",
    nfeCompra: "Invoice recipient's tax ID matches your company → purchase from a supplier → Accounts Payable.",
    nfeIndefinido: "Could not confirm whether this invoice is a sale or a purchase (your company's tax ID isn't registered under Company) — kept in Accounts Payable, please check.",
    nfeNaoBate: "The invoice's tax ID (issuer and recipient) doesn't match your company's registered tax ID — kept in Accounts Payable, please check.",
    vencimentoPagar: "Date column is a due date and the description indicates an expense/supplier → future payable.",
    vencimentoReceber: "Date column is a due date and the description indicates a customer/payment received → future receivable.",
    vencimentoPagarPadrao: "Date column is a due date, no customer/received wording in the description → treated as Accounts Payable (the most common case for this file type), please check.",
    movimentoReceita: "Inflow amount and a word in the description suggest revenue — please check.",
    movimentoCusto: "Outflow amount and a word in the description suggest a cost — please check.",
    movimentoFallback: "Already-settled transaction, not enough signal for a more specific destination.",
  },
  es: {
    ofx: "Detectado como extracto bancario (OFX) → Flujo de Caja.",
    extratoDetectado: "Archivo con cara de extracto bancario (transferencia/PIX/comisión bancaria) → Flujo de Caja para todas las filas.",
    nfeVenda: "El CNPJ del emisor de la factura es el de su empresa → factura de venta → Ingresos.",
    nfeCompra: "El CNPJ del destinatario de la factura es el de su empresa → compra a un proveedor → Cuentas por Pagar.",
    nfeIndefinido: "No fue posible confirmar si la factura es de venta o compra (el CNPJ de la empresa no está registrado en Empresa) — se mantuvo en Cuentas por Pagar, revise.",
    nfeNaoBate: "El CNPJ de la factura (emisor y destinatario) no coincide con el CNPJ registrado de su empresa — se mantuvo en Cuentas por Pagar, revise.",
    vencimentoPagar: "La columna de fecha es de vencimiento y la descripción indica gasto/proveedor → compromiso futuro por pagar.",
    vencimentoReceber: "La columna de fecha es de vencimiento y la descripción indica cliente/cobro → compromiso futuro por cobrar.",
    vencimentoPagarPadrao: "La columna de fecha es de vencimiento, sin palabra de cliente/cobro en la descripción → tratado como Cuentas por Pagar (el caso más común para este tipo de archivo), revise.",
    movimentoReceita: "Valor de entrada y una palabra en la descripción sugieren ingreso — revise.",
    movimentoCusto: "Valor de salida y una palabra en la descripción sugieren un costo — revise.",
    movimentoFallback: "Movimiento ya realizado, sin señal suficiente para un destino más específico.",
  },
};

export function sugerirDestinoTransacao(
  tipo: "entrada" | "saida" | undefined,
  descricao: string,
  nomeArquivo: string,
  colunaData?: string,
  lang: Lang = "pt",
  arquivoPareceExtrato: boolean = false
): { destino: DestinoTabela; confianca: "alta" | "baixa"; motivo: string } {
  const m = MOTIVOS_DESTINO[lang] || MOTIVOS_DESTINO.pt;
  const natureza = colunaData ? naturezaColunaData(colunaData) : "movimento";
  const alvo = ` ${normalizarBusca(`${descricao} ${nomeArquivo}`)} `;
  const scoreReceita = contarPalavras(alvo, PALAVRAS_RECEITA[lang] || PALAVRAS_RECEITA.pt);
  const scoreCusto = contarPalavras(alvo, PALAVRAS_CUSTO[lang] || PALAVRAS_CUSTO.pt);

  // 1) Coluna de vencimento = compromisso futuro (Contas a Pagar/Receber).
  // Palavra-chave decide a direção quando presente — arquivo de vencimento
  // costuma trazer só valor positivo (sem sinal negativo nenhum pra saber
  // se é a pagar ou a receber), então a descrição (fornecedor/cliente) é
  // mais confiável aqui do que o sinal do valor. Sem palavra nenhuma dos
  // dois lados, o padrão é CONTAS A PAGAR — despesa recorrente (energia,
  // água, aluguel, salário) é o caso mais comum desse tipo de arquivo e
  // raramente traz uma palavra de custo explícita; Contas a Receber só
  // quando há sinal claro de recebimento (cliente/recebimento/venda).
  if (natureza === "vencimento") {
    if (scoreReceita > scoreCusto) {
      return { destino: "contas_receber", confianca: "alta", motivo: m.vencimentoReceber };
    }
    if (scoreCusto > scoreReceita) {
      return { destino: "contas_pagar", confianca: "alta", motivo: m.vencimentoPagar };
    }
    return { destino: "contas_pagar", confianca: "baixa", motivo: m.vencimentoPagarPadrao };
  }

  // 2) Arquivo inteiro com cara de extrato bancário (calculado 1x pro
  // arquivo todo, não por linha) → tudo Fluxo de Caixa, mesmo tratamento do
  // OFX. Extrato é movimento do MESMO caixa — "PIX recebido" não é uma
  // venda só porque a palavra "recebido" aparece.
  if (arquivoPareceExtrato) {
    return { destino: "fluxo_caixa", confianca: "alta", motivo: m.extratoDetectado };
  }

  // 3) Lançamento já realizado, arquivo não é extrato — a palavra-chave só
  // reclassifica quando for DECISIVA (nenhuma palavra do lado oposto).
  // Sinal ambíguo (as duas aparecem, uma só ganha por contagem) continua
  // reclassificando, mas com confiança baixa — é o caso real de dúvida.
  if (tipo === "entrada" && scoreReceita > scoreCusto) {
    return { destino: "receitas", confianca: scoreCusto === 0 ? "alta" : "baixa", motivo: m.movimentoReceita };
  }
  if (tipo === "saida" && scoreCusto > scoreReceita) {
    return { destino: "custos_variaveis", confianca: scoreReceita === 0 ? "alta" : "baixa", motivo: m.movimentoCusto };
  }

  // 4) Nada decisivo → fallback seguro (é o comportamento de sempre, não é
  // uma adivinhação — por isso confiança alta).
  return { destino: "fluxo_caixa", confianca: "alta", motivo: m.movimentoFallback };
}

// Autodetecta mapeamento procurando por nomes comuns nos headers
export function autodetectarMapeamento(headers: string[]): MapeamentoColunas {
  const map: MapeamentoColunas = {};
  const hMap = headers.map((h) => normalizar(h));

  const padroes: Record<keyof MapeamentoColunas, string[]> = {
    data: ["data", "date", "dtposted", "datalancamento", "datavencimento", "dtmovimento", "datamovimento", "fecha", "vencimento", "vence", "emissao", "competencia", "duedate", "dtvencimento", "dtemissao"],
    hora: ["hora", "time", "horario", "hour", "horalancamento", "horamovimento"],
    valor: ["valor", "value", "amount", "trnamt", "vlr", "montante", "preco", "total", "monto"],
    descricao: ["descricao", "description", "memo", "historico", "obs", "observacao", "detalhe", "descripcion"],
    categoria: ["categoria", "category", "tipo", "classe", "grupo", "categoria"],
    documento: ["documento", "doc", "nf", "notafiscal", "numero", "ndoc", "numerofiscal", "fitid"],
    cnpj: ["cnpj", "cpfcnpj", "documento", "cuit", "rfc"],
  };

  for (const campo of Object.keys(padroes) as Array<keyof MapeamentoColunas>) {
    for (let i = 0; i < hMap.length; i++) {
      if (padroes[campo].some((p) => hMap[i] === p || hMap[i].includes(p))) {
        map[campo] = headers[i];
        break;
      }
    }
  }
  return map;
}

// ============================================================================
// PARSER: OFX (extrato bancário)
// ============================================================================

const DESCRICAO_FALLBACK_OFX: Record<Lang, string> = {
  pt: "Lançamento bancário",
  en: "Bank transaction",
  es: "Movimiento bancario",
};

export async function parseOFX(texto: string, lang: Lang = "pt"): Promise<ResultadoParse> {
  const motivos = MOTIVOS_DESTINO[lang] || MOTIVOS_DESTINO.pt;
  const descFallback = DESCRICAO_FALLBACK_OFX[lang] || DESCRICAO_FALLBACK_OFX.pt;
  // OFX é SGML — fazemos parsing manual robusto pra evitar dependências frágeis
  // Limpa BOM e headers
  let conteudo = texto.replace(/^\uFEFF/, "");
  const idxOFX = conteudo.indexOf("<OFX>");
  if (idxOFX >= 0) conteudo = conteudo.substring(idxOFX);

  // Normaliza tags auto-fechadas SGML pra XML-friendly
  conteudo = conteudo.replace(/<([A-Z][A-Z0-9.]*)>([^<\r\n]+)/g, "<$1>$2</$1>");

  const linhas: LinhaImportada[] = [];
  const metadados: Record<string, any> = {};

  // Extrai banco
  const bancoMatch = conteudo.match(/<BANKID>([^<]+)/);
  const contaMatch = conteudo.match(/<ACCTID>([^<]+)/);
  if (bancoMatch) metadados.banco_id = bancoMatch[1].trim();
  if (contaMatch) metadados.conta = contaMatch[1].trim();

  // Extrai todas as transações <STMTTRN>...</STMTTRN>
  const regexTrn = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let m: RegExpExecArray | null;
  while ((m = regexTrn.exec(conteudo)) !== null) {
    const bloco = m[1];
    const tipo = bloco.match(/<TRNTYPE>([^<]+)/)?.[1]?.trim();
    const dtPosted = bloco.match(/<DTPOSTED>([^<]+)/)?.[1]?.trim();
    const trnAmt = bloco.match(/<TRNAMT>([^<]+)/)?.[1]?.trim();
    const fitId = bloco.match(/<FITID>([^<]+)/)?.[1]?.trim();
    const memo = bloco.match(/<MEMO>([^<]+)/)?.[1]?.trim();
    const checkNum = bloco.match(/<CHECKNUM>([^<]+)/)?.[1]?.trim();

    const valorNum = parseValorBR(trnAmt);
    if (valorNum === undefined) continue;

    linhas.push({
      data: parseDataBR(dtPosted || ""),
      dataHora: parseDataHoraOFX(dtPosted || ""),
      valor: Math.abs(valorNum),
      descricao: memo || tipo || descFallback,
      documento: fitId || checkNum,
      tipo: valorNum < 0 ? "saida" : "entrada",
      destinoSugerido: "fluxo_caixa",
      confiancaDestino: "alta",
      motivoDestino: motivos.ofx,
      raw: { tipo, dtPosted, trnAmt, fitId, memo, checkNum },
    });
  }

  return {
    formato: "ofx",
    linhas,
    metadados,
    destinoSugerido: "fluxo_caixa",
    precisaMapeamento: false,
  };
}

// ============================================================================
// VALIDAÇÃO DE FORMATO — REFORMA TRIBUTÁRIA (CFOP/CST/NCM + grupo IBS/CBS)
// Só confere se o FORMATO/FAIXA dos campos está correto e se o grupo IBS/CBS
// (quando presente no XML) está coerente — NÃO é validação fiscal de alíquota.
// Layout do IBS/CBS ainda está em transição (EC 132/2023), por isso a busca é
// por nome de campo em qualquer nível (coletarPorChave), não por um caminho
// fixo que pode mudar de versão pra versão do layout da NF-e.
// ============================================================================

function coletarPorChave(obj: any, regexNome: RegExp, acc: { chave: string; valor: any }[] = []): { chave: string; valor: any }[] {
  if (obj === null || obj === undefined || typeof obj !== "object") return acc;
  if (Array.isArray(obj)) {
    obj.forEach((item) => coletarPorChave(item, regexNome, acc));
    return acc;
  }
  for (const chave of Object.keys(obj)) {
    if (regexNome.test(chave)) acc.push({ chave, valor: obj[chave] });
    coletarPorChave(obj[chave], regexNome, acc);
  }
  return acc;
}

function validarFormatoReforma(dets: any[]): string[] {
  const problemas: string[] = [];

  dets.forEach((det, idx) => {
    const n = idx + 1;
    const ncm = det?.prod?.NCM;
    if (ncm !== undefined && ncm !== null && !/^\d{8}$/.test(String(ncm))) {
      problemas.push(`Item ${n}: NCM "${ncm}" fora do formato (8 dígitos)`);
    }

    const cfop = det?.prod?.CFOP;
    if (cfop !== undefined && cfop !== null && !/^[123567]\d{3}$/.test(String(cfop))) {
      problemas.push(`Item ${n}: CFOP "${cfop}" fora do formato válido`);
    }

    coletarPorChave(det?.imposto, /^(CST|CSOSN)$/i).forEach(({ chave, valor }) => {
      if (!/^\d{2,3}$/.test(String(valor))) {
        problemas.push(`Item ${n}: ${chave} "${valor}" fora do formato (2 ou 3 dígitos)`);
      }
    });

    // Grupo IBS/CBS (Reforma) — quando existe no XML, os dois vêm juntos por
    // item; um presente sem o outro é layout incoerente, não decisão de negócio.
    const temIBS = coletarPorChave(det?.imposto, /IBS/i).length > 0;
    const temCBS = coletarPorChave(det?.imposto, /CBS/i).length > 0;
    if (temIBS !== temCBS) {
      problemas.push(`Item ${n}: grupo IBS/CBS incompleto no layout (só um dos dois presente)`);
    }
    coletarPorChave(det?.imposto, /^p(IBS|CBS)$/i).forEach(({ chave, valor }) => {
      const pct = Number(valor);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        problemas.push(`Item ${n}: ${chave} "${valor}" fora da faixa 0-100%`);
      }
    });
  });

  return problemas;
}

// ============================================================================
// PARSER: XML NF-e
// ============================================================================

const CONTRAPARTE_FALLBACK: Record<Lang, { cliente: string; fornecedor: string }> = {
  pt: { cliente: "Cliente", fornecedor: "Fornecedor" },
  en: { cliente: "Customer", fornecedor: "Supplier" },
  es: { cliente: "Cliente", fornecedor: "Proveedor" },
};

export async function parseXMLNFe(texto: string, empresaCnpj?: string, lang: Lang = "pt"): Promise<ResultadoParse> {
  const motivos = MOTIVOS_DESTINO[lang] || MOTIVOS_DESTINO.pt;
  const fallbackContraparte = CONTRAPARTE_FALLBACK[lang] || CONTRAPARTE_FALLBACK.pt;
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
  });

  const obj = parser.parse(texto);
  const linhas: LinhaImportada[] = [];
  const metadados: Record<string, any> = {};

  // Caminhos possíveis: nfeProc.NFe.infNFe ou NFe.infNFe ou diretamente infNFe
  const nfe = obj?.nfeProc?.NFe?.infNFe || obj?.NFe?.infNFe || obj?.infNFe;

  if (!nfe) {
    // Não é NF-e — tenta XML genérico (CT-e, NFS-e, etc) → retorna vazio mas reconhecido
    return {
      formato: "xml",
      linhas: [],
      metadados: { erro: "Estrutura XML não reconhecida como NF-e" },
      destinoSugerido: "fornecedores",
      precisaMapeamento: false,
    };
  }

  const emit = nfe.emit || {};
  const dest = nfe.dest || {};
  const ide = nfe.ide || {};
  const total = nfe.total?.ICMSTot || {};

  metadados.cnpj_emitente = emit.CNPJ || emit.CPF;
  metadados.razao_social = emit.xNome;
  metadados.fantasia = emit.xFant;
  metadados.numero_nf = ide.nNF;
  metadados.serie = ide.serie;
  metadados.data_emissao = parseDataBR(ide.dhEmi || ide.dEmi || "");
  metadados.valor_total = parseValorBR(total.vNF);
  metadados.valor_icms = parseValorBR(total.vICMS);
  metadados.valor_ipi = parseValorBR(total.vIPI);
  metadados.valor_pis = parseValorBR(total.vPIS);
  metadados.valor_cofins = parseValorBR(total.vCOFINS);
  metadados.uf_emitente = emit.enderEmit?.UF;
  metadados.municipio_emitente = emit.enderEmit?.xMun;

  // Validação de FORMATO da Reforma Tributária (CFOP/CST/NCM + coerência do
  // grupo IBS/CBS quando presente) — não é validação fiscal de alíquota.
  // Linha vai pra revisão em vez de ser importada às cegas se o layout
  // estiver incoerente.
  const dets = Array.isArray(nfe.det) ? nfe.det : nfe.det ? [nfe.det] : [];
  const problemasFormato = validarFormatoReforma(dets);
  if (problemasFormato.length > 0) metadados.problemas_formato_reforma = problemasFormato;

  // Estimativa honesta do impacto do Split Payment (reaproveita o mesmo
  // cálculo já usado em Contas a Receber — nenhuma fórmula nova) — só
  // informativa, não altera o valor importado.
  if (metadados.valor_total !== undefined) {
    metadados.impacto_reforma_estimado = estimarImpactoSplitPayment(metadados.valor_total);
    metadados.aviso_reforma = `Estimativa com base nas regras vigentes até ${new Date().toLocaleDateString("pt-BR")}. A Reforma Tributária ainda está em andamento e pode sofrer alterações — este número reflete o melhor entendimento atual.`;
  }

  // Venda ou compra? Compara o CNPJ do emitente e do destinatário da nota
  // com o CNPJ da própria empresa (cadastrado em Empresa) — não chuta.
  const cnpjEmpresa = (empresaCnpj || "").replace(/\D/g, "");
  const cnpjEmit = String(emit.CNPJ || emit.CPF || "").replace(/\D/g, "");
  const cnpjDest = String(dest.CNPJ || dest.CPF || "").replace(/\D/g, "");

  let destinoLinha: DestinoTabela = "contas_pagar";
  let confiancaLinha: "alta" | "baixa" = "baixa";
  let motivoLinha = motivos.nfeIndefinido;

  if (cnpjEmpresa) {
    if (cnpjEmit && cnpjEmit === cnpjEmpresa) {
      destinoLinha = "receitas";
      confiancaLinha = "alta";
      motivoLinha = motivos.nfeVenda;
    } else if (cnpjDest && cnpjDest === cnpjEmpresa) {
      destinoLinha = "contas_pagar";
      confiancaLinha = "alta";
      motivoLinha = motivos.nfeCompra;
    } else {
      motivoLinha = motivos.nfeNaoBate;
    }
  }

  const ehVenda = destinoLinha === "receitas";
  const nomeContraparte = ehVenda ? dest.xNome || fallbackContraparte.cliente : emit.xNome || fallbackContraparte.fornecedor;
  const cnpjContraparte = ehVenda ? dest.CNPJ || dest.CPF : emit.CNPJ || emit.CPF;

  // Cria uma linha-resumo da NF
  linhas.push({
    data: metadados.data_emissao,
    valor: metadados.valor_total,
    descricao: `NF ${ide.nNF || "?"} - ${nomeContraparte}`,
    documento: String(ide.nNF || ""),
    cnpj: cnpjContraparte,
    tipo: ehVenda ? "entrada" : "saida",
    destinoSugerido: destinoLinha,
    confiancaDestino: confiancaLinha,
    motivoDestino: motivoLinha,
    raw: { emit, ide, total, dest },
  });

  return {
    formato: "xml",
    linhas,
    metadados,
    destinoSugerido: destinoLinha,
    precisaMapeamento: false,
  };
}

// ============================================================================
// PARSER: CSV
// ============================================================================

function detectarDelimitador(linha: string): string {
  const candidatos = [",", ";", "\t", "|"];
  let melhor = ",";
  let max = 0;
  for (const d of candidatos) {
    const count = (linha.match(new RegExp(`\\${d}`, "g")) || []).length;
    if (count > max) {
      max = count;
      melhor = d;
    }
  }
  return melhor;
}

function parseLinhaCSV(linha: string, delim: string): string[] {
  const result: string[] = [];
  let atual = "";
  let dentroAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (c === delim && !dentroAspas) {
      result.push(atual.trim());
      atual = "";
    } else {
      atual += c;
    }
  }
  result.push(atual.trim());
  return result;
}

export async function parseCSV(
  texto: string,
  mapeamento?: MapeamentoColunas,
  delimitadorOverride?: string,
  nomeArquivo?: string,
  lang: Lang = "pt"
): Promise<ResultadoParse> {
  const conteudo = texto.replace(/^\uFEFF/, "");
  const linhasTxt = conteudo.split(/\r?\n/).filter((l) => l.trim());
  if (linhasTxt.length < 2) {
    return {
      formato: "csv",
      linhas: [],
      metadados: { erro: "Arquivo vazio ou sem dados" },
      colunas: [],
      destinoSugerido: "fluxo_caixa",
      precisaMapeamento: true,
    };
  }

  const delim = delimitadorOverride || detectarDelimitador(linhasTxt[0]);
  const headers = parseLinhaCSV(linhasTxt[0], delim).map((h) => h.replace(/"/g, ""));

  const mapUsado = mapeamento || autodetectarMapeamento(headers);
  const precisa = !mapUsado.data || !mapUsado.valor;

  // 1ª passada: monta os campos de cada linha sem decidir destino ainda —
  // precisamos ver TODAS as linhas primeiro pra saber se o arquivo inteiro
  // tem cara de extrato bancário (não dá pra decidir isso linha a linha).
  type LinhaBase = {
    data?: string; dataHora?: string; valor?: number; descricao: string;
    categoria?: string; documento?: string; cnpj?: string;
    tipo: "entrada" | "saida"; raw: Record<string, any>;
  };
  const base: LinhaBase[] = [];
  for (let i = 1; i < linhasTxt.length; i++) {
    const valores = parseLinhaCSV(linhasTxt[i], delim);
    const raw: Record<string, any> = {};
    headers.forEach((h, idx) => {
      raw[h] = valores[idx] || "";
    });

    const data = mapUsado.data ? parseDataBR(raw[mapUsado.data]) : undefined;
    const valor = mapUsado.valor ? parseValorBR(raw[mapUsado.valor]) : undefined;
    const descricao = mapUsado.descricao ? String(raw[mapUsado.descricao] || "") : "";
    const categoria = mapUsado.categoria ? String(raw[mapUsado.categoria] || "") : undefined;
    const documento = mapUsado.documento ? String(raw[mapUsado.documento] || "") : undefined;
    const cnpj = mapUsado.cnpj ? String(raw[mapUsado.cnpj] || "") : undefined;
    // Hora vem de coluna própria quando mapeada, senão tenta achar embutida
    // na própria coluna de data (ex: "24/07/2026 14:32") — nunca inventa.
    const dataHora = mapUsado.hora
      ? combinarDataHora(data, raw[mapUsado.hora])
      : combinarDataHora(data, mapUsado.data ? raw[mapUsado.data] : undefined);
    const tipo: "entrada" | "saida" = valor !== undefined && valor < 0 ? "saida" : "entrada";

    base.push({ data, dataHora, valor: valor !== undefined ? Math.abs(valor) : undefined, descricao, categoria, documento, cnpj, tipo, raw });
  }

  // 2ª passada: agora sim decide o destino de cada linha, já sabendo se o
  // arquivo inteiro parece um extrato bancário.
  const arquivoExtrato = pareceExtrato(base, lang);
  const linhas: LinhaImportada[] = base.map((l) => {
    const sugestao = sugerirDestinoTransacao(l.tipo, l.descricao, nomeArquivo || "", mapUsado.data, lang, arquivoExtrato);
    return {
      ...l,
      destinoSugerido: sugestao.destino,
      confiancaDestino: sugestao.confianca,
      motivoDestino: sugestao.motivo,
    };
  });

  return {
    formato: "csv",
    linhas,
    metadados: { delimitador: delim, total_linhas: linhas.length },
    colunas: headers,
    destinoSugerido: "fluxo_caixa",
    precisaMapeamento: precisa,
    mapeamentoAuto: mapUsado,
  };
}

// ============================================================================
// PARSER: XLSX / XLS
// ============================================================================

export async function parseXLSX(
  buffer: ArrayBuffer,
  mapeamento?: MapeamentoColunas,
  formato: "xlsx" | "xls" = "xlsx",
  nomeArquivo?: string,
  lang: Lang = "pt"
): Promise<ResultadoParse> {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Converte pra array de objetos com header da primeira linha
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
    raw: false,
  });

  if (json.length === 0) {
    return {
      formato,
      linhas: [],
      metadados: { erro: "Planilha vazia", aba: sheetName },
      colunas: [],
      destinoSugerido: "fluxo_caixa",
      precisaMapeamento: true,
    };
  }

  const headers = Object.keys(json[0]);
  const mapUsado = mapeamento || autodetectarMapeamento(headers);
  const precisa = !mapUsado.data || !mapUsado.valor;

  // 1ª passada: monta os campos sem decidir destino (precisa ver todas as
  // linhas antes de saber se o arquivo inteiro parece um extrato bancário).
  type LinhaBase = {
    data?: string; dataHora?: string; valor?: number; descricao: string;
    categoria?: string; documento?: string; cnpj?: string;
    tipo: "entrada" | "saida"; raw: Record<string, any>;
  };
  const base: LinhaBase[] = json.map((row) => {
    const data = mapUsado.data ? parseDataBR(String(row[mapUsado.data] || "")) : undefined;
    const valor = mapUsado.valor ? parseValorBR(row[mapUsado.valor]) : undefined;
    const descricao = mapUsado.descricao ? String(row[mapUsado.descricao] || "") : "";
    const categoria = mapUsado.categoria ? String(row[mapUsado.categoria] || "") : undefined;
    const documento = mapUsado.documento ? String(row[mapUsado.documento] || "") : undefined;
    const cnpj = mapUsado.cnpj ? String(row[mapUsado.cnpj] || "") : undefined;
    const dataHora = mapUsado.hora
      ? combinarDataHora(data, row[mapUsado.hora])
      : combinarDataHora(data, mapUsado.data ? row[mapUsado.data] : undefined);
    const tipo: "entrada" | "saida" = valor !== undefined && valor < 0 ? "saida" : "entrada";
    return { data, dataHora, valor: valor !== undefined ? Math.abs(valor) : undefined, descricao, categoria, documento, cnpj, tipo, raw: row };
  });

  // 2ª passada: decide o destino já sabendo se o arquivo parece extrato.
  const arquivoExtrato = pareceExtrato(base, lang);
  const linhas: LinhaImportada[] = base.map((l) => {
    const sugestao = sugerirDestinoTransacao(l.tipo, l.descricao, nomeArquivo || "", mapUsado.data, lang, arquivoExtrato);
    return {
      ...l,
      destinoSugerido: sugestao.destino,
      confiancaDestino: sugestao.confianca,
      motivoDestino: sugestao.motivo,
    };
  });

  return {
    formato,
    linhas,
    metadados: { aba: sheetName, total_abas: workbook.SheetNames.length },
    colunas: headers,
    destinoSugerido: "fluxo_caixa",
    precisaMapeamento: precisa,
    mapeamentoAuto: mapUsado,
  };
}

// ============================================================================
// ROTEADOR: detecta tipo e chama o parser certo
// ============================================================================

export async function parseArquivo(file: File, empresaCnpj?: string, lang: Lang = "pt"): Promise<ResultadoParse> {
  const nome = file.name.toLowerCase();
  const ext = nome.split(".").pop() || "";

  // OFX
  if (ext === "ofx" || ext === "qfx") {
    const texto = await file.text();
    return parseOFX(texto, lang);
  }

  // XML (NF-e, CT-e, NFS-e)
  if (ext === "xml") {
    const texto = await file.text();
    return parseXMLNFe(texto, empresaCnpj, lang);
  }

  // CSV / TSV
  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    const texto = await file.text();
    return parseCSV(texto, undefined, undefined, file.name, lang);
  }

  // XLSX / XLS
  if (ext === "xlsx" || ext === "xls" || ext === "ods") {
    const buffer = await file.arrayBuffer();
    return parseXLSX(buffer, undefined, ext === "xls" ? "xls" : "xlsx", file.name, lang);
  }

  // PDF - salva pra OCR futuro (Fase 2 com Claude Vision)
  if (ext === "pdf") {
    return {
      formato: "pdf",
      linhas: [],
      metadados: { aguardando_ocr: true, observacao: "PDF salvo. OCR automático na Fase 2." },
      destinoSugerido: "contas_pagar",
      precisaMapeamento: false,
    };
  }

  throw new Error(`Formato não suportado: .${ext}`);
}