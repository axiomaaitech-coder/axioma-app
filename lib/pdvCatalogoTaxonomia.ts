// 🦅 AXIOMA AI.TECH — PDV: taxonomia única de Nicho → Categoria → Sub-nicho
// Fonte ÚNICA da verdade da navegação e do cadastro do PDV (Fases 1, 2 e 2.1).
// Nunca reescrever esta árvore em outro arquivo — quem precisar de nicho,
// categoria, sub-nicho ou dos campos de cadastro importa daqui. Categoria só
// existe dentro de um nicho (NichoPdvDef.categorias), sub-nicho só existe
// dentro de uma categoria (CategoriaPdv.subNichos) — a estrutura de tipos por
// si só impede categoria órfã ou sub-nicho solto. Exatamente 3 níveis, sem
// quarto nível — "Alimentos/Não-Alimentos" (divisaoPrimaria) é só uma
// ETIQUETA no nicho pra filtro visual da tela, nunca um nível novo na árvore.
//
// Reaproveita, só pelo VALOR da string, os 6 segmentos do Estoque que mapeiam
// 1:1 com um nicho do PDV (mercado, farmacia, autopecas, papelaria, pet,
// eletronicos) + genérico. Os 10 segmentos do Estoque (lib/categoriaInteligente.ts)
// continuam 100% intocados — vestuario, restaurante_food e servicos ficam de
// fora desta árvore de propósito: são negócios finos demais pra caber num
// nicho só, e o PDV ganha nichos NOVOS e mais específicos no lugar.
//
// Fase 2.1: Açougue e Hortifruti/Sacolão existem NOS DOIS LUGARES —
// categoria DENTRO de "mercado" (departamento de supermercado) E nicho
// PRÓPRIO standalone (loja de bairro que só vende aquilo) — mesma lógica já
// usada com Padaria/Confeitaria. Peixaria fica só como categoria (raro como
// loja própria no pequeno varejo, decisão do Elias).
//
// Nichos novos gravam na MESMA coluna produtos.segmento (texto livre, sem
// CHECK constraint no banco) com uma string nova, nunca usada antes.
//
// categoria/subNicho usam {value, label}, mesmo padrão de SEGMENTOS em
// categoriaInteligente.ts. O `value` é só chave interna/React key; o filtro
// contra o banco usa label[idioma] — é isso que o Estoque já grava hoje na
// coluna categoria (texto traduzido, não slug, herança do dicionário
// existente). Ver lib/pdvHelpers.ts.
//
// Campos por sub-nicho: cada SubNichoPdv pode declarar `campos` (CampoNicho[],
// MESMO tipo já usado pelo Estoque em categoriaInteligente.ts — importado,
// nunca redeclarado). É o sub-nicho, e somente ele, que decide quais campos
// aparecem no cadastro.

import type { Idioma } from "./translations";
import { CHAVE_PERECIVEL, type CampoNicho } from "./categoriaInteligente";

export type ModoNicho = "produto" | "misto" | "servico";
export type DivisaoPrimaria = "alimentos" | "nao_alimentos";

// ehServico é ADITIVO e por SUB-NICHO: cobre o item vendido dentro de um nicho de
// produto que na verdade é serviço (ex: "Serviços de Impressão" na Papelaria) e o
// caminho inverso, produto revendido dentro de nicho de serviço (ex: shampoo no
// Salão) continua sendo um sub-nicho comum, sem essa flag. Quando ausente, herda
// o modo do nicho (nichoSel.modo === "servico") — nenhum sub-nicho existente muda
// de comportamento. Ver subNichoEhServico() abaixo, única forma de ler essa regra.
export type SubNichoPdv = { value: string; label: Record<Idioma, string>; campos?: CampoNicho[]; ehServico?: boolean };
export type CategoriaPdv = { value: string; label: Record<Idioma, string>; subNichos: SubNichoPdv[] };

export type NichoPdv =
  | "mercado" | "farmacia" | "autopecas" | "papelaria" | "pet" | "eletronicos" | "generico"
  | "roupas" | "calcados_tenis" | "padaria_confeitaria" | "cosmeticos_perfumaria" | "bebidas_adega"
  | "lanchonete" | "pizzaria" | "sorveteria_acai" | "marmita_comida_pronta"
  | "salao_barbearia" | "manicure_estetica" | "servicos_tecnicos" | "servicos_domesticos"
  | "acougue" | "hortifruti_sacolao" | "materiais_construcao";

export type NichoPdvDef = { value: NichoPdv; label: Record<Idioma, string>; modo: ModoNicho; divisaoPrimaria: DivisaoPrimaria; categorias: CategoriaPdv[] };

const L = (pt: string, en: string, es: string): Record<Idioma, string> => ({ pt, en, es });
const SUB = (value: string, pt: string, en: string, es: string, campos: CampoNicho[] = [], ehServico?: boolean): SubNichoPdv => ({ value, label: L(pt, en, es), campos, ehServico });
const CAT = (value: string, pt: string, en: string, es: string, subNichos: SubNichoPdv[]): CategoriaPdv => ({ value, label: L(pt, en, es), subNichos });

// ============================================================================
// BUNDLES DE CAMPO — reutilizáveis, mas sempre atribuídos explicitamente a um
// sub-nicho (nunca aplicados "por categoria" ou "por nicho" escondido).
// ============================================================================

const CB = (chave: string, tipo: CampoNicho["tipo"], pt: string, en: string, es: string, opcoes?: CampoNicho["opcoes"]): CampoNicho =>
  ({ chave, tipo, label: L(pt, en, es), opcoes });

const CAMPO_PERECIVEL: CampoNicho = { chave: CHAVE_PERECIVEL, tipo: "boolean", label: L("Perecível", "Perishable", "Perecedero") };
const CAMPO_VOLUME: CampoNicho = CB("volume", "text", "Volume", "Volume", "Volumen");
const CAMPO_TEOR_ALCOOLICO: CampoNicho = CB("teorAlcoolico", "text", "Teor Alcoólico", "Alcohol Content", "Contenido de Alcohol");
const CAMPO_TAMANHO_ROUPA: CampoNicho = CB("tamanho", "select", "Tamanho", "Size", "Talla", [
  ...["PP", "P", "M", "G", "GG", "XG"].map((t) => ({ value: t, label: L(t, t, t) })), { value: "unico", label: L("Único", "One Size", "Único") },
]);
const CAMPO_COR: CampoNicho = CB("cor", "text", "Cor", "Color", "Color");
const CAMPO_NUMERACAO_CALCADO: CampoNicho = CB("numeracao", "text", "Numeração", "Size (shoe)", "Numeración");
const CAMPO_GARANTIA_MESES: CampoNicho = CB("garantiaMeses", "number", "Garantia (meses)", "Warranty (months)", "Garantía (meses)");
const CAMPO_NECESSITA_RECEITA: CampoNicho = CB("necessitaReceita", "boolean", "Necessita Receita", "Requires Prescription", "Requiere Receta");

// Modo serviço: duração + forma de cobrança, universal aos 4 nichos de
// serviço — é exatamente o que o Elias pediu, nunca o modelo de produto.
const CAMPOS_SERVICO_PADRAO: CampoNicho[] = [
  CB("tempoEstimado", "text", "Duração Estimada", "Estimated Duration", "Duración Estimada"),
  CB("formaCobranca", "select", "Forma de Cobrança", "Billing Method", "Forma de Cobro", [
    { value: "hora", label: L("Por Hora", "Per Hour", "Por Hora") },
    { value: "fechado", label: L("Valor Fechado", "Flat Rate", "Precio Cerrado") },
    { value: "diaria", label: L("Diária", "Daily Rate", "Diaria") },
    { value: "peca", label: L("Por Peça/Serviço", "Per Piece/Job", "Por Pieza/Servicio") },
    { value: "m2", label: L("Por Metro Quadrado", "Per Square Meter", "Por Metro Cuadrado") },
  ]),
];

export const NICHOS_PDV: NichoPdvDef[] = [
  // ============================================================================
  // MODO PRODUTO — reaproveitam o segmento existente do Estoque (dado real)
  // ============================================================================
  {
    value: "mercado", label: L("Mercado/Mercearia", "Grocery Store", "Mercado/Almacén"), modo: "produto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("hortifruti", "Hortifruti", "Produce", "Frutas y Verduras", [
        SUB("fruta", "Fruta", "Fruit", "Fruta", [CAMPO_PERECIVEL]), SUB("verdura_legume", "Verdura/Legume", "Vegetable", "Verdura", [CAMPO_PERECIVEL]), SUB("ovos", "Ovos", "Eggs", "Huevos", [CAMPO_PERECIVEL]),
      ]),
      CAT("acougue_mercado", "Açougue", "Butcher", "Carnicería", [
        SUB("carne_bovina", "Carne Bovina", "Beef", "Carne de Res", [CAMPO_PERECIVEL]), SUB("carne_suina", "Carne Suína", "Pork", "Cerdo", [CAMPO_PERECIVEL]),
        SUB("aves", "Aves", "Poultry", "Aves", [CAMPO_PERECIVEL]), SUB("embutidos_frescos", "Embutidos Frescos", "Fresh Sausages", "Embutidos Frescos", [CAMPO_PERECIVEL]),
      ]),
      CAT("peixaria_mercado", "Peixaria/Pescados", "Seafood", "Pescadería", [
        SUB("peixe_fresco", "Peixe Fresco", "Fresh Fish", "Pescado Fresco", [CAMPO_PERECIVEL]), SUB("frutos_do_mar", "Frutos do Mar", "Seafood", "Mariscos", [CAMPO_PERECIVEL]),
      ]),
      CAT("padaria_mercado", "Padaria", "Bakery", "Panadería", [
        SUB("pao_do_dia", "Pão do Dia", "Daily Bread", "Pan del Día", [CAMPO_PERECIVEL]), SUB("confeitaria_doces", "Confeitaria/Doces", "Pastry/Sweets", "Pastelería/Dulces", [CAMPO_PERECIVEL]),
      ]),
      CAT("laticinios", "Laticínios", "Dairy", "Lácteos", [
        SUB("leite", "Leite", "Milk", "Leche", [CAMPO_PERECIVEL, CAMPO_VOLUME]), SUB("iogurte", "Iogurte", "Yogurt", "Yogur", [CAMPO_PERECIVEL]),
        SUB("manteiga_requeijao", "Manteiga/Requeijão", "Butter/Cream Cheese", "Mantequilla/Queso Crema", [CAMPO_PERECIVEL]),
        SUB("achocolatado_leite_po", "Achocolatado/Leite em Pó", "Chocolate Milk/Powdered Milk", "Achocolatado/Leche en Polvo"),
      ]),
      CAT("frios", "Frios", "Deli", "Fiambres", [
        SUB("queijo", "Queijo", "Cheese", "Queso", [CAMPO_PERECIVEL]), SUB("embutido", "Presunto/Embutido", "Ham/Cold Cuts", "Jamón/Fiambre", [CAMPO_PERECIVEL]),
        SUB("massas_frescas_prontas", "Massas Frescas/Prontas", "Fresh/Ready Pasta", "Pastas Frescas/Preparadas", [CAMPO_PERECIVEL]),
      ]),
      CAT("congelados", "Congelados", "Frozen", "Congelados", [
        SUB("carnes_congeladas", "Carnes Congeladas", "Frozen Meat", "Carnes Congeladas", [CAMPO_PERECIVEL]),
        SUB("pratos_prontos_congelados", "Pratos Prontos Congelados", "Frozen Ready Meals", "Comidas Congeladas", [CAMPO_PERECIVEL]),
        SUB("vegetais_congelados", "Vegetais Congelados", "Frozen Vegetables", "Verduras Congeladas", [CAMPO_PERECIVEL]),
        SUB("peixe_congelado", "Peixe/Frutos do Mar Congelado", "Frozen Fish/Seafood", "Pescado/Mariscos Congelados", [CAMPO_PERECIVEL]),
        SUB("sorvete", "Sorvete", "Ice Cream", "Helado", [CAMPO_PERECIVEL]),
      ]),
      CAT("enlatados_conservas", "Enlatados e Conservas", "Canned & Preserved Goods", "Enlatados y Conservas", [
        SUB("enlatados", "Enlatados", "Canned Goods", "Enlatados"), SUB("conservas", "Conservas", "Preserves", "Conservas"),
        SUB("molhos_temperos_prontos", "Molhos e Temperos Prontos", "Ready Sauces & Seasonings", "Salsas y Condimentos Listos"),
      ]),
      CAT("mercearia_seca", "Mercearia Seca", "Dry Grocery", "Almacén Seco", [
        SUB("graos_massas", "Grãos/Massas", "Grains/Pasta", "Granos/Pastas"), SUB("oleo_farinha_acucar_sal", "Óleo/Farinha/Açúcar/Sal", "Oil/Flour/Sugar/Salt", "Aceite/Harina/Azúcar/Sal"),
        SUB("cafe_achocolatado_po", "Café/Achocolatado em Pó", "Coffee/Powdered Chocolate", "Café/Chocolate en Polvo"), SUB("biscoitos_snacks", "Biscoitos e Snacks", "Cookies & Snacks", "Galletas y Snacks"),
      ]),
      CAT("bebidas", "Bebidas / Mercearia Líquida", "Beverages", "Bebidas", [
        SUB("refrigerante", "Refrigerante", "Soda", "Refresco", [CAMPO_PERECIVEL, CAMPO_VOLUME]), SUB("cerveja", "Cerveja", "Beer", "Cerveza", [CAMPO_PERECIVEL, CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("agua", "Água", "Water", "Agua", [CAMPO_PERECIVEL, CAMPO_VOLUME]), SUB("suco", "Suco", "Juice", "Jugo", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
        SUB("energetico_isotonico", "Energético/Isotônico", "Energy/Sports Drink", "Energética/Isotónica", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
      ]),
      CAT("higiene", "Higiene", "Personal Care", "Higiene", [
        SUB("sabonete", "Sabonete", "Soap", "Jabón"), SUB("higiene_bucal", "Higiene Bucal", "Oral Care", "Higiene Bucal"), SUB("papel_higienico_absorvente", "Papel Higiênico/Absorvente", "Toilet Paper/Pads", "Papel Higiénico/Toallas"),
      ]),
      CAT("limpeza", "Limpeza", "Cleaning", "Limpieza", [
        SUB("detergente", "Detergente", "Detergent", "Detergente"), SUB("desinfetante_amaciante", "Desinfetante/Amaciante", "Disinfectant/Softener", "Desinfectante/Suavizante"),
        SUB("sabao_po_alvejante", "Sabão em Pó/Alvejante", "Powder Soap/Bleach", "Jabón en Polvo/Blanqueador"),
      ]),
      CAT("infantil_bebe", "Infantil/Bebê", "Baby & Kids", "Infantil/Bebé", [
        SUB("fralda", "Fralda", "Diaper", "Pañal"), SUB("higiene_infantil", "Higiene Infantil", "Baby Care", "Higiene Infantil"), SUB("alimentacao_infantil", "Alimentação Infantil", "Baby Food", "Alimentación Infantil", [CAMPO_PERECIVEL]),
      ]),
      CAT("utensilios_domesticos", "Utensílios Domésticos", "Household Goods", "Utensilios Domésticos", [
        SUB("cozinha_utensilios", "Cozinha", "Kitchen", "Cocina"), SUB("organizacao", "Organização", "Organization", "Organización"), SUB("descartaveis_domesticos", "Descartáveis Domésticos", "Household Disposables", "Desechables del Hogar"),
      ]),
      CAT("bazar", "Bazar", "General Goods", "Bazar", [
        SUB("eletroportateis", "Eletroportáteis", "Small Appliances", "Electroportátiles"), SUB("iluminacao_decoracao", "Iluminação/Decoração", "Lighting/Decor", "Iluminación/Decoración"),
        SUB("presentes_papelaria_basica", "Presentes/Papelaria Básica", "Gifts/Basic Stationery", "Regalos/Papelería Básica"), SUB("pilhas_lampadas", "Pilhas e Lâmpadas", "Batteries & Light Bulbs", "Pilas y Bombillas"),
      ]),
    ],
  },
  {
    value: "farmacia", label: L("Farmácia", "Pharmacy", "Farmacia"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("medicamentos", "Medicamentos", "Medications", "Medicamentos", [
        SUB("isento_receita", "Isento de Receita", "Over-the-counter", "Sin Receta", [CAMPO_PERECIVEL]), SUB("com_retencao", "Com Retenção (tarja)", "Prescription Retained", "Con Retención", [CAMPO_PERECIVEL, CAMPO_NECESSITA_RECEITA]),
        SUB("controlado", "Controlado (SNGPC)", "Controlled (SNGPC)", "Controlado (SNGPC)", [CAMPO_PERECIVEL, CAMPO_NECESSITA_RECEITA]),
      ]),
      CAT("dermocosmetico", "Dermocosmético", "Dermocosmetics", "Dermocosmética", [
        SUB("protetor_solar", "Protetor Solar", "Sunscreen", "Protector Solar", [CAMPO_PERECIVEL]), SUB("hidratante_antirrugas", "Hidratante/Antirrugas", "Moisturizer/Anti-aging", "Hidratante/Antiarrugas", [CAMPO_PERECIVEL]),
      ]),
      CAT("higiene_beleza", "Higiene e Beleza", "Beauty & Care", "Higiene y Belleza", [
        SUB("sabonete_shampoo", "Sabonete/Shampoo", "Soap/Shampoo", "Jabón/Champú"), SUB("fralda_absorvente", "Fralda/Absorvente", "Diaper/Pad", "Pañal/Toalla"), SUB("perfumaria", "Perfumaria", "Fragrance", "Perfumería"),
      ]),
      CAT("vitaminas_suplementos", "Vitaminas/Suplementos", "Vitamins/Supplements", "Vitaminas/Suplementos", [
        SUB("vitamina_mineral", "Vitamina/Mineral", "Vitamin/Mineral", "Vitamina/Mineral", [CAMPO_PERECIVEL]), SUB("suplemento_esportivo", "Suplemento Esportivo", "Sports Supplement", "Suplemento Deportivo", [CAMPO_PERECIVEL]),
      ]),
      CAT("ortopedia", "Ortopedia", "Orthopedics", "Ortopedia", [
        SUB("meias_compressao", "Meias de Compressão", "Compression Socks", "Medias de Compresión"), SUB("orteses_apoios", "Órteses/Apoios", "Orthotics/Braces", "Órtesis/Soportes"),
      ]),
      CAT("materno_infantil_farmacia", "Materno-Infantil", "Mother & Baby", "Materno-Infantil", [
        SUB("fralda_geriatrica", "Fralda Geriátrica", "Adult Diaper", "Pañal Geriátrico"), SUB("leite_formula_infantil", "Leite/Fórmula Infantil", "Baby Formula", "Leche/Fórmula Infantil", [CAMPO_PERECIVEL]),
      ]),
    ],
  },
  {
    value: "autopecas", label: L("Autopeças", "Auto Parts", "Autopartes"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("motor", "Motor", "Engine", "Motor", [SUB("filtro", "Filtro", "Filter", "Filtro"), SUB("correia_vela", "Correia/Vela de Ignição", "Belt/Spark Plug", "Correa/Bujía")]),
      CAT("freios", "Freios", "Brakes", "Frenos", [SUB("pastilha", "Pastilha", "Brake Pad", "Pastilla"), SUB("disco_lona", "Disco/Lona", "Disc/Shoe", "Disco/Balata")]),
      CAT("suspensao", "Suspensão", "Suspension", "Suspensión", [SUB("amortecedor", "Amortecedor", "Shock Absorber", "Amortiguador"), SUB("mola_bandeja", "Mola/Bandeja", "Spring/Control Arm", "Resorte/Horquilla")]),
      CAT("eletrica", "Elétrica", "Electrical", "Eléctrica", [SUB("bateria", "Bateria", "Battery", "Batería", [CAMPO_GARANTIA_MESES]), SUB("lampada_farol", "Lâmpada/Farol", "Bulb/Headlight", "Bombilla/Faro")]),
      CAT("pneus_rodas", "Pneus e Rodas", "Tires & Wheels", "Neumáticos y Ruedas", [SUB("pneu", "Pneu", "Tire", "Neumático", [CAMPO_GARANTIA_MESES]), SUB("roda_calota", "Roda/Calota", "Wheel/Hubcap", "Rueda/Tapacubos")]),
      CAT("acessorios_automotivos", "Acessórios Automotivos", "Auto Accessories", "Accesorios Automotrices", [
        SUB("som_automotivo", "Som Automotivo", "Car Audio", "Audio para Auto", [CAMPO_GARANTIA_MESES]), SUB("tapete_capa_banco", "Tapete/Capa de Banco", "Mats/Seat Covers", "Alfombras/Fundas"), SUB("acessorios_externos", "Acessórios Externos", "Exterior Accessories", "Accesorios Exteriores"),
      ]),
    ],
  },
  {
    value: "papelaria", label: L("Papelaria", "Stationery", "Papelería"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("escrita", "Escrita", "Writing", "Escritura", [SUB("caneta_lapis", "Caneta/Lápis", "Pen/Pencil", "Bolígrafo/Lápiz"), SUB("marca_texto", "Marca-texto", "Highlighter", "Marcador")]),
      CAT("cadernos_papel", "Cadernos e Papel", "Notebooks & Paper", "Cuadernos y Papel", [SUB("caderno", "Caderno", "Notebook", "Cuaderno"), SUB("papel_sulfite", "Papel Sulfite", "Printer Paper", "Papel Bond")]),
      CAT("escritorio", "Escritório", "Office", "Oficina", [SUB("grampeador_clips", "Grampeador/Clips", "Stapler/Clips", "Engrapadora/Clips"), SUB("pasta_envelope", "Pasta/Envelope", "Folder/Envelope", "Carpeta/Sobre")]),
      CAT("arte_escolar", "Arte e Escolar", "Art & School", "Arte y Escolar", [SUB("tinta_cola_tesoura", "Tinta/Cola/Tesoura", "Paint/Glue/Scissors", "Pintura/Pegamento/Tijera")]),
      CAT("informatica_basica", "Informática Básica", "Basic Computer Supplies", "Informática Básica", [SUB("cartucho_toner", "Cartucho/Toner", "Ink/Toner Cartridge", "Cartucho/Tóner"), SUB("midia", "Mídia (pendrive, CD/DVD)", "Media (flash drive, CD/DVD)", "Medios (pendrive, CD/DVD)")]),
    ],
  },
  {
    value: "pet", label: L("Pet", "Pet", "Mascotas"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("racao", "Ração", "Pet Food", "Alimento para Mascotas", [
        SUB("cao", "Cão", "Dog", "Perro", [CAMPO_PERECIVEL]), SUB("gato", "Gato", "Cat", "Gato", [CAMPO_PERECIVEL]), SUB("outros", "Outros", "Other", "Otro", [CAMPO_PERECIVEL]),
      ]),
      CAT("higiene_pet", "Higiene Pet", "Pet Hygiene", "Higiene para Mascotas", [SUB("shampoo_pet", "Shampoo Pet", "Pet Shampoo", "Champú Mascota"), SUB("areia_sanitaria", "Areia Sanitária", "Litter", "Arena Sanitaria")]),
      CAT("acessorios_pet", "Acessórios Pet", "Pet Accessories", "Accesorios para Mascotas", [SUB("coleira_guia", "Coleira/Guia", "Collar/Leash", "Collar/Correa"), SUB("brinquedo", "Brinquedo", "Toy", "Juguete")]),
      CAT("saude_pet", "Saúde Pet", "Pet Health", "Salud para Mascotas", [SUB("antipulgas_vermifugo", "Antipulgas/Vermífugo", "Flea/Dewormer", "Antipulgas/Desparasitante", [CAMPO_PERECIVEL])]),
      CAT("aquarismo_outros", "Aquarismo/Outros Animais", "Fishkeeping/Other Animals", "Acuarismo/Otros Animales", [SUB("peixe_aquario", "Peixe/Aquário", "Fish/Aquarium", "Pez/Acuario"), SUB("roedor_ave", "Roedor/Ave", "Rodent/Bird", "Roedor/Ave")]),
    ],
  },
  {
    value: "eletronicos", label: L("Eletrônicos", "Electronics", "Electrónica"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("celulares_acessorios", "Celulares e Acessórios", "Phones & Accessories", "Celulares y Accesorios", [
        SUB("celular", "Celular", "Phone", "Celular", [CAMPO_GARANTIA_MESES]), SUB("acessorio", "Capinha/Carregador/Fone", "Case/Charger/Headphone", "Funda/Cargador/Audífono"),
      ]),
      CAT("informatica", "Informática", "Computers", "Informática", [SUB("notebook_pc", "Notebook/PC", "Laptop/PC", "Notebook/PC", [CAMPO_GARANTIA_MESES]), SUB("periferico", "Periférico", "Peripheral", "Periférico")]),
      CAT("audio_video", "Áudio e Vídeo", "Audio & Video", "Audio y Video", [SUB("som_fone", "Caixa de Som/Fone", "Speaker/Headphone", "Altavoz/Audífono", [CAMPO_GARANTIA_MESES]), SUB("tv", "Televisão", "TV", "Televisor", [CAMPO_GARANTIA_MESES])]),
      CAT("eletrodomesticos", "Eletrodomésticos", "Home Appliances", "Electrodomésticos", [SUB("linha_branca", "Linha Branca", "Major Appliance", "Línea Blanca", [CAMPO_GARANTIA_MESES]), SUB("pequenos_eletros", "Pequenos Eletros", "Small Appliance", "Pequeño Electrodoméstico", [CAMPO_GARANTIA_MESES])]),
      CAT("games", "Games", "Games", "Videojuegos", [SUB("console", "Console", "Console", "Consola", [CAMPO_GARANTIA_MESES]), SUB("jogo_acessorio", "Jogo/Acessório de Game", "Game/Gaming Accessory", "Juego/Accesorio de Videojuego")]),
    ],
  },

  // ============================================================================
  // MODO PRODUTO — novos (sem equivalente hoje no Estoque, sem dado ainda)
  // ============================================================================
  {
    value: "padaria_confeitaria", label: L("Padaria/Confeitaria", "Bakery/Pastry Shop", "Panadería/Pastelería"), modo: "produto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("paes", "Pães", "Bread", "Panes", [SUB("pao_frances", "Pão Francês", "French Bread", "Pan Francés", [CAMPO_PERECIVEL]), SUB("pao_doce_especial", "Pão Doce/Especial", "Sweet/Specialty Bread", "Pan Dulce/Especial", [CAMPO_PERECIVEL])]),
      CAT("confeitaria", "Confeitaria", "Pastry", "Pastelería", [SUB("bolo", "Bolo", "Cake", "Torta", [CAMPO_PERECIVEL]), SUB("salgado", "Salgado", "Savory Pastry", "Salado", [CAMPO_PERECIVEL])]),
      CAT("bebidas_consumo_local", "Bebidas", "Beverages", "Bebidas", [SUB("cafe_suco", "Café/Suco", "Coffee/Juice", "Café/Jugo", [CAMPO_PERECIVEL])]),
    ],
  },
  {
    value: "acougue", label: L("Açougue", "Butcher Shop", "Carnicería"), modo: "produto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("carnes_bovinas", "Carnes Bovinas", "Beef", "Carne de Res", [SUB("carne_primeira", "Carne de Primeira", "Premium Cuts", "Corte de Primera", [CAMPO_PERECIVEL]), SUB("carne_segunda", "Carne de Segunda", "Standard Cuts", "Corte de Segunda", [CAMPO_PERECIVEL])]),
      CAT("carnes_suinas", "Carnes Suínas", "Pork", "Cerdo", [SUB("cortes_suinos", "Cortes Suínos", "Pork Cuts", "Cortes de Cerdo", [CAMPO_PERECIVEL])]),
      CAT("aves_acougue", "Aves", "Poultry", "Aves", [SUB("frango", "Frango", "Chicken", "Pollo", [CAMPO_PERECIVEL]), SUB("outras_aves", "Outras Aves", "Other Poultry", "Otras Aves", [CAMPO_PERECIVEL])]),
      CAT("embutidos_defumados", "Embutidos e Defumados", "Sausages & Smoked Meats", "Embutidos y Ahumados", [SUB("linguica", "Linguiça", "Sausage", "Longaniza", [CAMPO_PERECIVEL]), SUB("bacon_defumados", "Bacon/Defumados", "Bacon/Smoked Meats", "Tocino/Ahumados", [CAMPO_PERECIVEL])]),
    ],
  },
  {
    value: "hortifruti_sacolao", label: L("Hortifruti/Sacolão", "Produce Market", "Verdulería"), modo: "produto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("frutas_hf", "Frutas", "Fruit", "Frutas", [SUB("fruta_nacional", "Fruta Nacional", "Domestic Fruit", "Fruta Nacional", [CAMPO_PERECIVEL]), SUB("fruta_importada", "Fruta Importada", "Imported Fruit", "Fruta Importada", [CAMPO_PERECIVEL])]),
      CAT("verduras_legumes_hf", "Verduras e Legumes", "Vegetables", "Verduras y Legumbres", [SUB("verdura_folhosa", "Verdura Folhosa", "Leafy Greens", "Verdura de Hoja", [CAMPO_PERECIVEL]), SUB("legume", "Legume", "Vegetable", "Legumbre", [CAMPO_PERECIVEL])]),
      CAT("temperos_ovos_hf", "Temperos Frescos e Ovos", "Fresh Herbs & Eggs", "Condimentos Frescos y Huevos", [SUB("tempero_fresco", "Tempero Fresco", "Fresh Herbs", "Condimento Fresco", [CAMPO_PERECIVEL]), SUB("ovos_hf", "Ovos", "Eggs", "Huevos", [CAMPO_PERECIVEL])]),
    ],
  },
  {
    value: "roupas", label: L("Roupas", "Apparel", "Ropa"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("camisetas", "Camisetas", "T-Shirts", "Camisetas", [
        SUB("masculina", "Masculina", "Men's", "Masculina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]), SUB("feminina", "Feminina", "Women's", "Femenina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]), SUB("infantil", "Infantil", "Kids", "Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
      ]),
      CAT("calcas", "Calças", "Pants", "Pantalones", [SUB("jeans", "Jeans", "Jeans", "Jeans", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]), SUB("legging_moletom", "Legging/Moletom", "Leggings/Sweatpants", "Legging/Buzo", [CAMPO_TAMANHO_ROUPA, CAMPO_COR])]),
      CAT("acessorios_vestuario", "Acessórios", "Accessories", "Accesorios", [SUB("cinto_bone_bolsa", "Cinto/Boné/Bolsa", "Belt/Cap/Bag", "Cinturón/Gorra/Bolso", [CAMPO_COR])]),
      CAT("intima_praia", "Roupa Íntima e Praia", "Underwear & Swimwear", "Ropa Íntima y Playa", [SUB("intima", "Íntima", "Underwear", "Ropa Íntima", [CAMPO_TAMANHO_ROUPA]), SUB("moda_praia", "Moda Praia", "Swimwear", "Moda de Playa", [CAMPO_TAMANHO_ROUPA, CAMPO_COR])]),
    ],
  },
  {
    value: "calcados_tenis", label: L("Calçados/Tênis", "Footwear", "Calzado"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("tenis", "Tênis", "Sneakers", "Zapatillas", [
        SUB("esportivo", "Esportivo", "Athletic", "Deportivo", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]), SUB("casual", "Casual", "Casual", "Casual", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("sapato_sandalia", "Sapato/Sandália", "Shoes/Sandals", "Zapato/Sandalia", [
        SUB("social", "Social", "Dress Shoe", "Formal", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]), SUB("chinelo_sandalia", "Chinelo/Sandália", "Flip-flop/Sandal", "Chancla/Sandalia", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("meias_cuidado", "Meias e Cuidado do Calçado", "Socks & Shoe Care", "Medias y Cuidado del Calzado", [SUB("meia", "Meia", "Socks", "Media"), SUB("palmilha_cuidado", "Palmilha/Cuidado", "Insole/Shoe Care", "Plantilla/Cuidado")]),
    ],
  },
  {
    value: "cosmeticos_perfumaria", label: L("Cosméticos/Perfumaria", "Cosmetics/Perfumery", "Cosméticos/Perfumería"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("maquiagem", "Maquiagem", "Makeup", "Maquillaje", [SUB("rosto", "Rosto", "Face", "Rostro", [CAMPO_PERECIVEL]), SUB("olhos_labios", "Olhos/Lábios", "Eyes/Lips", "Ojos/Labios", [CAMPO_PERECIVEL])]),
      CAT("perfumaria_cosm", "Perfumaria", "Fragrance", "Perfumería", [SUB("perfume", "Perfume", "Perfume", "Perfume"), SUB("colonia", "Colônia", "Cologne", "Colonia")]),
      CAT("skincare", "Skincare", "Skincare", "Cuidado de la Piel", [SUB("hidratante_skincare", "Hidratante", "Moisturizer", "Hidratante", [CAMPO_PERECIVEL]), SUB("protetor_solar_skincare", "Protetor Solar", "Sunscreen", "Protector Solar", [CAMPO_PERECIVEL])]),
      CAT("cabelo_cosm", "Cabelo", "Hair", "Cabello", [SUB("shampoo_condicionador", "Shampoo/Condicionador", "Shampoo/Conditioner", "Champú/Acondicionador"), SUB("finalizador", "Finalizador", "Styling Product", "Finalizador")]),
    ],
  },
  {
    value: "bebidas_adega", label: L("Bebidas/Adega", "Beverages/Wine Shop", "Bebidas/Vinoteca"), modo: "produto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("vinho", "Vinho", "Wine", "Vino", [SUB("tinto", "Tinto", "Red", "Tinto", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("branco_rose", "Branco/Rosé", "White/Rosé", "Blanco/Rosado", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO])]),
      CAT("destilado", "Destilado", "Spirits", "Destilado", [SUB("whisky_vodka_gin", "Whisky/Vodka/Gin", "Whisky/Vodka/Gin", "Whisky/Vodka/Gin", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO])]),
      CAT("cerveja_adega", "Cerveja", "Beer", "Cerveza", [SUB("artesanal", "Artesanal", "Craft", "Artesanal", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("comercial", "Comercial", "Mainstream", "Comercial", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO])]),
      CAT("nao_alcoolicas_premium", "Não Alcoólicas Premium", "Premium Non-Alcoholic", "No Alcohólicas Premium", [SUB("espumante_sem_alcool", "Espumante Sem Álcool", "Non-Alcoholic Sparkling", "Espumante Sin Alcohol", [CAMPO_VOLUME]), SUB("agua_gas_tonica", "Água com Gás/Tônica", "Sparkling Water/Tonic", "Agua con Gas/Tónica", [CAMPO_VOLUME])]),
    ],
  },
  {
    value: "materiais_construcao", label: L("Materiais de Construção", "Building Materials", "Materiales de Construcción"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("cimento_argamassa", "Cimento e Argamassa", "Cement & Mortar", "Cemento y Mortero", [
        SUB("cimento", "Cimento", "Cement", "Cemento"), SUB("argamassa_rejunte", "Argamassa/Rejunte", "Mortar/Grout", "Mortero/Junta"), SUB("cal_massa_pronta", "Cal/Massa Pronta", "Lime/Ready Mix", "Cal/Mezcla Lista"),
      ]),
      CAT("hidraulica", "Hidráulica", "Plumbing", "Plomería", [
        SUB("tubos_conexoes", "Tubos e Conexões", "Pipes & Fittings", "Tubos y Conexiones"), SUB("registros_torneiras", "Registros e Torneiras", "Valves & Faucets", "Llaves y Grifos"), SUB("caixa_agua_louca", "Caixa d'Água/Louça Sanitária", "Water Tank/Sanitary Ware", "Tanque de Agua/Sanitarios"),
      ]),
      CAT("eletrica_construcao", "Elétrica", "Electrical", "Eléctrica", [
        SUB("fios_cabos", "Fios e Cabos", "Wires & Cables", "Cables"), SUB("disjuntores_quadros", "Disjuntores/Quadros", "Breakers/Panels", "Disyuntores/Tableros"), SUB("tomadas_iluminacao", "Tomadas/Interruptores/Iluminação", "Outlets/Switches/Lighting", "Tomas/Interruptores/Iluminación"),
      ]),
      CAT("tintas", "Tintas", "Paints", "Pinturas", [
        SUB("tinta_latex_acrilica", "Tinta Látex/Acrílica", "Latex/Acrylic Paint", "Pintura Látex/Acrílica"), SUB("esmalte_sintetico", "Esmalte Sintético", "Enamel Paint", "Esmalte Sintético"), SUB("verniz_selador_acessorios", "Verniz/Selador/Acessórios de Pintura", "Varnish/Sealer/Painting Tools", "Barniz/Sellador/Accesorios de Pintura"),
      ]),
      CAT("ferramentas", "Ferramentas", "Tools", "Herramientas", [
        SUB("ferramentas_manuais", "Ferramentas Manuais", "Hand Tools", "Herramientas Manuales"), SUB("ferramentas_eletricas", "Ferramentas Elétricas", "Power Tools", "Herramientas Eléctricas", [CAMPO_GARANTIA_MESES]), SUB("escadas_andaimes", "Escadas e Andaimes", "Ladders & Scaffolding", "Escaleras y Andamios"),
      ]),
      CAT("pisos_revestimentos", "Pisos e Revestimentos", "Flooring & Wall Covering", "Pisos y Revestimientos", [
        SUB("piso_ceramico_porcelanato", "Piso Cerâmico/Porcelanato", "Ceramic/Porcelain Tile", "Cerámica/Porcelanato"), SUB("revestimento_parede", "Revestimento de Parede", "Wall Covering", "Revestimiento de Pared"), SUB("piso_laminado_vinilico", "Piso Laminado/Vinílico", "Laminate/Vinyl Flooring", "Piso Laminado/Vinílico"),
      ]),
      CAT("madeiras", "Madeiras", "Wood", "Maderas", [
        SUB("madeira_bruta_serrada", "Madeira Bruta/Serrada", "Raw/Sawn Wood", "Madera Bruta/Aserrada"), SUB("compensado_mdf", "Compensado/MDF", "Plywood/MDF", "Contrachapado/MDF"), SUB("portas_batentes", "Portas e Batentes", "Doors & Frames", "Puertas y Marcos"),
      ]),
      CAT("ferragens_fixacao", "Ferragens e Fixação", "Hardware & Fasteners", "Ferretería y Fijación", [
        SUB("parafusos_buchas", "Parafusos e Buchas", "Screws & Anchors", "Tornillos y Tacos"), SUB("pregos_arruelas", "Pregos e Arruelas", "Nails & Washers", "Clavos y Arandelas"), SUB("dobradicas_fechaduras", "Dobradiças e Fechaduras", "Hinges & Locks", "Bisagras y Cerraduras"),
      ]),
      CAT("jardim", "Jardim", "Garden", "Jardín", [
        SUB("vaso_terra_adubo", "Vaso/Terra/Adubo", "Pots/Soil/Fertilizer", "Maceta/Tierra/Abono"), SUB("ferramenta_jardim", "Ferramenta de Jardim", "Garden Tools", "Herramientas de Jardín"), SUB("mangueira_irrigacao", "Mangueira/Irrigação", "Hose/Irrigation", "Manguera/Riego"),
      ]),
      CAT("epi", "EPI", "PPE", "EPP", [
        SUB("protecao_individual", "Proteção Individual (luva, óculos, capacete)", "Personal Protection (gloves, goggles, helmet)", "Protección Personal (guantes, gafas, casco)"),
        SUB("protecao_respiratoria", "Proteção Respiratória", "Respiratory Protection", "Protección Respiratoria"), SUB("botas_calcados_seguranca", "Botas e Calçados de Segurança", "Safety Boots & Footwear", "Botas y Calzado de Seguridad"),
      ]),
    ],
  },

  // ============================================================================
  // MODO MISTO — food service granular (restaurante_food do Estoque intocado)
  // ============================================================================
  {
    value: "lanchonete", label: L("Lanchonete", "Snack Bar", "Cafetería"), modo: "misto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("insumos_lanchonete", "Insumos", "Raw Ingredients", "Insumos", [SUB("pao_carne_queijo", "Pão/Carne/Queijo", "Bread/Meat/Cheese", "Pan/Carne/Queso", [CAMPO_PERECIVEL])]),
      CAT("bebidas_lanchonete", "Bebidas", "Beverages", "Bebidas", [SUB("refrigerante_suco", "Refrigerante/Suco", "Soda/Juice", "Refresco/Jugo", [CAMPO_PERECIVEL])]),
      CAT("descartaveis_lanchonete", "Descartáveis", "Disposables", "Desechables", [SUB("embalagem_guardanapo", "Embalagem/Guardanapo", "Packaging/Napkin", "Empaque/Servilleta")]),
    ],
  },
  {
    value: "pizzaria", label: L("Pizzaria", "Pizzeria", "Pizzería"), modo: "misto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("insumos_pizzaria", "Insumos", "Raw Ingredients", "Insumos", [SUB("massa_molho_queijo", "Massa/Molho/Queijo", "Dough/Sauce/Cheese", "Masa/Salsa/Queso", [CAMPO_PERECIVEL])]),
      CAT("embalagens_pizzaria", "Embalagens", "Packaging", "Empaques", [SUB("caixa_pizza", "Caixa de Pizza", "Pizza Box", "Caja de Pizza")]),
    ],
  },
  {
    value: "sorveteria_acai", label: L("Sorveteria/Açaí", "Ice Cream/Açaí Shop", "Heladería/Açaí"), modo: "misto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("insumos_sorveteria", "Insumos", "Raw Ingredients", "Insumos", [
        SUB("sorvete_acai_base", "Sorvete/Açaí Base", "Ice Cream/Açaí Base", "Helado/Açaí Base", [CAMPO_PERECIVEL]), SUB("cobertura_complemento", "Cobertura/Complemento", "Topping", "Cobertura/Complemento", [CAMPO_PERECIVEL]),
      ]),
      CAT("descartaveis_sorveteria", "Descartáveis", "Disposables", "Desechables", [SUB("copo_casquinha", "Copo/Casquinha", "Cup/Cone", "Vaso/Cono")]),
    ],
  },
  {
    value: "marmita_comida_pronta", label: L("Marmita/Comida Pronta", "Meal Prep/Ready Food", "Vianda/Comida Preparada"), modo: "misto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("insumos_marmita", "Insumos", "Raw Ingredients", "Insumos", [SUB("proteina_guarnicao", "Proteína/Guarnição", "Protein/Side", "Proteína/Guarnición", [CAMPO_PERECIVEL])]),
      CAT("embalagens_marmita", "Embalagens", "Packaging", "Empaques", [SUB("marmita_talher", "Marmita/Talher Descartável", "Container/Disposable Cutlery", "Vianda/Cubiertos Desechables")]),
    ],
  },

  // ============================================================================
  // MODO SERVIÇO — sem EAN, sem estoque, sem validade (servicos do Estoque intocado)
  // ============================================================================
  {
    value: "salao_barbearia", label: L("Salão/Barbearia", "Salon/Barbershop", "Salón/Barbería"), modo: "servico", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("corte", "Corte", "Haircut", "Corte", [SUB("corte_masculino", "Corte Masculino", "Men's Haircut", "Corte Masculino", CAMPOS_SERVICO_PADRAO), SUB("corte_feminino", "Corte Feminino", "Women's Haircut", "Corte Femenino", CAMPOS_SERVICO_PADRAO)]),
      CAT("coloracao", "Coloração", "Coloring", "Coloración", [SUB("tintura", "Tintura", "Hair Dye", "Tintura", CAMPOS_SERVICO_PADRAO), SUB("luzes_mechas", "Luzes/Mechas", "Highlights", "Luces/Mechas", CAMPOS_SERVICO_PADRAO)]),
      CAT("barba", "Barba", "Beard", "Barba", [SUB("barba_completa", "Barba Completa", "Full Beard Service", "Barba Completa", CAMPOS_SERVICO_PADRAO)]),
    ],
  },
  {
    value: "manicure_estetica", label: L("Manicure/Estética", "Nail Care/Aesthetics", "Manicura/Estética"), modo: "servico", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("manicure_pedicure", "Manicure/Pedicure", "Manicure/Pedicure", "Manicura/Pedicura", [
        SUB("manicure_simples", "Manicure Simples", "Basic Manicure", "Manicura Simple", CAMPOS_SERVICO_PADRAO), SUB("pedicure_simples", "Pedicure Simples", "Basic Pedicure", "Pedicura Simple", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("estetica_facial", "Estética Facial", "Facial Aesthetics", "Estética Facial", [SUB("limpeza_pele", "Limpeza de Pele", "Facial Cleansing", "Limpieza Facial", CAMPOS_SERVICO_PADRAO)]),
    ],
  },
  {
    value: "servicos_tecnicos", label: L("Serviços Técnicos", "Technical Services", "Servicios Técnicos"), modo: "servico", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("eletrica_servico", "Elétrica", "Electrical", "Eléctrica", [SUB("instalacao_reparo_eletrico", "Instalação/Reparo", "Installation/Repair", "Instalación/Reparación", CAMPOS_SERVICO_PADRAO)]),
      CAT("hidraulica_servico", "Hidráulica", "Plumbing", "Plomería", [SUB("instalacao_reparo_hidraulico", "Instalação/Reparo", "Installation/Repair", "Instalación/Reparación", CAMPOS_SERVICO_PADRAO)]),
    ],
  },
  {
    value: "servicos_domesticos", label: L("Serviços Domésticos", "Domestic Services", "Servicios Domésticos"), modo: "servico", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("diarista", "Diarista", "House Cleaning", "Limpieza del Hogar", [SUB("diaria_padrao", "Diária Padrão", "Standard Day Rate", "Tarifa Diaria Estándar", CAMPOS_SERVICO_PADRAO)]),
      CAT("costura", "Costura", "Sewing", "Costura", [SUB("ajuste_reparo", "Ajuste/Reparo", "Alteration/Repair", "Ajuste/Reparación", CAMPOS_SERVICO_PADRAO)]),
    ],
  },

  // ============================================================================
  // GENÉRICO — reaproveita o segmento existente, sem categoria fixa
  // ============================================================================
  { value: "generico", label: L("Genérico", "Generic", "Genérico"), modo: "produto", divisaoPrimaria: "nao_alimentos", categorias: [] },
];

// ============================================================================
// LOOKUPS — únicas funções de acesso à árvore (nunca reconstruir em outro arquivo)
// ============================================================================

export function buscarNicho(nicho: string): NichoPdvDef | undefined {
  return NICHOS_PDV.find((n) => n.value === nicho);
}

// Única fonte de verdade de "isso é produto ou serviço" — sub-nicho decide
// primeiro (ehServico explícito), nicho decide por padrão quando o sub-nicho
// não declarar nada. Todo lugar que hoje olhava só nicho.modo === "servico"
// passa a chamar esta função (cadastro do PDV) — comportamento idêntico pra
// quem não usa a flag nova.
export function subNichoEhServico(nicho: NichoPdvDef | null | undefined, sub: SubNichoPdv | null | undefined): boolean {
  if (sub?.ehServico !== undefined) return sub.ehServico;
  return nicho?.modo === "servico";
}

export function buscarCategoria(nicho: string, categoria: string): CategoriaPdv | undefined {
  return buscarNicho(nicho)?.categorias.find((c) => c.value === categoria);
}

export function buscarSubNicho(nicho: string, categoria: string, subNicho: string): SubNichoPdv | undefined {
  return buscarCategoria(nicho, categoria)?.subNichos.find((s) => s.value === subNicho);
}
