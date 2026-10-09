// 🦅 AXIOMA AI.TECH — Fonte única das categorias de despesa (Fornecedores,
// Centros de Custo → Contas a Pagar, e o módulo Contas a Pagar). Antes eram
// 3 arrays idênticos copiados em 3 arquivos — agora um só, importado.

export const CATEGORIAS_DESPESA = ["Produtos", "Marketing", "Logística", "Tecnologia", "Serviços", "Impostos", "Outros"] as const;

export type CategoriaDespesa = typeof CATEGORIAS_DESPESA[number];

const LABELS: Record<CategoriaDespesa, { pt: string; en: string; es: string }> = {
  "Produtos": { pt: "Produtos", en: "Products", es: "Productos" },
  "Marketing": { pt: "Marketing", en: "Marketing", es: "Marketing" },
  "Logística": { pt: "Logística", en: "Logistics", es: "Logística" },
  "Tecnologia": { pt: "Tecnologia", en: "Technology", es: "Tecnología" },
  "Serviços": { pt: "Serviços", en: "Services", es: "Servicios" },
  "Impostos": { pt: "Impostos", en: "Taxes", es: "Impuestos" },
  "Outros": { pt: "Outros", en: "Other", es: "Otros" },
};

// O valor gravado no banco continua sempre a chave em PT (não quebra dado
// já existente) — isso só traduz o RÓTULO mostrado na tela.
export function labelCategoriaDespesa(categoria: string, idioma: "pt" | "en" | "es"): string {
  return LABELS[categoria as CategoriaDespesa]?.[idioma] || categoria;
}

// Natureza do gasto de cada item de uma nota de compra (Importar Documentos,
// B3): estoque (revenda/matéria-prima), custo variável, custo fixo, investimento.
export const NATUREZAS_ITEM = ["estoque", "custo_variavel", "custo_fixo", "investimento"] as const;
export type NaturezaItem = typeof NATUREZAS_ITEM[number];
export type ItemClassificado = { categoria: string; natureza: NaturezaItem | null };
export const LABEL_NATUREZA: Record<NaturezaItem | "indefinido", { pt: string; en: string; es: string }> = {
  estoque: { pt: "Estoque (revenda/matéria-prima)", en: "Inventory (resale/raw material)", es: "Inventario (reventa/materia prima)" },
  custo_variavel: { pt: "Custo variável", en: "Variable cost", es: "Costo variable" },
  custo_fixo: { pt: "Custo fixo", en: "Fixed cost", es: "Costo fijo" },
  investimento: { pt: "Investimento (bem durável)", en: "Investment (durable asset)", es: "Inversión (bien durable)" },
  indefinido: { pt: "Não classificado", en: "Not classified", es: "Sin clasificar" },
};
