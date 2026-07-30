// 🦅 AXIOMA AI.TECH - Motor de Categoria Inteligente do Estoque
// Modo "regra" (dicionário por segmento + aprendizado por empresa). Ponto único
// pra trocar por LLM depois (Fase 3+) sem mexer em quem chama esta função.
// ponytail: aprendizado usa a 1ª palavra significativa do nome como "termo" —
// upgrade real (extração de palavra-chave por NLP) fica pra quando plugarmos LLM.

import { createBrowserClient } from "@supabase/ssr";
import type { Idioma } from "./translations";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Segmento =
  | "mercado" | "farmacia" | "vestuario" | "autopecas" | "restaurante_food"
  | "eletronicos" | "papelaria" | "pet" | "servicos" | "generico";

export const SEGMENTOS: { value: Segmento; label: Record<Idioma, string> }[] = [
  { value: "mercado", label: { pt: "Mercado/Alimentício", en: "Grocery/Food Retail", es: "Supermercado/Alimenticio" } },
  { value: "farmacia", label: { pt: "Farmácia/Saúde", en: "Pharmacy/Health", es: "Farmacia/Salud" } },
  { value: "vestuario", label: { pt: "Vestuário", en: "Apparel", es: "Vestuario" } },
  { value: "autopecas", label: { pt: "Autopeças", en: "Auto Parts", es: "Autopartes" } },
  { value: "restaurante_food", label: { pt: "Restaurante/Food Service", en: "Restaurant/Food Service", es: "Restaurante/Food Service" } },
  { value: "eletronicos", label: { pt: "Eletrônicos", en: "Electronics", es: "Electrónica" } },
  { value: "papelaria", label: { pt: "Papelaria", en: "Stationery", es: "Papelería" } },
  { value: "pet", label: { pt: "Pet", en: "Pet", es: "Mascotas" } },
  { value: "servicos", label: { pt: "Serviços", en: "Services", es: "Servicios" } },
  { value: "generico", label: { pt: "Genérico", en: "Generic", es: "Genérico" } },
];

type RegraCategoria = { categoria: Record<Idioma, string>; palavrasChave: string[] };

const C = (pt: string, en: string, es: string) => ({ pt, en, es });

export const DICIONARIO_SEGMENTOS: Record<Segmento, RegraCategoria[]> = {
  mercado: [
    { categoria: C("Bebidas", "Beverages", "Bebidas"), palavrasChave: ["cerveja", "refri", "refrigerante", "suco", "agua", "vinho", "cachaca", "whisky", "vodka", "beer", "soda", "juice"] },
    { categoria: C("Frios", "Deli", "Fiambres"), palavrasChave: ["queijo", "presunto", "mortadela", "salame", "frios", "cheese", "ham"] },
    { categoria: C("Laticínios", "Dairy", "Lácteos"), palavrasChave: ["leite", "iogurte", "requeijao", "manteiga", "milk", "yogurt", "yoghurt"] },
    { categoria: C("Higiene", "Personal Care", "Higiene"), palavrasChave: ["sabonete", "shampoo", "condicionador", "creme dental", "escova de dente", "soap"] },
    { categoria: C("Limpeza", "Cleaning", "Limpieza"), palavrasChave: ["detergente", "sabao em po", "desinfetante", "amaciante", "cleaner"] },
    { categoria: C("Mercearia", "Grocery", "Almacén"), palavrasChave: ["arroz", "feijao", "macarrao", "acucar", "sal", "oleo", "farinha", "rice", "beans", "pasta", "sugar"] },
    { categoria: C("Hortifruti", "Produce", "Frutas y Verduras"), palavrasChave: ["banana", "maca", "tomate", "alface", "batata", "cebola", "fruit", "vegetable"] },
  ],
  farmacia: [
    { categoria: C("Medicamentos", "Medications", "Medicamentos"), palavrasChave: ["dipirona", "paracetamol", "ibuprofeno", "analgesico", "antibiotico", "medicamento", "comprimido", "xarope", "pomada", "medicine", "pill"] },
    { categoria: C("Dermocosmético", "Dermocosmetics", "Dermocosmética"), palavrasChave: ["protetor solar", "hidratante", "antirrugas", "dermocosmetico", "sunscreen", "moisturizer"] },
    { categoria: C("Higiene e Beleza", "Beauty & Care", "Higiene y Belleza"), palavrasChave: ["sabonete", "shampoo", "perfume", "desodorante", "fralda", "absorvente"] },
    { categoria: C("Vitaminas e Suplementos", "Vitamins & Supplements", "Vitaminas y Suplementos"), palavrasChave: ["vitamina", "complexo b", "omega 3", "suplemento", "whey", "colageno"] },
  ],
  vestuario: [
    { categoria: C("Camisetas", "T-Shirts", "Camisetas"), palavrasChave: ["camiseta", "camisa polo", "t-shirt", "regata"] },
    { categoria: C("Calças", "Pants", "Pantalones"), palavrasChave: ["calca", "jeans", "legging", "bermuda", "short", "pants"] },
    { categoria: C("Calçados", "Footwear", "Calzado"), palavrasChave: ["tenis", "sapato", "sandalia", "chinelo", "bota", "shoe", "sneaker"] },
    { categoria: C("Acessórios", "Accessories", "Accesorios"), palavrasChave: ["cinto", "bone", "bolsa", "carteira", "oculos", "belt", "bag"] },
  ],
  autopecas: [
    { categoria: C("Motor", "Engine", "Motor"), palavrasChave: ["filtro de oleo", "correia", "vela de ignicao", "junta", "radiador", "engine", "filter"] },
    { categoria: C("Freios", "Brakes", "Frenos"), palavrasChave: ["pastilha de freio", "disco de freio", "lona de freio", "brake"] },
    { categoria: C("Suspensão", "Suspension", "Suspensión"), palavrasChave: ["amortecedor", "mola", "bandeja", "suspension", "shock"] },
    { categoria: C("Elétrica", "Electrical", "Eléctrica"), palavrasChave: ["bateria", "alternador", "fusivel", "farol", "lampada", "battery", "fuse"] },
    { categoria: C("Pneus e Rodas", "Tires & Wheels", "Neumáticos y Ruedas"), palavrasChave: ["pneu", "roda", "calota", "tire", "wheel"] },
  ],
  restaurante_food: [
    { categoria: C("Insumos", "Raw Ingredients", "Insumos"), palavrasChave: ["farinha", "carne", "frango", "peixe", "legume", "tempero", "molho", "ingredient", "flour", "meat"] },
    { categoria: C("Bebidas", "Beverages", "Bebidas"), palavrasChave: ["refrigerante", "suco", "cerveja", "vinho", "agua"] },
    { categoria: C("Embalagens", "Packaging", "Empaques"), palavrasChave: ["embalagem", "copo descartavel", "guardanapo", "marmita", "packaging", "napkin"] },
    { categoria: C("Descartáveis", "Disposables", "Desechables"), palavrasChave: ["talher descartavel", "prato descartavel", "canudo", "disposable"] },
  ],
  eletronicos: [
    { categoria: C("Celulares e Acessórios", "Phones & Accessories", "Celulares y Accesorios"), palavrasChave: ["celular", "smartphone", "capinha", "pelicula", "carregador", "fone de ouvido", "phone", "charger"] },
    { categoria: C("Informática", "Computers", "Informática"), palavrasChave: ["notebook", "mouse", "teclado", "monitor", "ssd", "pendrive", "computer", "keyboard"] },
    { categoria: C("Áudio e Vídeo", "Audio & Video", "Audio y Video"), palavrasChave: ["caixa de som", "fone", "televisao", "speaker", "headphone"] },
    { categoria: C("Eletrodomésticos", "Home Appliances", "Electrodomésticos"), palavrasChave: ["liquidificador", "geladeira", "microondas", "ferro de passar", "blender", "fridge"] },
  ],
  papelaria: [
    { categoria: C("Escrita", "Writing", "Escritura"), palavrasChave: ["caneta", "lapis", "borracha", "marca texto", "pen", "pencil"] },
    { categoria: C("Cadernos e Papel", "Notebooks & Paper", "Cuadernos y Papel"), palavrasChave: ["caderno", "papel sulfite", "bloco de notas", "paper"] },
    { categoria: C("Escritório", "Office", "Oficina"), palavrasChave: ["grampeador", "clips", "pasta suspensa", "envelope", "fita adesiva", "stapler", "folder"] },
    { categoria: C("Arte e Escolar", "Art & School", "Arte y Escolar"), palavrasChave: ["tinta guache", "giz de cera", "cola", "tesoura", "glue", "scissors"] },
  ],
  pet: [
    { categoria: C("Ração", "Pet Food", "Alimento para Mascotas"), palavrasChave: ["racao", "petisco", "alimento para cao", "alimento para gato", "pet food", "treat"] },
    { categoria: C("Higiene Pet", "Pet Hygiene", "Higiene para Mascotas"), palavrasChave: ["shampoo pet", "tapete higienico", "areia sanitaria", "litter"] },
    { categoria: C("Acessórios Pet", "Pet Accessories", "Accesorios para Mascotas"), palavrasChave: ["coleira", "guia", "comedouro", "caminha", "brinquedo pet", "leash", "collar"] },
    { categoria: C("Saúde Pet", "Pet Health", "Salud para Mascotas"), palavrasChave: ["antipulgas", "vermifugo", "vacina", "flea", "dewormer"] },
  ],
  servicos: [
    { categoria: C("Materiais de Consumo", "Consumables", "Materiales de Consumo"), palavrasChave: ["material de consumo", "insumo de servico", "consumable"] },
    { categoria: C("Peças de Reposição", "Spare Parts", "Repuestos"), palavrasChave: ["peca de reposicao", "spare part"] },
    { categoria: C("Equipamentos", "Equipment", "Equipos"), palavrasChave: ["ferramenta", "equipamento", "tool", "equipment"] },
  ],
  generico: [],
};

// Campos condicionais por segmento — ficam dentro de produtos.atributos_nicho,
// nunca viram coluna nova.
export type TipoCampoNicho = "boolean" | "text" | "number" | "select";
export type CampoNicho = { chave: string; label: Record<Idioma, string>; tipo: TipoCampoNicho; opcoes?: { value: string; label: Record<Idioma, string> }[] };

export const CAMPOS_CONDICIONAIS_POR_SEGMENTO: Record<Segmento, CampoNicho[]> = {
  mercado: [
    { chave: "perecivel", tipo: "boolean", label: C("Perecível", "Perishable", "Perecedero") },
  ],
  farmacia: [
    { chave: "perecivel", tipo: "boolean", label: C("Perecível", "Perishable", "Perecedero") },
    { chave: "principioAtivo", tipo: "text", label: C("Princípio Ativo", "Active Ingredient", "Principio Activo") },
    {
      chave: "tarja", tipo: "select", label: C("Tarja", "Prescription Class", "Franja"),
      opcoes: [
        { value: "sem_tarja", label: C("Sem tarja", "Over-the-counter", "Sin franja") },
        { value: "amarela", label: C("Amarela (retenção de receita)", "Yellow (prescription retained)", "Amarilla (receta retenida)") },
        { value: "vermelha", label: C("Vermelha (retenção de receita)", "Red (prescription retained)", "Roja (receta retenida)") },
        { value: "preta", label: C("Preta (controlado)", "Black (controlled)", "Negra (controlado)") },
      ],
    },
    { chave: "registroAnvisa", tipo: "text", label: C("Registro ANVISA", "Health Registry No.", "Registro Sanitario") },
  ],
  vestuario: [
    {
      chave: "tamanho", tipo: "select", label: C("Tamanho", "Size", "Talla"),
      opcoes: ["PP", "P", "M", "G", "GG", "XG"].map((t) => ({ value: t, label: C(t, t, t) })),
    },
  ],
  autopecas: [
    { chave: "aplicacaoVeiculo", tipo: "text", label: C("Aplicação/Veículo", "Vehicle Application", "Aplicación/Vehículo") },
    { chave: "codigoOem", tipo: "text", label: C("Código OEM", "OEM Code", "Código OEM") },
  ],
  restaurante_food: [
    { chave: "perecivel", tipo: "boolean", label: C("Perecível", "Perishable", "Perecedero") },
    { chave: "insumoReceita", tipo: "boolean", label: C("É insumo de receita", "Is a recipe ingredient", "Es insumo de receta") },
    { chave: "fichaTecnica", tipo: "text", label: C("Ficha Técnica", "Technical Sheet", "Ficha Técnica") },
  ],
  eletronicos: [
    { chave: "garantiaMeses", tipo: "number", label: C("Garantia (meses)", "Warranty (months)", "Garantía (meses)") },
    {
      chave: "voltagem", tipo: "select", label: C("Voltagem", "Voltage", "Voltaje"),
      opcoes: [
        { value: "110v", label: C("110V", "110V", "110V") },
        { value: "220v", label: C("220V", "220V", "220V") },
        { value: "bivolt", label: C("Bivolt", "Dual voltage", "Bivoltaje") },
      ],
    },
  ],
  papelaria: [],
  pet: [
    {
      chave: "especieAlvo", tipo: "select", label: C("Espécie", "Species", "Especie"),
      opcoes: [
        { value: "cao", label: C("Cão", "Dog", "Perro") },
        { value: "gato", label: C("Gato", "Cat", "Gato") },
        { value: "ave", label: C("Ave", "Bird", "Ave") },
        { value: "outro", label: C("Outro", "Other", "Otro") },
      ],
    },
  ],
  servicos: [],
  generico: [],
};

function normalizarTexto(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function extrairTermoChave(nome: string): string {
  const normalizado = normalizarTexto(nome);
  const palavra = normalizado.split(/\s+/).find((p) => p.length >= 3);
  return palavra || normalizado;
}

function sugerirPorDicionario(segmento: Segmento | null | undefined, nome: string, idioma: Idioma): string | null {
  const regras = DICIONARIO_SEGMENTOS[segmento || "generico"] || [];
  const nomeNorm = normalizarTexto(nome);
  if (!nomeNorm) return null;
  for (const regra of regras) {
    if (regra.palavrasChave.some((p) => nomeNorm.includes(normalizarTexto(p)))) {
      return regra.categoria[idioma];
    }
  }
  return null;
}

// Checa o aprendizado da empresa primeiro (correções já feitas antes), só
// depois cai no dicionário fixo do segmento.
export async function sugerirCategoria(empresaId: string, segmento: Segmento | null | undefined, nome: string, idioma: Idioma): Promise<string | null> {
  const termo = extrairTermoChave(nome);
  if (termo) {
    const { data } = await supabase.from("produtos_categoria_aprendizado").select("categoria")
      .eq("empresa_id", empresaId).eq("termo", termo).order("ocorrencias", { ascending: false }).limit(1).maybeSingle();
    if (data?.categoria) return data.categoria;
  }
  return sugerirPorDicionario(segmento, nome, idioma);
}

// Chamar ao salvar o produto, só quando o usuário mudou a categoria que a
// sugestão automática tinha preenchido — assim o sistema aprende com a correção.
export async function registrarAprendizadoCategoria(empresaId: string, nome: string, categoriaEscolhida: string): Promise<void> {
  const termo = extrairTermoChave(nome);
  if (!termo || !categoriaEscolhida) return;
  const { data: existente } = await supabase.from("produtos_categoria_aprendizado").select("id, ocorrencias")
    .eq("empresa_id", empresaId).eq("termo", termo).maybeSingle();
  if (existente) {
    await supabase.from("produtos_categoria_aprendizado")
      .update({ categoria: categoriaEscolhida, ocorrencias: (existente.ocorrencias || 1) + 1, ultima_vez_usado: new Date().toISOString() })
      .eq("id", existente.id);
  } else {
    await supabase.from("produtos_categoria_aprendizado")
      .insert({ empresa_id: empresaId, termo, categoria: categoriaEscolhida });
  }
}
