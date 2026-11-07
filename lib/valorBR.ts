// Valor digitado em campo de texto, do jeito que se escreve no Brasil. NaN = vazio ou inválido.
// Antes cada tela trocava só a vírgula por ponto: "1.500,00" virava inválido e "1.500" virava R$ 1,50.
export function lerValorBR(texto: string | null | undefined): number {
  const t = String(texto ?? "").replace(/[R$\s ]/g, "");
  if (!t) return NaN;
  if (t.includes(",")) return Number(t.replace(/\./g, "").replace(",", "."));
  // Só ponto: com grupos de 3 dígitos é milhar (1.500, 12.345.678); senão é decimal (1.5, 1500.50)
  if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ""));
  return Number(t);
}
