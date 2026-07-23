// 🦅 AXIOMA AI.TECH - Avaliador de fórmula da Planilha do Centro de Custos (Fase 3)
// Escopo pequeno de propósito: só + - * / %, referência a célula (A1) e SOMA(A1:A9).
// NUNCA usa eval()/Function() — expressão é interpretada por um parser próprio.
//
// Regra de negócio (decisão do Elias): isto calcula o resultado UMA VEZ no momento em
// que a célula é confirmada. O número resultante é o que é gravado na tabela de origem —
// dado financeiro é fato registrado, não recalcula sozinho depois só porque outra célula
// mudou (isso invalidaria a trilha de auditoria). Fórmula viva só existe na camada de
// análise (totais/subtotais/% do total/desvio/projeção), que é derivada em tempo real
// pelo React a partir do estado atual — não passa por este avaliador.

export type ObterValorCelula = (endereco: string) => number | null;

const RE_RANGE = /^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$/;
const RE_CELULA = /[A-Z]+[0-9]+/g;

function colunaParaIndice(col: string): number {
  let n = 0;
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
  return n - 1;
}
function indiceParaColuna(idx: number): string {
  let n = idx + 1, s = "";
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function expandirRange(match: RegExpMatchArray): string[] {
  const [, colA, linA, colB, linB] = match;
  const c1 = colunaParaIndice(colA), c2 = colunaParaIndice(colB);
  const l1 = parseInt(linA), l2 = parseInt(linB);
  const enderecos: string[] = [];
  for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
    for (let l = Math.min(l1, l2); l <= Math.max(l1, l2); l++) enderecos.push(`${indiceParaColuna(c)}${l}`);
  }
  return enderecos;
}

// Parser recursivo pequeno: só +, -, *, /, %, parênteses, sobre números já substituídos.
// Nunca eval()/Function() — string nunca é executada como código.
function avaliarExpressaoAritmetica(expr: string): number {
  let i = 0;
  const pular = () => { while (expr[i] === " ") i++; };

  function numero(): number {
    pular();
    const inicio = i;
    if (expr[i] === "+" || expr[i] === "-") i++;
    const inicioDigitos = i;
    while (i < expr.length && /[0-9.]/.test(expr[i])) i++;
    if (i === inicioDigitos) throw new Error("número esperado");
    let v = parseFloat(expr.slice(inicio, i));
    pular();
    if (expr[i] === "%") { i++; v = v / 100; }
    return v;
  }

  function fator(): number {
    pular();
    if (expr[i] === "(") {
      i++;
      const v = expressao();
      pular();
      if (expr[i] !== ")") throw new Error("parêntese não fechado");
      i++;
      return v;
    }
    return numero();
  }

  function termo(): number {
    let v = fator();
    pular();
    while (expr[i] === "*" || expr[i] === "/") {
      const op = expr[i]; i++;
      const d = fator();
      v = op === "*" ? v * d : v / d;
      pular();
    }
    return v;
  }

  function expressao(): number {
    let v = termo();
    pular();
    while (expr[i] === "+" || expr[i] === "-") {
      const op = expr[i]; i++;
      const d = termo();
      v = op === "+" ? v + d : v - d;
      pular();
    }
    return v;
  }

  const resultado = expressao();
  pular();
  if (i !== expr.length) throw new Error("sobrou expressão sem interpretar");
  return resultado;
}

export function pareceFormula(valor: string): boolean {
  return typeof valor === "string" && valor.trim().startsWith("=");
}

export function avaliarFormula(formula: string, obterValorCelula: ObterValorCelula): { valor: number; erro?: string } {
  let expr = formula.trim();
  if (expr.startsWith("=")) expr = expr.slice(1);
  expr = expr.trim().toUpperCase();
  if (!expr) return { valor: 0, erro: "Fórmula vazia" };

  try {
    // 1) SOMA(...)/SUM(...) primeiro, porque contém ":" que não é um operador válido sozinho.
    expr = expr.replace(/(?:SOMA|SUM)\(([A-Z0-9:]+)\)/g, (_match, range: string) => {
      const m = range.match(RE_RANGE);
      const enderecos = m ? expandirRange(m) : [range];
      const soma = enderecos.reduce((s, e) => s + (obterValorCelula(e) ?? 0), 0);
      return String(soma);
    });

    // 2) referências de célula soltas (A1, B12...)
    expr = expr.replace(RE_CELULA, (endereco) => {
      const v = obterValorCelula(endereco);
      if (v === null) throw new Error(`Célula ${endereco} não encontrada`);
      return String(v);
    });

    const valor = avaliarExpressaoAritmetica(expr);
    if (!isFinite(valor)) throw new Error("resultado inválido");
    return { valor };
  } catch (e: any) {
    return { valor: 0, erro: e?.message || "Fórmula inválida" };
  }
}
