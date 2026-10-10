// 🦅 GUIA DO DAS (MEI e Simples/ME) — leitura, conferência e pagamento (2026-10-10)
//
// Fluxo: gerar a guia no portal oficial → enviar o PDF/foto → a IA lê (nº do documento,
// valor, "pagar até", competências, código de barras, Pix copia-e-cola) → a PESSOA confere
// → paga: copia o Pix/código de barras no app do banco, ou "Pagar com Pix pelo Axioma"
// (Pluggy, ligado pela chave PLUGGY_PAGAMENTOS_ATIVO) → baixa pelo motor de obrigações.
// Os códigos são conferidos por regra (CRC do Pix, dígitos do código de barras) antes de
// qualquer pagamento: leitura errada nunca vira pagamento errado.

// ---------------------------------------------------------------- Pix (BR Code / EMV)
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
// Copia-e-cola válido: começa com 000201, termina com 6304 + CRC16 correto.
export function pixValido(codigo: string | null | undefined): boolean {
  const c = (codigo || "").trim();
  if (!c.startsWith("000201") || c.length < 30) return false;
  const i = c.lastIndexOf("6304");
  if (i < 0 || i + 8 !== c.length) return false;
  return crc16(c.slice(0, i + 4)) === c.slice(i + 4).toUpperCase();
}

// ---------------------------------------------------------------- código de barras (arrecadação)
function mod10(num: string): number {
  let soma = 0, peso = 2;
  for (let i = num.length - 1; i >= 0; i--) { let p = Number(num[i]) * peso; if (p > 9) p = Math.floor(p / 10) + (p % 10); soma += p; peso = peso === 2 ? 1 : 2; }
  const r = soma % 10; return r === 0 ? 0 : 10 - r;
}
function mod11(num: string): number {
  let soma = 0, peso = 2;
  for (let i = num.length - 1; i >= 0; i--) { soma += Number(num[i]) * peso; peso = peso === 9 ? 2 : peso + 1; }
  const r = soma % 11; return r === 0 || r === 1 ? 0 : 11 - r;
}
// Linha digitável de arrecadação (tributos): 48 dígitos começando com 8, em 4 blocos de 11 + DV.
export function linhaDigitavelValida(codigo: string | null | undefined): boolean {
  const d = (codigo || "").replace(/\D/g, "");
  if (d.length !== 48 || d[0] !== "8") return false;
  const usaMod10 = d[2] === "6" || d[2] === "7";
  for (let b = 0; b < 4; b++) {
    const bloco = d.slice(b * 12, b * 12 + 11), dv = Number(d[b * 12 + 11]);
    if ((usaMod10 ? mod10(bloco) : mod11(bloco)) !== dv) return false;
  }
  return true;
}
export const soDigitos = (s: string | null | undefined) => (s || "").replace(/\D/g, "");

// ---------------------------------------------------------------- guia lida pela IA
export type GuiaLida = {
  eh_das: boolean; tipo: "DAS_MEI" | "DAS_SIMPLES" | "outro";
  numero_documento: string | null; cnpj: string | null; valor_total: number | null; data_vencimento: string | null;
  competencias: string[]; codigo_barras: string | null; pix_copia_cola: string | null;
  duvidas: { campo: string; pergunta: string }[];
};
// Confere o que a IA leu: o que não fecha vira pergunta pra pessoa (nunca paga sozinho).
export function conferirGuia(g: GuiaLida, cnpjEmpresa?: string | null): { ok: boolean; avisos: string[] } {
  const avisos: string[] = [];
  if (!g.eh_das) avisos.push("nao_e_das");
  if (!(Number(g.valor_total) > 0)) avisos.push("sem_valor");
  if (!g.competencias.length || g.competencias.some((c) => !/^\d{4}-\d{2}$/.test(c))) avisos.push("competencia");
  if (g.pix_copia_cola && !pixValido(g.pix_copia_cola)) avisos.push("pix_invalido");
  if (g.codigo_barras && !linhaDigitavelValida(g.codigo_barras)) avisos.push("codigo_barras_invalido");
  if (!g.pix_copia_cola && !g.codigo_barras) avisos.push("sem_codigo");
  if (cnpjEmpresa && g.cnpj && soDigitos(cnpjEmpresa) && soDigitos(g.cnpj) !== soDigitos(cnpjEmpresa)) avisos.push("cnpj_diferente");
  return { ok: avisos.length === 0, avisos };
}

// ---------------------------------------------------------------- serviços (navegador)
export async function lerGuiaComIA(arquivo: File, empresaId: string): Promise<{ guia?: GuiaLida; erro?: string }> {
  const fd = new FormData(); fd.append("arquivo", arquivo); fd.append("empresa_id", empresaId);
  const r = await fetch("/api/mei/ler-guia", { method: "POST", body: fd }).catch(() => null);
  if (!r) return { erro: "rede" };
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.guia) return { erro: j.error || "nao_leu" };
  return { guia: j.guia as GuiaLida };
}

export async function iniciarPixAxioma(guiaId: string): Promise<{ url?: string; erro?: string }> {
  const r = await fetch("/api/pagamentos/pix", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guia_id: guiaId }) }).catch(() => null);
  if (!r) return { erro: "rede" };
  const j = await r.json().catch(() => ({}));
  return r.ok && j.url ? { url: j.url } : { erro: j.error || "falhou" };
}

export async function conferirPixAxioma(guiaId: string): Promise<{ status?: string; erro?: string }> {
  const r = await fetch(`/api/pagamentos/pix?guia_id=${encodeURIComponent(guiaId)}`).catch(() => null);
  if (!r) return { erro: "rede" };
  const j = await r.json().catch(() => ({}));
  return r.ok ? { status: j.status } : { erro: j.error || "falhou" };
}

export const PIX_AXIOMA_ATIVO = process.env.NEXT_PUBLIC_PAGAMENTO_PIX_ATIVO === "on";
export const URL_PGMEI = "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao";
export const URL_PGDASD = "https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1";
