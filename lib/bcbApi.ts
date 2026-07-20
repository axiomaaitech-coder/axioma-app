// ═══════════════════════════════════════════════════════════════
// AXIOMA AI.TECH — bcbApi.ts
// Indicadores macro REAIS (Selic, CDI, IPCA acumulado 12m, dólar PTAX)
// via API pública do Banco Central (SGS), sem chave e sem custo.
// Se a API falhar (rede, manutenção do BC), cai num fallback fixo
// e sinaliza fonte: "fallback" — nunca quebra o módulo.
// ═══════════════════════════════════════════════════════════════

export type IndicadoresMacro = {
  selic: number;       // % a.a. (meta Selic)
  cdi: number;         // % a.a.
  ipca12m: number;      // % acumulado 12 meses
  usdBrl: number;       // PTAX venda
  fonte: "bcb" | "fallback";
};

// Referência de fallback — só usada se a API do BC estiver indisponível no momento do acesso.
const FALLBACK: IndicadoresMacro = { selic: 10.75, cdi: 10.65, ipca12m: 4.5, usdBrl: 5.4, fonte: "fallback" };

const SERIE_SELIC = 432;
const SERIE_CDI = 12;
const SERIE_IPCA_MENSAL = 433;
const SERIE_USD = 1;

async function buscarUltimosValores(codigo: number, n: number): Promise<number[] | null> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${n}?formato=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    return json.map((item: any) => parseFloat(String(item.valor).replace(",", ".")));
  } catch {
    return null;
  }
}

// IPCA acumulado 12 meses = composição das 12 variações mensais, não a soma simples.
function acumular12Meses(variacoesMensais: number[]): number {
  const fator = variacoesMensais.reduce((acc, v) => acc * (1 + v / 100), 1);
  return (fator - 1) * 100;
}

export async function buscarIndicadoresMacro(): Promise<IndicadoresMacro> {
  const [selicArr, cdiArr, ipcaArr, usdArr] = await Promise.all([
    buscarUltimosValores(SERIE_SELIC, 1),
    buscarUltimosValores(SERIE_CDI, 1),
    buscarUltimosValores(SERIE_IPCA_MENSAL, 12),
    buscarUltimosValores(SERIE_USD, 1),
  ]);

  const selic = selicArr?.[0];
  const cdi = cdiArr?.[0];
  const ipca12m = ipcaArr ? acumular12Meses(ipcaArr) : undefined;
  const usdBrl = usdArr?.[0];

  if (selic === undefined && cdi === undefined && ipca12m === undefined && usdBrl === undefined) {
    return FALLBACK;
  }

  return {
    selic: selic ?? FALLBACK.selic,
    cdi: cdi ?? FALLBACK.cdi,
    ipca12m: ipca12m ?? FALLBACK.ipca12m,
    usdBrl: usdBrl ?? FALLBACK.usdBrl,
    fonte: "bcb",
  };
}
