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
export type TipoCampoNicho = "boolean" | "text" | "number" | "select" | "date";
export type CampoNicho = {
  chave: string; label: Record<Idioma, string>; tipo: TipoCampoNicho; opcoes?: { value: string; label: Record<Idioma, string> }[];
  // se preenchido, este campo só aparece quando o campo boolean de chave
  // igual a "dependeDe" estiver marcado (ex: Lista de Controle só se
  // Medicamento Controlado = sim).
  dependeDe?: string;
};

// Chave única do campo "Perecível" em atributos_nicho — usada nos 3 segmentos
// que têm a flag (mercado, farmácia, restaurante/food) e lida em page.tsx
// pra decidir se abre os campos de lote/validade. Centralizada aqui, num só
// lugar, pra nunca mais existir risco de divergência de string entre eles.
export const CHAVE_PERECIVEL = "perecivel";

const NA = (): { value: string; label: Record<Idioma, string> } => ({ value: "na", label: C("N/A", "N/A", "N/A") });

export const CAMPOS_CONDICIONAIS_POR_SEGMENTO: Record<Segmento, CampoNicho[]> = {
  mercado: [
    { chave: CHAVE_PERECIVEL, tipo: "boolean", label: C("Perecível", "Perishable", "Perecedero") },
    { chave: "saborVariacao", tipo: "text", label: C("Sabor/Variação", "Flavor/Variant", "Sabor/Variante") },
    {
      chave: "unidadeVenda", tipo: "select", label: C("Unidade de Venda", "Sales Unit", "Unidad de Venta"),
      opcoes: [
        { value: "un", label: C("Unidade", "Unit", "Unidad") },
        { value: "kg", label: C("Kg", "Kg", "Kg") },
        { value: "L", label: C("Litro", "Liter", "Litro") },
        { value: "pacote", label: C("Pacote", "Pack", "Paquete") },
        { value: "caixa", label: C("Caixa", "Box", "Caja") },
        { value: "fardo", label: C("Fardo", "Bundle", "Fardo") },
      ],
    },
    {
      chave: "origem", tipo: "select", label: C("Origem", "Origin", "Origen"),
      opcoes: [
        { value: "nacional", label: C("Nacional", "Domestic", "Nacional") },
        { value: "importado", label: C("Importado", "Imported", "Importado") },
      ],
    },
    { chave: "pesoLiquido", tipo: "text", label: C("Peso Líquido", "Net Weight", "Peso Neto") },
    { chave: "pesoBruto", tipo: "text", label: C("Peso Bruto", "Gross Weight", "Peso Bruto") },
    { chave: "registroSifDipoa", tipo: "text", label: C("Registro no órgão (SIF/DIPOA)", "Health Registry (SIF/DIPOA)", "Registro Sanitario (SIF/DIPOA)") },
    { chave: "contemGluten", tipo: "boolean", label: C("Contém Glúten", "Contains Gluten", "Contiene Gluten") },
    { chave: "contemLactose", tipo: "boolean", label: C("Contém Lactose", "Contains Lactose", "Contiene Lactosa") },
    { chave: "organico", tipo: "boolean", label: C("Orgânico", "Organic", "Orgánico") },
  ],
  farmacia: [
    { chave: CHAVE_PERECIVEL, tipo: "boolean", label: C("Perecível", "Perishable", "Perecedero") },
    { chave: "principioAtivo", tipo: "text", label: C("Princípio Ativo / DCB", "Active Ingredient / INN", "Principio Activo / DCI") },
    { chave: "concentracao", tipo: "text", label: C("Concentração/Dosagem", "Concentration/Dosage", "Concentración/Dosis") },
    {
      chave: "formaFarmaceutica", tipo: "select", label: C("Forma Farmacêutica", "Pharmaceutical Form", "Forma Farmacéutica"),
      opcoes: [
        { value: "comprimido", label: C("Comprimido", "Tablet", "Comprimido") },
        { value: "capsula", label: C("Cápsula", "Capsule", "Cápsula") },
        { value: "xarope", label: C("Xarope", "Syrup", "Jarabe") },
        { value: "injetavel", label: C("Injetável", "Injectable", "Inyectable") },
        { value: "pomada", label: C("Pomada", "Ointment", "Pomada") },
        { value: "gotas", label: C("Gotas", "Drops", "Gotas") },
        { value: "creme", label: C("Creme", "Cream", "Crema") },
        { value: "outro", label: C("Outro", "Other", "Otro") },
      ],
    },
    {
      chave: "tarja", tipo: "select", label: C("Tarja", "Prescription Class", "Franja"),
      opcoes: [
        { value: "sem_tarja", label: C("Sem tarja", "Over-the-counter", "Sin franja") },
        { value: "amarela", label: C("Amarela (retenção de receita)", "Yellow (prescription retained)", "Amarilla (receta retenida)") },
        { value: "vermelha", label: C("Vermelha (retenção de receita)", "Red (prescription retained)", "Roja (receta retenida)") },
        { value: "preta", label: C("Preta (controlado)", "Black (controlled)", "Negra (controlado)") },
      ],
    },
    { chave: "medicamentoControlado", tipo: "boolean", label: C("Medicamento Controlado (SNGPC)", "Controlled Medication (SNGPC)", "Medicamento Controlado (SNGPC)") },
    {
      chave: "listaControle", tipo: "select", label: C("Lista de Controle", "Control List", "Lista de Control"), dependeDe: "medicamentoControlado",
      opcoes: [NA(), ...["A1", "A2", "A3", "B1", "B2", "C1", "C2", "C5"].map((l) => ({ value: l, label: C(l, l, l) }))],
    },
    { chave: "registroAnvisa", tipo: "text", label: C("Registro MS/ANVISA", "Health Registry No.", "Registro Sanitario") },
    { chave: "laboratorioFabricante", tipo: "text", label: C("Laboratório/Fabricante", "Laboratory/Manufacturer", "Laboratorio/Fabricante") },
    { chave: "necessitaReceita", tipo: "boolean", label: C("Necessita Receita", "Requires Prescription", "Requiere Receta") },
    { chave: "pmc", tipo: "number", label: C("Valor Máximo ao Consumidor (PMC)", "Max. Consumer Price (PMC)", "Precio Máximo al Consumidor (PMC)") },
    { chave: "eanCaixa", tipo: "text", label: C("Código EAN da caixa", "Box EAN Code", "Código EAN de la caja") },
    {
      chave: "classificacaoMedicamento", tipo: "select", label: C("Genérico/Similar/Referência", "Generic/Similar/Reference", "Genérico/Similar/Referencia"),
      opcoes: [
        { value: "generico", label: C("Genérico", "Generic", "Genérico") },
        { value: "similar", label: C("Similar", "Similar", "Similar") },
        { value: "referencia", label: C("Referência", "Reference", "Referencia") },
      ],
    },
    { chave: "necessitaRefrigeracao", tipo: "boolean", label: C("Necessita Refrigeração", "Requires Refrigeration", "Requiere Refrigeración") },
    {
      chave: "publicoUso", tipo: "select", label: C("Uso", "Use", "Uso"),
      opcoes: [
        { value: "adulto", label: C("Adulto", "Adult", "Adulto") },
        { value: "pediatrico", label: C("Pediátrico", "Pediatric", "Pediátrico") },
        { value: "ambos", label: C("Ambos", "Both", "Ambos") },
      ],
    },
  ],
  vestuario: [
    {
      chave: "tamanho", tipo: "select", label: C("Tamanho", "Size", "Talla"),
      opcoes: [...["PP", "P", "M", "G", "GG", "XG"].map((t) => ({ value: t, label: C(t, t, t) })), { value: "unico", label: C("Único", "One Size", "Único") }],
    },
    {
      chave: "genero", tipo: "select", label: C("Gênero", "Gender", "Género"),
      opcoes: [
        { value: "masculino", label: C("Masculino", "Men's", "Masculino") },
        { value: "feminino", label: C("Feminino", "Women's", "Femenino") },
        { value: "unissex", label: C("Unissex", "Unisex", "Unisex") },
        { value: "infantil", label: C("Infantil", "Kids", "Infantil") },
      ],
    },
    { chave: "materialComposicao", tipo: "text", label: C("Material/Composição do Tecido", "Fabric Material/Composition", "Material/Composición del Tejido") },
    { chave: "colecaoEstacao", tipo: "text", label: C("Coleção/Estação", "Collection/Season", "Colección/Temporada") },
    { chave: "cor", tipo: "text", label: C("Cor", "Color", "Color") },
    {
      chave: "modelagem", tipo: "select", label: C("Modelagem", "Fit", "Corte"),
      opcoes: [
        { value: "slim", label: C("Slim", "Slim", "Slim") },
        { value: "regular", label: C("Regular", "Regular", "Regular") },
        { value: "oversized", label: C("Oversized", "Oversized", "Oversized") },
        NA(),
      ],
    },
    { chave: "cuidadosLavagem", tipo: "text", label: C("Cuidados de Lavagem", "Washing Instructions", "Cuidados de Lavado") },
    { chave: "referenciaModelo", tipo: "text", label: C("Referência do Modelo", "Model Reference", "Referencia del Modelo") },
  ],
  autopecas: [
    { chave: "aplicacaoVeiculo", tipo: "text", label: C("Aplicação/Veículo", "Vehicle Application", "Aplicación/Vehículo") },
    { chave: "codigoOem", tipo: "text", label: C("Código OEM", "OEM Code", "Código OEM") },
    { chave: "montadora", tipo: "text", label: C("Montadora", "Automaker", "Automotriz") },
    { chave: "anoInicio", tipo: "number", label: C("Ano Início", "Start Year", "Año Inicio") },
    { chave: "anoFim", tipo: "number", label: C("Ano Fim", "End Year", "Año Fin") },
    { chave: "fabricantePeca", tipo: "text", label: C("Fabricante da Peça", "Part Manufacturer", "Fabricante de la Pieza") },
    { chave: "garantiaMeses", tipo: "number", label: C("Garantia (meses)", "Warranty (months)", "Garantía (meses)") },
    { chave: "material", tipo: "text", label: C("Material", "Material", "Material") },
    { chave: "medidasDimensoes", tipo: "text", label: C("Medidas/Dimensões", "Measurements/Dimensions", "Medidas/Dimensiones") },
    { chave: "crossReference", tipo: "text", label: C("Cross-reference/Similares", "Cross-reference/Equivalents", "Cross-reference/Similares") },
    {
      chave: "posicao", tipo: "select", label: C("Posição", "Position", "Posición"),
      opcoes: [
        { value: "dianteira", label: C("Dianteira", "Front", "Delantera") },
        { value: "traseira", label: C("Traseira", "Rear", "Trasera") },
        { value: "ambas", label: C("Ambas", "Both", "Ambas") },
        NA(),
      ],
    },
    {
      chave: "lado", tipo: "select", label: C("Lado", "Side", "Lado"),
      opcoes: [
        { value: "esquerdo", label: C("Esquerdo", "Left", "Izquierdo") },
        { value: "direito", label: C("Direito", "Right", "Derecho") },
        NA(),
      ],
    },
    {
      chave: "origemPeca", tipo: "select", label: C("Original ou Paralela", "Original or Aftermarket", "Original o Paralela"),
      opcoes: [
        { value: "original", label: C("Original", "Original", "Original") },
        { value: "paralela", label: C("Paralela", "Aftermarket", "Paralela") },
        { value: "recondicionada", label: C("Recondicionada", "Reconditioned", "Reacondicionada") },
      ],
    },
  ],
  restaurante_food: [
    { chave: CHAVE_PERECIVEL, tipo: "boolean", label: C("Perecível", "Perishable", "Perecedero") },
    { chave: "insumoReceita", tipo: "boolean", label: C("É insumo de receita", "Is a recipe ingredient", "Es insumo de receta") },
    { chave: "fichaTecnica", tipo: "text", label: C("Ficha Técnica", "Technical Sheet", "Ficha Técnica") },
    {
      chave: "unidadeConsumo", tipo: "select", label: C("Unidade de Consumo", "Consumption Unit", "Unidad de Consumo"),
      opcoes: [
        { value: "kg", label: C("Kg", "Kg", "Kg") },
        { value: "g", label: C("Grama", "Gram", "Gramo") },
        { value: "L", label: C("Litro", "Liter", "Litro") },
        { value: "ml", label: C("Mililitro", "Milliliter", "Mililitro") },
        { value: "un", label: C("Unidade", "Unit", "Unidad") },
        { value: "porcao", label: C("Porção", "Portion", "Porción") },
      ],
    },
    { chave: "rendimentoPorcoes", tipo: "number", label: C("Rendimento/Porções", "Yield/Servings", "Rendimiento/Porciones") },
    {
      chave: "armazenamento", tipo: "select", label: C("Armazenamento", "Storage", "Almacenamiento"),
      opcoes: [
        { value: "ambiente", label: C("Ambiente", "Room Temperature", "Ambiente") },
        { value: "refrigerado", label: C("Refrigerado", "Refrigerated", "Refrigerado") },
        { value: "congelado", label: C("Congelado", "Frozen", "Congelado") },
      ],
    },
    { chave: "alergenos", tipo: "text", label: C("Alérgenos", "Allergens", "Alérgenos") },
    { chave: "temperaturaArmazenamento", tipo: "text", label: C("Temperatura de Armazenamento", "Storage Temperature", "Temperatura de Almacenamiento") },
    { chave: "fornecedorPreferencial", tipo: "text", label: C("Fornecedor Preferencial", "Preferred Supplier", "Proveedor Preferido") },
    { chave: "custoPorPorcao", tipo: "number", label: C("Custo por Porção", "Cost per Serving", "Costo por Porción") },
    { chave: "validadeAposAberto", tipo: "text", label: C("Validade após Aberto", "Shelf Life After Opening", "Vencimiento después de Abierto") },
  ],
  eletronicos: [
    { chave: "garantiaMeses", tipo: "number", label: C("Garantia (meses)", "Warranty (months)", "Garantía (meses)") },
    {
      chave: "voltagem", tipo: "select", label: C("Voltagem", "Voltage", "Voltaje"),
      opcoes: [
        { value: "110v", label: C("110V", "110V", "110V") },
        { value: "220v", label: C("220V", "220V", "220V") },
        { value: "bivolt", label: C("Bivolt", "Dual voltage", "Bivoltaje") },
        NA(),
      ],
    },
    { chave: "potencia", tipo: "text", label: C("Potência", "Power", "Potencia") },
    { chave: "modeloPartNumber", tipo: "text", label: C("Modelo/Part Number", "Model/Part Number", "Modelo/Part Number") },
    { chave: "numeroSerieControlado", tipo: "boolean", label: C("Número de Série controlado", "Serial Number tracked", "Número de Serie controlado") },
    { chave: "cor", tipo: "text", label: C("Cor", "Color", "Color") },
    { chave: "dimensoes", tipo: "text", label: C("Dimensões", "Dimensions", "Dimensiones") },
    { chave: "pesoTexto", tipo: "text", label: C("Peso", "Weight", "Peso") },
    { chave: "conteudoEmbalagem", tipo: "text", label: C("Conteúdo da Embalagem", "Package Contents", "Contenido del Paquete") },
    { chave: "certificacaoAnatel", tipo: "text", label: C("Certificação Anatel", "Anatel Certification", "Certificación Anatel") },
  ],
  papelaria: [
    { chave: "marcaFabricante", tipo: "text", label: C("Marca/Fabricante", "Brand/Manufacturer", "Marca/Fabricante") },
    { chave: "cor", tipo: "text", label: C("Cor", "Color", "Color") },
    { chave: "material", tipo: "text", label: C("Material", "Material", "Material") },
    { chave: "dimensoes", tipo: "text", label: C("Dimensões", "Dimensions", "Dimensiones") },
    {
      chave: "unidadeVenda", tipo: "select", label: C("Unidade de Venda", "Sales Unit", "Unidad de Venta"),
      opcoes: [
        { value: "un", label: C("Unidade", "Unit", "Unidad") },
        { value: "pacote", label: C("Pacote", "Pack", "Paquete") },
        { value: "caixa", label: C("Caixa", "Box", "Caja") },
        { value: "resma", label: C("Resma", "Ream", "Resma") },
      ],
    },
  ],
  pet: [
    {
      chave: "especieAlvo", tipo: "select", label: C("Espécie", "Species", "Especie"),
      opcoes: [
        { value: "cao", label: C("Cão", "Dog", "Perro") },
        { value: "gato", label: C("Gato", "Cat", "Gato") },
        { value: "ave", label: C("Ave", "Bird", "Ave") },
        { value: "peixe", label: C("Peixe", "Fish", "Pez") },
        { value: "roedor", label: C("Roedor", "Rodent", "Roedor") },
        { value: "outro", label: C("Outro", "Other", "Otro") },
      ],
    },
    {
      chave: "porte", tipo: "select", label: C("Porte", "Size", "Tamaño"),
      opcoes: [
        { value: "pequeno", label: C("Pequeno", "Small", "Pequeño") },
        { value: "medio", label: C("Médio", "Medium", "Mediano") },
        { value: "grande", label: C("Grande", "Large", "Grande") },
        { value: "todos", label: C("Todos", "All", "Todos") },
      ],
    },
    {
      chave: "faixaEtaria", tipo: "select", label: C("Faixa Etária", "Age Range", "Rango de Edad"),
      opcoes: [
        { value: "filhote", label: C("Filhote", "Puppy/Kitten", "Cachorro/Cría") },
        { value: "adulto", label: C("Adulto", "Adult", "Adulto") },
        { value: "senior", label: C("Sênior", "Senior", "Sénior") },
        { value: "todos", label: C("Todos", "All", "Todos") },
      ],
    },
    {
      chave: "tipoPet", tipo: "select", label: C("Tipo", "Type", "Tipo"),
      opcoes: [
        { value: "alimento", label: C("Alimento", "Food", "Alimento") },
        { value: "medicamento", label: C("Medicamento", "Medication", "Medicamento") },
        { value: "higiene", label: C("Higiene", "Hygiene", "Higiene") },
        { value: "acessorio", label: C("Acessório", "Accessory", "Accesorio") },
        { value: "brinquedo", label: C("Brinquedo", "Toy", "Juguete") },
      ],
    },
    { chave: "pesoVolume", tipo: "text", label: C("Peso/Volume da Embalagem", "Package Weight/Volume", "Peso/Volumen del Paquete") },
    { chave: "sabor", tipo: "text", label: C("Sabor", "Flavor", "Sabor") },
    { chave: "indicacao", tipo: "text", label: C("Indicação", "Indication", "Indicación") },
    { chave: "registroMapa", tipo: "text", label: C("Registro MAPA", "MAPA Registry", "Registro MAPA") },
    {
      chave: "linha", tipo: "select", label: C("Linha", "Line", "Línea"),
      opcoes: [
        { value: "premium", label: C("Premium", "Premium", "Premium") },
        { value: "standard", label: C("Standard", "Standard", "Estándar") },
        { value: "economica", label: C("Econômica", "Economy", "Económica") },
        NA(),
      ],
    },
  ],
  servicos: [
    {
      chave: "tipoItem", tipo: "select", label: C("Tipo de Item", "Item Type", "Tipo de Ítem"),
      opcoes: [
        { value: "material_consumo", label: C("Material de Consumo", "Consumable", "Material de Consumo") },
        { value: "peca", label: C("Peça", "Part", "Pieza") },
        { value: "equipamento", label: C("Equipamento", "Equipment", "Equipo") },
        { value: "ferramenta", label: C("Ferramenta", "Tool", "Herramienta") },
      ],
    },
    {
      chave: "unidadeUso", tipo: "select", label: C("Unidade de Uso", "Usage Unit", "Unidad de Uso"),
      opcoes: [
        { value: "un", label: C("Unidade", "Unit", "Unidad") },
        { value: "kg", label: C("Kg", "Kg", "Kg") },
        { value: "L", label: C("Litro", "Liter", "Litro") },
        { value: "m", label: C("Metro", "Meter", "Metro") },
        { value: "h", label: C("Hora", "Hour", "Hora") },
      ],
    },
    { chave: "descricaoServico", tipo: "text", label: C("Descrição do Serviço", "Service Description", "Descripción del Servicio") },
    {
      chave: "unidadeCobranca", tipo: "select", label: C("Unidade de Cobrança", "Billing Unit", "Unidad de Cobro"),
      opcoes: [
        { value: "hora", label: C("Hora", "Hour", "Hora") },
        { value: "diaria", label: C("Diária", "Daily Rate", "Diaria") },
        { value: "projeto", label: C("Projeto", "Project", "Proyecto") },
        { value: "un", label: C("Unidade", "Unit", "Unidad") },
      ],
    },
    { chave: "tempoEstimado", tipo: "text", label: C("Tempo Estimado", "Estimated Time", "Tiempo Estimado") },
  ],
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
