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
        SUB("fruta_nacional_mercado", "Fruta Nacional", "Domestic Fruit", "Fruta Nacional", [CAMPO_PERECIVEL]), SUB("fruta_importada_mercado", "Fruta Importada", "Imported Fruit", "Fruta Importada", [CAMPO_PERECIVEL]),
        SUB("verdura_folhosa_mercado", "Verdura Folhosa", "Leafy Greens", "Verdura de Hoja", [CAMPO_PERECIVEL]), SUB("legume_mercado", "Legume", "Vegetable", "Legumbre", [CAMPO_PERECIVEL]),
        SUB("raiz_tuberculo_mercado", "Raiz/Tubérculo", "Root/Tuber", "Raíz/Tubérculo", [CAMPO_PERECIVEL]), SUB("tempero_fresco_mercado", "Tempero Fresco", "Fresh Herbs", "Condimento Fresco", [CAMPO_PERECIVEL]),
        SUB("ovos_mercado", "Ovos", "Eggs", "Huevos", [CAMPO_PERECIVEL]), SUB("fruta_verdura_higienizada", "Fruta/Verdura Higienizada", "Washed Fruit/Vegetable (Ready-to-eat)", "Fruta/Verdura Higienizada", [CAMPO_PERECIVEL]),
      ]),
      CAT("acougue_mercado", "Açougue", "Butcher", "Carnicería", [
        SUB("carne_bovina_primeira_mercado", "Carne Bovina de Primeira", "Premium Beef Cuts", "Carne de Res de Primera", [CAMPO_PERECIVEL]),
        SUB("carne_bovina_segunda_mercado", "Carne Bovina de Segunda", "Standard Beef Cuts", "Carne de Res de Segunda", [CAMPO_PERECIVEL]),
        SUB("carne_suina_mercado", "Carne Suína", "Pork", "Cerdo", [CAMPO_PERECIVEL]), SUB("aves_mercado", "Aves", "Poultry", "Aves", [CAMPO_PERECIVEL]),
        SUB("embutidos_frescos_mercado", "Embutidos Frescos", "Fresh Sausages", "Embutidos Frescos", [CAMPO_PERECIVEL]),
        SUB("carne_temperada_pronta_mercado", "Carne Temperada/Pronta", "Marinated/Ready Meat", "Carne Condimentada/Lista", [CAMPO_PERECIVEL]),
        SUB("linguica_mercado", "Linguiça", "Sausage", "Longaniza", [CAMPO_PERECIVEL]), SUB("carne_moida_mercado", "Carne Moída", "Ground Beef", "Carne Molida", [CAMPO_PERECIVEL]),
      ]),
      CAT("peixaria_mercado", "Peixaria/Pescados", "Seafood", "Pescadería", [
        SUB("peixe_agua_salgada", "Peixe de Água Salgada", "Saltwater Fish", "Pescado de Agua Salada", [CAMPO_PERECIVEL]),
        SUB("peixe_agua_doce", "Peixe de Água Doce", "Freshwater Fish", "Pescado de Agua Dulce", [CAMPO_PERECIVEL]),
        SUB("frutos_do_mar", "Frutos do Mar", "Seafood", "Mariscos", [CAMPO_PERECIVEL]), SUB("peixe_congelado_peixaria", "Peixe Congelado", "Frozen Fish", "Pescado Congelado", [CAMPO_PERECIVEL]),
        SUB("bacalhau_salgado", "Bacalhau/Salgado", "Salted Cod/Dried Fish", "Bacalao/Salado", [CAMPO_PERECIVEL]), SUB("sushi_preparado", "Sushi/Preparado", "Sushi/Prepared", "Sushi/Preparado", [CAMPO_PERECIVEL]),
      ]),
      CAT("padaria_mercado", "Padaria", "Bakery", "Panadería", [
        SUB("pao_do_dia", "Pão do Dia", "Daily Bread", "Pan del Día", [CAMPO_PERECIVEL]), SUB("pao_forma_industrializado", "Pão de Forma Industrializado", "Packaged Sliced Bread", "Pan de Molde Industrial"),
        SUB("confeitaria_doces", "Confeitaria/Doces", "Pastry/Sweets", "Pastelería/Dulces", [CAMPO_PERECIVEL]), SUB("torrada_biscoito_padaria", "Torrada/Biscoito de Padaria", "Toast/Bakery Cookies", "Tostada/Galleta de Panadería"),
        SUB("bolo_padaria_mercado", "Bolo de Padaria", "Bakery Cake", "Torta de Panadería", [CAMPO_PERECIVEL]), SUB("salgado_assado_frito_mercado", "Salgado Assado/Frito", "Baked/Fried Savory Pastry", "Salado Horneado/Frito", [CAMPO_PERECIVEL]),
      ]),
      CAT("laticinios", "Laticínios", "Dairy", "Lácteos", [
        SUB("leite", "Leite", "Milk", "Leche", [CAMPO_PERECIVEL, CAMPO_VOLUME]), SUB("iogurte", "Iogurte", "Yogurt", "Yogur", [CAMPO_PERECIVEL]),
        SUB("manteiga_requeijao", "Manteiga/Requeijão", "Butter/Cream Cheese", "Mantequilla/Queso Crema", [CAMPO_PERECIVEL]),
        SUB("achocolatado_leite_po", "Achocolatado/Leite em Pó", "Chocolate Milk/Powdered Milk", "Achocolatado/Leche en Polvo"),
        SUB("creme_leite_condensado", "Creme de Leite/Leite Condensado", "Cream/Condensed Milk", "Crema de Leche/Leche Condensada", [CAMPO_PERECIVEL]),
        SUB("bebida_lactea", "Bebida Láctea", "Dairy Drink", "Bebida Láctea", [CAMPO_PERECIVEL]), SUB("leite_vegetal", "Leite Vegetal", "Plant-based Milk", "Leche Vegetal", [CAMPO_PERECIVEL]),
        SUB("petit_suisse_sobremesa_lactea", "Petit Suisse/Sobremesa Láctea", "Petit Suisse/Dairy Dessert", "Petit Suisse/Postre Lácteo", [CAMPO_PERECIVEL]),
      ]),
      CAT("frios", "Frios", "Deli", "Fiambres", [
        SUB("queijo_fatiado_peca", "Queijo Fatiado/Peça", "Sliced/Block Cheese", "Queso en Fetas/Pieza", [CAMPO_PERECIVEL]),
        SUB("embutido", "Presunto/Embutido", "Ham/Cold Cuts", "Jamón/Fiambre", [CAMPO_PERECIVEL]),
        SUB("massas_frescas_prontas", "Massas Frescas/Prontas", "Fresh/Ready Pasta", "Pastas Frescas/Preparadas", [CAMPO_PERECIVEL]),
        SUB("pate", "Patê", "Pâté", "Paté", [CAMPO_PERECIVEL]), SUB("salsicha_frios", "Salsicha", "Hot Dog Sausage", "Salchicha", [CAMPO_PERECIVEL]),
        SUB("salame_copa", "Salame/Copa", "Salami/Cured Meat", "Salame/Bondiola", [CAMPO_PERECIVEL]),
      ]),
      CAT("congelados", "Congelados", "Frozen", "Congelados", [
        SUB("carnes_congeladas", "Carnes Congeladas", "Frozen Meat", "Carnes Congeladas", [CAMPO_PERECIVEL]),
        SUB("pratos_prontos_congelados", "Pratos Prontos Congelados", "Frozen Ready Meals", "Comidas Congeladas", [CAMPO_PERECIVEL]),
        SUB("vegetais_congelados", "Vegetais Congelados", "Frozen Vegetables", "Verduras Congeladas", [CAMPO_PERECIVEL]),
        SUB("peixe_congelado", "Peixe/Frutos do Mar Congelado", "Frozen Fish/Seafood", "Pescado/Mariscos Congelados", [CAMPO_PERECIVEL]),
        SUB("sorvete", "Sorvete", "Ice Cream", "Helado", [CAMPO_PERECIVEL]),
        SUB("salgado_congelado_mercado", "Salgado Congelado", "Frozen Savory Pastry", "Salado Congelado", [CAMPO_PERECIVEL]),
        SUB("massa_pizza_pao_queijo_congelado", "Massa de Pizza/Pão de Queijo Congelado", "Frozen Pizza Dough/Cheese Bread", "Masa de Pizza/Pan de Queso Congelado", [CAMPO_PERECIVEL]),
        SUB("polpa_fruta_congelada_mercado", "Polpa de Fruta Congelada", "Frozen Fruit Pulp", "Pulpa de Fruta Congelada", [CAMPO_PERECIVEL]),
        SUB("acai_sorbet", "Açaí/Sorbet", "Açaí/Sorbet", "Açaí/Sorbete", [CAMPO_PERECIVEL]),
      ]),
      CAT("enlatados_conservas", "Enlatados e Conservas", "Canned & Preserved Goods", "Enlatados y Conservas", [
        SUB("enlatados", "Enlatados", "Canned Goods", "Enlatados"), SUB("conservas", "Conservas", "Preserves", "Conservas"),
        SUB("molhos_temperos_prontos", "Molhos e Temperos Prontos", "Ready Sauces & Seasonings", "Salsas y Condimentos Listos"),
        SUB("extrato_molho_tomate", "Extrato/Molho de Tomate", "Tomato Paste/Sauce", "Extracto/Salsa de Tomate"),
        SUB("azeite_oleo_especial", "Azeite/Óleo Especial", "Olive Oil/Specialty Oil", "Aceite de Oliva/Aceite Especial"),
        SUB("vinagre", "Vinagre", "Vinegar", "Vinagre"), SUB("condimento_po", "Condimento em Pó", "Powdered Seasoning", "Condimento en Polvo"),
      ]),
      CAT("mercearia_seca", "Mercearia Seca", "Dry Grocery", "Almacén Seco", [
        SUB("graos", "Grãos", "Grains", "Granos"), SUB("massas_mercearia", "Massas", "Pasta", "Pastas"),
        SUB("oleo_mercearia", "Óleo/Azeite", "Oil", "Aceite"), SUB("farinha", "Farinha", "Flour", "Harina"),
        SUB("acucar_adocante", "Açúcar/Adoçante", "Sugar/Sweetener", "Azúcar/Edulcorante"), SUB("sal_mercearia", "Sal", "Salt", "Sal"),
        SUB("cafe_mercearia", "Café", "Coffee", "Café"), SUB("achocolatado_po_mercearia", "Achocolatado em Pó", "Powdered Chocolate", "Chocolate en Polvo"),
        SUB("biscoitos_snacks", "Biscoitos e Snacks", "Cookies & Snacks", "Galletas y Snacks"),
      ]),
      CAT("bebidas", "Bebidas / Mercearia Líquida", "Beverages", "Bebidas", [
        SUB("refrigerante", "Refrigerante", "Soda", "Refresco", [CAMPO_PERECIVEL, CAMPO_VOLUME]), SUB("cerveja", "Cerveja", "Beer", "Cerveza", [CAMPO_PERECIVEL, CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("agua", "Água", "Water", "Agua", [CAMPO_PERECIVEL, CAMPO_VOLUME]), SUB("suco", "Suco", "Juice", "Jugo", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
        SUB("energetico_isotonico", "Energético/Isotônico", "Energy/Sports Drink", "Energética/Isotónica", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
        SUB("cha_pronto_gelado", "Chá Pronto/Gelado", "Ready-to-drink/Iced Tea", "Té Listo/Helado", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
        SUB("vinho_mesa_mercado", "Vinho de Mesa", "Table Wine", "Vino de Mesa", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("agua_coco_mercado", "Água de Coco", "Coconut Water", "Agua de Coco", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
        SUB("bebida_soja_vegetal", "Bebida à Base de Soja/Vegetal", "Soy/Plant-based Drink", "Bebida a Base de Soja/Vegetal", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
      ]),
      CAT("higiene", "Higiene", "Personal Care", "Higiene", [
        SUB("sabonete", "Sabonete", "Soap", "Jabón"), SUB("higiene_bucal", "Higiene Bucal", "Oral Care", "Higiene Bucal"),
        SUB("papel_higienico_absorvente", "Papel Higiênico/Absorvente", "Toilet Paper/Pads", "Papel Higiénico/Toallas"),
        SUB("desodorante_mercado", "Desodorante", "Deodorant", "Desodorante"), SUB("shampoo_condicionador_mercado", "Shampoo/Condicionador", "Shampoo/Conditioner", "Champú/Acondicionador"),
        SUB("cotonete_algodao_mercado", "Cotonete/Algodão", "Cotton Swabs/Cotton Balls", "Hisopos/Algodón"),
        SUB("barbeador_lamina_mercado", "Barbeador/Lâmina", "Razor/Blade", "Rastrillo/Cuchilla"), SUB("lenco_papel", "Lenço de Papel", "Facial Tissue", "Pañuelo de Papel"),
      ]),
      CAT("limpeza", "Limpeza", "Cleaning", "Limpieza", [
        SUB("detergente", "Detergente", "Detergent", "Detergente"), SUB("desinfetante_amaciante", "Desinfetante/Amaciante", "Disinfectant/Softener", "Desinfectante/Suavizante"),
        SUB("sabao_po_alvejante", "Sabão em Pó/Alvejante", "Powder Soap/Bleach", "Jabón en Polvo/Blanqueador"),
        SUB("agua_sanitaria", "Água Sanitária", "Bleach (Chlorine)", "Lavandina"), SUB("esponja_palha_aco", "Esponja/Palha de Aço", "Sponge/Steel Wool", "Esponja/Lana de Acero"),
        SUB("sacos_lixo", "Sacos de Lixo", "Trash Bags", "Bolsas de Basura"), SUB("multiuso_vidro", "Multiuso/Vidro", "All-purpose/Glass Cleaner", "Limpiador Multiuso/Vidrios"),
        SUB("limpador_piso", "Limpador de Piso", "Floor Cleaner", "Limpiapisos"),
      ]),
      CAT("infantil_bebe", "Infantil/Bebê", "Baby & Kids", "Infantil/Bebé", [
        SUB("fralda", "Fralda", "Diaper", "Pañal"), SUB("higiene_infantil", "Higiene Infantil", "Baby Care", "Higiene Infantil"),
        SUB("alimentacao_infantil", "Alimentação Infantil", "Baby Food", "Alimentación Infantil", [CAMPO_PERECIVEL]),
        SUB("lenco_umedecido_mercado", "Lenço Umedecido", "Wet Wipes", "Toallitas Húmedas"), SUB("formula_infantil_mercado", "Fórmula Infantil", "Baby Formula", "Fórmula Infantil", [CAMPO_PERECIVEL]),
        SUB("chupeta_mamadeira_mercado", "Chupeta/Mamadeira", "Pacifier/Bottle", "Chupete/Biberón"),
      ]),
      CAT("utensilios_domesticos", "Utensílios Domésticos", "Household Goods", "Utensilios Domésticos", [
        SUB("cozinha_utensilios", "Cozinha", "Kitchen", "Cocina"), SUB("organizacao", "Organização", "Organization", "Organización"),
        SUB("descartaveis_domesticos", "Descartáveis Domésticos", "Household Disposables", "Desechables del Hogar"),
        SUB("papel_aluminio_filme_pvc", "Papel Alumínio/Filme PVC", "Aluminum Foil/Plastic Wrap", "Papel Aluminio/Film"),
        SUB("embalagem_freezer", "Embalagem para Freezer", "Freezer Bags", "Bolsas para Freezer"), SUB("vela_fosforo", "Vela/Fósforo", "Candle/Matches", "Vela/Fósforos"),
      ]),
      CAT("bazar", "Bazar", "General Goods", "Bazar", [
        SUB("eletroportateis", "Eletroportáteis", "Small Appliances", "Electroportátiles"), SUB("iluminacao_decoracao", "Iluminação/Decoração", "Lighting/Decor", "Iluminación/Decoración"),
        SUB("presentes_papelaria_basica", "Presentes/Papelaria Básica", "Gifts/Basic Stationery", "Regalos/Papelería Básica"), SUB("pilhas_lampadas", "Pilhas e Lâmpadas", "Batteries & Light Bulbs", "Pilas y Bombillas"),
        SUB("brinquedo_simples", "Brinquedo Simples", "Simple Toy", "Juguete Simple"), SUB("artigo_festa", "Artigo de Festa", "Party Supplies", "Artículo de Fiesta"),
        SUB("costura_aviamento", "Costura/Aviamento", "Sewing Notions", "Costura/Mercería"), SUB("pet_racao_acessorio_basico", "Pet (Ração e Acessório Básico)", "Pet (Basic Food & Accessories)", "Mascota (Alimento y Accesorio Básico)"),
      ]),
    ],
  },
  {
    value: "farmacia", label: L("Farmácia", "Pharmacy", "Farmacia"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("medicamentos", "Medicamentos", "Medications", "Medicamentos", [
        SUB("mip_isento", "MIP (Isento de Receita)", "OTC (No Prescription)", "MIP (Sin Receta)", [CAMPO_PERECIVEL]),
        SUB("generico_tarja_amarela", "Genérico (Tarja Amarela)", "Generic (Yellow Stripe)", "Genérico (Franja Amarilla)", [CAMPO_PERECIVEL]),
        SUB("similar", "Similar", "Similar (Branded Generic)", "Similar", [CAMPO_PERECIVEL]),
        SUB("referencia_marca", "Referência/Marca", "Reference/Brand-name", "Referencia/Marca", [CAMPO_PERECIVEL]),
        SUB("tarja_vermelha", "Tarja Vermelha (Controle Simples)", "Red Stripe (Simple Control)", "Franja Roja (Control Simple)", [CAMPO_PERECIVEL, CAMPO_NECESSITA_RECEITA]),
        SUB("tarja_preta_controlado", "Tarja Preta/Controlado (SNGPC)", "Black Stripe/Controlled (SNGPC)", "Franja Negra/Controlado (SNGPC)", [CAMPO_PERECIVEL, CAMPO_NECESSITA_RECEITA]),
      ]),
      CAT("saude_bucal", "Saúde Bucal", "Oral Health", "Salud Bucal", [
        SUB("creme_dental", "Creme Dental", "Toothpaste", "Crema Dental"), SUB("escova_dente", "Escova de Dente", "Toothbrush", "Cepillo de Dientes"),
        SUB("fio_dental", "Fio Dental", "Dental Floss", "Hilo Dental"), SUB("enxaguante_bucal", "Enxaguante Bucal", "Mouthwash", "Enjuague Bucal"),
        SUB("fixador_dentadura", "Fixador de Dentadura", "Denture Adhesive", "Fijador de Dentadura"), SUB("clareamento_dental", "Clareamento Dental", "Teeth Whitening", "Blanqueamiento Dental"),
      ]),
      CAT("dermocosmetico", "Dermocosmético", "Dermocosmetics", "Dermocosmética", [
        SUB("protetor_solar", "Protetor Solar", "Sunscreen", "Protector Solar", [CAMPO_PERECIVEL]),
        SUB("hidratante_facial_corporal", "Hidratante Facial/Corporal", "Facial/Body Moisturizer", "Hidratante Facial/Corporal", [CAMPO_PERECIVEL]),
        SUB("antirrugas_antiidade", "Antirrugas/Anti-idade", "Anti-wrinkle/Anti-aging", "Antiarrugas/Antiedad", [CAMPO_PERECIVEL]),
        SUB("agua_micelar", "Água Micelar", "Micellar Water", "Agua Micelar", [CAMPO_PERECIVEL]),
        SUB("sabonete_facial", "Sabonete Facial", "Facial Cleanser", "Jabón Facial", [CAMPO_PERECIVEL]),
        SUB("tratamento_acne_manchas", "Tratamento para Acne/Manchas", "Acne/Blemish Treatment", "Tratamiento para Acné/Manchas", [CAMPO_PERECIVEL]),
      ]),
      CAT("cabelo_farmacia", "Cabelo", "Hair Care", "Cabello", [
        SUB("shampoo_condicionador_farmacia", "Shampoo/Condicionador", "Shampoo/Conditioner", "Champú/Acondicionador"),
        SUB("mascara_hidratacao_farmacia", "Máscara de Hidratação", "Hydrating Hair Mask", "Mascarilla Hidratante"),
        SUB("creme_pentear_farmacia", "Creme de Pentear", "Leave-in/Combing Cream", "Crema para Peinar"),
        SUB("oleo_reparador", "Óleo Reparador", "Repair Hair Oil", "Aceite Reparador"),
        SUB("coloracao_tintura", "Coloração/Tintura", "Hair Color/Dye", "Coloración/Tinte"),
        SUB("tratamento_antiqueda", "Tratamento Antiqueda", "Anti-hair-loss Treatment", "Tratamiento Anticaída"),
      ]),
      CAT("higiene_pessoal_farmacia", "Higiene Pessoal", "Personal Hygiene", "Higiene Personal", [
        SUB("sabonete_farmacia", "Sabonete", "Soap", "Jabón"), SUB("desodorante_farmacia", "Desodorante", "Deodorant", "Desodorante"),
        SUB("papel_higienico_farmacia", "Papel Higiênico", "Toilet Paper", "Papel Higiénico"), SUB("cotonete_algodao", "Cotonete/Algodão", "Cotton Swabs/Cotton Balls", "Hisopos/Algodón"),
        SUB("barbeador_lamina", "Barbeador/Lâmina", "Razor/Blade", "Rastrillo/Cuchilla"), SUB("sabonete_intimo", "Sabonete Íntimo", "Intimate Wash", "Jabón Íntimo"),
      ]),
      CAT("perfumaria_farmacia", "Perfumaria", "Fragrance", "Perfumería", [
        SUB("perfume_farmacia", "Perfume", "Perfume", "Perfume"), SUB("colonia_farmacia", "Colônia", "Cologne", "Colonia"),
        SUB("body_splash", "Body Splash", "Body Splash", "Body Splash"), SUB("kit_presente_farmacia", "Kit Presente", "Gift Set", "Kit de Regalo"),
      ]),
      CAT("vitaminas_suplementos", "Vitaminas, Suplementos e Nutrição", "Vitamins, Supplements & Nutrition", "Vitaminas, Suplementos y Nutrición", [
        SUB("vitamina_mineral", "Vitamina/Mineral Isolado", "Isolated Vitamin/Mineral", "Vitamina/Mineral Aislado", [CAMPO_PERECIVEL]),
        SUB("polivitaminico", "Polivitamínico", "Multivitamin", "Polivitamínico", [CAMPO_PERECIVEL]),
        SUB("suplemento_esportivo", "Suplemento Esportivo/Whey", "Sports Supplement/Whey", "Suplemento Deportivo/Whey", [CAMPO_PERECIVEL]),
        SUB("omega_3", "Ômega 3", "Omega 3", "Omega 3", [CAMPO_PERECIVEL]), SUB("colageno", "Colágeno", "Collagen", "Colágeno", [CAMPO_PERECIVEL]),
        SUB("probiotico", "Probiótico", "Probiotic", "Probiótico", [CAMPO_PERECIVEL]),
        SUB("barra_proteina_cereal", "Barra de Proteína/Cereal", "Protein/Cereal Bar", "Barra de Proteína/Cereal", [CAMPO_PERECIVEL]),
        SUB("adocante_diet", "Adoçante/Produto Diet", "Sweetener/Diet Product", "Edulcorante/Producto Diet", [CAMPO_PERECIVEL]),
      ]),
      CAT("materno_infantil_farmacia", "Materno-Infantil", "Mother & Baby", "Materno-Infantil", [
        SUB("fralda_infantil", "Fralda Infantil", "Baby Diaper", "Pañal Infantil"), SUB("lenco_umedecido", "Lenço Umedecido", "Wet Wipes", "Toallitas Húmedas"),
        SUB("leite_formula_infantil", "Fórmula/Leite Infantil", "Baby Formula/Milk", "Fórmula/Leche Infantil", [CAMPO_PERECIVEL]),
        SUB("mamadeira_bico", "Mamadeira/Bico", "Baby Bottle/Nipple", "Biberón/Chupón"), SUB("higiene_bebe", "Higiene do Bebê", "Baby Care", "Higiene del Bebé"),
        SUB("chupeta_acessorios", "Chupeta/Acessórios", "Pacifier/Accessories", "Chupete/Accesorios"),
      ]),
      CAT("saude_feminina_intima", "Saúde Feminina e Íntima", "Women's & Intimate Health", "Salud Femenina e Íntima", [
        SUB("absorvente_externo", "Absorvente Externo", "External Pad", "Toalla Femenina Externa"), SUB("absorvente_interno", "Absorvente Interno", "Tampon", "Tampón"),
        SUB("protetor_diario", "Protetor Diário", "Panty Liner", "Protector Diario"), SUB("coletor_menstrual", "Coletor Menstrual", "Menstrual Cup", "Copa Menstrual"),
        SUB("teste_gravidez", "Teste de Gravidez", "Pregnancy Test", "Prueba de Embarazo"), SUB("preservativo", "Preservativo", "Condom", "Preservativo"),
        SUB("lubrificante_intimo", "Lubrificante Íntimo", "Intimate Lubricant", "Lubricante Íntimo"),
      ]),
      CAT("geriatria", "Geriatria", "Geriatric Care", "Geriatría", [
        SUB("fralda_geriatrica", "Fralda Geriátrica", "Adult Diaper", "Pañal Geriátrico"), SUB("fixador_dentadura_geriatria", "Fixador de Dentadura", "Denture Adhesive", "Fijador de Dentadura"),
        SUB("suplemento_geriatrico", "Suplemento Geriátrico", "Geriatric Supplement", "Suplemento Geriátrico", [CAMPO_PERECIVEL]),
        SUB("andador_apoio", "Andador/Apoio de Mobilidade", "Walker/Mobility Aid", "Andador/Apoyo de Movilidad"), SUB("cadeira_banho", "Cadeira de Banho", "Shower Chair", "Silla de Baño"),
      ]),
      CAT("ortopedia", "Ortopedia", "Orthopedics", "Ortopedia", [
        SUB("meias_compressao", "Meia de Compressão", "Compression Socks", "Medias de Compresión"), SUB("orteses_talas", "Órtese/Tala", "Orthosis/Splint", "Órtesis/Férula"),
        SUB("muleta_bengala", "Muleta/Bengala", "Crutch/Cane", "Muleta/Bastón"), SUB("colar_cervical", "Colar Cervical", "Cervical Collar", "Collar Cervical"),
        SUB("joelheira_tornozeleira", "Joelheira/Tornozeleira", "Knee/Ankle Brace", "Rodillera/Tobillera"),
      ]),
      CAT("primeiros_socorros_mips", "Primeiros Socorros e MIPs", "First Aid & OTC", "Primeros Auxilios y MIPs", [
        SUB("curativo_bandagem", "Curativo/Bandagem", "Bandage/Wound Dressing", "Curita/Vendaje"), SUB("gaze_esparadrapo", "Gaze/Esparadrapo", "Gauze/Adhesive Tape", "Gasa/Esparadrapo"),
        SUB("antisseptico_alcool", "Antisséptico/Álcool", "Antiseptic/Alcohol", "Antiséptico/Alcohol"), SUB("analgesico_antitermico", "Analgésico/Antitérmico", "Pain Reliever/Fever Reducer", "Analgésico/Antitérmico"),
        SUB("antiacido_digestivo", "Antiácido/Digestivo", "Antacid/Digestive", "Antiácido/Digestivo"), SUB("repelente", "Repelente", "Insect Repellent", "Repelente"),
        SUB("termometro_medidor_pressao", "Termômetro/Medidor de Pressão", "Thermometer/Blood Pressure Monitor", "Termómetro/Tensiómetro"),
      ]),
      CAT("conveniencia_farmacia", "Conveniência de Farmácia", "Pharmacy Convenience", "Conveniencia de Farmacia", [
        SUB("pilha_farmacia", "Pilha", "Batteries", "Pilas"), SUB("isqueiro_acessorios", "Isqueiro/Acessórios", "Lighter/Accessories", "Encendedor/Accesorios"),
        SUB("chocolate_doce", "Chocolate/Doce", "Chocolate/Candy", "Chocolate/Dulce", [CAMPO_PERECIVEL]), SUB("bebida_nao_alcoolica_farmacia", "Bebida Não Alcoólica", "Non-alcoholic Beverage", "Bebida Sin Alcohol", [CAMPO_PERECIVEL]),
        SUB("snack_biscoito", "Snack/Biscoito", "Snack/Cookie", "Snack/Galleta", [CAMPO_PERECIVEL]), SUB("lembrancinha_embalagem", "Lembrancinha/Embalagem de Presente", "Small Gift/Gift Wrap", "Detalle/Envoltorio de Regalo"),
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
      CAT("paes", "Pães", "Bread", "Panes", [
        SUB("pao_frances_tradicional", "Pão Francês/Tradicional", "French/Traditional Bread", "Pan Francés/Tradicional", [CAMPO_PERECIVEL]),
        SUB("pao_forma_sovado", "Pão de Forma/Sovado", "Sliced/Soft White Bread", "Pan de Molde/Sobado", [CAMPO_PERECIVEL]),
        SUB("pao_integral_multigraos", "Pão Integral/Multigrãos", "Whole Wheat/Multigrain Bread", "Pan Integral/Multigrano", [CAMPO_PERECIVEL]),
        SUB("pao_fermentacao_natural", "Pão de Fermentação Natural", "Sourdough Bread", "Pan de Masa Madre", [CAMPO_PERECIVEL]),
        SUB("pao_especial", "Pão Especial (Ciabatta/Australiano/Centeio/Focaccia/Sírio)", "Specialty Bread (Ciabatta/Rye/Focaccia/Pita)", "Pan Especial (Chapata/Centeno/Focaccia/Sirio)", [CAMPO_PERECIVEL]),
        SUB("pao_de_queijo", "Pão de Queijo", "Cheese Bread", "Pan de Queso", [CAMPO_PERECIVEL]),
        SUB("pao_doce", "Pão Doce (Brioche/Rosca/Sonho)", "Sweet Bread (Brioche/Sweet Roll/Filled Doughnut)", "Pan Dulce (Brioche/Rosca/Berlinesa)", [CAMPO_PERECIVEL]),
        SUB("pao_lanche", "Pão para Lanche (Hambúrguer/Cachorro-quente)", "Sandwich Bread (Burger/Hot Dog)", "Pan para Sándwich (Hamburguesa/Hot Dog)", [CAMPO_PERECIVEL]),
        SUB("pao_sazonal_festivo", "Pão Sazonal/Festivo (Panetone/Colomba)", "Seasonal/Holiday Bread (Panettone/Colomba)", "Pan de Temporada (Panetón/Colomba)", [CAMPO_PERECIVEL]),
        SUB("torrada_pao_fatiado", "Torrada/Pão Fatiado Torrado", "Toast/Sliced Toasted Bread", "Tostada/Pan Tostado en Rebanadas"),
      ]),
      CAT("salgados_assados", "Salgados Assados", "Baked Savory Pastries", "Salados Horneados", [
        SUB("esfiha", "Esfiha", "Esfiha", "Esfiha", [CAMPO_PERECIVEL]), SUB("empada", "Empada", "Empanada Pie (Empada)", "Empanada al Horno (Empada)", [CAMPO_PERECIVEL]),
        SUB("quiche", "Quiche", "Quiche", "Quiche", [CAMPO_PERECIVEL]), SUB("calzone", "Calzone", "Calzone", "Calzone", [CAMPO_PERECIVEL]),
        SUB("croissant_salgado", "Croissant Salgado", "Savory Croissant", "Croissant Salado", [CAMPO_PERECIVEL]), SUB("pao_batata", "Pão de Batata", "Potato Bread Roll", "Pan de Papa", [CAMPO_PERECIVEL]),
        SUB("bauru", "Bauru", "Bauru Sandwich", "Bauru", [CAMPO_PERECIVEL]), SUB("enroladinho_salsicha", "Enroladinho de Salsicha", "Sausage Roll", "Enrollado de Salchicha", [CAMPO_PERECIVEL]),
      ]),
      CAT("salgados_fritos", "Salgados Fritos", "Fried Savory Pastries", "Salados Fritos", [
        SUB("coxinha", "Coxinha", "Coxinha (Chicken Croquette)", "Coxinha", [CAMPO_PERECIVEL]), SUB("pastel", "Pastel", "Pastel (Fried Pastry)", "Pastel Frito", [CAMPO_PERECIVEL]),
        SUB("risole", "Risole", "Risole", "Risol", [CAMPO_PERECIVEL]), SUB("croquete", "Croquete", "Croquette", "Croqueta", [CAMPO_PERECIVEL]),
        SUB("bolinha_queijo", "Bolinha de Queijo", "Cheese Ball", "Bolita de Queso", [CAMPO_PERECIVEL]), SUB("kibe", "Kibe", "Kibbeh", "Kibe", [CAMPO_PERECIVEL]),
      ]),
      CAT("lanches_naturais", "Lanches Naturais", "Natural Sandwiches", "Sándwiches Naturales", [
        SUB("sanduiche_natural", "Sanduíche Natural", "Natural Sandwich", "Sándwich Natural", [CAMPO_PERECIVEL]), SUB("wrap", "Wrap", "Wrap", "Wrap", [CAMPO_PERECIVEL]),
        SUB("salada_individual", "Salada Individual", "Individual Salad", "Ensalada Individual", [CAMPO_PERECIVEL]), SUB("suco_detox_funcional", "Suco Detox/Funcional", "Detox/Functional Juice", "Jugo Detox/Funcional", [CAMPO_PERECIVEL]),
      ]),
      CAT("confeitaria_fina", "Confeitaria Fina", "Fine Pastry", "Pastelería Fina", [
        SUB("macaron", "Macaron", "Macaron", "Macaron", [CAMPO_PERECIVEL]), SUB("trufa", "Trufa", "Truffle", "Trufa", [CAMPO_PERECIVEL]),
        SUB("brigadeiro_gourmet", "Brigadeiro Gourmet", "Gourmet Brigadeiro", "Brigadeiro Gourmet", [CAMPO_PERECIVEL]), SUB("bombom_artesanal", "Bombom Artesanal", "Artisanal Bonbon", "Bombón Artesanal", [CAMPO_PERECIVEL]),
        SUB("petit_four", "Petit Four", "Petit Four", "Petit Four", [CAMPO_PERECIVEL]), SUB("financier_mini_doce", "Financier/Mini Doce Francês", "Financier/Mini French Pastry", "Financier/Mini Dulce Francés", [CAMPO_PERECIVEL]),
      ]),
      CAT("bolos_tortas", "Bolos e Tortas", "Cakes & Pies", "Tortas y Pasteles", [
        SUB("bolo_caseiro_fatia", "Bolo Caseiro (Fatia)", "Homemade Cake (Slice)", "Torta Casera (Porción)", [CAMPO_PERECIVEL]),
        SUB("bolo_personalizado", "Bolo Personalizado/Decorado", "Custom/Decorated Cake", "Torta Personalizada/Decorada", [CAMPO_PERECIVEL]),
        SUB("torta_doce", "Torta Doce", "Sweet Pie", "Tarta Dulce", [CAMPO_PERECIVEL]), SUB("torta_salgada", "Torta Salgada", "Savory Pie", "Tarta Salada", [CAMPO_PERECIVEL]),
        SUB("cheesecake", "Cheesecake", "Cheesecake", "Cheesecake", [CAMPO_PERECIVEL]), SUB("bolo_especial", "Bolo Especial (Red Velvet etc.)", "Specialty Cake (Red Velvet etc.)", "Torta Especial (Red Velvet, etc.)", [CAMPO_PERECIVEL]),
      ]),
      CAT("doces_sobremesas", "Doces e Sobremesas", "Sweets & Desserts", "Dulces y Postres", [
        SUB("pudim", "Pudim", "Pudding (Flan)", "Pudín (Flan)", [CAMPO_PERECIVEL]), SUB("mousse", "Mousse", "Mousse", "Mousse", [CAMPO_PERECIVEL]),
        SUB("brigadeiro_tradicional", "Brigadeiro Tradicional", "Traditional Brigadeiro", "Brigadeiro Tradicional", [CAMPO_PERECIVEL]), SUB("cocada", "Cocada", "Cocada (Coconut Candy)", "Cocada", [CAMPO_PERECIVEL]),
        SUB("doce_em_calda", "Doce em Calda", "Fruit in Syrup", "Dulce en Almíbar", [CAMPO_PERECIVEL]), SUB("sobremesa_copo", "Sobremesa em Copo", "Cup Dessert", "Postre en Vaso", [CAMPO_PERECIVEL]),
      ]),
      CAT("cafeteria", "Café/Cafeteria", "Coffee/Café", "Café/Cafetería", [
        SUB("espresso", "Espresso", "Espresso", "Espresso"), SUB("cafe_com_leite", "Café com Leite", "Coffee with Milk", "Café con Leche"),
        SUB("cappuccino", "Cappuccino", "Cappuccino", "Capuchino"), SUB("chocolate_quente", "Chocolate Quente", "Hot Chocolate", "Chocolate Caliente"),
        SUB("suco_natural_cafeteria", "Suco Natural", "Fresh Juice", "Jugo Natural"), SUB("cha", "Chá", "Tea", "Té"),
      ]),
      CAT("frios_laticinios_padaria", "Frios e Laticínios", "Deli & Dairy", "Fiambres y Lácteos", [
        SUB("queijo_fatiado", "Queijo Fatiado", "Sliced Cheese", "Queso en Fetas", [CAMPO_PERECIVEL]), SUB("presunto_embutido_padaria", "Presunto/Embutido", "Ham/Cold Cuts", "Jamón/Fiambre", [CAMPO_PERECIVEL]),
        SUB("manteiga_margarina", "Manteiga/Margarina", "Butter/Margarine", "Mantequilla/Margarina", [CAMPO_PERECIVEL]), SUB("iogurte_padaria", "Iogurte", "Yogurt", "Yogur", [CAMPO_PERECIVEL]),
        SUB("requeijao", "Requeijão", "Cream Cheese Spread (Requeijão)", "Requesón (Requeijão)", [CAMPO_PERECIVEL]), SUB("leite_padaria", "Leite", "Milk", "Leche", [CAMPO_PERECIVEL]),
      ]),
      CAT("congelados_padaria", "Congelados", "Frozen", "Congelados", [
        SUB("prato_pronto_congelado_padaria", "Prato Pronto Congelado", "Frozen Ready Meal", "Comida Congelada Lista", [CAMPO_PERECIVEL]),
        SUB("massa_pizza_pastel_congelada", "Massa de Pizza/Pastel Congelada", "Frozen Pizza/Pastel Dough", "Masa de Pizza/Pastel Congelada", [CAMPO_PERECIVEL]),
        SUB("sorvete_acai_padaria", "Sorvete/Açaí", "Ice Cream/Açaí", "Helado/Açaí", [CAMPO_PERECIVEL]),
        SUB("polpa_fruta_congelada_padaria", "Polpa de Fruta Congelada", "Frozen Fruit Pulp", "Pulpa de Fruta Congelada", [CAMPO_PERECIVEL]),
        SUB("pao_queijo_congelado", "Pão de Queijo Congelado (Pacote)", "Frozen Cheese Bread (Bag)", "Pan de Queso Congelado (Bolsa)", [CAMPO_PERECIVEL]),
      ]),
    ],
  },
  {
    value: "acougue", label: L("Açougue", "Butcher Shop", "Carnicería"), modo: "produto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("cortes_bovinos_primeira", "Cortes Bovinos de Primeira", "Premium Beef Cuts", "Cortes de Res de Primera", [
        SUB("picanha", "Picanha", "Picanha (Rump Cap)", "Picanha", [CAMPO_PERECIVEL]), SUB("alcatra", "Alcatra", "Top Sirloin", "Colita de Cuadril", [CAMPO_PERECIVEL]),
        SUB("contrafile", "Contrafilé", "Ribeye/Striploin", "Bife Angosto/Ancho", [CAMPO_PERECIVEL]), SUB("file_mignon", "Filé Mignon", "Filet Mignon", "Lomo", [CAMPO_PERECIVEL]),
        SUB("maminha", "Maminha", "Tri-tip", "Tapa de Cuadril", [CAMPO_PERECIVEL]), SUB("fraldinha", "Fraldinha", "Flank Steak", "Vacío", [CAMPO_PERECIVEL]),
        SUB("coxao_mole_duro", "Coxão Mole/Duro", "Top/Bottom Round", "Peceto/Nalga", [CAMPO_PERECIVEL]),
      ]),
      CAT("cortes_bovinos_segunda_terceira", "Cortes Bovinos de Segunda e Terceira", "Standard Beef Cuts", "Cortes de Res de Segunda y Tercera", [
        SUB("acem", "Acém", "Chuck", "Paleta", [CAMPO_PERECIVEL]), SUB("peito_bovino", "Peito", "Brisket", "Pecho", [CAMPO_PERECIVEL]),
        SUB("costela_bovina", "Costela", "Short Rib", "Costilla", [CAMPO_PERECIVEL]), SUB("musculo", "Músculo", "Shank", "Osobuco/Garrón", [CAMPO_PERECIVEL]),
        SUB("pescoco", "Pescoço", "Neck", "Cogote", [CAMPO_PERECIVEL]),
      ]),
      CAT("carnes_suinas", "Carne Suína", "Pork", "Cerdo", [
        SUB("pernil", "Pernil", "Ham (Fresh)", "Pernil", [CAMPO_PERECIVEL]), SUB("lombo_suino", "Lombo", "Pork Loin", "Lomo de Cerdo", [CAMPO_PERECIVEL]),
        SUB("costela_suina", "Costela Suína", "Pork Ribs", "Costilla de Cerdo", [CAMPO_PERECIVEL]), SUB("bisteca", "Bisteca", "Pork Chop", "Bife de Cerdo", [CAMPO_PERECIVEL]),
        SUB("barriga_bacon_fresco", "Barriga/Bacon Fresco", "Pork Belly/Fresh Bacon", "Panceta", [CAMPO_PERECIVEL]), SUB("pe_rabo_suino", "Pé/Rabo", "Feet/Tail", "Pata/Rabo", [CAMPO_PERECIVEL]),
      ]),
      CAT("aves_acougue", "Aves", "Poultry", "Aves", [
        SUB("frango_inteiro", "Frango Inteiro", "Whole Chicken", "Pollo Entero", [CAMPO_PERECIVEL]), SUB("peito_frango", "Peito de Frango", "Chicken Breast", "Pechuga de Pollo", [CAMPO_PERECIVEL]),
        SUB("coxa_sobrecoxa", "Coxa/Sobrecoxa", "Thigh/Drumstick", "Muslo/Contramuslo", [CAMPO_PERECIVEL]), SUB("asa_frango", "Asa de Frango", "Chicken Wing", "Ala de Pollo", [CAMPO_PERECIVEL]),
        SUB("outras_aves", "Outras Aves", "Other Poultry", "Otras Aves", [CAMPO_PERECIVEL]),
      ]),
      CAT("embutidos_frescos_acougue", "Embutidos e Frescos", "Fresh Sausages & Ground Meat", "Embutidos y Frescos", [
        SUB("linguica_toscana", "Linguiça Toscana", "Tuscan Sausage", "Longaniza Toscana", [CAMPO_PERECIVEL]), SUB("linguica_calabresa", "Linguiça Calabresa", "Calabrese Sausage", "Longaniza Calabresa", [CAMPO_PERECIVEL]),
        SUB("linguica_artesanal", "Linguiça Artesanal", "Artisanal Sausage", "Longaniza Artesanal", [CAMPO_PERECIVEL]), SUB("salsicha_acougue", "Salsicha", "Hot Dog Sausage", "Salchicha", [CAMPO_PERECIVEL]),
        SUB("hamburguer_artesanal", "Hambúrguer Artesanal", "Artisanal Burger", "Hamburguesa Artesanal", [CAMPO_PERECIVEL]), SUB("kafta_almondega", "Kafta/Almôndega", "Kafta/Meatball", "Kafta/Albóndiga", [CAMPO_PERECIVEL]),
      ]),
      CAT("defumados", "Defumados", "Smoked Meats", "Ahumados", [
        SUB("bacon_manta", "Bacon em Manta", "Sliced Bacon", "Tocino en Lonjas", [CAMPO_PERECIVEL]), SUB("costela_defumada", "Costela Defumada", "Smoked Ribs", "Costilla Ahumada", [CAMPO_PERECIVEL]),
        SUB("linguica_defumada", "Linguiça Defumada", "Smoked Sausage", "Longaniza Ahumada", [CAMPO_PERECIVEL]), SUB("paio", "Paio", "Paio Sausage", "Paio", [CAMPO_PERECIVEL]),
        SUB("copa_defumada", "Copa Defumada", "Smoked Pork Shoulder", "Bondiola Ahumada", [CAMPO_PERECIVEL]),
      ]),
      CAT("carnes_especiais_premium", "Carnes Especiais e Premium", "Premium & Specialty Meats", "Carnes Especiales y Premium", [
        SUB("alta_marmorizacao", "Carne com Alta Marmorização", "Highly Marbled Beef (Wagyu/Angus)", "Carne de Alto Marmoleo", [CAMPO_PERECIVEL]),
        SUB("cortes_maturados", "Cortes Maturados", "Aged Cuts", "Cortes Madurados", [CAMPO_PERECIVEL]), SUB("cordeiro", "Cordeiro", "Lamb", "Cordero", [CAMPO_PERECIVEL]),
        SUB("frutos_do_mar_acougue", "Frutos do Mar", "Seafood", "Mariscos", [CAMPO_PERECIVEL]), SUB("carne_organica_certificada", "Carne Orgânica/Certificada", "Organic/Certified Beef", "Carne Orgánica/Certificada", [CAMPO_PERECIVEL]),
      ]),
      CAT("temperados_prontos_churrasco", "Temperados e Prontos para Churrasco", "Marinated & Barbecue-ready", "Condimentados y Listos para Parrilla", [
        SUB("carne_temperada", "Carne Temperada", "Marinated Meat", "Carne Condimentada", [CAMPO_PERECIVEL]), SUB("espetinho_pronto", "Espetinho Pronto", "Ready Skewers", "Brochette Lista", [CAMPO_PERECIVEL]),
        SUB("kit_churrasco", "Kit Churrasco", "Barbecue Kit", "Kit Parrillada", [CAMPO_PERECIVEL]), SUB("frango_temperado", "Frango Temperado", "Marinated Chicken", "Pollo Condimentado", [CAMPO_PERECIVEL]),
        SUB("costela_ripa_janela", "Costela Ripa/Janela", "Ribbon-cut/Flanken Ribs", "Costilla en Tira/Flanken", [CAMPO_PERECIVEL]),
      ]),
      CAT("acompanhamentos_churrasco", "Acompanhamentos de Churrasco", "Barbecue Sides", "Acompañamientos de Parrillada", [
        SUB("carvao", "Carvão", "Charcoal", "Carbón"), SUB("sal_grosso", "Sal Grosso", "Coarse Salt", "Sal Gruesa"),
        SUB("espeto", "Espeto (Madeira/Metal)", "Skewer (Wood/Metal)", "Pincho (Madera/Metal)"), SUB("farofa_pronta", "Farofa Pronta", "Ready Farofa", "Farofa Lista", [CAMPO_PERECIVEL]),
        SUB("pao_alho_acougue", "Pão de Alho", "Garlic Bread", "Pan de Ajo", [CAMPO_PERECIVEL]), SUB("vinagrete_pronto", "Vinagrete Pronto", "Ready Vinaigrette", "Vinagreta Lista", [CAMPO_PERECIVEL]),
        SUB("queijo_coalho_provolone", "Queijo Coalho/Provolone", "Coalho/Provolone Cheese", "Queso Coalho/Provolone", [CAMPO_PERECIVEL]),
      ]),
    ],
  },
  {
    value: "hortifruti_sacolao", label: L("Hortifruti/Sacolão", "Produce Market", "Verdulería"), modo: "produto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("frutas_nacionais", "Frutas Nacionais", "Domestic Fruit", "Frutas Nacionales", [
        SUB("citricas", "Cítricas", "Citrus Fruits", "Cítricos", [CAMPO_PERECIVEL]), SUB("tropicais", "Tropicais", "Tropical Fruits", "Frutas Tropicales", [CAMPO_PERECIVEL]),
        SUB("frutas_caroco", "Frutas de Caroço", "Stone Fruits", "Frutas de Hueso", [CAMPO_PERECIVEL]), SUB("melancia_melao", "Melancia/Melão", "Watermelon/Melon", "Sandía/Melón", [CAMPO_PERECIVEL]),
        SUB("uva_nacional", "Uva Nacional", "Domestic Grapes", "Uva Nacional", [CAMPO_PERECIVEL]), SUB("frutas_vermelhas_silvestres", "Frutas Vermelhas/Silvestres", "Berries", "Frutos Rojos/Silvestres", [CAMPO_PERECIVEL]),
        SUB("coco", "Coco", "Coconut", "Coco", [CAMPO_PERECIVEL]),
      ]),
      CAT("frutas_importadas", "Frutas Importadas", "Imported Fruit", "Frutas Importadas", [
        SUB("maca_importada", "Maçã Importada", "Imported Apple", "Manzana Importada", [CAMPO_PERECIVEL]), SUB("pera_importada", "Pera Importada", "Imported Pear", "Pera Importada", [CAMPO_PERECIVEL]),
        SUB("uva_importada", "Uva Importada", "Imported Grapes", "Uva Importada", [CAMPO_PERECIVEL]), SUB("kiwi", "Kiwi", "Kiwi", "Kiwi", [CAMPO_PERECIVEL]),
        SUB("frutas_exoticas_importadas", "Frutas Exóticas Importadas", "Imported Exotic Fruits", "Frutas Exóticas Importadas", [CAMPO_PERECIVEL]),
      ]),
      CAT("verduras_folhosas", "Verduras/Folhosas", "Leafy Greens", "Verduras de Hoja", [
        SUB("alface", "Alface", "Lettuce", "Lechuga", [CAMPO_PERECIVEL]), SUB("rucula", "Rúcula", "Arugula", "Rúcula", [CAMPO_PERECIVEL]),
        SUB("agriao", "Agrião", "Watercress", "Berro", [CAMPO_PERECIVEL]), SUB("couve", "Couve", "Collard Greens", "Col Rizada", [CAMPO_PERECIVEL]),
        SUB("espinafre", "Espinafre", "Spinach", "Espinaca", [CAMPO_PERECIVEL]), SUB("acelga", "Acelga", "Swiss Chard", "Acelga", [CAMPO_PERECIVEL]),
        SUB("almeirao_catalonha", "Almeirão/Catalonha", "Chicory/Escarole", "Achicoria/Escarola", [CAMPO_PERECIVEL]), SUB("repolho", "Repolho", "Cabbage", "Repollo", [CAMPO_PERECIVEL]),
      ]),
      CAT("legumes_hf", "Legumes", "Vegetables", "Legumbres", [
        SUB("tomate", "Tomate", "Tomato", "Tomate", [CAMPO_PERECIVEL]), SUB("pepino", "Pepino", "Cucumber", "Pepino", [CAMPO_PERECIVEL]),
        SUB("abobrinha", "Abobrinha", "Zucchini", "Calabacín", [CAMPO_PERECIVEL]), SUB("berinjela", "Berinjela", "Eggplant", "Berenjena", [CAMPO_PERECIVEL]),
        SUB("pimentao", "Pimentão", "Bell Pepper", "Pimiento", [CAMPO_PERECIVEL]), SUB("chuchu", "Chuchu", "Chayote", "Chayote", [CAMPO_PERECIVEL]),
        SUB("quiabo", "Quiabo", "Okra", "Quimbombó", [CAMPO_PERECIVEL]), SUB("vagem", "Vagem", "Green Beans", "Ejote", [CAMPO_PERECIVEL]),
      ]),
      CAT("raizes_tuberculos", "Raízes e Tubérculos", "Roots & Tubers", "Raíces y Tubérculos", [
        SUB("batata_inglesa", "Batata Inglesa", "White Potato", "Papa", [CAMPO_PERECIVEL]), SUB("batata_doce", "Batata Doce", "Sweet Potato", "Batata/Camote", [CAMPO_PERECIVEL]),
        SUB("mandioca_aipim", "Mandioca/Aipim", "Cassava", "Yuca/Mandioca", [CAMPO_PERECIVEL]), SUB("inhame", "Inhame", "Yam", "Ñame", [CAMPO_PERECIVEL]),
        SUB("cenoura", "Cenoura", "Carrot", "Zanahoria", [CAMPO_PERECIVEL]), SUB("beterraba", "Beterraba", "Beet", "Remolacha", [CAMPO_PERECIVEL]),
        SUB("gengibre", "Gengibre", "Ginger", "Jengibre", [CAMPO_PERECIVEL]),
      ]),
      CAT("bulbos", "Bulbos", "Bulbs", "Bulbos", [
        SUB("cebola_nacional", "Cebola Nacional", "Domestic Onion", "Cebolla Nacional", [CAMPO_PERECIVEL]), SUB("cebola_roxa", "Cebola Roxa", "Red Onion", "Cebolla Morada", [CAMPO_PERECIVEL]),
        SUB("alho_nacional", "Alho Nacional", "Domestic Garlic", "Ajo Nacional", [CAMPO_PERECIVEL]), SUB("alho_importado", "Alho Importado", "Imported Garlic", "Ajo Importado", [CAMPO_PERECIVEL]),
        SUB("alho_poro", "Alho-poró", "Leek", "Puerro", [CAMPO_PERECIVEL]),
      ]),
      CAT("temperos_frescos_hf", "Temperos Frescos", "Fresh Herbs", "Condimentos Frescos", [
        SUB("manjericao", "Manjericão", "Basil", "Albahaca", [CAMPO_PERECIVEL]), SUB("hortela", "Hortelã", "Mint", "Menta", [CAMPO_PERECIVEL]),
        SUB("salsa_cebolinha", "Salsa/Cebolinha", "Parsley/Chives", "Perejil/Cebollín", [CAMPO_PERECIVEL]), SUB("coentro", "Coentro", "Cilantro", "Cilantro", [CAMPO_PERECIVEL]),
        SUB("alecrim_tomilho_salvia", "Alecrim/Tomilho/Sálvia", "Rosemary/Thyme/Sage", "Romero/Tomillo/Salvia", [CAMPO_PERECIVEL]), SUB("pimenta_fresca", "Pimenta Fresca", "Fresh Chili Pepper", "Ají/Chile Fresco", [CAMPO_PERECIVEL]),
        SUB("louro", "Louro", "Bay Leaf", "Laurel", [CAMPO_PERECIVEL]),
      ]),
      CAT("ovos_hf", "Ovos", "Eggs", "Huevos", [
        SUB("ovo_branco", "Ovo Branco", "White Egg", "Huevo Blanco", [CAMPO_PERECIVEL]), SUB("ovo_caipira_colonial", "Ovo Caipira/Colonial", "Free-range Egg", "Huevo de Campo", [CAMPO_PERECIVEL]),
        SUB("ovo_codorna", "Ovo de Codorna", "Quail Egg", "Huevo de Codorniz", [CAMPO_PERECIVEL]),
      ]),
      CAT("graos_granel", "Grãos e Granel", "Grains & Bulk Foods", "Granos a Granel", [
        SUB("castanhas", "Castanhas", "Nuts (Brazil/Cashew)", "Castañas (Pará/Marañón)"), SUB("nozes_macadamia", "Nozes/Macadâmia", "Walnuts/Macadamia", "Nueces/Macadamia"),
        SUB("graos_a_granel", "Grãos a Granel", "Bulk Grains", "Granos a Granel"), SUB("farinhas_a_granel", "Farinhas a Granel", "Bulk Flours", "Harinas a Granel"),
        SUB("frutas_secas", "Frutas Secas", "Dried Fruit", "Frutas Secas"), SUB("mix_castanhas", "Mix de Castanhas", "Nut Mix", "Mix de Frutos Secos"),
      ]),
      CAT("polpas_congelados_fruta", "Polpas e Congelados de Fruta", "Fruit Pulp & Frozen Fruit", "Pulpas y Congelados de Fruta", [
        SUB("polpa_fruta_congelada_hf", "Polpa de Fruta Congelada", "Frozen Fruit Pulp", "Pulpa de Fruta Congelada", [CAMPO_PERECIVEL]),
        SUB("fruta_congelada", "Fruta Congelada", "Frozen Fruit", "Fruta Congelada", [CAMPO_PERECIVEL]),
        SUB("suco_natural_engarrafado", "Suco Natural Engarrafado", "Bottled Fresh Juice", "Jugo Natural Embotellado", [CAMPO_PERECIVEL]),
      ]),
      CAT("minimamente_processados", "Minimamente Processados", "Minimally Processed", "Mínimamente Procesados", [
        SUB("salada_pronta_higienizada", "Salada Pronta Higienizada", "Ready-to-eat Washed Salad", "Ensalada Lista Higienizada", [CAMPO_PERECIVEL]),
        SUB("legume_cortado_descascado", "Legume Cortado/Descascado", "Cut/Peeled Vegetables", "Verdura Cortada/Pelada", [CAMPO_PERECIVEL]),
        SUB("fruta_picada_embalada", "Fruta Picada Embalada", "Packaged Cut Fruit", "Fruta Picada Envasada", [CAMPO_PERECIVEL]),
        SUB("suco_detox_prensado_frio", "Suco Detox Prensado a Frio", "Cold-pressed Detox Juice", "Jugo Detox Prensado en Frío", [CAMPO_PERECIVEL]),
      ]),
      CAT("cogumelos_especiais", "Cogumelos e Especiais", "Mushrooms & Specialty Items", "Hongos y Especiales", [
        SUB("cogumelo", "Cogumelo (Paris/Shitake/Shimeji)", "Mushroom (Button/Shiitake/Shimeji)", "Hongo (Champiñón/Shitake/Shimeji)", [CAMPO_PERECIVEL]),
        SUB("palmito_fresco", "Palmito Fresco", "Fresh Heart of Palm", "Palmito Fresco", [CAMPO_PERECIVEL]),
        SUB("broto", "Broto (Feijão/Alfafa)", "Sprouts (Bean/Alfalfa)", "Brotes (Frijol/Alfalfa)", [CAMPO_PERECIVEL]),
      ]),
      CAT("flores_plantas", "Flores e Plantas", "Flowers & Plants", "Flores y Plantas", [
        SUB("flor_corte", "Flor de Corte", "Cut Flowers", "Flor de Corte", [CAMPO_PERECIVEL]), SUB("vaso_muda", "Vaso/Muda", "Potted Plant/Seedling", "Maceta/Plantín"),
        SUB("terra_adubo", "Terra/Adubo", "Soil/Fertilizer", "Tierra/Abono"),
      ]),
    ],
  },
  {
    value: "roupas", label: L("Roupas", "Apparel", "Ropa"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("camisetas", "Camisetas e Blusas", "T-Shirts & Tops", "Camisetas y Blusas", [
        SUB("camiseta_masculina", "Camiseta Masculina", "Men's T-Shirt", "Camiseta Masculina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("camiseta_feminina", "Camiseta Feminina", "Women's T-Shirt", "Camiseta Femenina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("blusa_regata_feminina", "Blusa/Regata Feminina", "Women's Blouse/Tank Top", "Blusa/Musculosa Femenina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("camisa_social", "Camisa Social", "Dress Shirt", "Camisa Formal", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("polo", "Polo", "Polo Shirt", "Polo", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("camiseta_infantil_roupas", "Camiseta Infantil", "Kids' T-Shirt", "Camiseta Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
      ]),
      CAT("calcas", "Calças e Shorts", "Pants & Shorts", "Pantalones y Shorts", [
        SUB("jeans", "Calça Jeans", "Jeans", "Jean", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("calca_social_alfaiataria", "Calça Social/Alfaiataria", "Dress/Tailored Pants", "Pantalón Formal/Sastre", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("legging_moletom", "Legging/Moletom", "Leggings/Sweatpants", "Legging/Jogger", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("short_bermuda", "Short/Bermuda", "Shorts/Bermuda", "Short/Bermuda", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("calca_infantil", "Calça Infantil", "Kids' Pants", "Pantalón Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("saia", "Saia", "Skirt", "Falda", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
      ]),
      CAT("vestidos", "Vestidos", "Dresses", "Vestidos", [
        SUB("vestido_casual", "Vestido Casual", "Casual Dress", "Vestido Casual", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("vestido_festa", "Vestido Festa", "Party Dress", "Vestido de Fiesta", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("vestido_praia", "Vestido Praia", "Beach Dress", "Vestido de Playa", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("vestido_infantil", "Vestido Infantil", "Kids' Dress", "Vestido Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
      ]),
      CAT("moletom_frio", "Moletom e Frio", "Sweatshirts & Outerwear", "Buzos y Abrigo", [
        SUB("moletom_blusa_frio", "Moletom/Blusa de Frio", "Sweatshirt/Hoodie", "Buzo/Sudadera", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("jaqueta", "Jaqueta", "Jacket", "Chaqueta", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("casaco", "Casaco", "Coat", "Abrigo", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("cachecol_gorro_luva", "Cachecol/Gorro/Luva", "Scarf/Beanie/Gloves", "Bufanda/Gorro/Guantes", [CAMPO_COR]),
        SUB("colete", "Colete", "Vest", "Chaleco", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
      ]),
      CAT("moda_intima", "Moda Íntima", "Intimates", "Ropa Íntima", [
        SUB("sutia", "Sutiã", "Bra", "Sujetador", [CAMPO_TAMANHO_ROUPA]),
        SUB("calcinha", "Calcinha", "Panties", "Bombacha/Calzón", [CAMPO_TAMANHO_ROUPA]),
        SUB("cueca", "Cueca", "Men's Underwear (Briefs)", "Calzoncillo", [CAMPO_TAMANHO_ROUPA]),
        SUB("body", "Body", "Bodysuit", "Body", [CAMPO_TAMANHO_ROUPA]),
        SUB("pijama_camisola", "Pijama/Camisola", "Pajamas/Nightgown", "Pijama/Camisón", [CAMPO_TAMANHO_ROUPA]),
        SUB("meia_calca", "Meia-calça", "Tights", "Panty Medias", [CAMPO_TAMANHO_ROUPA]),
        SUB("cinta_modeladora", "Cinta Modeladora", "Shapewear", "Faja Moldeadora", [CAMPO_TAMANHO_ROUPA]),
        SUB("meia_masculina_feminina", "Meia Masculina/Feminina", "Men's/Women's Socks", "Media Masculina/Femenina"),
      ]),
      CAT("moda_praia", "Moda Praia", "Swimwear", "Moda de Playa", [
        SUB("biquini", "Biquíni", "Bikini", "Bikini", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("maio", "Maiô", "One-piece Swimsuit", "Traje de Baño Entero", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("sunga", "Sunga", "Swim Trunks", "Sunga/Bañador", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("saida_praia_canga", "Saída de Praia/Canga", "Beach Cover-up/Sarong", "Pareo/Salida de Playa", [CAMPO_COR]),
        SUB("bone_chapeu_praia", "Boné/Chapéu de Praia", "Beach Cap/Hat", "Gorra/Sombrero de Playa", [CAMPO_COR]),
      ]),
      CAT("moda_esportiva", "Moda Esportiva", "Activewear", "Moda Deportiva", [
        SUB("top_esportivo", "Top Esportivo", "Sports Bra", "Top Deportivo", [CAMPO_TAMANHO_ROUPA]),
        SUB("legging_esportiva", "Legging Esportiva", "Athletic Leggings", "Legging Deportiva", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("camiseta_dry_fit", "Camiseta Dry-fit", "Dry-fit Shirt", "Remera Dry-fit", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("short_esportivo", "Short Esportivo", "Athletic Shorts", "Short Deportivo", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("conjunto_fitness", "Conjunto Fitness", "Fitness Set", "Conjunto Fitness", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("meia_esportiva_roupas", "Meia Esportiva", "Athletic Socks", "Media Deportiva"),
      ]),
      CAT("roupa_infantil", "Roupa Infantil", "Kidswear", "Ropa Infantil", [
        SUB("body_macacao_bebe", "Body/Macacão Bebê", "Baby Bodysuit/Onesie", "Body/Mameluco Bebé", [CAMPO_TAMANHO_ROUPA]),
        SUB("conjunto_infantil", "Conjunto Infantil", "Kids' Outfit Set", "Conjunto Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("uniforme_escolar", "Uniforme Escolar", "School Uniform", "Uniforme Escolar", [CAMPO_TAMANHO_ROUPA]),
        SUB("pijama_infantil", "Pijama Infantil", "Kids' Pajamas", "Pijama Infantil", [CAMPO_TAMANHO_ROUPA]),
        SUB("fantasia", "Fantasia", "Costume", "Disfraz", [CAMPO_TAMANHO_ROUPA]),
        SUB("roupa_banho_infantil", "Roupa de Banho Infantil", "Kids' Swimwear", "Traje de Baño Infantil", [CAMPO_TAMANHO_ROUPA]),
      ]),
      CAT("calcados_roupas", "Calçados", "Footwear", "Calzado", [
        SUB("tenis_roupas", "Tênis", "Sneakers", "Zapatillas", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("sapato_social_roupas", "Sapato Social", "Dress Shoes", "Zapato Formal", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("sandalia_chinelo_roupas", "Sandália/Chinelo", "Sandals/Flip-flops", "Sandalia/Chancla", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("bota_roupas", "Bota", "Boots", "Bota", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("calcado_infantil_roupas", "Calçado Infantil", "Kids' Shoes", "Calzado Infantil", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("sapatilha_rasteirinha", "Sapatilha/Rasteirinha", "Flats/Ballet Flats", "Balerina/Chata", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("bolsas_malas", "Bolsas e Malas", "Bags & Luggage", "Bolsos y Maletas", [
        SUB("bolsa_feminina", "Bolsa Feminina", "Women's Handbag", "Bolso Femenino", [CAMPO_COR]),
        SUB("mochila_roupas", "Mochila", "Backpack", "Mochila", [CAMPO_COR]),
        SUB("carteira_necessaire", "Carteira/Necessaire", "Wallet/Toiletry Bag", "Billetera/Neceser", [CAMPO_COR]),
        SUB("mala_viagem", "Mala de Viagem", "Suitcase", "Maleta de Viaje", [CAMPO_COR]),
        SUB("pasta_bolsa_executiva", "Pasta/Bolsa Executiva", "Briefcase/Work Bag", "Portafolio/Bolso Ejecutivo", [CAMPO_COR]),
      ]),
      CAT("acessorios_vestuario", "Acessórios", "Accessories", "Accesorios", [
        SUB("cinto_roupas", "Cinto", "Belt", "Cinturón", [CAMPO_COR]),
        SUB("bone_chapeu_roupas", "Boné/Chapéu", "Cap/Hat", "Gorra/Sombrero", [CAMPO_COR]),
        SUB("oculos_sol", "Óculos de Sol", "Sunglasses", "Gafas de Sol"),
        SUB("relogio", "Relógio", "Watch", "Reloj"),
        SUB("bijuteria_joia_folheada", "Bijuteria/Joia Folheada", "Costume Jewelry", "Bijutería"),
        SUB("lenco_echarpe", "Lenço/Echarpe", "Scarf/Wrap", "Pañuelo/Echarpe", [CAMPO_COR]),
        SUB("luva_moda", "Luva de Moda", "Fashion Gloves", "Guante de Moda", [CAMPO_COR]),
      ]),
    ],
  },
  {
    value: "calcados_tenis", label: L("Calçados/Tênis", "Footwear", "Calzado"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("tenis", "Tênis", "Sneakers", "Zapatillas", [
        SUB("esportivo_corrida", "Esportivo/Corrida", "Running/Athletic", "Deportivo/Running", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("casual_streetwear", "Casual/Streetwear", "Casual/Streetwear", "Casual/Urbano", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("skate", "Skate", "Skate", "Skate", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("basquete_cano_alto", "Basquete/Cano Alto", "High-top Basketball", "Baloncesto Caña Alta", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("slip_on", "Slip-on", "Slip-on", "Slip-on", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("chuteira_futsal", "Chuteira/Futsal", "Soccer/Futsal Cleats", "Botín de Fútbol/Futsal", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("sapatos_sociais", "Sapatos Sociais", "Dress Shoes", "Zapatos Formales", [
        SUB("sapato_social_masculino", "Sapato Social Masculino", "Men's Dress Shoes", "Zapato Formal Masculino", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("sapato_social_feminino", "Sapato Social Feminino", "Women's Dress Shoes", "Zapato Formal Femenino", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("mocassim", "Mocassim", "Loafer", "Mocasín", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("oxford_derby", "Oxford/Derby", "Oxford/Derby", "Oxford/Derby", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("sandalias_chinelos", "Sandálias e Chinelos", "Sandals & Flip-flops", "Sandalias y Chancletas", [
        SUB("sandalia_feminina", "Sandália Feminina", "Women's Sandals", "Sandalia Femenina", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("sandalia_masculina", "Sandália Masculina", "Men's Sandals", "Sandalia Masculina", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("chinelo_dedo", "Chinelo de Dedo", "Flip-flops", "Chancla de Dedo", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("papete_slide", "Papete/Slide", "Slides", "Sandalia Slide", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("botas", "Botas", "Boots", "Botas", [
        SUB("coturno", "Coturno", "Combat Boots", "Borceguí", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("bota_chuva_galocha", "Bota de Chuva/Galocha", "Rain Boots", "Bota de Lluvia", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("bota_country", "Bota Country", "Western Boots", "Bota Country", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("bota_feminina_salto", "Bota Feminina Salto", "Women's Heeled Boots", "Bota Femenina con Taco", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("calcados_infantis", "Calçados Infantis", "Kids' Shoes", "Calzado Infantil", [
        SUB("tenis_infantil", "Tênis Infantil", "Kids' Sneakers", "Zapatilla Infantil", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("sandalia_infantil", "Sandália Infantil", "Kids' Sandals", "Sandalia Infantil", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("bota_infantil", "Bota Infantil", "Kids' Boots", "Bota Infantil", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("chinelo_infantil", "Chinelo Infantil", "Kids' Flip-flops", "Chancla Infantil", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("calcado_escolar_primeiros_passos", "Calçado Escolar/Primeiros Passos", "School/First Walker Shoes", "Calzado Escolar/Primeros Pasos", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("meias_palmilhas", "Meias e Palmilhas", "Socks & Insoles", "Medias y Plantillas", [
        SUB("meia_social", "Meia Social", "Dress Socks", "Media Formal"), SUB("meia_esportiva", "Meia Esportiva", "Athletic Socks", "Media Deportiva"),
        SUB("palmilha", "Palmilha", "Insole", "Plantilla"), SUB("cadarco", "Cadarço", "Shoelaces", "Cordón"),
      ]),
      CAT("cuidado_acessorios_calcado", "Cuidado e Acessórios de Calçado", "Shoe Care & Accessories", "Cuidado y Accesorios de Calzado", [
        SUB("graxa_tinta_couro", "Graxa/Tinta para Couro", "Shoe Polish/Leather Dye", "Betún/Tinte para Cuero"),
        SUB("escova_kit_limpeza_calcado", "Escova/Kit de Limpeza", "Cleaning Brush/Kit", "Cepillo/Kit de Limpieza"),
        SUB("espuma_expansora_calcado", "Espuma Expansora de Calçado", "Shoe Stretcher/Expander", "Ensanchador de Calzado"),
        SUB("organizador_sapateira", "Organizador/Sapateira", "Shoe Organizer/Rack", "Organizador/Zapatero"),
      ]),
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
      CAT("vinhos_tintos", "Vinhos Tintos", "Red Wines", "Vinos Tintos", [
        SUB("tinto_nacional", "Tinto Nacional", "Domestic Red", "Tinto Nacional", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("tinto_argentino", "Tinto Argentino", "Argentine Red", "Tinto Argentino", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("tinto_chileno", "Tinto Chileno", "Chilean Red", "Tinto Chileno", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("tinto_portugues", "Tinto Português", "Portuguese Red", "Tinto Portugués", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("tinto_italiano_frances", "Tinto Italiano/Francês", "Italian/French Red", "Tinto Italiano/Francés", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("tinto_suave_frisante", "Tinto Suave/Frisante", "Sweet/Frizzante Red", "Tinto Suave/Frizzante", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
      ]),
      CAT("vinhos_brancos_rose", "Vinhos Brancos e Rosé", "White & Rosé Wines", "Vinos Blancos y Rosados", [
        SUB("branco_nacional", "Branco Nacional", "Domestic White", "Blanco Nacional", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("branco_importado", "Branco Importado", "Imported White", "Blanco Importado", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("rose", "Rosé", "Rosé", "Rosado", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("vinho_suave_branco", "Vinho Suave Branco", "Sweet White Wine", "Vino Blanco Suave", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
      ]),
      CAT("espumantes_champagne", "Espumantes e Champagne", "Sparkling Wines & Champagne", "Espumantes y Champán", [
        SUB("espumante_nacional", "Espumante Nacional", "Domestic Sparkling Wine", "Espumante Nacional", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("prosecco", "Prosecco", "Prosecco", "Prosecco", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("champagne", "Champagne", "Champagne", "Champán", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("espumante_rose", "Espumante Rosé", "Rosé Sparkling Wine", "Espumante Rosado", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
      ]),
      CAT("whisky", "Whisky", "Whisky", "Whisky", [
        SUB("whisky_escoces", "Whisky Escocês", "Scotch Whisky", "Whisky Escocés", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("whisky_nacional", "Whisky Nacional", "Domestic Whisky", "Whisky Nacional", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("bourbon", "Bourbon", "Bourbon", "Bourbon", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("single_malt", "Single Malt", "Single Malt", "Single Malt", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("whisky_blended", "Whisky Blended", "Blended Whisky", "Whisky Blended", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
      ]),
      CAT("vodka_gin_tequila", "Vodka, Gin e Tequila", "Vodka, Gin & Tequila", "Vodka, Gin y Tequila", [
        SUB("vodka_nacional", "Vodka Nacional", "Domestic Vodka", "Vodka Nacional", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("vodka_importada", "Vodka Importada", "Imported Vodka", "Vodka Importada", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("gin_nacional", "Gin Nacional", "Domestic Gin", "Gin Nacional", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("gin_premium_importado", "Gin Premium Importado", "Premium Imported Gin", "Gin Premium Importado", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("tequila", "Tequila", "Tequila", "Tequila", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
      ]),
      CAT("cachaca_rum", "Cachaça e Rum", "Cachaça & Rum", "Cachaza y Ron", [
        SUB("cachaca_prata", "Cachaça Prata", "Silver Cachaça", "Cachaza Plata", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("cachaca_envelhecida_ouro", "Cachaça Envelhecida/Ouro", "Aged/Gold Cachaça", "Cachaza Añejada/Oro", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("cachaca_artesanal", "Cachaça Artesanal", "Artisanal Cachaça", "Cachaza Artesanal", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("rum_branco", "Rum Branco", "White Rum", "Ron Blanco", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("rum_envelhecido", "Rum Envelhecido", "Aged Rum", "Ron Añejado", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
      ]),
      CAT("licores_aperitivos", "Licores e Aperitivos", "Liqueurs & Aperitifs", "Licores y Aperitivos", [
        SUB("licor_frutas", "Licor de Frutas", "Fruit Liqueur", "Licor de Frutas", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("licor_cafe_chocolate_canela", "Licor de Café/Chocolate/Canela", "Coffee/Chocolate/Cinnamon Liqueur", "Licor de Café/Chocolate/Canela", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("aperitivo_amargo_bitter", "Aperitivo Amargo (Bitter)", "Bitters/Aperitif", "Aperitivo Amargo (Bitter)", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("vermute", "Vermute", "Vermouth", "Vermú", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("conhaque_brandy", "Conhaque/Brandy", "Cognac/Brandy", "Coñac/Brandy", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
      ]),
      CAT("cerveja_adega", "Cerveja", "Beer", "Cerveza", [
        SUB("artesanal_nacional", "Artesanal Nacional", "Domestic Craft", "Artesanal Nacional", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("comercial", "Comercial (Pilsen/Lager)", "Mainstream (Pilsen/Lager)", "Comercial (Pilsen/Lager)", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("importada", "Importada", "Imported", "Importada", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("puro_malte", "Puro Malte", "All-malt", "Puro Malta", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("trigo_weiss", "De Trigo/Weiss", "Wheat/Weiss", "De Trigo/Weiss", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("sem_alcool_cerveja", "Sem Álcool", "Non-alcoholic", "Sin Alcohol", [CAMPO_VOLUME]),
        SUB("growler_chopp", "Growler/Chopp", "Growler/Draft", "Growler/Chopp", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
      ]),
      CAT("nao_alcoolicas_premium", "Não Alcoólicos e Energéticos", "Non-alcoholic & Energy Drinks", "No Alcohólicas y Energéticas", [
        SUB("agua_com_sem_gas", "Água com/sem Gás", "Sparkling/Still Water", "Agua con/sin Gas", [CAMPO_VOLUME]), SUB("agua_tonica", "Água Tônica", "Tonic Water", "Agua Tónica", [CAMPO_VOLUME]),
        SUB("suco_premium", "Suco Premium", "Premium Juice", "Jugo Premium", [CAMPO_PERECIVEL, CAMPO_VOLUME]), SUB("energetico_adega", "Energético", "Energy Drink", "Energética", [CAMPO_VOLUME]),
        SUB("refrigerante_premium_artesanal", "Refrigerante Premium/Artesanal", "Premium/Craft Soda", "Refresco Premium/Artesanal", [CAMPO_VOLUME]), SUB("espumante_sem_alcool", "Espumante Sem Álcool", "Non-Alcoholic Sparkling", "Espumante Sin Alcohol", [CAMPO_VOLUME]),
      ]),
      CAT("gelo_acessorios_bar", "Gelo e Acessórios de Bar", "Ice & Bar Accessories", "Hielo y Accesorios de Bar", [
        SUB("gelo_cubo_saco", "Gelo em Cubo/Saco", "Ice Cubes/Bag", "Hielo en Cubo/Bolsa"), SUB("taca_vinho", "Taça de Vinho", "Wine Glass", "Copa de Vino"),
        SUB("copo_cerveja_chopp", "Copo de Cerveja/Chopp", "Beer Glass/Mug", "Vaso de Cerveza/Chopp"), SUB("saca_rolha_abridor", "Saca-rolha/Abridor", "Corkscrew/Bottle Opener", "Sacacorchos/Abridor"),
        SUB("balde_gelo", "Balde de Gelo", "Ice Bucket", "Cubitera"), SUB("coqueteleira_dosador", "Coqueteleira/Dosador", "Cocktail Shaker/Jigger", "Coctelera/Medidor"),
      ]),
      CAT("insumos_drinks", "Insumos para Drinks", "Cocktail Ingredients", "Insumos para Tragos", [
        SUB("xarope_groselha", "Xarope/Groselha", "Syrup/Grenadine", "Jarabe/Granadina"), SUB("suco_concentrado_coquetel", "Suco Concentrado para Coquetel", "Concentrated Cocktail Juice", "Jugo Concentrado para Cóctel", [CAMPO_PERECIVEL]),
        SUB("agua_coco_drinks", "Água de Coco", "Coconut Water", "Agua de Coco", [CAMPO_PERECIVEL]), SUB("especiarias_guarnicao", "Especiarias/Guarnição", "Spices/Garnish", "Especias/Guarnición"),
      ]),
    ],
  },
  {
    value: "materiais_construcao", label: L("Materiais de Construção", "Building Materials", "Materiales de Construcción"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("cimento_argamassa", "Cimento, Argamassa e Estrutura", "Cement, Mortar & Structure", "Cemento, Mortero y Estructura", [
        SUB("cimento", "Cimento", "Cement", "Cemento"), SUB("argamassa_rejunte", "Argamassa/Rejunte", "Mortar/Grout", "Mortero/Junta"),
        SUB("cal_massa_pronta", "Cal/Massa Pronta", "Lime/Ready Mix", "Cal/Mezcla Lista"), SUB("areia", "Areia", "Sand", "Arena"),
        SUB("pedra_brita", "Pedra/Brita", "Gravel/Crushed Stone", "Piedra/Grava"), SUB("ferro_vergalhao", "Ferro/Vergalhão", "Rebar", "Varilla/Hierro"),
        SUB("bloco_tijolo", "Bloco/Tijolo", "Block/Brick", "Bloque/Ladrillo"),
      ]),
      CAT("hidraulica", "Hidráulica", "Plumbing", "Plomería", [
        SUB("tubos_conexoes_pvc", "Tubos e Conexões PVC", "PVC Pipes & Fittings", "Tubos y Conexiones PVC"),
        SUB("tubos_conexoes_cobre_metal", "Tubos e Conexões Cobre/Metal", "Copper/Metal Pipes & Fittings", "Tubos y Conexiones de Cobre/Metal"),
        SUB("registros_valvulas", "Registros e Válvulas", "Valves", "Llaves y Válvulas"), SUB("torneira_area_tanque", "Torneira de Área/Tanque", "Utility/Laundry Faucet", "Grifo de Patio/Lavadero"),
        SUB("caixa_agua", "Caixa d'Água", "Water Tank", "Tanque de Agua"), SUB("bomba_agua", "Bomba d'Água", "Water Pump", "Bomba de Agua"),
        SUB("aquecedor_agua", "Aquecedor de Água", "Water Heater", "Calentador de Agua"), SUB("conexoes_esgoto", "Conexões de Esgoto", "Sewage Fittings", "Conexiones de Desagüe"),
      ]),
      CAT("eletrica_construcao", "Elétrica", "Electrical", "Eléctrica", [
        SUB("fios_cabos", "Fios e Cabos", "Wires & Cables", "Cables"), SUB("disjuntores", "Disjuntores", "Circuit Breakers", "Disyuntores"),
        SUB("quadros_distribuicao", "Quadros de Distribuição", "Distribution Panels", "Tableros de Distribución"), SUB("tomadas_interruptores", "Tomadas e Interruptores", "Outlets & Switches", "Tomas e Interruptores"),
        SUB("eletroduto_conduite", "Eletroduto/Conduíte", "Conduit", "Conducto/Caño"), SUB("automacao_residencial", "Automação Residencial", "Home Automation", "Automatización del Hogar"),
        SUB("aterramento_para_raios", "Aterramento/Para-raios", "Grounding/Lightning Rod", "Puesta a Tierra/Pararrayos"), SUB("ventilador_exaustor", "Ventilador/Exaustor", "Fan/Exhaust Fan", "Ventilador/Extractor"),
        SUB("fita_isolante_abracadeira", "Fita Isolante/Abraçadeira", "Electrical Tape/Cable Tie", "Cinta Aislante/Precinto"),
      ]),
      CAT("iluminacao", "Iluminação", "Lighting", "Iluminación", [
        SUB("lampada_led", "Lâmpada LED", "LED Bulb", "Lámpara LED"), SUB("luminaria_plafon", "Luminária/Plafon", "Light Fixture/Ceiling Lamp", "Luminaria/Plafón"),
        SUB("spot_trilho", "Spot/Trilho", "Spotlight/Track Light", "Foco/Riel"), SUB("refletor_externo", "Refletor Externo", "Outdoor Floodlight", "Reflector Exterior"),
        SUB("fita_led", "Fita LED", "LED Strip", "Cinta LED"), SUB("arandela", "Arandela", "Wall Sconce", "Aplique de Pared"),
      ]),
      CAT("tintas", "Tintas e Acabamento de Parede", "Paints & Wall Finishing", "Pinturas y Acabado de Pared", [
        SUB("tinta_latex_acrilica", "Tinta Látex/Acrílica", "Latex/Acrylic Paint", "Pintura Látex/Acrílica"), SUB("esmalte_sintetico", "Esmalte Sintético", "Enamel Paint", "Esmalte Sintético"),
        SUB("verniz", "Verniz", "Varnish", "Barniz"), SUB("selador_fundo_preparador", "Selador/Fundo Preparador", "Sealer/Primer", "Sellador/Fondo Preparador"),
        SUB("massa_corrida", "Massa Corrida", "Wall Putty", "Masilla"), SUB("textura", "Textura", "Textured Coating", "Textura"),
        SUB("acessorios_pintura", "Acessórios de Pintura", "Painting Accessories", "Accesorios de Pintura"),
      ]),
      CAT("ferramentas_manuais", "Ferramentas Manuais", "Hand Tools", "Herramientas Manuales", [
        SUB("chave_fenda_phillips", "Chave de Fenda/Phillips", "Screwdriver", "Destornillador"), SUB("alicate", "Alicate", "Pliers", "Alicate"),
        SUB("martelo", "Martelo", "Hammer", "Martillo"), SUB("trena_nivel", "Trena/Nível", "Tape Measure/Level", "Cinta Métrica/Nivel"),
        SUB("serrote", "Serrote", "Handsaw", "Serrucho"), SUB("chave_combinada_allen", "Chave Combinada/Allen", "Combination/Allen Wrench", "Llave Combinada/Allen"),
      ]),
      CAT("ferramentas_eletricas", "Ferramentas Elétricas", "Power Tools", "Herramientas Eléctricas", [
        SUB("furadeira", "Furadeira", "Drill", "Taladro", [CAMPO_GARANTIA_MESES]), SUB("parafusadeira", "Parafusadeira", "Screwdriver Drill", "Atornilladora", [CAMPO_GARANTIA_MESES]),
        SUB("serra_circular_tico_tico", "Serra Circular/Tico-tico", "Circular/Jigsaw", "Sierra Circular/Caladora", [CAMPO_GARANTIA_MESES]), SUB("lixadeira", "Lixadeira", "Sander", "Lijadora", [CAMPO_GARANTIA_MESES]),
        SUB("esmerilhadeira", "Esmerilhadeira", "Angle Grinder", "Amoladora", [CAMPO_GARANTIA_MESES]), SUB("compressor_ar", "Compressor de Ar", "Air Compressor", "Compresor de Aire", [CAMPO_GARANTIA_MESES]),
      ]),
      CAT("pisos_revestimentos", "Pisos e Revestimentos", "Flooring & Wall Covering", "Pisos y Revestimientos", [
        SUB("piso_ceramico", "Piso Cerâmico", "Ceramic Tile", "Cerámica"), SUB("porcelanato", "Porcelanato", "Porcelain Tile", "Porcelanato"),
        SUB("revestimento_parede_azulejo", "Revestimento de Parede/Azulejo", "Wall Tile", "Revestimiento de Pared/Azulejo"), SUB("piso_laminado", "Piso Laminado", "Laminate Flooring", "Piso Laminado"),
        SUB("piso_vinilico", "Piso Vinílico", "Vinyl Flooring", "Piso Vinílico"), SUB("soleira_rodape", "Soleira/Rodapé", "Threshold/Baseboard", "Umbral/Zócalo"),
      ]),
      CAT("madeiras", "Madeiras e Marcenaria", "Wood & Woodworking", "Madera y Carpintería", [
        SUB("madeira_bruta_serrada", "Madeira Bruta/Serrada", "Raw/Sawn Wood", "Madera Bruta/Aserrada"), SUB("compensado_mdf", "Compensado/MDF", "Plywood/MDF", "Contrachapado/MDF"),
        SUB("reguas_molduras", "Réguas e Molduras", "Trim & Moulding", "Molduras"), SUB("cola_fixador_madeira", "Cola e Fixador para Madeira", "Wood Glue/Fastener", "Pegamento/Fijador para Madera"),
        SUB("ferragens_marcenaria", "Ferragens de Marcenaria", "Furniture Hardware", "Herrajes de Carpintería"),
      ]),
      CAT("esquadrias", "Esquadrias — Portas e Janelas", "Doors & Windows", "Puertas y Ventanas", [
        SUB("porta_madeira", "Porta de Madeira", "Wood Door", "Puerta de Madera"), SUB("porta_aluminio_pvc", "Porta de Alumínio/PVC", "Aluminum/PVC Door", "Puerta de Aluminio/PVC"),
        SUB("janela_aluminio", "Janela de Alumínio", "Aluminum Window", "Ventana de Aluminio"), SUB("portao_grade", "Portão/Grade", "Gate/Security Grille", "Portón/Reja"),
        SUB("vidro_temperado", "Vidro Temperado", "Tempered Glass", "Vidrio Templado"), SUB("tela_mosquiteira", "Tela Mosquiteira", "Window Screen", "Mosquitero"),
      ]),
      CAT("ferragens_fixacao", "Ferragens e Fixação", "Hardware & Fasteners", "Ferretería y Fijación", [
        SUB("parafusos_buchas", "Parafusos e Buchas", "Screws & Anchors", "Tornillos y Tacos"), SUB("pregos_arruelas", "Pregos e Arruelas", "Nails & Washers", "Clavos y Arandelas"),
        SUB("dobradicas", "Dobradiças", "Hinges", "Bisagras"), SUB("fechaduras_cadeados", "Fechaduras e Cadeados", "Locks & Padlocks", "Cerraduras y Candados"),
        SUB("puxadores_macanetas", "Puxadores e Maçanetas", "Handles & Doorknobs", "Tiradores y Manijas"), SUB("trilhos_corredicas", "Trilhos e Corrediças", "Tracks & Slides", "Rieles y Correderas"),
        SUB("corda_arame", "Corda/Arame", "Rope/Wire", "Soga/Alambre"),
      ]),
      CAT("cobertura_telhados", "Cobertura e Telhados", "Roofing", "Cubiertas y Techos", [
        SUB("telha_ceramica", "Telha Cerâmica", "Ceramic Roof Tile", "Teja Cerámica"), SUB("telha_concreto", "Telha de Concreto", "Concrete Roof Tile", "Teja de Concreto"),
        SUB("telha_metalica_pvc", "Telha Metálica/PVC", "Metal/PVC Roofing", "Techo Metálico/PVC"), SUB("calha_rufo", "Calha e Rufo", "Gutter & Flashing", "Canaleta y Bajante"),
        SUB("manta_termica_subcobertura", "Manta Térmica/Subcobertura", "Thermal Blanket/Underlayment", "Manta Térmica/Subcubierta"),
      ]),
      CAT("impermeabilizacao", "Impermeabilização e Vedação", "Waterproofing & Sealing", "Impermeabilización y Sellado", [
        SUB("manta_asfaltica", "Manta Asfáltica", "Asphalt Membrane", "Manta Asfáltica"), SUB("impermeabilizante_liquido", "Impermeabilizante Líquido", "Liquid Waterproofing", "Impermeabilizante Líquido"),
        SUB("silicone_vedante", "Silicone/Vedante", "Silicone Sealant", "Silicona/Sellador"), SUB("espuma_expansiva", "Espuma Expansiva", "Expanding Foam", "Espuma Expansiva"),
        SUB("fita_veda_calha", "Fita Veda-Calha", "Gutter Sealing Tape", "Cinta Selladora de Canaleta"),
      ]),
      CAT("gesso_drywall", "Gesso, Drywall e Forro", "Plaster, Drywall & Ceiling", "Yeso, Drywall y Cielorraso", [
        SUB("placa_gesso", "Placa de Gesso", "Plaster Board", "Placa de Yeso"), SUB("chapa_drywall", "Chapa Drywall", "Drywall Sheet", "Placa de Drywall"),
        SUB("perfil_metalico_drywall", "Perfil Metálico para Drywall", "Drywall Metal Frame", "Perfil Metálico para Drywall"), SUB("forro_pvc", "Forro de PVC", "PVC Ceiling", "Cielorraso de PVC"),
        SUB("sanca_roda_forro", "Sanca/Roda-forro", "Crown Molding", "Moldura de Cielorraso"),
      ]),
      CAT("banheiro_loucas_metais", "Banheiro — Louças e Metais", "Bathroom Fixtures", "Baño — Sanitarios y Grifería", [
        SUB("vaso_sanitario", "Vaso Sanitário", "Toilet", "Inodoro"), SUB("caixa_acoplada", "Caixa Acoplada", "Toilet Tank", "Tanque de Inodoro"),
        SUB("pia_cuba", "Pia/Cuba", "Sink/Basin", "Lavabo/Bacha"), SUB("torneira_misturador", "Torneira e Misturador", "Faucet & Mixer", "Grifo y Mezclador"),
        SUB("box_blindex", "Box/Blindex", "Shower Enclosure", "Mampara de Ducha"), SUB("ducha_higienica", "Ducha Higiênica", "Handheld Bidet Sprayer", "Ducha Higiénica"),
        SUB("assento_sanitario", "Assento Sanitário", "Toilet Seat", "Asiento de Inodoro"),
      ]),
      CAT("jardim", "Jardim e Paisagismo", "Garden & Landscaping", "Jardín y Paisajismo", [
        SUB("vaso_terra_adubo", "Vaso/Terra/Adubo", "Pot/Soil/Fertilizer", "Maceta/Tierra/Abono"), SUB("ferramenta_jardim", "Ferramenta de Jardim", "Garden Tools", "Herramienta de Jardín"),
        SUB("mangueira_irrigacao", "Mangueira/Irrigação", "Hose/Irrigation", "Manguera/Riego"), SUB("grama_muda", "Grama/Muda", "Grass/Seedling", "Césped/Plantín"),
        SUB("pedra_pastilha_decorativa", "Pedra/Pastilha Decorativa", "Decorative Stone/Pebble", "Piedra Decorativa"), SUB("cerca_tela_jardim", "Cerca/Tela de Jardim", "Garden Fence/Mesh", "Cerca/Malla de Jardín"),
      ]),
      CAT("epi", "EPI — Segurança do Trabalho", "PPE — Work Safety", "EPP — Seguridad Laboral", [
        SUB("luva_protecao", "Luva de Proteção", "Protective Gloves", "Guante de Protección"), SUB("oculos_protecao", "Óculos de Proteção", "Safety Goggles", "Gafas de Protección"),
        SUB("capacete", "Capacete", "Hard Hat", "Casco"), SUB("mascara_respiratoria", "Máscara Respiratória", "Respiratory Mask", "Máscara Respiratoria"),
        SUB("bota_seguranca", "Bota de Segurança", "Safety Boots", "Bota de Seguridad"), SUB("cinto_seguranca_talabarte", "Cinto de Segurança/Talabarte", "Safety Harness/Lanyard", "Arnés/Cinturón de Seguridad"),
      ]),
      CAT("limpeza_manutencao_pos_obra", "Limpeza e Manutenção Pós-obra", "Post-construction Cleaning & Maintenance", "Limpieza y Mantenimiento Posobra", [
        SUB("removedor_solvente", "Removedor/Solvente", "Remover/Solvent", "Removedor/Solvente"), SUB("limpa_pedra_acido_muriatico", "Limpa-pedra/Ácido Muriático", "Stone Cleaner/Muriatic Acid", "Limpiapisos/Ácido Muriático"),
        SUB("vassoura_rodo_balde", "Vassoura/Rodo/Balde", "Broom/Squeegee/Bucket", "Escoba/Secador/Balde"), SUB("lona_saco_entulho", "Lona/Saco de Entulho", "Tarp/Debris Bag", "Lona/Bolsa de Escombro"),
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
