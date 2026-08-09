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
      CAT("motor", "Motor", "Engine", "Motor", [
        SUB("filtro_oleo_ar_combustivel", "Filtro (Óleo/Ar/Combustível)", "Oil/Air/Fuel Filter", "Filtro de Aceite/Aire/Combustible"), SUB("correia_dentada_acessorios", "Correia Dentada/Acessórios", "Timing/Accessory Belt", "Correa de Distribución/Accesorios"),
        SUB("vela_ignicao", "Vela de Ignição", "Spark Plug", "Bujía"), SUB("bomba_agua_motor", "Bomba d'Água", "Water Pump", "Bomba de Agua"),
        SUB("junta_retentor", "Junta/Retentor", "Gasket/Seal", "Junta/Retén"), SUB("bomba_oleo", "Bomba de Óleo", "Oil Pump", "Bomba de Aceite"),
      ]),
      CAT("arrefecimento_escapamento", "Arrefecimento e Escapamento", "Cooling & Exhaust", "Refrigeración y Escape", [
        SUB("radiador", "Radiador", "Radiator", "Radiador"), SUB("mangueira", "Mangueira", "Hose", "Manguera"),
        SUB("ventoinha", "Ventoinha", "Cooling Fan", "Electroventilador"), SUB("silencioso_escapamento", "Silencioso/Escapamento", "Muffler/Exhaust Pipe", "Silenciador/Escape"),
        SUB("catalisador", "Catalisador", "Catalytic Converter", "Catalizador"),
      ]),
      CAT("freios", "Freios", "Brakes", "Frenos", [
        SUB("pastilha_freio", "Pastilha de Freio", "Brake Pad", "Pastilla de Freno"), SUB("disco_freio", "Disco de Freio", "Brake Disc", "Disco de Freno"),
        SUB("lona_tambor", "Lona/Tambor", "Brake Shoe/Drum", "Balata/Tambor"), SUB("fluido_freio", "Fluido de Freio", "Brake Fluid", "Líquido de Frenos"),
        SUB("cilindro_pinca", "Cilindro/Pinça", "Cylinder/Caliper", "Cilindro/Mordaza"), SUB("cabo_freio", "Cabo de Freio", "Brake Cable", "Cable de Freno"),
      ]),
      CAT("suspensao", "Suspensão e Direção", "Suspension & Steering", "Suspensión y Dirección", [
        SUB("amortecedor", "Amortecedor", "Shock Absorber", "Amortiguador"), SUB("mola_suspensao", "Mola", "Spring", "Resorte"),
        SUB("bandeja_braco", "Bandeja/Braço", "Control Arm", "Horquilla/Brazo"), SUB("bucha", "Bucha", "Bushing", "Buje"),
        SUB("pivo", "Pivô", "Ball Joint", "Rótula"), SUB("rolamento_roda", "Rolamento de Roda", "Wheel Bearing", "Rodamiento de Rueda"),
        SUB("caixa_direcao", "Caixa de Direção", "Steering Rack", "Caja de Dirección"),
      ]),
      CAT("eletrica", "Elétrica e Bateria", "Electrical & Battery", "Eléctrica y Batería", [
        SUB("bateria", "Bateria", "Battery", "Batería", [CAMPO_GARANTIA_MESES]), SUB("alternador", "Alternador", "Alternator", "Alternador"),
        SUB("motor_partida", "Motor de Partida", "Starter Motor", "Motor de Arranque"), SUB("lampada_farol", "Lâmpada/Farol", "Bulb/Headlight", "Bombilla/Faro"),
        SUB("sensor_automotivo", "Sensor", "Sensor", "Sensor"), SUB("chicote_fusivel", "Chicote/Fusível", "Wiring Harness/Fuse", "Mazo de Cables/Fusible"),
        SUB("modulo_vidro_trava", "Módulo de Vidro/Trava Elétrica", "Power Window/Lock Module", "Módulo de Vidrio/Cierre Eléctrico"),
      ]),
      CAT("transmissao_embreagem", "Transmissão e Embreagem", "Transmission & Clutch", "Transmisión y Embrague", [
        SUB("kit_embreagem", "Kit de Embreagem", "Clutch Kit", "Kit de Embrague"), SUB("cambio_caixa_marcha", "Câmbio/Caixa de Marcha", "Transmission/Gearbox", "Caja de Cambios"),
        SUB("junta_homocinetica", "Junta Homocinética", "CV Joint", "Junta Homocinética"), SUB("cruzeta", "Cruzeta", "Universal Joint", "Cruceta"),
        SUB("oleo_cambio", "Óleo de Câmbio", "Transmission Fluid", "Aceite de Caja"),
      ]),
      CAT("pneus_rodas", "Pneus e Rodas", "Tires & Wheels", "Neumáticos y Ruedas", [
        SUB("pneu", "Pneu", "Tire", "Neumático", [CAMPO_GARANTIA_MESES]), SUB("roda_liga_aco", "Roda de Liga/Aço", "Alloy/Steel Wheel", "Rueda de Aleación/Acero"),
        SUB("calota", "Calota", "Hubcap", "Tapacubos"), SUB("valvula_camara_ar", "Válvula/Câmara de Ar", "Valve/Inner Tube", "Válvula/Cámara de Aire"),
        SUB("estepe", "Estepe", "Spare Tire", "Rueda de Repuesto"),
      ]),
      CAT("fluidos_lubrificantes", "Fluidos e Lubrificantes", "Fluids & Lubricants", "Fluidos y Lubricantes", [
        SUB("oleo_motor", "Óleo de Motor", "Engine Oil", "Aceite de Motor"), SUB("aditivo_radiador", "Aditivo de Radiador", "Radiator Coolant", "Refrigerante de Radiador"),
        SUB("fluido_direcao_hidraulica", "Fluido de Direção Hidráulica", "Power Steering Fluid", "Líquido de Dirección Hidráulica"), SUB("aditivo_combustivel", "Aditivo de Combustível", "Fuel Additive", "Aditivo de Combustible"),
        SUB("graxa", "Graxa", "Grease", "Grasa"), SUB("desengraxante", "Desengraxante", "Degreaser", "Desengrasante"),
      ]),
      CAT("acessorios_automotivos", "Acessórios Automotivos", "Auto Accessories", "Accesorios Automotrices", [
        SUB("som_automotivo", "Som Automotivo/Multimídia", "Car Audio/Multimedia", "Audio para Auto/Multimedia", [CAMPO_GARANTIA_MESES]), SUB("tapete_capa_banco", "Tapete/Capa de Banco", "Mats/Seat Covers", "Alfombras/Fundas"),
        SUB("palheta_limpador", "Palheta de Limpador", "Wiper Blade", "Escobilla Limpiaparabrisas"), SUB("acessorio_externo", "Acessório Externo (Spoiler/Friso)", "Exterior Trim (Spoiler/Molding)", "Accesorio Exterior (Spoiler/Moldura)"),
        SUB("engate_rack_teto", "Engate/Rack de Teto", "Tow Hitch/Roof Rack", "Enganche/Baca"), SUB("alarme_rastreador", "Alarme/Rastreador", "Alarm/Tracker", "Alarma/Rastreador"),
        SUB("capa_protetor_veiculo", "Capa/Protetor de Veículo", "Car Cover", "Funda/Cubre Auto"),
      ]),
      CAT("ferramentas_automotivas", "Ferramentas Automotivas", "Automotive Tools", "Herramientas Automotrices", [
        SUB("macaco", "Macaco", "Jack", "Gato Hidráulico"), SUB("chave_roda", "Chave de Roda", "Lug Wrench", "Llave de Cruz"),
        SUB("kit_ferramenta_multiuso", "Kit Ferramenta Multiuso", "Multi-tool Kit", "Kit de Herramientas Multiuso"), SUB("cabo_carregador_bateria", "Cabo/Carregador de Bateria", "Jumper Cables/Battery Charger", "Cables/Cargador de Batería"),
        SUB("compressor_ar_portatil", "Compressor de Ar Portátil", "Portable Air Compressor", "Compresor de Aire Portátil"),
      ]),
    ],
  },
  {
    value: "papelaria", label: L("Papelaria", "Stationery", "Papelería"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("escrita", "Escrita", "Writing", "Escritura", [
        SUB("caneta", "Caneta", "Pen", "Bolígrafo"), SUB("lapis", "Lápis", "Pencil", "Lápiz"), SUB("marca_texto", "Marca-texto", "Highlighter", "Marcador"),
        SUB("lapiseira", "Lapiseira", "Mechanical Pencil", "Portaminas"), SUB("corretivo", "Corretivo", "Correction Fluid/Tape", "Corrector"), SUB("borracha_apontador", "Borracha/Apontador", "Eraser/Sharpener", "Goma/Sacapuntas"),
      ]),
      CAT("cadernos_papel", "Cadernos e Papel", "Notebooks & Paper", "Cuadernos y Papel", [
        SUB("caderno_universitario", "Caderno Universitário", "College Notebook", "Cuaderno Universitario"), SUB("caderno_brochura", "Caderno Brochura", "Composition Notebook", "Cuaderno de Grapas"),
        SUB("papel_sulfite", "Papel Sulfite", "Printer Paper", "Papel Bond"), SUB("bloco_notas_post_it", "Bloco de Notas/Post-it", "Notepad/Sticky Notes", "Bloc de Notas/Post-it"),
        SUB("papel_cartao_color_set", "Papel Cartão/Color Set", "Cardstock/Colored Paper", "Cartulina/Papel de Color"), SUB("agenda_planner", "Agenda/Planner", "Planner/Agenda", "Agenda/Planner"),
      ]),
      CAT("escritorio", "Escritório", "Office", "Oficina", [
        SUB("grampeador_clips", "Grampeador/Clips", "Stapler/Clips", "Engrapadora/Clips"), SUB("pasta_envelope", "Pasta/Envelope", "Folder/Envelope", "Carpeta/Sobre"),
        SUB("fita_adesiva", "Fita Adesiva", "Adhesive Tape", "Cinta Adhesiva"), SUB("furador", "Furador", "Hole Punch", "Perforadora"),
        SUB("calculadora", "Calculadora", "Calculator", "Calculadora"), SUB("carimbo", "Carimbo", "Rubber Stamp", "Sello"), SUB("organizador_mesa", "Organizador de Mesa", "Desk Organizer", "Organizador de Escritorio"),
      ]),
      CAT("arte_escolar", "Arte e Escolar", "Art & School", "Arte y Escolar", [
        SUB("tinta_guache", "Tinta/Guache", "Paint/Poster Paint", "Pintura/Témpera"), SUB("cola", "Cola", "Glue", "Pegamento"), SUB("tesoura", "Tesoura", "Scissors", "Tijera"),
        SUB("massinha_argila", "Massinha/Argila", "Modeling Clay", "Plastilina/Arcilla"), SUB("giz_cera_lapis_cor", "Giz de Cera/Lápis de Cor", "Crayons/Colored Pencils", "Crayones/Lápices de Color"),
        SUB("mochila_estojo", "Mochila/Estojo", "Backpack/Pencil Case", "Mochila/Estuche"), SUB("regua_esquadro", "Régua/Esquadro", "Ruler/Set Square", "Regla/Escuadra"),
      ]),
      CAT("informatica_basica", "Informática Básica", "Basic Computer Supplies", "Informática Básica", [
        SUB("cartucho_toner", "Cartucho/Toner", "Ink/Toner Cartridge", "Cartucho/Tóner"), SUB("midia", "Mídia (Pendrive/CD)", "Media (Flash Drive/CD)", "Medios (Pendrive/CD)"),
        SUB("mouse_teclado_basico", "Mouse/Teclado Básico", "Basic Mouse/Keyboard", "Mouse/Teclado Básico"), SUB("cabo_adaptador_papelaria", "Cabo/Adaptador", "Cable/Adapter", "Cable/Adaptador"),
        SUB("papel_fotografico", "Papel Fotográfico", "Photo Paper", "Papel Fotográfico"),
        SUB("servicos_impressao_copia", "Serviços de Impressão/Cópia", "Printing/Copying Services", "Servicios de Impresión/Copia", CAMPOS_SERVICO_PADRAO, true),
      ]),
      CAT("livraria", "Livraria", "Bookstore", "Librería", [
        SUB("livro_didatico", "Livro Didático", "Textbook", "Libro Didáctico"), SUB("livro_infantil", "Livro Infantil", "Children's Book", "Libro Infantil"),
        SUB("revista", "Revista", "Magazine", "Revista"), SUB("dicionario_atlas", "Dicionário/Atlas", "Dictionary/Atlas", "Diccionario/Atlas"), SUB("livro_colorir", "Livro de Colorir", "Coloring Book", "Libro para Colorear"),
      ]),
      CAT("organizacao_papelaria", "Organização", "Organization", "Organización", [
        SUB("pasta_suspensa", "Pasta Suspensa", "Hanging Folder", "Carpeta Colgante"), SUB("caixa_arquivo", "Caixa Arquivo", "File Box", "Caja Archivadora"),
        SUB("etiqueta_marcador_pagina", "Etiqueta/Marcador de Página", "Label/Bookmark", "Etiqueta/Separador"), SUB("porta_documento", "Porta-documento", "Document Holder", "Portadocumentos"),
      ]),
      CAT("presentes_papelaria_fina", "Presentes e Papelaria Fina", "Gifts & Fine Stationery", "Regalos y Papelería Fina", [
        SUB("cartao_comemorativo", "Cartão Comemorativo", "Greeting Card", "Tarjeta de Felicitación"), SUB("papel_presente", "Papel de Presente", "Gift Wrap", "Papel de Regalo"),
        SUB("vela_balao", "Vela/Balão", "Candle/Balloon", "Vela/Globo"), SUB("convite", "Convite", "Invitation", "Invitación"), SUB("album_fotos", "Álbum de Fotos", "Photo Album", "Álbum de Fotos"),
      ]),
      CAT("artesanato", "Artesanato", "Crafts", "Manualidades", [
        SUB("eva", "EVA", "Foam Sheet (EVA)", "Goma EVA"), SUB("bijuteria_micanga", "Bijuteria/Miçanga", "Beading/Costume Jewelry Supplies", "Bijutería/Mostacilla"),
        SUB("scrapbook", "Scrapbook", "Scrapbooking", "Scrapbook"), SUB("tinta_tecido", "Tinta para Tecido", "Fabric Paint", "Pintura para Tela"),
      ]),
    ],
  },
  {
    value: "pet", label: L("Pet", "Pet", "Mascotas"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("racao", "Ração e Alimentação", "Food", "Alimento para Mascotas", [
        SUB("racao_cao", "Ração Cão", "Dog Food", "Alimento para Perro", [CAMPO_PERECIVEL]), SUB("racao_gato", "Ração Gato", "Cat Food", "Alimento para Gato", [CAMPO_PERECIVEL]),
        SUB("racao_filhote", "Ração Filhote", "Puppy/Kitten Food", "Alimento para Cachorro", [CAMPO_PERECIVEL]), SUB("racao_prescrita_veterinaria", "Ração Prescrita/Veterinária", "Prescription/Veterinary Food", "Alimento Prescrito/Veterinario", [CAMPO_PERECIVEL]),
        SUB("petisco_snack_pet", "Petisco/Snack", "Treats/Snacks", "Snack/Premio", [CAMPO_PERECIVEL]), SUB("alimento_umido_sache", "Alimento Úmido (Sachê)", "Wet Food (Pouch)", "Alimento Húmedo (Sobre)", [CAMPO_PERECIVEL]),
        SUB("alimento_natural_cru", "Alimento Natural/Cru", "Natural/Raw Food", "Alimento Natural/Crudo", [CAMPO_PERECIVEL]),
      ]),
      CAT("higiene_pet", "Higiene Pet", "Pet Hygiene", "Higiene para Mascotas", [
        SUB("shampoo_condicionador_pet", "Shampoo/Condicionador Pet", "Pet Shampoo/Conditioner", "Champú/Acondicionador Mascota"), SUB("areia_sanitaria", "Areia Sanitária", "Litter", "Arena Sanitaria"),
        SUB("tapete_higienico", "Tapete Higiênico", "Pee Pad", "Tapete Higiénico"), SUB("perfume_colonia_pet", "Perfume/Colônia Pet", "Pet Perfume/Cologne", "Perfume/Colonia Mascota"),
        SUB("escova_cortador_unha_pet", "Escova/Cortador de Unha", "Brush/Nail Clipper", "Cepillo/Cortaúñas"), SUB("fralda_pet", "Fralda Pet", "Pet Diaper", "Pañal Mascota"),
        SUB("banho_tosa", "Banho e Tosa", "Bath & Grooming", "Baño y Peluquería", CAMPOS_SERVICO_PADRAO, true),
      ]),
      CAT("saude_pet", "Saúde Pet", "Pet Health", "Salud para Mascotas", [
        SUB("antipulgas_carrapaticida", "Antipulgas/Carrapaticida", "Flea/Tick Treatment", "Antipulgas/Garrapaticida", [CAMPO_PERECIVEL]), SUB("vermifugo", "Vermífugo", "Dewormer", "Desparasitante", [CAMPO_PERECIVEL]),
        SUB("suplemento_vitamina_pet", "Suplemento/Vitamina", "Supplement/Vitamin", "Suplemento/Vitamina", [CAMPO_PERECIVEL]), SUB("curativo_pomada_pet", "Curativo/Pomada", "Bandage/Ointment", "Curita/Pomada"),
        SUB("racao_terapeutica", "Ração Terapêutica", "Therapeutic Food", "Alimento Terapéutico", [CAMPO_PERECIVEL]), SUB("contraceptivo_pet", "Contraceptivo Pet", "Pet Contraceptive", "Anticonceptivo Mascota"),
      ]),
      CAT("acessorios_pet", "Acessórios Pet", "Pet Accessories", "Accesorios para Mascotas", [
        SUB("coleira_guia_peitoral", "Coleira/Guia/Peitoral", "Collar/Leash/Harness", "Collar/Correa/Pechera"), SUB("comedouro_bebedouro", "Comedouro/Bebedouro", "Feeder/Waterer", "Comedero/Bebedero"),
        SUB("brinquedo_pet", "Brinquedo", "Toy", "Juguete"), SUB("roupa_pet", "Roupa Pet", "Pet Clothing", "Ropa para Mascota"),
        SUB("caixa_transporte", "Caixa de Transporte", "Carrier", "Transportadora"), SUB("placa_identificacao", "Placa de Identificação", "ID Tag", "Placa de Identificación"),
      ]),
      CAT("habitacao_conforto_pet", "Habitação e Conforto", "Housing & Comfort", "Habitación y Confort", [
        SUB("cama_almofada_pet", "Cama/Almofada", "Bed/Cushion", "Cama/Almohadón"), SUB("casinha", "Casinha", "Pet House", "Casita"),
        SUB("arranhador", "Arranhador (Gato)", "Scratching Post (Cat)", "Rascador (Gato)"), SUB("cerca_grade_pet", "Cerca/Grade", "Fence/Gate", "Cerca/Reja"),
        SUB("tapete_cercadinho", "Tapete/Cercadinho", "Playpen Mat", "Corral/Tapete"),
      ]),
      CAT("aquarismo_outros", "Aquarismo e Outros Animais", "Fishkeeping & Other Animals", "Acuarismo y Otros Animales", [
        SUB("peixe_ornamental", "Peixe Ornamental", "Ornamental Fish", "Pez Ornamental"), SUB("racao_peixe", "Ração para Peixe", "Fish Food", "Alimento para Peces"),
        SUB("aquario_kit", "Aquário/Kit", "Aquarium/Kit", "Acuario/Kit"), SUB("roedor_racao_gaiola", "Roedor (Ração/Gaiola)", "Rodent (Food/Cage)", "Roedor (Alimento/Jaula)"),
        SUB("ave_racao_gaiola", "Ave (Ração/Gaiola)", "Bird (Food/Cage)", "Ave (Alimento/Jaula)"), SUB("reptil_racao_terrario", "Réptil (Ração/Terrário)", "Reptile (Food/Terrarium)", "Reptil (Alimento/Terrario)"),
      ]),
    ],
  },
  {
    value: "eletronicos", label: L("Eletrônicos", "Electronics", "Electrónica"), modo: "produto", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("celulares_acessorios", "Celulares e Acessórios", "Phones & Accessories", "Celulares y Accesorios", [
        SUB("celular", "Celular/Smartphone", "Cell Phone/Smartphone", "Celular/Smartphone", [CAMPO_GARANTIA_MESES]), SUB("capinha", "Capinha", "Phone Case", "Funda"),
        SUB("pelicula_vidro", "Película/Vidro", "Screen Protector", "Protector de Pantalla"), SUB("carregador_cabo", "Carregador/Cabo", "Charger/Cable", "Cargador/Cable"),
        SUB("fone_ouvido", "Fone de Ouvido", "Headphones", "Audífonos"), SUB("power_bank", "Power Bank", "Power Bank", "Batería Portátil"),
      ]),
      CAT("informatica", "Informática", "Computers", "Informática", [
        SUB("notebook", "Notebook", "Laptop", "Notebook", [CAMPO_GARANTIA_MESES]), SUB("pc_desktop", "PC/Desktop", "PC/Desktop", "PC/Escritorio", [CAMPO_GARANTIA_MESES]),
        SUB("monitor", "Monitor", "Monitor", "Monitor", [CAMPO_GARANTIA_MESES]), SUB("mouse_teclado", "Mouse/Teclado", "Mouse/Keyboard", "Mouse/Teclado"),
        SUB("impressora", "Impressora", "Printer", "Impresora", [CAMPO_GARANTIA_MESES]), SUB("armazenamento", "Armazenamento (HD/SSD/Pendrive)", "Storage (HD/SSD/Flash Drive)", "Almacenamiento (HD/SSD/Pendrive)"),
      ]),
      CAT("audio_video", "Áudio e Vídeo", "Audio & Video", "Audio y Video", [
        SUB("caixa_som_portatil", "Caixa de Som Portátil", "Portable Speaker", "Parlante Portátil"), SUB("televisao", "Televisão", "Television", "Televisor", [CAMPO_GARANTIA_MESES]),
        SUB("home_theater_soundbar", "Home Theater/Soundbar", "Home Theater/Soundbar", "Home Theater/Soundbar", [CAMPO_GARANTIA_MESES]), SUB("radio_micro_system", "Rádio/Micro System", "Radio/Micro System", "Radio/Micro System"),
        SUB("microfone", "Microfone", "Microphone", "Micrófono"), SUB("antena", "Antena", "Antenna", "Antena"),
      ]),
      CAT("eletrodomesticos", "Eletrodomésticos", "Home Appliances", "Electrodomésticos", [
        SUB("linha_branca", "Linha Branca", "Major Appliances", "Línea Blanca", [CAMPO_GARANTIA_MESES]), SUB("pequenos_eletros", "Pequenos Eletros", "Small Appliances", "Pequeños Electrodomésticos", [CAMPO_GARANTIA_MESES]),
        SUB("climatizacao", "Climatização", "Climate Control", "Climatización", [CAMPO_GARANTIA_MESES]), SUB("ferro_passar", "Ferro de Passar", "Iron", "Plancha", [CAMPO_GARANTIA_MESES]),
        SUB("aspirador_po", "Aspirador de Pó", "Vacuum Cleaner", "Aspiradora", [CAMPO_GARANTIA_MESES]), SUB("micro_ondas", "Micro-ondas", "Microwave", "Microondas", [CAMPO_GARANTIA_MESES]),
      ]),
      CAT("games", "Games", "Games", "Videojuegos", [
        SUB("console", "Console", "Console", "Consola", [CAMPO_GARANTIA_MESES]), SUB("jogo_fisico_digital", "Jogo Físico/Digital", "Physical/Digital Game", "Juego Físico/Digital"),
        SUB("controle_acessorio_game", "Controle/Acessório de Game", "Game Controller/Accessory", "Control/Accesorio de Videojuego"), SUB("cadeira_gamer", "Cadeira Gamer", "Gaming Chair", "Silla Gamer"),
        SUB("headset_gamer", "Headset Gamer", "Gaming Headset", "Auricular Gamer"),
      ]),
      CAT("seguranca_eletronica", "Segurança Eletrônica", "Electronic Security", "Seguridad Electrónica", [
        SUB("camera_seguranca", "Câmera de Segurança", "Security Camera", "Cámara de Seguridad", [CAMPO_GARANTIA_MESES]), SUB("dvr_nvr", "DVR/NVR", "DVR/NVR", "DVR/NVR", [CAMPO_GARANTIA_MESES]),
        SUB("sensor_presenca", "Sensor de Presença", "Motion Sensor", "Sensor de Presencia"), SUB("fechadura_eletronica", "Fechadura Eletrônica", "Electronic Lock", "Cerradura Electrónica", [CAMPO_GARANTIA_MESES]),
        SUB("interfone", "Interfone", "Intercom", "Portero Eléctrico"),
      ]),
      CAT("automacao_casa_inteligente", "Automação e Casa Inteligente", "Home Automation & Smart Home", "Automatización y Hogar Inteligente", [
        SUB("tomada_inteligente", "Tomada Inteligente", "Smart Plug", "Enchufe Inteligente"), SUB("lampada_inteligente", "Lâmpada Inteligente", "Smart Bulb", "Lámpara Inteligente"),
        SUB("assistente_virtual", "Assistente Virtual", "Virtual Assistant", "Asistente Virtual"), SUB("fechadura_inteligente", "Fechadura Inteligente", "Smart Lock", "Cerradura Inteligente", [CAMPO_GARANTIA_MESES]),
        SUB("central_automacao", "Central de Automação", "Automation Hub", "Central de Automatización"),
      ]),
      CAT("pilhas_baterias_energia", "Pilhas, Baterias e Energia", "Batteries & Power", "Pilas, Baterías y Energía", [
        SUB("pilha_alcalina", "Pilha Alcalina", "Alkaline Battery", "Pila Alcalina"), SUB("bateria_recarregavel", "Bateria Recarregável", "Rechargeable Battery", "Batería Recargable"),
        SUB("carregador_pilha", "Carregador de Pilha", "Battery Charger", "Cargador de Pilas"), SUB("nobreak_estabilizador", "No-break/Estabilizador", "UPS/Voltage Stabilizer", "UPS/Estabilizador"),
        SUB("filtro_linha", "Filtro de Linha", "Power Strip/Surge Protector", "Zapatilla/Protector de Picos"),
      ]),
      CAT("cabos_adaptadores", "Cabos e Adaptadores", "Cables & Adapters", "Cables y Adaptadores", [
        SUB("cabo_hdmi_usb", "Cabo HDMI/USB", "HDMI/USB Cable", "Cable HDMI/USB"), SUB("adaptador_tomada", "Adaptador de Tomada", "Plug Adapter", "Adaptador de Enchufe"),
        SUB("extensao_eletrica", "Extensão Elétrica", "Extension Cord", "Extensión Eléctrica"), SUB("hub_usb", "Hub USB", "USB Hub", "Hub USB"),
      ]),
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
      // Reestruturado por PÚBLICO (Feminina/Masculina/Infantil), não mais por tipo
      // de peça — segue o padrão real de Renner/C&A/Riachuelo (Feminino, Masculino,
      // Infantil como eixo principal de navegação). Vestido, moletom, esportivo etc.
      // que antes eram categoria própria viram sub-nicho dentro do público certo,
      // sem criar 4º nível e sem duplicar o mesmo tipo de peça em 2 categorias.
      CAT("moda_feminina", "Moda Feminina", "Women's Fashion", "Moda Femenina", [
        SUB("camiseta_blusa_feminina", "Camiseta/Blusa Feminina", "Women's T-Shirt/Top", "Camiseta/Blusa Femenina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("camisa_social_feminina", "Camisa Social Feminina", "Women's Dress Shirt", "Camisa Formal Femenina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("calca_feminina", "Calça Feminina", "Women's Pants", "Pantalón Femenino", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("saia", "Saia", "Skirt", "Falda", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("short_bermuda_feminino", "Short/Bermuda Feminino", "Women's Shorts/Bermuda", "Short/Bermuda Femenino", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("vestido_casual", "Vestido Casual", "Casual Dress", "Vestido Casual", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("vestido_festa", "Vestido Festa", "Party Dress", "Vestido de Fiesta", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("moletom_jaqueta_casaco_feminino", "Moletom/Jaqueta/Casaco Feminino", "Women's Sweatshirt/Jacket/Coat", "Buzo/Campera/Abrigo Femenino", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("conjunto_fitness_feminino", "Conjunto Fitness/Legging Esportiva", "Fitness Set/Athletic Leggings", "Conjunto Fitness/Legging Deportiva", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
      ]),
      CAT("moda_masculina", "Moda Masculina", "Men's Fashion", "Moda Masculina", [
        SUB("camiseta_masculina", "Camiseta Masculina", "Men's T-Shirt", "Camiseta Masculina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("camisa_social_masculina", "Camisa Social Masculina", "Men's Dress Shirt", "Camisa Formal Masculina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("polo", "Polo", "Polo Shirt", "Polo", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("calca_masculina", "Calça Masculina", "Men's Pants", "Pantalón Masculino", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("bermuda_short_masculino", "Bermuda/Short Masculino", "Men's Shorts/Bermuda", "Bermuda/Short Masculino", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("moletom_jaqueta_casaco_masculino", "Moletom/Jaqueta/Casaco Masculino", "Men's Sweatshirt/Jacket/Coat", "Buzo/Campera/Abrigo Masculino", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("conjunto_fitness_masculino", "Conjunto Fitness/Dry-fit", "Fitness Set/Dry-fit", "Conjunto Fitness/Dry-fit", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
      ]),
      CAT("moda_infantil", "Moda Infantil", "Kidswear", "Moda Infantil", [
        SUB("camiseta_calca_infantil", "Camiseta/Calça Infantil", "Kids' T-Shirt/Pants", "Camiseta/Pantalón Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("body_macacao_bebe", "Body/Macacão Bebê", "Baby Bodysuit/Onesie", "Body/Mameluco Bebé", [CAMPO_TAMANHO_ROUPA]),
        SUB("conjunto_infantil", "Conjunto Infantil", "Kids' Outfit Set", "Conjunto Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("vestido_infantil", "Vestido Infantil", "Kids' Dress", "Vestido Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("uniforme_escolar", "Uniforme Escolar", "School Uniform", "Uniforme Escolar", [CAMPO_TAMANHO_ROUPA]),
        SUB("pijama_infantil", "Pijama Infantil", "Kids' Pajamas", "Pijama Infantil", [CAMPO_TAMANHO_ROUPA]),
        SUB("fantasia", "Fantasia", "Costume", "Disfraz", [CAMPO_TAMANHO_ROUPA]),
        SUB("roupa_banho_infantil", "Roupa de Banho Infantil", "Kids' Swimwear", "Traje de Baño Infantil", [CAMPO_TAMANHO_ROUPA]),
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
      // Tênis e Sapato Social viram categorias POR PÚBLICO (Masculino/Feminino/
      // Unissex) — mesmo padrão de Nike/Centauro, que filtram calçado por gênero
      // como facet principal. Sandálias, Botas e Infantis já tinham gênero
      // resolvido nos sub-nichos, não precisaram mudar.
      CAT("tenis_masculino", "Tênis Masculino", "Men's Sneakers", "Zapatillas Masculinas", [
        SUB("tenis_esportivo_corrida_masc", "Esportivo/Corrida", "Running/Athletic", "Deportivo/Running", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_casual_streetwear_masc", "Casual/Streetwear", "Casual/Streetwear", "Casual/Urbano", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_skate_masc", "Skate", "Skate", "Skate", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_basquete_cano_alto_masc", "Basquete/Cano Alto", "High-top Basketball", "Baloncesto Caña Alta", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_slip_on_masc", "Slip-on", "Slip-on", "Slip-on", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("chuteira_futsal", "Chuteira/Futsal", "Soccer/Futsal Cleats", "Botín de Fútbol/Futsal", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("tenis_feminino", "Tênis Feminino", "Women's Sneakers", "Zapatillas Femeninas", [
        SUB("tenis_esportivo_corrida_fem", "Esportivo/Corrida", "Running/Athletic", "Deportivo/Running", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_casual_streetwear_fem", "Casual/Streetwear", "Casual/Streetwear", "Casual/Urbano", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_plataforma", "Plataforma", "Platform Sneakers", "Plataforma", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_cano_alto_bota_fem", "Cano Alto/Bota Tênis", "High-top/Boot Sneaker", "Bota Tenis/Caña Alta", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_slip_on_fem", "Slip-on", "Slip-on", "Slip-on", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("tenis_unissex", "Tênis Unissex", "Unisex Sneakers", "Zapatillas Unisex", [
        SUB("tenis_esportivo_corrida_uni", "Esportivo/Corrida", "Running/Athletic", "Deportivo/Running", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_casual_streetwear_uni", "Casual/Streetwear", "Casual/Streetwear", "Casual/Urbano", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_skate_uni", "Skate", "Skate", "Skate", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("tenis_slip_on_uni", "Slip-on", "Slip-on", "Slip-on", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("sapato_masculino", "Sapato Masculino", "Men's Dress Shoes", "Zapato Formal Masculino", [
        SUB("sapato_social_masculino", "Sapato Social", "Dress Shoe", "Zapato Formal", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("mocassim_masc", "Mocassim", "Loafer", "Mocasín", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("oxford_derby_masc", "Oxford/Derby", "Oxford/Derby", "Oxford/Derby", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("casual_couro_masc", "Casual de Couro", "Leather Casual Shoe", "Zapato Casual de Cuero", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("sapato_feminino", "Sapato Feminino", "Women's Dress Shoes", "Zapato Formal Femenino", [
        SUB("sapato_social_scarpin", "Sapato Social/Scarpin", "Dress Shoe/Pump", "Zapato Formal/Stiletto", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("mocassim_fem", "Mocassim", "Loafer", "Mocasín", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("oxford_derby_fem", "Oxford/Derby", "Oxford/Derby", "Oxford/Derby", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("sapatilha_rasteirinha_sapato", "Sapatilha/Rasteirinha", "Flats/Ballet Flats", "Balerina/Chata", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("plataforma_anabela", "Plataforma/Anabela", "Platform/Wedge", "Plataforma/Cuña", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
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
      CAT("maquiagem", "Maquiagem", "Makeup", "Maquillaje", [
        SUB("base_corretivo", "Base/Corretivo", "Foundation/Concealer", "Base/Corrector", [CAMPO_PERECIVEL]), SUB("po_facial", "Pó Facial", "Face Powder", "Polvo Facial", [CAMPO_PERECIVEL]),
        SUB("sombra_paleta", "Sombra/Paleta", "Eyeshadow/Palette", "Sombra/Paleta", [CAMPO_PERECIVEL]), SUB("rimel_delineador", "Rímel/Delineador", "Mascara/Eyeliner", "Rímel/Delineador", [CAMPO_PERECIVEL]),
        SUB("batom_gloss", "Batom/Gloss", "Lipstick/Gloss", "Labial/Gloss", [CAMPO_PERECIVEL]), SUB("blush_iluminador", "Blush/Iluminador", "Blush/Highlighter", "Rubor/Iluminador", [CAMPO_PERECIVEL]),
        SUB("pincel_esponja", "Pincel/Esponja de Maquiagem", "Makeup Brush/Sponge", "Brocha/Esponja"),
      ]),
      CAT("perfumaria_cosm", "Perfumaria", "Fragrance", "Perfumería", [
        SUB("perfume_feminino", "Perfume Feminino", "Women's Perfume", "Perfume Femenino"), SUB("perfume_masculino", "Perfume Masculino", "Men's Perfume", "Perfume Masculino"),
        SUB("colonia_body_splash", "Colônia/Body Splash", "Cologne/Body Splash", "Colonia/Body Splash"), SUB("perfume_importado", "Perfume Importado", "Imported Perfume", "Perfume Importado"),
        SUB("kit_presente_perfumaria", "Kit Presente", "Gift Set", "Kit de Regalo"),
      ]),
      CAT("skincare", "Skincare", "Skincare", "Cuidado de la Piel", [
        SUB("hidratante_facial_skincare", "Hidratante Facial", "Facial Moisturizer", "Hidratante Facial", [CAMPO_PERECIVEL]), SUB("protetor_solar_skincare", "Protetor Solar", "Sunscreen", "Protector Solar", [CAMPO_PERECIVEL]),
        SUB("serum_acido", "Sérum/Ácido", "Serum/Acid", "Sérum/Ácido", [CAMPO_PERECIVEL]), SUB("agua_micelar_demaquilante", "Água Micelar/Demaquilante", "Micellar Water/Makeup Remover", "Agua Micelar/Desmaquillante", [CAMPO_PERECIVEL]),
        SUB("mascara_facial_skincare", "Máscara Facial", "Face Mask", "Mascarilla Facial", [CAMPO_PERECIVEL]), SUB("anti_idade", "Anti-idade", "Anti-aging", "Antiedad", [CAMPO_PERECIVEL]),
        SUB("tratamento_acne_skincare", "Tratamento para Acne", "Acne Treatment", "Tratamiento para Acné", [CAMPO_PERECIVEL]),
      ]),
      CAT("cabelo_cosm", "Cabelo", "Hair", "Cabello", [
        SUB("shampoo_condicionador", "Shampoo/Condicionador", "Shampoo/Conditioner", "Champú/Acondicionador"), SUB("mascara_hidratacao_cosm", "Máscara de Hidratação", "Hair Mask", "Mascarilla Capilar"),
        SUB("creme_pentear_leave_in", "Creme de Pentear/Leave-in", "Leave-in/Combing Cream", "Crema para Peinar/Leave-in"), SUB("oleo_capilar", "Óleo Capilar", "Hair Oil", "Aceite Capilar"),
        SUB("coloracao_cosm", "Coloração", "Hair Color", "Coloración"), SUB("finalizador", "Finalizador/Modelador", "Styling Product", "Finalizador/Modelador"),
      ]),
      CAT("corpo_banho", "Corpo e Banho", "Body & Bath", "Cuerpo y Baño", [
        SUB("sabonete_cosm", "Sabonete", "Soap", "Jabón"), SUB("hidratante_corporal", "Hidratante Corporal", "Body Lotion", "Hidratante Corporal", [CAMPO_PERECIVEL]),
        SUB("oleo_creme_banho", "Óleo/Creme de Banho", "Bath Oil/Cream", "Aceite/Crema de Baño", [CAMPO_PERECIVEL]), SUB("esfoliante_corporal", "Esfoliante Corporal", "Body Scrub", "Exfoliante Corporal", [CAMPO_PERECIVEL]),
        SUB("desodorante_cosm", "Desodorante", "Deodorant", "Desodorante"), SUB("depilacao", "Depilação", "Hair Removal", "Depilación"),
      ]),
      CAT("unhas_cosm", "Unhas", "Nails", "Uñas", [
        SUB("esmalte", "Esmalte", "Nail Polish", "Esmalte"), SUB("acetona_removedor", "Acetona/Removedor", "Acetone/Remover", "Acetona/Removedor"),
        SUB("alicate_lixa", "Alicate/Lixa", "Clipper/File", "Alicate/Lima"), SUB("unha_postica_adesivo", "Unha Postiça/Adesivo", "Fake Nails/Stickers", "Uña Postiza/Adhesivo"),
        SUB("fortalecedor_unha", "Fortalecedor de Unha", "Nail Strengthener", "Fortalecedor de Uñas"),
      ]),
      CAT("linha_masculina", "Linha Masculina", "Men's Line", "Línea Masculina", [
        SUB("espuma_gel_barbear", "Espuma/Gel de Barbear", "Shaving Foam/Gel", "Espuma/Gel de Afeitar"), SUB("pos_barba", "Pós-barba", "Aftershave", "Aftershave"),
        SUB("barbeador_lamina_cosm", "Barbeador/Lâmina", "Razor/Blade", "Rastrillo/Cuchilla"), SUB("oleo_cera_barba", "Óleo/Cera para Barba", "Beard Oil/Wax", "Aceite/Cera para Barba"),
        SUB("desodorante_masculino", "Desodorante Masculino", "Men's Deodorant", "Desodorante Masculino"),
      ]),
      CAT("kits_presentes_cosm", "Kits e Presentes", "Gift Sets", "Kits y Regalos", [
        SUB("kit_presente_feminino", "Kit Presente Feminino", "Women's Gift Set", "Kit de Regalo Femenino"), SUB("kit_presente_masculino", "Kit Presente Masculino", "Men's Gift Set", "Kit de Regalo Masculino"),
        SUB("necessaire_kit_viagem", "Nécessaire/Kit Viagem", "Toiletry Bag/Travel Kit", "Neceser/Kit de Viaje"),
      ]),
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
      CAT("insumos_paes_massas_lanchonete", "Insumos — Pães e Massas", "Ingredients — Bread & Dough", "Insumos — Panes y Masas", [
        SUB("pao_hamburguer", "Pão de Hambúrguer", "Burger Bun", "Pan de Hamburguesa", [CAMPO_PERECIVEL]), SUB("pao_frances_sanduiche_lanchonete", "Pão Francês/Sanduíche", "French/Sandwich Bread", "Pan Francés/Sándwich", [CAMPO_PERECIVEL]),
        SUB("pao_cachorro_quente", "Pão de Cachorro-quente", "Hot Dog Bun", "Pan de Pancho", [CAMPO_PERECIVEL]), SUB("massa_salgado_lanchonete", "Massa de Salgado", "Savory Pastry Dough", "Masa de Salado", [CAMPO_PERECIVEL]),
        SUB("torrada_fatia_pao", "Torrada/Fatia de Pão", "Toast/Bread Slice", "Tostada/Rebanada de Pan"),
      ]),
      CAT("insumos_proteinas_lanchonete", "Insumos — Proteínas", "Ingredients — Proteins", "Insumos — Proteínas", [
        SUB("carne_hamburguer", "Carne para Hambúrguer", "Burger Patty Meat", "Carne para Hamburguesa", [CAMPO_PERECIVEL]), SUB("frango_file_desfiado", "Frango (Filé/Desfiado)", "Chicken (Fillet/Shredded)", "Pollo (Filete/Desmenuzado)", [CAMPO_PERECIVEL]),
        SUB("salsicha_linguica_lanchonete", "Salsicha/Linguiça", "Sausage", "Salchicha/Longaniza", [CAMPO_PERECIVEL]), SUB("bacon_lanchonete", "Bacon", "Bacon", "Tocino", [CAMPO_PERECIVEL]),
        SUB("ovo_lanchonete", "Ovo", "Egg", "Huevo", [CAMPO_PERECIVEL]), SUB("presunto_mortadela", "Presunto/Mortadela", "Ham/Bologna", "Jamón/Mortadela", [CAMPO_PERECIVEL]),
      ]),
      CAT("insumos_queijos_laticinios_lanchonete", "Insumos — Queijos e Laticínios", "Ingredients — Cheese & Dairy", "Insumos — Quesos y Lácteos", [
        SUB("queijo_cheddar_mussarela", "Queijo Cheddar/Mussarela", "Cheddar/Mozzarella Cheese", "Queso Cheddar/Muzzarella", [CAMPO_PERECIVEL]), SUB("catupiry_cream_cheese", "Catupiry/Cream Cheese", "Catupiry/Cream Cheese", "Catupiry/Queso Crema", [CAMPO_PERECIVEL]),
        SUB("maionese", "Maionese", "Mayonnaise", "Mayonesa", [CAMPO_PERECIVEL]), SUB("manteiga_margarina_lanchonete", "Manteiga/Margarina", "Butter/Margarine", "Mantequilla/Margarina", [CAMPO_PERECIVEL]),
      ]),
      CAT("insumos_hortifruti_molhos_lanchonete", "Insumos — Hortifruti e Molhos", "Ingredients — Produce & Sauces", "Insumos — Verduras y Salsas", [
        SUB("alface_tomate_cebola", "Alface/Tomate/Cebola", "Lettuce/Tomato/Onion", "Lechuga/Tomate/Cebolla", [CAMPO_PERECIVEL]), SUB("batata_palito_congelada", "Batata (Palito/Congelada)", "Potato (Fries/Frozen)", "Papa (Bastón/Congelada)", [CAMPO_PERECIVEL]),
        SUB("molho_tomate_barbecue", "Molho de Tomate/Barbecue", "Ketchup/BBQ Sauce", "Salsa de Tomate/BBQ", [CAMPO_PERECIVEL]), SUB("molho_especial_casa", "Molho Especial da Casa", "House Special Sauce", "Salsa Especial de la Casa", [CAMPO_PERECIVEL]),
        SUB("picles_cebola_crispy", "Picles/Cebola Crispy", "Pickles/Crispy Onion", "Pepinillos/Cebolla Crocante", [CAMPO_PERECIVEL]),
      ]),
      CAT("insumos_bebidas_preparo_lanchonete", "Insumos — Bebidas para Preparo", "Ingredients — Beverage Prep", "Insumos — Bebidas para Preparar", [
        SUB("xarope_concentrado_lanchonete", "Xarope/Concentrado", "Syrup/Concentrate", "Jarabe/Concentrado", [CAMPO_PERECIVEL]), SUB("gelo_lanchonete", "Gelo", "Ice", "Hielo"),
        SUB("copo_guarnicao_suco", "Copo/Guarnição para Suco", "Cup/Juice Garnish", "Vaso/Guarnición para Jugo"),
      ]),
      CAT("cardapio_sanduiches_hamburgueres", "Cardápio — Sanduíches e Hambúrgueres", "Menu — Sandwiches & Burgers", "Menú — Sándwiches y Hamburguesas", [
        SUB("hamburguer_artesanal", "Hambúrguer Artesanal", "Artisanal Burger", "Hamburguesa Artesanal", [CAMPO_PERECIVEL]), SUB("x_salada_x_bacon", "X-Salada/X-Bacon", "Cheeseburger/Bacon Burger", "X-Salada/X-Bacon", [CAMPO_PERECIVEL]),
        SUB("cachorro_quente", "Cachorro-quente", "Hot Dog", "Pancho/Hot Dog", [CAMPO_PERECIVEL]), SUB("sanduiche_natural_lanchonete", "Sanduíche Natural", "Natural Sandwich", "Sándwich Natural", [CAMPO_PERECIVEL]),
        SUB("misto_quente", "Misto Quente", "Grilled Ham & Cheese", "Mixto Caliente", [CAMPO_PERECIVEL]), SUB("hamburguer_especial_casa", "Hambúrguer Especial da Casa", "House Special Burger", "Hamburguesa Especial de la Casa", [CAMPO_PERECIVEL]),
      ]),
      CAT("cardapio_porcoes_petiscos", "Cardápio — Porções e Petiscos", "Menu — Sides & Appetizers", "Menú — Porciones y Picoteos", [
        SUB("batata_frita_lanchonete", "Batata Frita", "French Fries", "Papas Fritas", [CAMPO_PERECIVEL]), SUB("porcao_frango", "Porção de Frango", "Chicken Bites", "Porción de Pollo", [CAMPO_PERECIVEL]),
        SUB("isca_peixe", "Isca de Peixe", "Fish Strips", "Bastones de Pescado", [CAMPO_PERECIVEL]), SUB("aneis_cebola", "Anéis de Cebola", "Onion Rings", "Aros de Cebolla", [CAMPO_PERECIVEL]),
        SUB("petisco_misto", "Petisco Misto", "Mixed Appetizer Platter", "Picoteo Mixto", [CAMPO_PERECIVEL]), SUB("pastel_salgado_frito", "Pastel/Salgado Frito", "Pastel/Fried Snack", "Pastel/Salado Frito", [CAMPO_PERECIVEL]),
      ]),
      CAT("cardapio_bebidas_prontas_lanchonete", "Cardápio — Bebidas Prontas", "Menu — Ready-to-drink Beverages", "Menú — Bebidas Listas", [
        SUB("suco_natural_lanchonete", "Suco Natural", "Fresh Juice", "Jugo Natural", [CAMPO_PERECIVEL]), SUB("refrigerante_lanchonete", "Refrigerante", "Soda", "Refresco", [CAMPO_PERECIVEL]),
        SUB("milk_shake", "Milk-shake", "Milkshake", "Milkshake", [CAMPO_PERECIVEL]), SUB("vitamina_lanchonete", "Vitamina", "Smoothie", "Batido/Vitamina", [CAMPO_PERECIVEL]),
      ]),
      CAT("descartaveis_lanchonete", "Descartáveis e Embalagens", "Disposables & Packaging", "Desechables y Empaques", [
        SUB("embalagem_viagem", "Embalagem para Viagem", "Take-out Container", "Envase para Llevar"), SUB("guardanapo_lanchonete", "Guardanapo", "Napkin", "Servilleta"),
        SUB("copo_descartavel_lanchonete", "Copo Descartável", "Disposable Cup", "Vaso Descartable"), SUB("canudo", "Canudo", "Straw", "Sorbete"),
        SUB("sacola_lanchonete", "Sacola", "Bag", "Bolsa"),
      ]),
    ],
  },
  {
    value: "pizzaria", label: L("Pizzaria", "Pizzeria", "Pizzería"), modo: "misto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("insumos_massa_base_pizzaria", "Insumos — Massa e Base", "Ingredients — Dough & Base", "Insumos — Masa y Base", [
        SUB("massa_pizza_pronta", "Massa de Pizza Pronta", "Ready Pizza Dough", "Masa de Pizza Lista", [CAMPO_PERECIVEL]), SUB("farinha_massa_pizzaria", "Farinha para Massa", "Dough Flour", "Harina para Masa"),
        SUB("fermento", "Fermento", "Yeast", "Levadura"), SUB("pre_assada_broa", "Pré-assada/Broa", "Pre-baked Crust", "Prehorneada", [CAMPO_PERECIVEL]),
      ]),
      CAT("insumos_molhos_queijos_pizzaria", "Insumos — Molhos e Queijos", "Ingredients — Sauces & Cheese", "Insumos — Salsas y Quesos", [
        SUB("molho_tomate_pizzaria", "Molho de Tomate", "Tomato Sauce", "Salsa de Tomate", [CAMPO_PERECIVEL]), SUB("mussarela_bloco_ralada", "Mussarela em Bloco/Ralada", "Block/Shredded Mozzarella", "Muzzarella en Bloque/Rallada", [CAMPO_PERECIVEL]),
        SUB("queijos_especiais_pizzaria", "Queijos Especiais", "Specialty Cheeses", "Quesos Especiales", [CAMPO_PERECIVEL]), SUB("catupiry_pizzaria", "Catupiry", "Catupiry", "Catupiry", [CAMPO_PERECIVEL]),
      ]),
      CAT("insumos_recheios_pizzaria", "Insumos — Recheios", "Ingredients — Toppings", "Insumos — Rellenos", [
        SUB("calabresa_pizzaria", "Calabresa", "Pepperoni-style Sausage", "Longaniza", [CAMPO_PERECIVEL]), SUB("frango_desfiado_pizzaria", "Frango Desfiado", "Shredded Chicken", "Pollo Desmenuzado", [CAMPO_PERECIVEL]),
        SUB("presunto_pizzaria", "Presunto", "Ham", "Jamón", [CAMPO_PERECIVEL]), SUB("bacon_pizzaria", "Bacon", "Bacon", "Tocino", [CAMPO_PERECIVEL]),
        SUB("palmito_azeitona_milho_ervilha", "Palmito/Azeitona/Milho/Ervilha", "Palm Heart/Olives/Corn/Peas", "Palmito/Aceituna/Choclo/Arveja", [CAMPO_PERECIVEL]), SUB("camarao_pizzaria", "Camarão", "Shrimp", "Camarón", [CAMPO_PERECIVEL]),
        SUB("chocolate_frutas_pizzaria", "Chocolate/Frutas", "Chocolate/Fruit", "Chocolate/Frutas", [CAMPO_PERECIVEL]),
      ]),
      CAT("cardapio_pizzas_salgadas", "Cardápio — Pizzas Salgadas", "Menu — Savory Pizzas", "Menú — Pizzas Saladas", [
        SUB("mussarela_pizza", "Mussarela", "Cheese", "Muzzarella", [CAMPO_PERECIVEL]), SUB("calabresa_pizza", "Calabresa", "Pepperoni-style", "Calabresa", [CAMPO_PERECIVEL]),
        SUB("portuguesa", "Portuguesa", "Portuguese", "Portuguesa", [CAMPO_PERECIVEL]), SUB("frango_catupiry", "Frango com Catupiry", "Chicken with Catupiry", "Pollo con Catupiry", [CAMPO_PERECIVEL]),
        SUB("quatro_queijos", "Quatro Queijos", "Four Cheese", "Cuatro Quesos", [CAMPO_PERECIVEL]), SUB("especial_casa_pizza", "Especial da Casa", "House Special", "Especial de la Casa", [CAMPO_PERECIVEL]),
      ]),
      CAT("cardapio_pizzas_doces", "Cardápio — Pizzas Doces", "Menu — Sweet Pizzas", "Menú — Pizzas Dulces", [
        SUB("chocolate_pizza", "Chocolate", "Chocolate", "Chocolate", [CAMPO_PERECIVEL]), SUB("romeu_julieta", "Romeu e Julieta", "Romeu e Julieta (Cheese & Guava)", "Romeu e Julieta", [CAMPO_PERECIVEL]),
        SUB("banana_canela", "Banana com Canela", "Banana with Cinnamon", "Banana con Canela", [CAMPO_PERECIVEL]), SUB("nutella_pizza", "Nutella", "Nutella", "Nutella", [CAMPO_PERECIVEL]),
      ]),
      CAT("esfiha_similares", "Esfiha e Similares", "Esfiha & Similar Items", "Esfiha y Similares", [
        SUB("esfiha_aberta", "Esfiha Aberta", "Open Esfiha", "Esfiha Abierta", [CAMPO_PERECIVEL]), SUB("esfiha_fechada", "Esfiha Fechada", "Closed Esfiha", "Esfiha Cerrada", [CAMPO_PERECIVEL]),
        SUB("beirute_lanche_forno", "Beirute/Lanche de Forno", "Beirute/Baked Sandwich", "Beirute/Sándwich al Horno", [CAMPO_PERECIVEL]),
      ]),
      CAT("bebidas_acompanhamentos_pizzaria", "Cardápio — Bebidas e Acompanhamentos", "Menu — Beverages & Sides", "Menú — Bebidas y Acompañamientos", [
        SUB("refrigerante_pizzaria", "Refrigerante", "Soda", "Refresco", [CAMPO_PERECIVEL]), SUB("suco_pizzaria", "Suco", "Juice", "Jugo", [CAMPO_PERECIVEL]),
        SUB("pao_alho_pizzaria", "Pão de Alho", "Garlic Bread", "Pan de Ajo", [CAMPO_PERECIVEL]), SUB("borda_recheada", "Borda Recheada", "Stuffed Crust", "Borde Relleno", [CAMPO_PERECIVEL]),
      ]),
      CAT("embalagens_pizzaria", "Embalagens", "Packaging", "Empaques", [
        SUB("caixa_pizza", "Caixa de Pizza", "Pizza Box", "Caja de Pizza"), SUB("sacola_termica_pizzaria", "Sacola Térmica", "Thermal Bag", "Bolsa Térmica"),
        SUB("guardanapo_talher_pizzaria", "Guardanapo/Talher Descartável", "Napkin/Disposable Cutlery", "Servilleta/Cubiertos Descartables"),
      ]),
    ],
  },
  {
    value: "sorveteria_acai", label: L("Sorveteria/Açaí", "Ice Cream/Açaí Shop", "Heladería/Açaí"), modo: "misto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("insumos_base_sorveteria", "Insumos — Base", "Ingredients — Base", "Insumos — Base", [
        SUB("acai_batido_polpa", "Açaí Batido/Polpa", "Açaí Puree/Pulp", "Açaí Batido/Pulpa", [CAMPO_PERECIVEL]), SUB("sorvete_base", "Sorvete Base", "Ice Cream Base", "Base de Helado", [CAMPO_PERECIVEL]),
        SUB("sorbet_base", "Sorbet Base", "Sorbet Base", "Base de Sorbete", [CAMPO_PERECIVEL]), SUB("iogurte_base", "Iogurte Base", "Yogurt Base", "Base de Yogur", [CAMPO_PERECIVEL]),
      ]),
      CAT("insumos_frutas_complementos_sorveteria", "Insumos — Frutas e Complementos", "Ingredients — Fruit & Toppings", "Insumos — Frutas y Complementos", [
        SUB("banana_sorveteria", "Banana", "Banana", "Banana", [CAMPO_PERECIVEL]), SUB("morango_sorveteria", "Morango", "Strawberry", "Frutilla", [CAMPO_PERECIVEL]),
        SUB("frutas_diversas_sorveteria", "Frutas Diversas", "Assorted Fruit", "Frutas Variadas", [CAMPO_PERECIVEL]), SUB("granola_cereal", "Granola/Cereal", "Granola/Cereal", "Granola/Cereal"),
        SUB("leite_po_condensado", "Leite em Pó/Condensado", "Powdered/Condensed Milk", "Leche en Polvo/Condensada"),
      ]),
      CAT("insumos_coberturas_xaropes", "Insumos — Coberturas e Xaropes", "Ingredients — Toppings & Syrups", "Insumos — Coberturas y Jarabes", [
        SUB("chocolate_cobertura", "Chocolate (Cobertura)", "Chocolate Topping", "Cobertura de Chocolate"), SUB("mel_agave", "Mel/Agave", "Honey/Agave", "Miel/Agave"),
        SUB("confetes_granulado", "Confetes/Granulado", "Sprinkles", "Confites/Granulado"), SUB("pacoca_castanha", "Paçoca/Castanha", "Peanut Candy/Nuts", "Paçoca/Castañas"),
        SUB("xarope_diversos_sabores", "Xarope Diversos Sabores", "Assorted Flavor Syrup", "Jarabe de Sabores Varios"),
      ]),
      CAT("cardapio_acai_sorvete_montado", "Cardápio — Açaí e Sorvete Montado", "Menu — Assembled Açaí & Ice Cream", "Menú — Açaí y Helado Armado", [
        SUB("acai_copo", "Açaí no Copo", "Açaí in a Cup", "Açaí en Vaso", [CAMPO_PERECIVEL]), SUB("acai_tigela", "Açaí na Tigela", "Açaí Bowl", "Açaí en Bowl", [CAMPO_PERECIVEL]),
        SUB("casquinha", "Casquinha", "Ice Cream Cone", "Cucurucho", [CAMPO_PERECIVEL]), SUB("milk_shake_sorveteria", "Milk-shake", "Milkshake", "Milkshake", [CAMPO_PERECIVEL]),
        SUB("sundae", "Sundae", "Sundae", "Sundae", [CAMPO_PERECIVEL]),
      ]),
      CAT("cardapio_copos_combos", "Cardápio — Copos e Combos Prontos", "Menu — Ready Cups & Combos", "Menú — Vasos y Combos Listos", [
        SUB("copo_montado_padrao", "Copo Montado Padrão", "Standard Assembled Cup", "Vaso Armado Estándar", [CAMPO_PERECIVEL]), SUB("combo_familia", "Combo Família", "Family Combo", "Combo Familiar", [CAMPO_PERECIVEL]),
        SUB("copo_fitness_sem_acucar", "Copo Fitness/Sem Açúcar", "Fitness/Sugar-free Cup", "Vaso Fitness/Sin Azúcar", [CAMPO_PERECIVEL]),
      ]),
      CAT("descartaveis_sorveteria", "Descartáveis", "Disposables", "Desechables", [
        SUB("copo_tigela_descartavel", "Copo/Tigela Descartável", "Disposable Cup/Bowl", "Vaso/Bowl Descartable"), SUB("colher_sorveteria", "Colher", "Spoon", "Cuchara"),
        SUB("tampa_sorveteria", "Tampa", "Lid", "Tapa"), SUB("sacola_termica_sorveteria", "Sacola Térmica", "Thermal Bag", "Bolsa Térmica"),
      ]),
    ],
  },
  {
    value: "marmita_comida_pronta", label: L("Marmita/Comida Pronta", "Meal Prep/Ready Food", "Vianda/Comida Preparada"), modo: "misto", divisaoPrimaria: "alimentos",
    categorias: [
      CAT("insumos_proteinas_marmita", "Insumos — Proteínas", "Ingredients — Proteins", "Insumos — Proteínas", [
        SUB("frango_marmita", "Frango", "Chicken", "Pollo", [CAMPO_PERECIVEL]), SUB("carne_bovina_marmita", "Carne Bovina", "Beef", "Carne de Res", [CAMPO_PERECIVEL]),
        SUB("peixe_marmita", "Peixe", "Fish", "Pescado", [CAMPO_PERECIVEL]), SUB("ovo_marmita", "Ovo", "Egg", "Huevo", [CAMPO_PERECIVEL]),
        SUB("proteina_vegetal", "Proteína Vegetal", "Plant-based Protein", "Proteína Vegetal", [CAMPO_PERECIVEL]),
      ]),
      CAT("insumos_guarnicoes_graos", "Insumos — Guarnições e Grãos", "Ingredients — Sides & Grains", "Insumos — Guarniciones y Granos", [
        SUB("arroz_marmita", "Arroz", "Rice", "Arroz"), SUB("feijao_marmita", "Feijão", "Beans", "Frijoles"),
        SUB("macarrao_marmita", "Macarrão", "Pasta", "Fideos"), SUB("legumes_marmita", "Legumes", "Vegetables", "Verduras", [CAMPO_PERECIVEL]),
        SUB("farofa_marmita", "Farofa", "Farofa", "Farofa", [CAMPO_PERECIVEL]),
      ]),
      CAT("insumos_temperos_molhos_marmita", "Insumos — Temperos e Molhos", "Ingredients — Seasonings & Sauces", "Insumos — Condimentos y Salsas", [
        SUB("tempero_base_marmita", "Tempero Base", "Base Seasoning", "Condimento Base"), SUB("molho_marmita", "Molho para Marmita", "Meal Prep Sauce", "Salsa para Vianda"),
        SUB("oleo_azeite_marmita", "Óleo/Azeite", "Oil", "Aceite"),
      ]),
      CAT("cardapio_marmitas_montadas", "Cardápio — Marmitas Montadas", "Menu — Assembled Meals", "Menú — Viandas Armadas", [
        SUB("marmita_tradicional", "Marmita Tradicional (P/M/G)", "Traditional Meal (S/M/L)", "Vianda Tradicional (P/M/G)", [CAMPO_PERECIVEL]), SUB("marmita_fitness", "Marmita Fitness", "Fitness Meal", "Vianda Fitness", [CAMPO_PERECIVEL]),
        SUB("marmita_vegetariana", "Marmita Vegetariana", "Vegetarian Meal", "Vianda Vegetariana", [CAMPO_PERECIVEL]), SUB("marmita_congelada", "Marmita Congelada", "Frozen Meal", "Vianda Congelada", [CAMPO_PERECIVEL]),
        SUB("marmita_executiva", "Marmita Executiva", "Executive Meal", "Vianda Ejecutiva", [CAMPO_PERECIVEL]),
      ]),
      CAT("cardapio_porcoes_avulsas", "Cardápio — Porções Avulsas", "Menu — Individual Portions", "Menú — Porciones Sueltas", [
        SUB("porcao_extra_proteina", "Porção Extra de Proteína", "Extra Protein Portion", "Porción Extra de Proteína", [CAMPO_PERECIVEL]), SUB("porcao_extra_guarnicao", "Porção Extra de Guarnição", "Extra Side Portion", "Porción Extra de Guarnición", [CAMPO_PERECIVEL]),
        SUB("sobremesa_dia", "Sobremesa do Dia", "Dessert of the Day", "Postre del Día", [CAMPO_PERECIVEL]),
      ]),
      CAT("embalagens_marmita", "Embalagens", "Packaging", "Empaques", [
        SUB("marmita_aluminio", "Marmita de Alumínio", "Aluminum Container", "Vianda de Aluminio"), SUB("marmita_isopor_plastico", "Marmita de Isopor/Plástico", "Styrofoam/Plastic Container", "Vianda de Telgopor/Plástico"),
        SUB("marmita_congelamento", "Marmita para Congelamento", "Freezer-safe Container", "Vianda para Congelar"), SUB("talher_descartavel_marmita", "Talher Descartável", "Disposable Cutlery", "Cubiertos Descartables"),
      ]),
    ],
  },

  // ============================================================================
  // MODO SERVIÇO — sem EAN, sem estoque, sem validade (servicos do Estoque intocado)
  // ============================================================================
  {
    value: "salao_barbearia", label: L("Salão/Barbearia", "Salon/Barbershop", "Salón/Barbería"), modo: "servico", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("corte", "Corte", "Haircut", "Corte", [
        SUB("corte_feminino_salao", "Corte Feminino", "Women's Haircut", "Corte Femenino", CAMPOS_SERVICO_PADRAO), SUB("corte_masculino_salao", "Corte Masculino", "Men's Haircut", "Corte Masculino", CAMPOS_SERVICO_PADRAO),
        SUB("corte_infantil_salao", "Corte Infantil", "Kids' Haircut", "Corte Infantil", CAMPOS_SERVICO_PADRAO), SUB("corte_barba_combo", "Corte + Barba (Combo)", "Haircut + Beard (Combo)", "Corte + Barba (Combo)", CAMPOS_SERVICO_PADRAO),
        SUB("acabamento_pezinho", "Acabamento/Pezinho", "Neckline Trim", "Perfilado de Nuca", CAMPOS_SERVICO_PADRAO), SUB("pacote_plano_mensal", "Pacote/Plano Mensal", "Monthly Package/Plan", "Paquete/Plan Mensual", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("coloracao_quimica", "Coloração e Química", "Coloring & Chemical Treatments", "Coloración y Química", [
        SUB("coloracao_tintura_salao", "Coloração/Tintura", "Hair Color/Dye", "Coloración/Tintura", CAMPOS_SERVICO_PADRAO), SUB("luzes_mechas", "Luzes/Mechas", "Highlights", "Luces/Mechas", CAMPOS_SERVICO_PADRAO),
        SUB("alisamento_progressiva", "Alisamento/Progressiva", "Straightening/Keratin Treatment", "Alisado/Keratina", CAMPOS_SERVICO_PADRAO), SUB("relaxamento", "Relaxamento", "Relaxer", "Relajado", CAMPOS_SERVICO_PADRAO),
        SUB("descoloracao", "Descoloração", "Bleaching", "Decoloración", CAMPOS_SERVICO_PADRAO), SUB("reconstrucao_capilar", "Reconstrução Capilar", "Hair Reconstruction", "Reconstrucción Capilar", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("tratamentos_capilares", "Tratamentos Capilares", "Hair Treatments", "Tratamientos Capilares", [
        SUB("hidratacao_salao", "Hidratação", "Deep Conditioning", "Hidratación", CAMPOS_SERVICO_PADRAO), SUB("cauterizacao", "Cauterização", "Cauterization", "Cauterización", CAMPOS_SERVICO_PADRAO),
        SUB("botox_capilar", "Botox Capilar", "Hair Botox", "Botox Capilar", CAMPOS_SERVICO_PADRAO), SUB("cronograma_capilar", "Cronograma Capilar", "Hair Care Schedule", "Cronograma Capilar", CAMPOS_SERVICO_PADRAO),
        SUB("escova_chapinha", "Escova/Chapinha", "Blowout/Flat Iron", "Brushing/Planchado", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("barba", "Barba", "Beard", "Barba", [
        SUB("barba_completa", "Barba Completa", "Full Beard Service", "Barba Completa", CAMPOS_SERVICO_PADRAO), SUB("barboterapia", "Barboterapia", "Beard Therapy", "Barboterapia", CAMPOS_SERVICO_PADRAO),
        SUB("desenho_barba", "Desenho de Barba", "Beard Design", "Diseño de Barba", CAMPOS_SERVICO_PADRAO), SUB("sobrancelha_masculina", "Sobrancelha Masculina", "Men's Eyebrow", "Cejas Masculinas", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("penteado_finalizacao", "Penteado e Finalização", "Hairstyling & Finishing", "Peinado y Finalización", [
        SUB("penteado_festa_noiva", "Penteado (Festa/Noiva)", "Hairstyling (Party/Bridal)", "Peinado (Fiesta/Novia)", CAMPOS_SERVICO_PADRAO), SUB("escova_modelada", "Escova Modelada", "Blowout Styling", "Brushing Modelado", CAMPOS_SERVICO_PADRAO),
        SUB("tranca", "Trança", "Braid", "Trenza", CAMPOS_SERVICO_PADRAO), SUB("maquiagem_salao", "Maquiagem", "Makeup", "Maquillaje", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("depilacao_sobrancelha_salao", "Depilação e Sobrancelha", "Hair Removal & Eyebrows", "Depilación y Cejas", [
        SUB("depilacao_cera", "Depilação com Cera", "Wax Hair Removal", "Depilación con Cera", CAMPOS_SERVICO_PADRAO), SUB("depilacao_linha", "Depilação com Linha", "Threading", "Depilación con Hilo", CAMPOS_SERVICO_PADRAO),
        SUB("design_sobrancelha_salao", "Design de Sobrancelha", "Eyebrow Design", "Diseño de Cejas", CAMPOS_SERVICO_PADRAO), SUB("henna_sobrancelha_salao", "Henna de Sobrancelha", "Eyebrow Henna", "Henna de Cejas", CAMPOS_SERVICO_PADRAO),
        SUB("depilacao_laser", "Depilação a Laser", "Laser Hair Removal", "Depilación Láser", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("massagem_bem_estar", "Massagem e Bem-estar", "Massage & Wellness", "Masaje y Bienestar", [
        SUB("massagem_relaxante", "Massagem Relaxante", "Relaxing Massage", "Masaje Relajante", CAMPOS_SERVICO_PADRAO), SUB("massagem_capilar", "Massagem Capilar", "Scalp Massage", "Masaje Capilar", CAMPOS_SERVICO_PADRAO),
        SUB("drenagem_facial_salao", "Drenagem Facial", "Facial Drainage", "Drenaje Facial", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("revenda_produtos_salao", "Revenda de Produtos", "Product Resale", "Reventa de Productos", [
        SUB("shampoo_condicionador_profissional", "Shampoo/Condicionador Profissional", "Professional Shampoo/Conditioner", "Champú/Acondicionador Profesional"),
        SUB("finalizador_leave_in_salao", "Finalizador/Leave-in", "Styling/Leave-in Product", "Finalizador/Leave-in"),
        SUB("mascara_tratamento_salao", "Máscara de Tratamento", "Treatment Mask", "Mascarilla de Tratamiento"), SUB("oleo_capilar_salao", "Óleo Capilar", "Hair Oil", "Aceite Capilar"),
        SUB("produto_coloracao_casa", "Produto de Coloração para Casa", "At-home Coloring Product", "Producto de Coloración para Casa"), SUB("kit_presente_salao", "Kit Presente", "Gift Set", "Kit de Regalo"),
      ]),
    ],
  },
  {
    value: "manicure_estetica", label: L("Manicure/Estética", "Nail Care/Aesthetics", "Manicura/Estética"), modo: "servico", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("manicure", "Manicure", "Manicure", "Manicura", [
        SUB("manicure_simples", "Manicure Simples", "Basic Manicure", "Manicura Simple", CAMPOS_SERVICO_PADRAO), SUB("manicure_esmaltacao_gel", "Manicure + Esmaltação em Gel", "Manicure + Gel Polish", "Manicura + Esmaltado en Gel", CAMPOS_SERVICO_PADRAO),
        SUB("troca_esmalte", "Troca de Esmalte", "Polish Change", "Cambio de Esmalte", CAMPOS_SERVICO_PADRAO), SUB("alongamento_unha", "Alongamento de Unha", "Nail Extension", "Alargamiento de Uñas", CAMPOS_SERVICO_PADRAO),
        SUB("manutencao_alongamento", "Manutenção de Alongamento", "Extension Maintenance", "Mantenimiento de Alargamiento", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("pedicure", "Pedicure", "Pedicure", "Pedicura", [
        SUB("pedicure_simples", "Pedicure Simples", "Basic Pedicure", "Pedicura Simple", CAMPOS_SERVICO_PADRAO), SUB("pedicure_esmaltacao_gel", "Pedicure + Esmaltação em Gel", "Pedicure + Gel Polish", "Pedicura + Esmaltado en Gel", CAMPOS_SERVICO_PADRAO),
        SUB("spa_pes", "Spa dos Pés", "Foot Spa", "Spa de Pies", CAMPOS_SERVICO_PADRAO), SUB("remocao_calo", "Remoção de Calo", "Callus Removal", "Remoción de Callos", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("design_nail_art", "Design e Nail Art", "Nail Design & Art", "Diseño y Nail Art", [
        SUB("nail_art_desenho", "Nail Art/Desenho", "Nail Art", "Nail Art/Diseño", CAMPOS_SERVICO_PADRAO), SUB("unha_francesinha", "Unha Francesinha", "French Manicure", "Uña Francesa", CAMPOS_SERVICO_PADRAO),
        SUB("unha_decorada_pedraria", "Unha Decorada com Pedraria", "Rhinestone Nail Design", "Uña Decorada con Piedras", CAMPOS_SERVICO_PADRAO), SUB("blindagem_unha", "Blindagem de Unha", "Nail Strengthening (Shielding)", "Blindaje de Uñas", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("sobrancelha_cilios", "Sobrancelha e Cílios", "Eyebrows & Eyelashes", "Cejas y Pestañas", [
        SUB("design_sobrancelha_manicure", "Design de Sobrancelha", "Eyebrow Design", "Diseño de Cejas", CAMPOS_SERVICO_PADRAO), SUB("henna_sobrancelha_manicure", "Henna de Sobrancelha", "Eyebrow Henna", "Henna de Cejas", CAMPOS_SERVICO_PADRAO),
        SUB("micropigmentacao", "Micropigmentação", "Micropigmentation", "Micropigmentación", CAMPOS_SERVICO_PADRAO), SUB("extensao_cilios", "Extensão de Cílios", "Eyelash Extension", "Extensión de Pestañas", CAMPOS_SERVICO_PADRAO),
        SUB("lash_lifting", "Lash Lifting", "Lash Lifting", "Lifting de Pestañas", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("estetica_facial", "Estética Facial", "Facial Aesthetics", "Estética Facial", [
        SUB("limpeza_pele", "Limpeza de Pele", "Facial Cleansing", "Limpieza Facial", CAMPOS_SERVICO_PADRAO), SUB("peeling", "Peeling", "Peeling", "Peeling", CAMPOS_SERVICO_PADRAO),
        SUB("hidratacao_facial", "Hidratação Facial", "Facial Hydration", "Hidratación Facial", CAMPOS_SERVICO_PADRAO), SUB("massagem_facial", "Massagem Facial", "Facial Massage", "Masaje Facial", CAMPOS_SERVICO_PADRAO),
        SUB("microagulhamento", "Microagulhamento", "Microneedling", "Microagujas", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("estetica_corporal", "Estética Corporal", "Body Aesthetics", "Estética Corporal", [
        SUB("massagem_modeladora", "Massagem Modeladora", "Body Contouring Massage", "Masaje Modelador", CAMPOS_SERVICO_PADRAO), SUB("drenagem_linfatica", "Drenagem Linfática", "Lymphatic Drainage", "Drenaje Linfático", CAMPOS_SERVICO_PADRAO),
        SUB("depilacao_manicure", "Depilação", "Hair Removal", "Depilación", CAMPOS_SERVICO_PADRAO), SUB("bronzeamento_artificial", "Bronzeamento Artificial", "Spray Tan", "Bronceado Artificial", CAMPOS_SERVICO_PADRAO),
        SUB("esfoliacao_corporal", "Esfoliação Corporal", "Body Exfoliation", "Exfoliación Corporal", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("revenda_produtos_manicure", "Revenda de Produtos", "Product Resale", "Reventa de Productos", [
        SUB("esmalte", "Esmalte", "Nail Polish", "Esmalte"), SUB("base_fortalecedor_unha", "Base/Fortalecedor de Unha", "Base Coat/Nail Strengthener", "Base/Fortalecedor de Uñas"),
        SUB("oleo_cuticular", "Óleo Cuticular", "Cuticle Oil", "Aceite de Cutículas"), SUB("kit_manicure", "Kit de Manicure", "Manicure Kit", "Kit de Manicura"),
        SUB("cosmetico_skincare_manicure", "Cosmético de Skincare", "Skincare Product", "Cosmético de Skincare"),
      ]),
    ],
  },
  {
    value: "servicos_tecnicos", label: L("Serviços Técnicos", "Technical Services", "Servicios Técnicos"), modo: "servico", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("eletrica_servico", "Elétrica", "Electrical", "Eléctrica", [
        SUB("instalacao_reparo_ponto_eletrico", "Instalação/Reparo de Ponto Elétrico", "Electrical Outlet Installation/Repair", "Instalación/Reparación de Punto Eléctrico", CAMPOS_SERVICO_PADRAO),
        SUB("troca_disjuntor_quadro", "Troca de Disjuntor/Quadro", "Breaker/Panel Replacement", "Cambio de Disyuntor/Tablero", CAMPOS_SERVICO_PADRAO),
        SUB("instalacao_chuveiro", "Instalação de Chuveiro", "Shower Heater Installation", "Instalación de Calefón/Ducha", CAMPOS_SERVICO_PADRAO),
        SUB("instalacao_ventilador_luminaria", "Instalação de Ventilador/Luminária", "Fan/Light Fixture Installation", "Instalación de Ventilador/Luminaria", CAMPOS_SERVICO_PADRAO),
        SUB("laudo_vistoria_eletrica", "Laudo/Vistoria Elétrica", "Electrical Inspection Report", "Informe/Inspección Eléctrica", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("hidraulica_servico", "Hidráulica", "Plumbing", "Plomería", [
        SUB("reparo_vazamento", "Reparo de Vazamento", "Leak Repair", "Reparación de Fuga", CAMPOS_SERVICO_PADRAO), SUB("desentupimento", "Desentupimento", "Drain Unclogging", "Destape de Cañería", CAMPOS_SERVICO_PADRAO),
        SUB("instalacao_torneira_registro", "Instalação de Torneira/Registro", "Faucet/Valve Installation", "Instalación de Grifo/Llave", CAMPOS_SERVICO_PADRAO),
        SUB("instalacao_caixa_agua_aquecedor", "Instalação de Caixa d'Água/Aquecedor", "Water Tank/Heater Installation", "Instalación de Tanque de Agua/Calentador", CAMPOS_SERVICO_PADRAO),
        SUB("troca_vaso_sanitario_servico", "Troca de Vaso Sanitário", "Toilet Replacement", "Cambio de Inodoro", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("eletrodomesticos_eletronicos_servico", "Eletrodomésticos e Eletrônicos", "Appliances & Electronics", "Electrodomésticos y Electrónicos", [
        SUB("conserto_geladeira_maquina_lavar", "Conserto de Geladeira/Máquina de Lavar", "Refrigerator/Washer Repair", "Reparación de Heladera/Lavarropas", CAMPOS_SERVICO_PADRAO),
        SUB("conserto_tv_som", "Conserto de TV/Som", "TV/Audio Repair", "Reparación de TV/Audio", CAMPOS_SERVICO_PADRAO),
        SUB("manutencao_celular_servico", "Manutenção de Celular", "Phone Repair", "Reparación de Celular", CAMPOS_SERVICO_PADRAO),
        SUB("manutencao_computador_servico", "Manutenção de Computador", "Computer Maintenance", "Mantenimiento de Computadora", CAMPOS_SERVICO_PADRAO),
        SUB("instalacao_ar_condicionado", "Instalação de Ar-condicionado", "AC Installation", "Instalación de Aire Acondicionado", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("montagem_marcenaria_servico", "Montagem e Marcenaria", "Assembly & Woodworking", "Armado y Carpintería", [
        SUB("montagem_moveis", "Montagem de Móveis", "Furniture Assembly", "Armado de Muebles", CAMPOS_SERVICO_PADRAO),
        SUB("instalacao_prateleira_suporte", "Instalação de Prateleira/Suporte", "Shelf/Bracket Installation", "Instalación de Estante/Soporte", CAMPOS_SERVICO_PADRAO),
        SUB("conserto_porta_fechadura_servico", "Conserto de Porta/Fechadura", "Door/Lock Repair", "Reparación de Puerta/Cerradura", CAMPOS_SERVICO_PADRAO),
        SUB("marcenaria_sob_medida", "Marcenaria sob Medida", "Custom Woodworking", "Carpintería a Medida", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("chaveiro", "Chaveiro", "Locksmith", "Cerrajería", [
        SUB("abertura_fechadura", "Abertura de Fechadura", "Lock Opening", "Apertura de Cerradura", CAMPOS_SERVICO_PADRAO), SUB("copia_chave", "Cópia de Chave", "Key Copy", "Copia de Llave", CAMPOS_SERVICO_PADRAO),
        SUB("troca_fechadura_segredo", "Troca de Fechadura/Segredo", "Lock/Cylinder Replacement", "Cambio de Cerradura/Combinación", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("visita_tecnica_diagnostico", "Visita Técnica e Diagnóstico", "Technical Visit & Diagnosis", "Visita Técnica y Diagnóstico", [
        SUB("visita_tecnica_orcamento", "Visita Técnica/Orçamento", "Technical Visit/Quote", "Visita Técnica/Presupuesto", CAMPOS_SERVICO_PADRAO),
        SUB("vistoria_laudo_tecnico", "Vistoria/Laudo Técnico", "Inspection/Technical Report", "Inspección/Informe Técnico", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("manutencao_preventiva_contrato", "Manutenção Preventiva/Contrato", "Preventive Maintenance/Contract", "Mantenimiento Preventivo/Contrato", [
        SUB("contrato_mensal_manutencao", "Contrato Mensal de Manutenção", "Monthly Maintenance Contract", "Contrato Mensual de Mantenimiento", CAMPOS_SERVICO_PADRAO),
        SUB("limpeza_ar_condicionado", "Limpeza de Ar-condicionado", "AC Cleaning", "Limpieza de Aire Acondicionado", CAMPOS_SERVICO_PADRAO),
        SUB("revisao_eletrica_periodica", "Revisão Elétrica Periódica", "Periodic Electrical Checkup", "Revisión Eléctrica Periódica", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("revenda_pecas_materiais", "Revenda de Peças e Materiais", "Parts & Materials Resale", "Reventa de Piezas y Materiales", [
        SUB("disjuntor_tomada_avulsa", "Disjuntor/Tomada Avulsa", "Individual Breaker/Outlet", "Disyuntor/Toma Suelto"), SUB("torneira_sifao", "Torneira/Sifão", "Faucet/Trap", "Grifo/Sifón"),
        SUB("fechadura_chave_branco", "Fechadura/Chave em Branco", "Lock/Blank Key", "Cerradura/Llave en Blanco"), SUB("cabo_adaptador_servico", "Cabo/Adaptador", "Cable/Adapter", "Cable/Adaptador"),
        SUB("kit_reparo", "Kit de Reparo", "Repair Kit", "Kit de Reparación"),
      ]),
    ],
  },
  {
    value: "servicos_domesticos", label: L("Serviços Domésticos", "Domestic Services", "Servicios Domésticos"), modo: "servico", divisaoPrimaria: "nao_alimentos",
    categorias: [
      CAT("limpeza_residencial", "Limpeza Residencial", "House Cleaning", "Limpieza del Hogar", [
        SUB("diaria_padrao", "Diária Padrão", "Standard Day Rate", "Tarifa Diaria Estándar", CAMPOS_SERVICO_PADRAO), SUB("faxina_completa_pesada", "Faxina Completa/Pesada", "Deep Cleaning", "Limpieza Profunda", CAMPOS_SERVICO_PADRAO),
        SUB("limpeza_pos_obra", "Limpeza Pós-obra", "Post-construction Cleaning", "Limpieza Posobra", CAMPOS_SERVICO_PADRAO), SUB("limpeza_estofados_tapete", "Limpeza de Estofados/Tapete", "Upholstery/Carpet Cleaning", "Limpieza de Tapizados/Alfombras", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("passadoria", "Passadoria", "Ironing", "Planchado", [
        SUB("passadoria_peca", "Passadoria por Peça", "Ironing per Item", "Planchado por Prenda", CAMPOS_SERVICO_PADRAO), SUB("passadoria_cesto_kg", "Passadoria por Cesto/Kg", "Ironing per Basket/Kg", "Planchado por Canasto/Kg", CAMPOS_SERVICO_PADRAO),
        SUB("passadoria_domicilio", "Passadoria a Domicílio", "In-home Ironing", "Planchado a Domicilio", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("jardinagem", "Jardinagem", "Gardening", "Jardinería", [
        SUB("manutencao_jardim_diaria", "Manutenção de Jardim (Diária)", "Garden Maintenance (Day Rate)", "Mantenimiento de Jardín (Diaria)", CAMPOS_SERVICO_PADRAO),
        SUB("poda_corte_grama", "Poda/Corte de Grama", "Pruning/Lawn Mowing", "Poda/Corte de Césped", CAMPOS_SERVICO_PADRAO),
        SUB("paisagismo_pontual", "Paisagismo Pontual", "One-time Landscaping", "Paisajismo Puntual", CAMPOS_SERVICO_PADRAO), SUB("manutencao_mensal_jardim", "Manutenção Mensal", "Monthly Maintenance", "Mantenimiento Mensual", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("cuidados_companhia", "Cuidados e Companhia", "Care & Companionship", "Cuidados y Compañía", [
        SUB("cuidador_idoso_diaria", "Cuidador de Idoso (Diária)", "Elderly Caregiver (Day Rate)", "Cuidador de Adulto Mayor (Diaria)", CAMPOS_SERVICO_PADRAO),
        SUB("cuidador_idoso_plantao", "Cuidador de Idoso (Período/Plantão)", "Elderly Caregiver (Shift)", "Cuidador de Adulto Mayor (Turno)", CAMPOS_SERVICO_PADRAO),
        SUB("baba", "Babá", "Babysitter", "Niñera", CAMPOS_SERVICO_PADRAO), SUB("acompanhante_hospitalar", "Acompanhante Hospitalar", "Hospital Companion", "Acompañante Hospitalario", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("costura", "Costura e Ajustes", "Sewing & Alterations", "Costura y Ajustes", [
        SUB("ajuste_roupa", "Ajuste de Roupa", "Clothing Alteration", "Ajuste de Ropa", CAMPOS_SERVICO_PADRAO), SUB("reparo_conserto", "Reparo/Conserto", "Repair/Mending", "Reparación/Arreglo", CAMPOS_SERVICO_PADRAO),
        SUB("costura_sob_medida", "Costura sob Medida", "Custom Sewing", "Costura a Medida", CAMPOS_SERVICO_PADRAO), SUB("bordado_personalizado", "Bordado Personalizado", "Custom Embroidery", "Bordado Personalizado", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("revenda_produtos_domesticos", "Revenda de Produtos", "Product Resale", "Reventa de Productos", [
        SUB("kit_limpeza", "Kit de Limpeza", "Cleaning Kit", "Kit de Limpieza"), SUB("aviamento_linha_costura", "Aviamento/Linha para Costura", "Sewing Notions/Thread", "Mercería/Hilo para Costura"),
        SUB("produto_passadoria_amido", "Produto de Passadoria (Amido/Goma)", "Ironing Product (Starch)", "Producto de Planchado (Almidón)"), SUB("organizador_domestico", "Organizador Doméstico", "Home Organizer", "Organizador Doméstico"),
      ]),
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
