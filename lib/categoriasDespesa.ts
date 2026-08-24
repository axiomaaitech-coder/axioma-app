// 🦅 AXIOMA AI.TECH — Fonte única das categorias de despesa (Fornecedores,
// Centros de Custo → Contas a Pagar, e o módulo Contas a Pagar). Antes eram
// 3 arrays idênticos copiados em 3 arquivos — agora um só, importado.

export const CATEGORIAS_DESPESA = ["Produtos", "Marketing", "Logística", "Tecnologia", "Serviços", "Outros"] as const;

export type CategoriaDespesa = typeof CATEGORIAS_DESPESA[number];

const LABELS: Record<CategoriaDespesa, { pt: string; en: string; es: string }> = {
  "Produtos": { pt: "Produtos", en: "Products", es: "Productos" },
  "Marketing": { pt: "Marketing", en: "Marketing", es: "Marketing" },
  "Logística": { pt: "Logística", en: "Logistics", es: "Logística" },
  "Tecnologia": { pt: "Tecnologia", en: "Technology", es: "Tecnología" },
  "Serviços": { pt: "Serviços", en: "Services", es: "Servicios" },
  "Outros": { pt: "Outros", en: "Other", es: "Otros" },
};

// O valor gravado no banco continua sempre a chave em PT (não quebra dado
// já existente) — isso só traduz o RÓTULO mostrado na tela.
export function labelCategoriaDespesa(categoria: string, idioma: "pt" | "en" | "es"): string {
  return LABELS[categoria as CategoriaDespesa]?.[idioma] || categoria;
}
