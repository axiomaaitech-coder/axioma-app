// 🦅 AXIOMA AI.TECH - Parsers de Importação
// Suporta: OFX (extrato bancário), XML NF-e, CSV, XLSX/XLS
// Todos os parsers retornam o tipo unificado ResultadoParse

import * as XLSX from "xlsx";
import { XMLParser } from "fast-xml-parser";

// ============================================================================
// TIPOS
// ============================================================================

export type DestinoTabela =
  | "fluxo_caixa"
  | "receitas"
  | "custos_fixos"
  | "custos_variaveis"
  | "fornecedores"
  | "contas_pagar"
  | "contas_receber"
  | "endividamento";

export type LinhaImportada = {
  data?: string; // ISO YYYY-MM-DD
  valor?: number;
  descricao?: string;
  categoria?: string;
  documento?: string;
  cnpj?: string;
  tipo?: "entrada" | "saida";
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

  // Excel serial number (dias desde 1899-12-30)
  const num = Number(limpo);
  if (!isNaN(num) && num > 25569 && num < 100000) {
    const ms = (num - 25569) * 86400 * 1000;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  return undefined;
}

function parseValorBR(texto: any): number | undefined {
  if (texto === null || texto === undefined || texto === "") return undefined;
  if (typeof texto === "number") return texto;
  let s = String(texto).trim();

  // Remove R$, espaços, caracteres não numéricos exceto vírgula/ponto/sinal
  s = s.replace(/R\$/gi, "").replace(/\s/g, "").replace(/[^\d,.\-+]/g, "");
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

// Autodetecta mapeamento procurando por nomes comuns nos headers
export function autodetectarMapeamento(headers: string[]): MapeamentoColunas {
  const map: MapeamentoColunas = {};
  const hMap = headers.map((h) => normalizar(h));

  const padroes: Record<keyof MapeamentoColunas, string[]> = {
    data: ["data", "date", "dtposted", "datalancamento", "datavencimento", "dtmovimento", "datamovimento", "fecha"],
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

export async function parseOFX(texto: string): Promise<ResultadoParse> {
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
      valor: Math.abs(valorNum),
      descricao: memo || tipo || "Lançamento bancário",
      documento: fitId || checkNum,
      tipo: valorNum < 0 ? "saida" : "entrada",
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
// PARSER: XML NF-e
// ============================================================================

export async function parseXMLNFe(texto: string): Promise<ResultadoParse> {
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

  // Cria uma linha-resumo da NF (vai virar conta a pagar)
  linhas.push({
    data: metadados.data_emissao,
    valor: metadados.valor_total,
    descricao: `NF ${ide.nNF || "?"} - ${emit.xNome || "Fornecedor"}`,
    documento: String(ide.nNF || ""),
    cnpj: metadados.cnpj_emitente,
    tipo: "saida",
    raw: { emit, ide, total },
  });

  return {
    formato: "xml",
    linhas,
    metadados,
    destinoSugerido: "contas_pagar",
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
  delimitadorOverride?: string
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

  const linhas: LinhaImportada[] = [];
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

    linhas.push({
      data,
      valor: valor !== undefined ? Math.abs(valor) : undefined,
      descricao,
      categoria,
      documento,
      cnpj,
      tipo: valor !== undefined && valor < 0 ? "saida" : "entrada",
      raw,
    });
  }

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
  formato: "xlsx" | "xls" = "xlsx"
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

  const linhas: LinhaImportada[] = json.map((row) => {
    const data = mapUsado.data ? parseDataBR(String(row[mapUsado.data] || "")) : undefined;
    const valor = mapUsado.valor ? parseValorBR(row[mapUsado.valor]) : undefined;
    const descricao = mapUsado.descricao ? String(row[mapUsado.descricao] || "") : "";
    const categoria = mapUsado.categoria ? String(row[mapUsado.categoria] || "") : undefined;
    const documento = mapUsado.documento ? String(row[mapUsado.documento] || "") : undefined;
    const cnpj = mapUsado.cnpj ? String(row[mapUsado.cnpj] || "") : undefined;

    return {
      data,
      valor: valor !== undefined ? Math.abs(valor) : undefined,
      descricao,
      categoria,
      documento,
      cnpj,
      tipo: valor !== undefined && valor < 0 ? "saida" : "entrada",
      raw: row,
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

export async function parseArquivo(file: File): Promise<ResultadoParse> {
  const nome = file.name.toLowerCase();
  const ext = nome.split(".").pop() || "";

  // OFX
  if (ext === "ofx" || ext === "qfx") {
    const texto = await file.text();
    return parseOFX(texto);
  }

  // XML (NF-e, CT-e, NFS-e)
  if (ext === "xml") {
    const texto = await file.text();
    return parseXMLNFe(texto);
  }

  // CSV / TSV
  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    const texto = await file.text();
    return parseCSV(texto);
  }

  // XLSX / XLS
  if (ext === "xlsx" || ext === "xls" || ext === "ods") {
    const buffer = await file.arrayBuffer();
    return parseXLSX(buffer, undefined, ext === "xls" ? "xls" : "xlsx");
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