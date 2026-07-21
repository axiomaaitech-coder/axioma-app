// ═══════════════════════════════════════════════════════════════
// AXIOMA AI.TECH — ibgeApi.ts
// Endereço inteligente Estado → Cidade via API pública do IBGE,
// sem chave e sem custo. Mesmo padrão de lib/bcbApi.ts: se a API
// falhar, cai num fallback e sinaliza fonte — nunca quebra o modal.
// ═══════════════════════════════════════════════════════════════

export type EstadoIBGE = { id: number; sigla: string; nome: string };
export type MunicipioIBGE = { id: number; nome: string };
export type ResultadoIBGE<T> = { dados: T; fonte: "ibge" | "fallback" };

// Fallback — as 27 UFs nunca mudam, seguro manter fixo. Municípios (~5570) não
// entram em fallback: se a API cair na busca de cidade, o campo vira digitação
// livre (avisado na UI) em vez de fingir uma lista completa offline.
const FALLBACK_ESTADOS: EstadoIBGE[] = [
  { id: 12, sigla: "AC", nome: "Acre" }, { id: 27, sigla: "AL", nome: "Alagoas" },
  { id: 16, sigla: "AP", nome: "Amapá" }, { id: 13, sigla: "AM", nome: "Amazonas" },
  { id: 29, sigla: "BA", nome: "Bahia" }, { id: 23, sigla: "CE", nome: "Ceará" },
  { id: 53, sigla: "DF", nome: "Distrito Federal" }, { id: 32, sigla: "ES", nome: "Espírito Santo" },
  { id: 52, sigla: "GO", nome: "Goiás" }, { id: 21, sigla: "MA", nome: "Maranhão" },
  { id: 51, sigla: "MT", nome: "Mato Grosso" }, { id: 50, sigla: "MS", nome: "Mato Grosso do Sul" },
  { id: 31, sigla: "MG", nome: "Minas Gerais" }, { id: 15, sigla: "PA", nome: "Pará" },
  { id: 25, sigla: "PB", nome: "Paraíba" }, { id: 41, sigla: "PR", nome: "Paraná" },
  { id: 26, sigla: "PE", nome: "Pernambuco" }, { id: 22, sigla: "PI", nome: "Piauí" },
  { id: 33, sigla: "RJ", nome: "Rio de Janeiro" }, { id: 24, sigla: "RN", nome: "Rio Grande do Norte" },
  { id: 43, sigla: "RS", nome: "Rio Grande do Sul" }, { id: 11, sigla: "RO", nome: "Rondônia" },
  { id: 14, sigla: "RR", nome: "Roraima" }, { id: 42, sigla: "SC", nome: "Santa Catarina" },
  { id: 35, sigla: "SP", nome: "São Paulo" }, { id: 28, sigla: "SE", nome: "Sergipe" },
  { id: 17, sigla: "TO", nome: "Tocantins" },
];

export async function buscarEstados(): Promise<ResultadoIBGE<EstadoIBGE[]>> {
  try {
    const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome", { cache: "no-store" });
    if (!res.ok) return { dados: FALLBACK_ESTADOS, fonte: "fallback" };
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return { dados: FALLBACK_ESTADOS, fonte: "fallback" };
    return { dados: json.map((e: any) => ({ id: e.id, sigla: e.sigla, nome: e.nome })), fonte: "ibge" };
  } catch {
    return { dados: FALLBACK_ESTADOS, fonte: "fallback" };
  }
}

export async function buscarMunicipios(uf: string): Promise<ResultadoIBGE<MunicipioIBGE[]>> {
  if (!uf) return { dados: [], fonte: "ibge" };
  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`, { cache: "no-store" });
    if (!res.ok) return { dados: [], fonte: "fallback" };
    const json = await res.json();
    if (!Array.isArray(json)) return { dados: [], fonte: "fallback" };
    return { dados: json.map((m: any) => ({ id: m.id, nome: m.nome })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), fonte: "ibge" };
  } catch {
    return { dados: [], fonte: "fallback" };
  }
}
