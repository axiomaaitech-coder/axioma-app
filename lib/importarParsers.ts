// 🦅 AXIOMA AI.TECH - Parsers de Importação
// Suporta: OFX (extrato bancário), XML NF-e, CSV, XLSX/XLS
// Todos os parsers retornam o tipo unificado ResultadoParse

import * as XLSX from "xlsx";
import { XMLParser } from "fast-xml-parser";
import { estimarImpactoSplitPayment } from "./previsaoRecebimentoHelpers";
import type { ItemClassificado, NaturezaItem } from "./categoriasDespesa";

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
  // Motor Antiduplicidade: forma de pagamento (cartão × boleto × Pix nunca é a mesma
  // conta) e chave de acesso da NF-e (identidade única do documento).
  forma?: string;
  chaveAcesso?: string;
  // NF-e (B3, 2026-09-28): vencimento de verdade (duplicata da nota) e quanto já
  // foi quitado na emissão (grupo de pagamento). Sem isso a conta nascia "vencendo
  // no dia da emissão" e sempre em aberto, mesmo paga à vista.
  vencimento?: string; // ISO YYYY-MM-DD
  valorPago?: number;
  // B3 item 5 — fornecedor da compra (achado pelo CNPJ ou cadastrado com o "sim" do humano)
  fornecedorId?: string;
  // Distribuição automática de destino (por linha, não por arquivo inteiro —
  // um extrato pode ter entrada E saída, uma NF-e pode ser venda OU compra).
  // Sempre uma SUGESTÃO: o usuário decide de verdade, nunca grava sozinho.
  destinoSugerido?: DestinoTabela;
  confiancaDestino?: "alta" | "baixa";
  motivoDestino?: string;
  raw: Record<string, any>;
};

export type ResultadoParse = {
  formato: "ofx" | "xml" | "csv" | "xlsx" | "xls" | "pdf" | "imagem" | "txt";
  linhas: LinhaImportada[];
  metadados: Record<string, any>;
  colunas?: string[]; // headers detectados (CSV/XLSX)
  destinoSugerido: DestinoTabela;
  precisaMapeamento: boolean;
  mapeamentoAuto?: MapeamentoColunas;
  // Itens de NF-e (PDV Fase 2.1) — só populado por parseXMLNFe quando a nota
  // tem <det> de verdade. Campo aditivo: Importar Documentos nunca lê isso,
  // continua exatamente como antes.
  itensNFe?: ItemNFe[];
};

// PDV Fase 2.1 — um item (produto) dentro de uma NF-e de entrada. Todo campo
// vem literalmente do XML validado pela SEFAZ, nunca calculado/inferido aqui.
export type ItemNFe = {
  codigoFornecedor?: string; // det.prod.cProd — código que O FORNECEDOR usa
  ean?: string; // det.prod.cEAN — "SEM GTIN" quando o produto não tem código de barras
  descricao: string; // det.prod.xProd — texto cru da nota, sem tratamento
  ncm?: string;
  cfop?: string;
  unidade?: string; // det.prod.uCom
  quantidade: number; // det.prod.qCom
  valorUnitario: number; // det.prod.vUnCom
  valorTotal: number; // det.prod.vProd
  // Grupo <rastro> — só presente em produto regulado (medicamento, alguns
  // alimentos). Quando a nota traz mais de um lote pro mesmo item, pega só
  // o primeiro (rastreabilidade completa multi-lote fica de fora por ora).
  numeroLote?: string;
  dataFabricacao?: string;
  dataValidade?: string;
  // B3 item 3 — sugestão da IA (só nota de compra do Importar Documentos)
  categoriaSugerida?: string;
  naturezaSugerida?: NaturezaItem;
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

// ─── NF-e: parcelas e pagamentos (B3, 2026-09-28) ───
// cobr/dup: nDup (número), dVenc (vencimento), vDup (valor) — as parcelas a prazo.
// pag/detPag: indPag (0 à vista, 1 a prazo), tPag (meio, tabela SEFAZ), vPag.
// "quitado" = pago no ato da nota (Pix, dinheiro, cartão, transferência,
// depósito); boleto, crédito da loja e "sem pagamento" ficam em aberto.
const MEIOS_PAGAMENTO_NFE: Record<string, string> = {
  "01": "Dinheiro", "02": "Cheque", "03": "Cartão de crédito", "04": "Cartão de débito", "05": "Crédito loja",
  "10": "Vale alimentação", "11": "Vale refeição", "12": "Vale presente", "13": "Vale combustível",
  "15": "Boleto", "16": "Depósito", "17": "Pix", "18": "Transferência", "19": "Programa de fidelidade",
  "90": "Sem pagamento", "99": "Outros",
};
const MEIOS_QUITADOS_NA_EMISSAO = new Set(["01", "03", "04", "16", "17", "18"]);
export type ParcelaNFe = { numero?: string; vencimento?: string; valor: number };
export type PagamentoNFe = { codigo: string; meio: string; valor: number; aPrazo: boolean; quitado: boolean };

export function lerCobrancaNFe(nfe: any): { parcelas: ParcelaNFe[]; pagamentos: PagamentoNFe[] } {
  const lista = (x: any) => (Array.isArray(x) ? x : x ? [x] : []);
  const parcelas: ParcelaNFe[] = lista(nfe?.cobr?.dup)
    .map((d: any) => ({ numero: d?.nDup ? String(d.nDup) : undefined, vencimento: d?.dVenc ? parseDataBR(String(d.dVenc)) : undefined, valor: parseValorBR(d?.vDup) ?? 0 }))
    .filter((p: ParcelaNFe) => p.valor > 0);
  const pagamentos: PagamentoNFe[] = lista(nfe?.pag?.detPag)
    .map((p: any) => {
      const codigo = String(p?.tPag ?? "").padStart(2, "0");
      const aPrazo = String(p?.indPag ?? "") === "1";
      return { codigo, meio: MEIOS_PAGAMENTO_NFE[codigo] ?? "Outros", valor: parseValorBR(p?.vPag) ?? 0, aPrazo, quitado: !aPrazo && MEIOS_QUITADOS_NA_EMISSAO.has(codigo) };
    })
    .filter((p: PagamentoNFe) => p.valor > 0);
  return { parcelas, pagamentos };
}

// Resumo em linguagem simples pro usuário (pedido do Elias): parcelado ou não,
// cartão, boleto, Pix. O XML traz o MEIO mas não em quantas vezes foi no cartão —
// nesse caso o resumo vira pergunta (perguntaParcelasCartao = true).
const MEIO_EN: Record<string, string> = { Dinheiro: "cash", Cheque: "check", "Cartão de crédito": "credit card", "Cartão de débito": "debit card", "Crédito loja": "store credit", Boleto: "bank slip (boleto)", Depósito: "deposit", Pix: "Pix", Transferência: "bank transfer", "Sem pagamento": "no payment", Outros: "other" };
const MEIO_ES: Record<string, string> = { Dinheiro: "efectivo", Cheque: "cheque", "Cartão de crédito": "tarjeta de crédito", "Cartão de débito": "tarjeta de débito", "Crédito loja": "crédito de la tienda", Boleto: "boleto bancario", Depósito: "depósito", Pix: "Pix", Transferência: "transferencia", "Sem pagamento": "sin pago", Outros: "otro" };
export function resumirPagamentoNFe(parcelas: ParcelaNFe[], pagamentos: PagamentoNFe[], total: number): { pt: string; en: string; es: string; perguntaParcelasCartao: boolean } {
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const data = (iso?: string, loc = "pt-BR") => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(loc) : "?");
  const meios = [...new Set(pagamentos.map((p) => p.meio))]
  const cartaoCredito = pagamentos.some((p) => p.codigo === "03");
  const perguntaParcelasCartao = cartaoCredito && parcelas.length === 0;
  if (parcelas.length > 0) {
    const via = meios.length ? meios.join(", ") : null;
    return {
      pt: `Parcelado em ${parcelas.length}x${via ? ` (${via})` : ""}: ${parcelas.map((p) => `${brl(p.valor)} em ${data(p.vencimento)}`).join("; ")}.`,
      en: `Paid in ${parcelas.length} installments${via ? ` (${meios.map((m) => MEIO_EN[m] ?? m).join(", ")})` : ""}: ${parcelas.map((p) => `${brl(p.valor)} on ${data(p.vencimento, "en-US")}`).join("; ")}.`,
      es: `En ${parcelas.length} cuotas${via ? ` (${meios.map((m) => MEIO_ES[m] ?? m).join(", ")})` : ""}: ${parcelas.map((p) => `${brl(p.valor)} el ${data(p.vencimento, "es-ES")}`).join("; ")}.`,
      perguntaParcelasCartao,
    };
  }
  if (!pagamentos.length) return { pt: "A nota não informa a forma de pagamento.", en: "The invoice does not state the payment method.", es: "La factura no informa la forma de pago.", perguntaParcelasCartao: false };
  const linha = (m: Record<string, string> | null) => pagamentos.map((p) => `${m ? m[p.meio] ?? p.meio : p.meio} ${brl(p.valor)}`).join(" + ");
  const quitado = pagamentos.every((p) => p.quitado) && pagamentos.reduce((s, p) => s + p.valor, 0) >= total - 0.01;
  return {
    pt: `${perguntaParcelasCartao ? "Pago com" : quitado ? "Pago à vista" : "Forma de pagamento"}: ${linha(null)}.${perguntaParcelasCartao ? " Foi no cartão de crédito — em quantas vezes?" : ""}`,
    en: `${perguntaParcelasCartao ? "Paid with" : quitado ? "Paid in full" : "Payment method"}: ${linha(MEIO_EN)}.${perguntaParcelasCartao ? " Paid by credit card — in how many installments?" : ""}`,
    es: `${perguntaParcelasCartao ? "Pagado con" : quitado ? "Pagado al contado" : "Forma de pago"}: ${linha(MEIO_ES)}.${perguntaParcelasCartao ? " Fue con tarjeta de crédito — ¿en cuántas cuotas?" : ""}`,
    perguntaParcelasCartao,
  };
}

// Cartão de crédito sem nº de parcelas no XML: o usuário escolhe N (1 a 48) e a
// compra vira N contas a pagar mensais (vencimento = emissão + i meses; a data
// real da fatura varia por cartão — o usuário ajusta na tela se quiser).
// Divisão em centavos: a diferença de arredondamento fica na última parcela.
// 1x mantém a linha única já quitada na emissão. Só mexe em NF-e de COMPRA.
export const MAX_PARCELAS_CARTAO = 48;
export function parcelarCompraCartao(res: ResultadoParse, n: number): ResultadoParse {
  const resumo = res.metadados?.resumo_pagamento;
  if (!resumo?.perguntaParcelasCartao || !Number.isInteger(n) || n < 1 || n > MAX_PARCELAS_CARTAO) return res;
  // Sempre a partir da compra ORIGINAL (o usuário pode trocar 10x por 12x depois).
  const original: LinhaImportada | undefined = res.metadados?.linha_original_cartao ?? res.linhas[0];
  if (!original || original.destinoSugerido === "receitas" || original.valor === undefined) return res;
  const totalCent = Math.round(original.valor * 100);
  const baseCent = Math.floor(totalCent / n);
  const emissao = original.data ? new Date(`${original.data}T12:00:00`) : new Date();
  const descBase = String(original.descricao || "").replace(/ \(cartão .*\)$/, "");
  const linhas: LinhaImportada[] = n === 1
    ? [{ ...original, descricao: `${descBase} (cartão 1x)`, valorPago: original.valor }]
    : Array.from({ length: n }, (_, i) => {
        const venc = new Date(emissao); venc.setMonth(venc.getMonth() + i + 1);
        const cent = i === n - 1 ? totalCent - baseCent * (n - 1) : baseCent;
        return { ...original, valor: cent / 100, valorPago: undefined, vencimento: venc.toISOString().slice(0, 10), descricao: `${descBase} (cartão ${i + 1}/${n})` };
      });
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const parc = brl(baseCent / 100);
  return {
    ...res, linhas,
    metadados: {
      ...res.metadados, parcelas_cartao: n, linha_original_cartao: original,
      resumo_pagamento: {
        pt: n === 1 ? `Cartão de crédito à vista: ${brl(original.valor)}.` : `Cartão de crédito em ${n}x de ${parc} (mensal, a partir do mês seguinte à compra).`,
        en: n === 1 ? `Credit card, single payment: ${brl(original.valor)}.` : `Credit card in ${n} installments of ${parc} (monthly, starting the month after purchase).`,
        es: n === 1 ? `Tarjeta de crédito en 1 pago: ${brl(original.valor)}.` : `Tarjeta de crédito en ${n} cuotas de ${parc} (mensual, desde el mes siguiente a la compra).`,
        perguntaParcelasCartao: true,
      },
    },
  };
}

export async function parseXMLNFe(texto: string, empresaCnpj?: string, lang: Lang = "pt"): Promise<ResultadoParse> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
  });

  const obj = parser.parse(texto);

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
  return montarResultadoNFe(nfe, { chaveProtocolo: obj?.nfeProc?.protNFe?.infProt?.chNFe, empresaCnpj, lang, formato: "xml" });
}

// Monta o resultado a partir do infNFe — usado pelo XML e pela nota lida por IA
// (PDF/foto, que chega aqui já no mesmo formato do infNFe). Um caminho só:
// parcelas, resumo de pagamento, venda × compra e linhas saem iguais.
function montarResultadoNFe(
  nfe: any,
  opcoes: { chaveProtocolo?: string; empresaCnpj?: string; lang: Lang; formato: ResultadoParse["formato"] },
): ResultadoParse {
  const { empresaCnpj, lang } = opcoes;
  const motivos = MOTIVOS_DESTINO[lang] || MOTIVOS_DESTINO.pt;
  const fallbackContraparte = CONTRAPARTE_FALLBACK[lang] || CONTRAPARTE_FALLBACK.pt;
  const linhas: LinhaImportada[] = [];
  const metadados: Record<string, any> = {};

  const emit = nfe.emit || {};
  const dest = nfe.dest || {};
  const ide = nfe.ide || {};
  const total = nfe.total?.ICMSTot || {};

  metadados.cnpj_emitente = emit.CNPJ || emit.CPF;
  metadados.razao_social = emit.xNome;
  metadados.fantasia = emit.xFant;
  metadados.numero_nf = ide.nNF;
  metadados.serie = ide.serie;
  // Chave de acesso (44 dígitos) — dois lugares possíveis no XML real: o
  // protocolo de autorização (nfeProc.protNFe.infProt.chNFe, já limpo) ou o
  // atributo Id de infNFe (formato "NFe" + 44 dígitos, precisa tirar o
  // prefixo). PDV Fase 2.1 usa isso pra travar reimportação da mesma nota.
  const chaveProtocolo = opcoes.chaveProtocolo;
  const chaveAtributo = String(nfe?.["@_Id"] || "").replace(/^NFe/i, "");
  metadados.chave_acesso = chaveProtocolo || (chaveAtributo.length === 44 ? chaveAtributo : undefined);
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

  // PDV Fase 2.1 — itens da nota (produto/serviço comprado), sempre literal
  // do XML. cEAN vem como "SEM GTIN" quando o produto não tem código de
  // barras próprio (padrão SEFAZ) — tratado como ausente, nunca gravado
  // como se fosse um código real.
  const itensNFe: ItemNFe[] = dets.map((det: any) => {
    const prod = det?.prod || {};
    const eanCru = String(prod.cEAN || prod.cEANTrib || "").trim();
    const rastroCru = prod.rastro;
    const rastro = Array.isArray(rastroCru) ? rastroCru[0] : rastroCru;
    return {
      codigoFornecedor: prod.cProd ? String(prod.cProd) : undefined,
      ean: eanCru && eanCru.toUpperCase() !== "SEM GTIN" ? eanCru : undefined,
      descricao: String(prod.xProd || "").trim(),
      ncm: prod.NCM ? String(prod.NCM) : undefined,
      cfop: prod.CFOP ? String(prod.CFOP) : undefined,
      unidade: prod.uCom ? String(prod.uCom) : undefined,
      quantidade: parseValorBR(prod.qCom) ?? 0,
      valorUnitario: parseValorBR(prod.vUnCom) ?? 0,
      valorTotal: parseValorBR(prod.vProd) ?? 0,
      numeroLote: rastro?.nLote ? String(rastro.nLote) : undefined,
      dataFabricacao: rastro?.dFab ? parseDataBR(rastro.dFab) : undefined,
      dataValidade: rastro?.dVal ? parseDataBR(rastro.dVal) : undefined,
    };
  }).filter((item: ItemNFe) => item.descricao);

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

  // Parcelas (grupo cobr/dup) e pagamentos (grupo pag/detPag) — tudo literal do XML.
  const { parcelas, pagamentos } = lerCobrancaNFe(nfe);
  metadados.parcelas = parcelas;
  metadados.pagamentos = pagamentos;
  const valorQuitado = pagamentos.filter((p) => p.quitado).reduce((s, p) => s + p.valor, 0);
  metadados.valor_quitado_na_emissao = valorQuitado;
  const resumo = resumirPagamentoNFe(parcelas, pagamentos, metadados.valor_total ?? 0);
  // Cartão: "Pago com" (não "à vista" — confundia com a pergunta de parcelas).
  // A pergunta "em quantas vezes no cartão?" só vale pra COMPRA (na venda quem
  // parcela é o cliente, e o recebimento segue a maquininha — outro fluxo).
  metadados.resumo_pagamento = ehVenda && resumo.perguntaParcelasCartao
    ? { pt: resumo.pt.replace(/ Foi no cartão de crédito — em quantas vezes\?$/, ""), en: resumo.en.replace(/ Paid by credit card — in how many installments\?$/, ""), es: resumo.es.replace(/ Fue con tarjeta de crédito — ¿en cuántas cuotas\?$/, ""), perguntaParcelasCartao: false }
    : resumo;

  const base = {
    data: metadados.data_emissao, documento: String(ide.nNF || ""), cnpj: cnpjContraparte,
    chaveAcesso: metadados.chave_acesso, forma: [...new Set(pagamentos.map((p) => p.meio))].join(" + ") || undefined,
    tipo: (ehVenda ? "entrada" : "saida") as "entrada" | "saida",
    destinoSugerido: destinoLinha, confiancaDestino: confiancaLinha, motivoDestino: motivoLinha,
    raw: { emit, ide, total, dest },
  };
  const descricaoNF = `NF ${ide.nNF || "?"} - ${nomeContraparte}`;
  if (!ehVenda && parcelas.length > 0) {
    // Compra parcelada: 1 conta a pagar por duplicata, cada uma com o vencimento real.
    parcelas.forEach((p, i) => linhas.push({
      ...base, valor: p.valor, vencimento: p.vencimento,
      descricao: `${descricaoNF} (parcela ${i + 1}/${parcelas.length}${p.numero ? ` · dup. ${p.numero}` : ""})`,
    }));
  } else {
    // Uma linha-resumo; se a nota diz que foi quitada na emissão (Pix, dinheiro,
    // cartão, transferência), a conta já nasce paga.
    const total = metadados.valor_total ?? 0;
    linhas.push({ ...base, valor: metadados.valor_total, descricao: descricaoNF, valorPago: !ehVenda && valorQuitado > 0 ? Math.min(valorQuitado, total) : undefined });
    // Venda parcelada: a receita fica na data da venda (linha acima) E cada parcela
    // vira uma conta a receber no vencimento real — o caixa sabe quando entra.
    if (ehVenda && parcelas.length > 0) {
      parcelas.forEach((p, i) => linhas.push({
        ...base, valor: p.valor, vencimento: p.vencimento, destinoSugerido: "contas_receber", confiancaDestino: "alta",
        motivoDestino: lang === "en" ? "Installment of a sale invoice (receivable)" : lang === "es" ? "Cuota de una factura de venta (por cobrar)" : "Parcela de nota de venda (a receber)",
        descricao: `${descricaoNF} (parcela ${i + 1}/${parcelas.length}${p.numero ? ` · dup. ${p.numero}` : ""})`,
      }));
    }
  }

  return {
    formato: opcoes.formato,
    linhas,
    metadados,
    destinoSugerido: destinoLinha,
    precisaMapeamento: false,
    itensNFe,
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

// ============================================================================
// NOTA LIDA POR IA (B3 — PDF ou foto, quando não há XML)
// ============================================================================
// Formato que /api/importar/ler-nota devolve (esquema fixo no servidor). Vira
// um infNFe e segue pelo MESMO montarResultadoNFe do XML. Sempre sugestão:
// a pré-visualização mostra tudo e nada grava sem o usuário confirmar.
export type NotaLidaIA = {
  eh_nota: boolean;
  tipo_documento: string;
  numero: string | null;
  data_emissao: string | null;
  emitente: { nome: string | null; cnpj_cpf: string | null };
  destinatario: { nome: string | null; cnpj_cpf: string | null };
  valor_total: number | null;
  itens: { descricao: string; quantidade: number | null; unidade: string | null; valor_unitario: number | null; valor_total: number | null; ncm: string | null; cfop: string | null; codigo: string | null; ean: string | null }[];
  parcelas: { numero: string | null; vencimento: string | null; valor: number }[];
  pagamentos: { codigo_meio: string; valor: number; a_prazo: boolean }[];
  duvidas: { campo: string; pergunta: string }[];
};

export function resultadoDeNotaIA(nota: NotaLidaIA, formato: ResultadoParse["formato"], empresaCnpj?: string, lang: Lang = "pt"): ResultadoParse {
  const digitos = (v: string | null) => (v ? v.replace(/\D/g, "") : undefined);
  const nfe = {
    emit: { CNPJ: digitos(nota.emitente?.cnpj_cpf), xNome: nota.emitente?.nome ?? undefined },
    dest: { CNPJ: digitos(nota.destinatario?.cnpj_cpf), xNome: nota.destinatario?.nome ?? undefined },
    ide: { nNF: nota.numero ?? undefined, dhEmi: nota.data_emissao ?? "" },
    total: { ICMSTot: { vNF: nota.valor_total ?? undefined } },
    det: (nota.itens ?? []).map((i) => ({ prod: {
      xProd: i.descricao, qCom: i.quantidade ?? undefined, uCom: i.unidade ?? undefined, vUnCom: i.valor_unitario ?? undefined,
      vProd: i.valor_total ?? undefined, NCM: i.ncm ?? undefined, CFOP: i.cfop ?? undefined, cProd: i.codigo ?? undefined, cEAN: i.ean ?? undefined,
    } })),
    cobr: { dup: (nota.parcelas ?? []).map((p) => ({ nDup: p.numero ?? undefined, dVenc: p.vencimento ?? undefined, vDup: p.valor })) },
    pag: { detPag: (nota.pagamentos ?? []).map((p) => ({ tPag: p.codigo_meio, vPag: p.valor, indPag: p.a_prazo ? "1" : "0" })) },
  };
  const res = montarResultadoNFe(nfe, { empresaCnpj, lang, formato });
  res.metadados.lido_por_ia = true;
  res.metadados.tipo_documento = nota.tipo_documento;
  res.metadados.duvidas_ia = (nota.duvidas ?? []).filter((d) => d?.pergunta).slice(0, 10);
  return res;
}

// ============================================================================
// SUPERVISÃO HUMANA (regra do Elias, 2026-10-02)
// ============================================================================
// Toda nota passa por perguntas que um humano responde ANTES de importar:
// conferência da leitura da IA, dúvidas que a própria IA marcou e conferências
// sem IA (parcelas × total, datas impossíveis, CNPJ inválido, compra ou venda
// indefinida). Confirmar fica travado até responder todas.
type T3 = { pt: string; en: string; es: string };
export type PerguntaSupervisao = { id: string; tipo: "conferir" | "destino" | "lancamento"; texto: T3; opcoes?: { valor: string; texto: T3 }[] };

// Categoria de Custos Variáveis (lista da tela Custos Variáveis) a partir da
// categoria de despesa sugerida pela IA.
export function categoriaCustoVariavel(categoriaDespesa?: string): string {
  return categoriaDespesa === "Produtos" ? "Matéria-prima" : categoriaDespesa === "Marketing" || categoriaDespesa === "Logística" ? categoriaDespesa : "Outros";
}

function cnpjValido(c: string): boolean {
  if (!/^\d{14}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
  const dv = (base: string) => {
    let soma = 0, peso = base.length - 7;
    for (const d of base) { soma += Number(d) * peso--; if (peso < 2) peso = 9; }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(c.slice(0, 12)) === Number(c[12]) && dv(c.slice(0, 13)) === Number(c[13]);
}

// Ajudante da conferência (pedido do Elias): a IA explica cada pergunta em
// linguagem simples e SUGERE a resposta — nunca responde sozinha. Formato de
// linha pedido ao motor: [id] => valor || explicação. Ignora id/valor que não existem.
export function lerSugestoesIA(texto: string, perguntas: PerguntaSupervisao[], opcoesPadrao: (p: PerguntaSupervisao) => string[]): Record<string, { valor: string; explicacao: string }> {
  const out: Record<string, { valor: string; explicacao: string }> = {};
  for (const linha of texto.split("\n")) {
    const m = linha.match(/\[([\w-]+)\]\s*=>\s*([\w-]+)\s*\|\|\s*(.+)/);
    if (!m) continue;
    const p = perguntas.find((x) => x.id === m[1]);
    if (!p || !(p.opcoes ? p.opcoes.map((o) => o.valor) : opcoesPadrao(p)).includes(m[2])) continue;
    out[p.id] = { valor: m[2], explicacao: m[3].trim().slice(0, 600) };
  }
  return out;
}

export function perguntasSupervisao(res: ResultadoParse, hoje = new Date()): PerguntaSupervisao[] {
  const m = res.metadados ?? {};
  const ehNota = res.formato === "xml" || m.lido_por_ia;
  if (!ehNota || m.valor_total === undefined && !m.lido_por_ia) return [];
  const brl = (v: number) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dt = (iso?: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "?");
  const p: PerguntaSupervisao[] = [];
  const total = Number(m.valor_total ?? 0);
  const parcelas: ParcelaNFe[] = m.parcelas ?? [];

  if (m.lido_por_ia) {
    const resumo = `${m.razao_social ?? "?"} · ${brl(total)} · ${dt(m.data_emissao)} · ${parcelas.length || 1}x`;
    p.push({ id: "leitura_ia", tipo: "conferir", texto: {
      pt: `A IA leu esta nota assim: ${resumo}. Confere com o documento (emitente, valor total, data de emissão e parcelas)?`,
      en: `The AI read this invoice as: ${resumo}. Does it match the document (issuer, total, issue date and installments)?`,
      es: `La IA leyó esta factura así: ${resumo}. ¿Coincide con el documento (emisor, total, fecha de emisión y cuotas)?`,
    } });
  }
  ((m.duvidas_ia ?? []) as { campo: string; pergunta: string }[]).forEach((d, i) =>
    p.push({ id: `duvida_ia_${i}`, tipo: "conferir", texto: { pt: `Dúvida da IA: ${d.pergunta}`, en: `AI doubt (in Portuguese): ${d.pergunta}`, es: `Duda de la IA (en portugués): ${d.pergunta}` } }));

  if (!total) p.push({ id: "sem_total", tipo: "conferir", texto: { pt: "A nota está sem valor total. Preencha o valor certo na tabela antes de importar.", en: "The invoice has no total amount. Fill in the correct amount in the table before importing.", es: "La factura no tiene valor total. Complete el valor correcto en la tabla antes de importar." } });
  if (parcelas.length && total) {
    const soma = parcelas.reduce((s, x) => s + x.valor, 0);
    if (Math.abs(soma - total) > 0.05) p.push({ id: "parcelas_total", tipo: "conferir", texto: {
      pt: `As parcelas somam ${brl(soma)}, mas o total da nota é ${brl(total)}. Confira na tabela qual está certo antes de importar.`,
      en: `The installments add up to ${brl(soma)}, but the invoice total is ${brl(total)}. Check which is right in the table before importing.`,
      es: `Las cuotas suman ${brl(soma)}, pero el total de la factura es ${brl(total)}. Verifique en la tabla cuál es correcto antes de importar.`,
    } });
  }

  const emissao: string | undefined = m.data_emissao;
  const hojeIso = hoje.toISOString().slice(0, 10);
  const cincoAnos = new Date(hoje); cincoAnos.setFullYear(cincoAnos.getFullYear() - 5);
  if (!emissao) p.push({ id: "sem_emissao", tipo: "conferir", texto: { pt: "A nota está sem data de emissão. Preencha a data certa na tabela.", en: "The invoice has no issue date. Fill in the correct date in the table.", es: "La factura no tiene fecha de emisión. Complete la fecha correcta en la tabla." } });
  else if (emissao > hojeIso) p.push({ id: "emissao_futura", tipo: "conferir", texto: { pt: `A data de emissão (${dt(emissao)}) está no futuro. Está certa?`, en: `The issue date (${dt(emissao)}) is in the future. Is it right?`, es: `La fecha de emisión (${dt(emissao)}) está en el futuro. ¿Es correcta?` } });
  else if (emissao < cincoAnos.toISOString().slice(0, 10)) p.push({ id: "emissao_antiga", tipo: "conferir", texto: { pt: `A data de emissão (${dt(emissao)}) tem mais de 5 anos. Está certa?`, en: `The issue date (${dt(emissao)}) is over 5 years old. Is it right?`, es: `La fecha de emisión (${dt(emissao)}) tiene más de 5 años. ¿Es correcta?` } });
  if (emissao && res.linhas.some((l) => l.vencimento && l.vencimento < emissao)) p.push({ id: "vencimento_antes", tipo: "conferir", texto: { pt: "Há vencimento ANTES da data de emissão. Confira as datas na tabela.", en: "There is a due date BEFORE the issue date. Check the dates in the table.", es: "Hay un vencimiento ANTES de la fecha de emisión. Verifique las fechas en la tabla." } });

  const raw = res.linhas[0]?.raw ?? {};
  for (const [lado, cnpj] of [["emitente", raw.emit?.CNPJ], ["destinatario", raw.dest?.CNPJ]] as const) {
    const c = String(cnpj ?? "").replace(/\D/g, "");
    if (c.length === 14 && !cnpjValido(c)) p.push({ id: `cnpj_${lado}`, tipo: "conferir", texto: {
      pt: `O CNPJ do ${lado === "emitente" ? "emitente" : "destinatário"} (${c}) não é válido — pode ter sido lido errado. Confira no documento.`,
      en: `The ${lado === "emitente" ? "issuer" : "recipient"} CNPJ (${c}) is not valid — it may have been misread. Check the document.`,
      es: `El CNPJ del ${lado === "emitente" ? "emisor" : "destinatario"} (${c}) no es válido — puede haberse leído mal. Verifique el documento.`,
    } });
  }

  // B3 item 4 — onde lançar a parte "custo" da COMPRA (só depois do "sim" do
  // humano). Contas a pagar não entra no DRE; Custos Variáveis entra no mês;
  // Custo Fixo conta TODO mês (só vale pra despesa que se repete).
  const grupos = (m.classificacao_itens?.porNatureza ?? {}) as Record<string, { valor: number; itens: string[] }>;
  if (res.linhas.some((l) => l.destinoSugerido === "contas_pagar")) {
    const nomes = (g: { itens: string[] }) => g.itens.slice(0, 3).join(", ") + (g.itens.length > 3 ? "…" : "");
    const naoLancar = { valor: "nao", texto: { pt: "Não lançar como custo", en: "Do not post as a cost", es: "No registrar como costo" } };
    const g = grupos.custo_fixo;
    if (g) {
      const notaInteira = g.valor >= total * 0.99 && parcelas.length <= 1;
      p.push({ id: "lanc_custo_fixo", tipo: "lancamento", texto: {
        pt: `Itens de custo fixo (${brl(g.valor)}: ${nomes(g)}). Essa despesa se repete todo mês?`,
        en: `Fixed-cost items (${brl(g.valor)}: ${nomes(g)}). Does this expense repeat every month?`,
        es: `Ítems de costo fijo (${brl(g.valor)}: ${nomes(g)}). ¿Este gasto se repite todos los meses?`,
      }, opcoes: [
        ...(notaInteira ? [{ valor: "mensal", texto: { pt: "Sim, todo mês: criar Custo Fixo mensal", en: "Yes, monthly: create a monthly Fixed Cost", es: "Sí, cada mes: crear Costo Fijo mensual" } }] : []),
        { valor: "unico", texto: { pt: "Foi só desta vez: lançar em Custos Variáveis do mês", en: "One-off: post to this month's Variable Costs", es: "Solo esta vez: registrar en Costos Variables del mes" } },
        naoLancar,
      ] });
    }
    if (grupos.custo_variavel) p.push({ id: "lanc_custo_variavel", tipo: "lancamento", texto: {
      pt: `Itens de custo variável (${brl(grupos.custo_variavel.valor)}: ${nomes(grupos.custo_variavel)}). Lançar em Custos Variáveis do mês (entra no resultado)?`,
      en: `Variable-cost items (${brl(grupos.custo_variavel.valor)}: ${nomes(grupos.custo_variavel)}). Post to this month's Variable Costs (affects the result)?`,
      es: `Ítems de costo variable (${brl(grupos.custo_variavel.valor)}: ${nomes(grupos.custo_variavel)}). ¿Registrar en Costos Variables del mes (afecta el resultado)?`,
    }, opcoes: [{ valor: "sim", texto: { pt: "Sim, lançar", en: "Yes, post it", es: "Sí, registrar" } }, naoLancar] });
    if (grupos.estoque) p.push({ id: "lanc_estoque", tipo: "lancamento", texto: {
      pt: `Itens de estoque/matéria-prima (${brl(grupos.estoque.valor)}: ${nomes(grupos.estoque)}). Como tratar?`,
      en: `Inventory/raw-material items (${brl(grupos.estoque.valor)}: ${nomes(grupos.estoque)}). How to handle them?`,
      es: `Ítems de inventario/materia prima (${brl(grupos.estoque.valor)}: ${nomes(grupos.estoque)}). ¿Cómo tratarlos?`,
    }, opcoes: [
      { valor: "custo", texto: { pt: "Lançar como custo variável do mês (já foi/será usado)", en: "Post as this month's variable cost (used up)", es: "Registrar como costo variable del mes (ya usado)" } },
      { valor: "estoque", texto: { pt: "Vou dar entrada no Estoque (não lançar como custo agora)", en: "I will add it to Inventory (no cost now)", es: "Daré entrada en Inventario (sin costo ahora)" } },
    ] });
    if (grupos.investimento) p.push({ id: "lanc_investimento", tipo: "conferir", texto: {
      pt: `Itens de investimento (${brl(grupos.investimento.valor)}: ${nomes(grupos.investimento)}) ficam só na conta a pagar e não entram como custo do mês, porque são bens duráveis. Está certo?`,
      en: `Investment items (${brl(grupos.investimento.valor)}: ${nomes(grupos.investimento)}) stay only as a payable and are not a cost of the month, since they are durable assets. Is that right?`,
      es: `Ítems de inversión (${brl(grupos.investimento.valor)}: ${nomes(grupos.investimento)}) quedan solo como cuenta por pagar y no son costo del mes, por ser bienes durables. ¿Es correcto?`,
    } });
  }

  // B3 item 5 — fornecedor que ainda não está cadastrado: pergunta antes de criar.
  // (Já cadastrado com o mesmo CNPJ = liga sozinho, sem pergunta.)
  const cnpjEmit = String(m.cnpj_emitente ?? "").replace(/\D/g, "");
  if (m.fornecedor_cadastrado === null && cnpjEmit && res.linhas.some((l) => l.destinoSugerido === "contas_pagar")) {
    const nome = m.fantasia || m.razao_social || cnpjEmit;
    p.push({ id: "fornecedor_novo", tipo: "lancamento", texto: {
      pt: `O fornecedor ${nome} (CNPJ ${cnpjEmit}) ainda não está cadastrado. Cadastrar e ligar as contas a pagar desta nota a ele?`,
      en: `The supplier ${nome} (CNPJ ${cnpjEmit}) is not registered yet. Register it and link this invoice's payables to it?`,
      es: `El proveedor ${nome} (CNPJ ${cnpjEmit}) aún no está registrado. ¿Registrarlo y vincular las cuentas por pagar de esta factura?`,
    }, opcoes: [
      { valor: "sim", texto: { pt: "Sim, cadastrar e ligar", en: "Yes, register and link", es: "Sí, registrar y vincular" } },
      { valor: "nao", texto: { pt: "Não cadastrar", en: "Do not register", es: "No registrar" } },
    ] });
  }

  if (res.linhas.some((l) => l.confiancaDestino === "baixa")) p.push({ id: "destino", tipo: "destino", texto: {
    pt: "Não deu para ter certeza se esta nota é uma COMPRA ou uma VENDA da sua empresa (o CNPJ da empresa não bate com o da nota ou não está cadastrado). O que ela é?",
    en: "We could not be sure whether this invoice is a PURCHASE or a SALE of your company (the company CNPJ does not match the invoice or is not registered). What is it?",
    es: "No se pudo saber si esta factura es una COMPRA o una VENTA de su empresa (el CNPJ de la empresa no coincide con la factura o no está registrado). ¿Qué es?",
  } });
  return p;
}

// ============================================================================
// CLASSIFICAÇÃO DOS ITENS DA COMPRA (B3 item 3)
// ============================================================================
// /api/importar/classificar-itens devolve, por item da nota, a categoria de
// despesa (lista fechada de Contas a Pagar/contabilidade) e a natureza do gasto.

// Grava a sugestão no resultado: resumo por natureza (pra tela) e a categoria
// de maior valor nas linhas de compra que ainda não têm categoria. Venda não
// mexe. Sempre sugestão — o usuário troca na pré-visualização.
export function aplicarClassificacaoItens(res: ResultadoParse, classificados: ItemClassificado[]): ResultadoParse {
  const itens = res.itensNFe ?? [];
  if (!classificados.length || classificados.length !== itens.length) return res;
  const porCategoria = new Map<string, number>();
  const porNatureza = new Map<string, { valor: number; itens: string[] }>();
  itens.forEach((item, i) => {
    const c = classificados[i];
    porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + item.valorTotal);
    const chave = c.natureza ?? "indefinido";
    const grupo = porNatureza.get(chave) ?? { valor: 0, itens: [] };
    grupo.valor += item.valorTotal;
    grupo.itens.push(item.descricao);
    porNatureza.set(chave, grupo);
  });
  const categoriaPrincipal = [...porCategoria.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    ...res,
    itensNFe: itens.map((item, i) => ({ ...item, categoriaSugerida: classificados[i].categoria, naturezaSugerida: classificados[i].natureza ?? undefined })),
    linhas: res.linhas.map((l) => (l.destinoSugerido === "contas_pagar" && !l.categoria && categoriaPrincipal ? { ...l, categoria: categoriaPrincipal } : l)),
    metadados: { ...res.metadados, classificacao_itens: { categoriaPrincipal, porNatureza: Object.fromEntries(porNatureza) } },
  };
}

// Chama a IA só pra NOTA DE COMPRA com itens. Falha/demora → devolve o
// resultado como estava (a importação nunca depende da classificação).
export async function classificarItensCompra(res: ResultadoParse, empresaId: string): Promise<ResultadoParse> {
  const itens = res.itensNFe ?? [];
  if (!itens.length || !res.linhas.some((l) => l.destinoSugerido === "contas_pagar")) return res;
  try {
    const r = await fetch("/api/importar/classificar-itens", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empresa_id: empresaId, itens: itens.map((i) => ({ descricao: i.descricao, ncm: i.ncm, cfop: i.cfop, valor: i.valorTotal })) }),
    });
    if (!r.ok) return res;
    const { itens: classificados } = (await r.json()) as { itens: ItemClassificado[] | null };
    return classificados ? aplicarClassificacaoItens(res, classificados) : res;
  } catch {
    return res;
  }
}

// Foto grande do celular passa do limite de envio (4,5 MB na Vercel): reduz
// pra no máximo 2000 px em JPEG, que continua legível pra IA.
async function reduzirImagem(file: File): Promise<Blob> {
  if (file.size <= 3_000_000 || typeof document === "undefined") return file;
  const bmp = await createImageBitmap(file);
  const escala = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((ok) => canvas.toBlob((b) => ok(b ?? file), "image/jpeg", 0.85));
}

const MSG_LEITURA_IA = {
  falhou: { pt: "Não foi possível ler esta nota automaticamente. Tente uma foto mais nítida ou envie o XML da nota.", en: "Could not read this invoice automatically. Try a sharper photo or upload the invoice XML.", es: "No se pudo leer esta factura automáticamente. Intente una foto más nítida o envíe el XML." },
  grande: { pt: "Arquivo grande demais para leitura automática (máximo 4 MB). Envie o XML da nota ou um PDF menor.", en: "File too large for automatic reading (max 4 MB). Upload the invoice XML or a smaller PDF.", es: "Archivo demasiado grande para lectura automática (máx. 4 MB). Envíe el XML o un PDF más pequeño." },
  indisponivel: { pt: "A leitura automática de PDF e foto está indisponível agora (não é problema do seu arquivo). Envie o XML da nota ou tente mais tarde.", en: "Automatic PDF/photo reading is unavailable right now (not a problem with your file). Upload the invoice XML or try again later.", es: "La lectura automática de PDF y foto no está disponible ahora (no es un problema de su archivo). Envíe el XML o intente más tarde." },
  naoNota: { pt: "Este arquivo não parece ser uma nota fiscal ou recibo.", en: "This file does not look like an invoice or receipt.", es: "Este archivo no parece una factura o recibo." },
};

async function lerNotaComIA(file: File, formato: "pdf" | "imagem", empresaCnpj: string | undefined, lang: Lang, empresaId: string | undefined): Promise<ResultadoParse> {
  const vazio = (erro: string): ResultadoParse => ({ formato, linhas: [], metadados: { erro_leitura: erro }, destinoSugerido: "contas_pagar", precisaMapeamento: false });
  const corpo = formato === "imagem" ? await reduzirImagem(file) : file;
  if (corpo.size > 4_000_000) return vazio(MSG_LEITURA_IA.grande[lang]);
  const form = new FormData();
  form.append("arquivo", corpo, file.name);
  form.append("empresa_id", empresaId ?? "");
  try {
    const r = await fetch("/api/importar/ler-nota", { method: "POST", body: form });
    if (!r.ok) return vazio(MSG_LEITURA_IA.falhou[lang]);
    const { nota, motivo } = (await r.json()) as { nota: NotaLidaIA | null; motivo?: string | null };
    // Falha do serviço de IA (sem crédito, fora do ar, sem chave) não é culpa do arquivo.
    if (!nota) return vazio((motivo && /^(api_|sem_chave|erro:)/.test(motivo) ? MSG_LEITURA_IA.indisponivel : MSG_LEITURA_IA.falhou)[lang]);
    if (!nota.eh_nota) return vazio(MSG_LEITURA_IA.naoNota[lang]);
    return resultadoDeNotaIA(nota, formato, empresaCnpj, lang);
  } catch {
    return vazio(MSG_LEITURA_IA.falhou[lang]);
  }
}

export async function parseArquivo(file: File, empresaCnpj?: string, lang: Lang = "pt", empresaId?: string): Promise<ResultadoParse> {
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

  // PDF ou foto da nota — a IA lê (B3)
  if (ext === "pdf") return lerNotaComIA(file, "pdf", empresaCnpj, lang, empresaId);
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return lerNotaComIA(file, "imagem", empresaCnpj, lang, empresaId);

  throw new Error(`Formato não suportado: .${ext}`);
}