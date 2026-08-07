// 🦅 AXIOMA AI.TECH — PDV: taxonomia única de Nicho → Categoria → Sub-nicho
// Fonte ÚNICA da verdade da navegação e do cadastro do PDV (Fase 1 + Fase 2).
// Nunca reescrever esta árvore em outro arquivo — quem precisar de nicho,
// categoria, sub-nicho ou dos campos de cadastro importa daqui. Categoria só
// existe dentro de um nicho (NichoPdvDef.categorias), sub-nicho só existe
// dentro de uma categoria (CategoriaPdv.subNichos) — a estrutura de tipos por
// si só impede categoria órfã ou sub-nicho solto.
//
// Reaproveita, só pelo VALOR da string, os 6 segmentos do Estoque que mapeiam
// 1:1 com um nicho do PDV (mercado, farmacia, autopecas, papelaria, pet,
// eletronicos) + genérico. Os 10 segmentos do Estoque (lib/categoriaInteligente.ts)
// continuam 100% intocados — vestuario, restaurante_food e servicos ficam de
// fora desta árvore de propósito (decisão registrada em STATUS-AXIOMA.md):
// são negócios finos demais pra caber num nicho só, e o PDV ganha nichos
// NOVOS e mais específicos no lugar, sem mexer no que já existe.
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
// FASE 2 — campos por sub-nicho: cada SubNichoPdv pode declarar `campos`
// (CampoNicho[], MESMO tipo já usado pelo Estoque em categoriaInteligente.ts
// — importado, nunca redeclarado). É o sub-nicho, e somente ele, que decide
// quais campos aparecem no cadastro — o formulário nunca olha pra categoria
// ou nicho pra montar esses campos extras, só pro bloco (produto/misto/
// serviço) que já é decidido por NichoPdvDef.modo. Os bundles CB()/CAMPO_*
// abaixo são só pra não repetir a mesma definição de campo dezenas de vezes;
// quem efetivamente "declara" o campo pra um sub-nicho é sempre o próprio nó.

import type { Idioma } from "./translations";
import { CHAVE_PERECIVEL, type CampoNicho } from "./categoriaInteligente";

export type ModoNicho = "produto" | "misto" | "servico";

export type SubNichoPdv = { value: string; label: Record<Idioma, string>; campos?: CampoNicho[] };
export type CategoriaPdv = { value: string; label: Record<Idioma, string>; subNichos: SubNichoPdv[] };

export type NichoPdv =
  | "mercado" | "farmacia" | "autopecas" | "papelaria" | "pet" | "eletronicos" | "generico"
  | "roupas" | "calcados_tenis" | "padaria_confeitaria" | "cosmeticos_perfumaria" | "bebidas_adega"
  | "lanchonete" | "pizzaria" | "sorveteria_acai" | "marmita_comida_pronta"
  | "salao_barbearia" | "manicure_estetica" | "servicos_tecnicos" | "servicos_domesticos";

export type NichoPdvDef = { value: NichoPdv; label: Record<Idioma, string>; modo: ModoNicho; categorias: CategoriaPdv[] };

const L = (pt: string, en: string, es: string): Record<Idioma, string> => ({ pt, en, es });
const SUB = (value: string, pt: string, en: string, es: string, campos: CampoNicho[] = []): SubNichoPdv => ({ value, label: L(pt, en, es), campos });
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
// serviço — é exatamente o que o Elias pediu ("duração e forma de cobrança,
// por hora/fechado/diária/peça"), nunca o modelo de produto.
const CAMPOS_SERVICO_PADRAO: CampoNicho[] = [
  CB("tempoEstimado", "text", "Duração Estimada", "Estimated Duration", "Duración Estimada"),
  CB("formaCobranca", "select", "Forma de Cobrança", "Billing Method", "Forma de Cobro", [
    { value: "hora", label: L("Por Hora", "Per Hour", "Por Hora") },
    { value: "fechado", label: L("Valor Fechado", "Flat Rate", "Precio Cerrado") },
    { value: "diaria", label: L("Diária", "Daily Rate", "Diaria") },
    { value: "peca", label: L("Por Peça/Serviço", "Per Piece/Job", "Por Pieza/Servicio") },
  ]),
];

export const NICHOS_PDV: NichoPdvDef[] = [
  // ============================================================================
  // MODO PRODUTO — reaproveitam o segmento existente do Estoque (dado real)
  // ============================================================================
  {
    value: "mercado", label: L("Mercado/Mercearia", "Grocery Store", "Mercado/Almacén"), modo: "produto",
    categorias: [
      CAT("bebidas", "Bebidas", "Beverages", "Bebidas", [
        SUB("refrigerante", "Refrigerante", "Soda", "Refresco", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
        SUB("cerveja", "Cerveja", "Beer", "Cerveza", [CAMPO_PERECIVEL, CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]),
        SUB("agua", "Água", "Water", "Agua", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
        SUB("suco", "Suco", "Juice", "Jugo", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
      ]),
      CAT("frios", "Frios", "Deli", "Fiambres", [
        SUB("queijo", "Queijo", "Cheese", "Queso", [CAMPO_PERECIVEL]),
        SUB("embutido", "Presunto/Embutido", "Ham/Cold Cuts", "Jamón/Fiambre", [CAMPO_PERECIVEL]),
      ]),
      CAT("laticinios", "Laticínios", "Dairy", "Lácteos", [
        SUB("leite", "Leite", "Milk", "Leche", [CAMPO_PERECIVEL, CAMPO_VOLUME]),
        SUB("iogurte", "Iogurte", "Yogurt", "Yogur", [CAMPO_PERECIVEL]),
        SUB("manteiga_requeijao", "Manteiga/Requeijão", "Butter/Cream Cheese", "Mantequilla/Queso Crema", [CAMPO_PERECIVEL]),
      ]),
      CAT("higiene", "Higiene", "Personal Care", "Higiene", [
        SUB("sabonete", "Sabonete", "Soap", "Jabón"),
        SUB("higiene_bucal", "Higiene Bucal", "Oral Care", "Higiene Bucal"),
      ]),
      CAT("limpeza", "Limpeza", "Cleaning", "Limpieza", [
        SUB("detergente", "Detergente", "Detergent", "Detergente"),
        SUB("desinfetante_amaciante", "Desinfetante/Amaciante", "Disinfectant/Softener", "Desinfectante/Suavizante"),
      ]),
      CAT("mercearia", "Mercearia", "Grocery", "Almacén", [
        SUB("graos_massas", "Grãos/Massas", "Grains/Pasta", "Granos/Pastas"),
        SUB("oleo_farinha_acucar_sal", "Óleo/Farinha/Açúcar/Sal", "Oil/Flour/Sugar/Salt", "Aceite/Harina/Azúcar/Sal"),
      ]),
      CAT("hortifruti", "Hortifruti", "Produce", "Frutas y Verduras", [
        SUB("fruta", "Fruta", "Fruit", "Fruta", [CAMPO_PERECIVEL]),
        SUB("verdura_legume", "Verdura/Legume", "Vegetable", "Verdura", [CAMPO_PERECIVEL]),
      ]),
    ],
  },
  {
    value: "farmacia", label: L("Farmácia", "Pharmacy", "Farmacia"), modo: "produto",
    categorias: [
      CAT("medicamentos", "Medicamentos", "Medications", "Medicamentos", [
        SUB("isento_receita", "Isento de Receita", "Over-the-counter", "Sin Receta", [CAMPO_PERECIVEL]),
        SUB("com_retencao", "Com Retenção (tarja)", "Prescription Retained", "Con Retención", [CAMPO_PERECIVEL, CAMPO_NECESSITA_RECEITA]),
        SUB("controlado", "Controlado (SNGPC)", "Controlled (SNGPC)", "Controlado (SNGPC)", [CAMPO_PERECIVEL, CAMPO_NECESSITA_RECEITA]),
      ]),
      CAT("dermocosmetico", "Dermocosmético", "Dermocosmetics", "Dermocosmética", [
        SUB("protetor_solar", "Protetor Solar", "Sunscreen", "Protector Solar", [CAMPO_PERECIVEL]),
        SUB("hidratante_antirrugas", "Hidratante/Antirrugas", "Moisturizer/Anti-aging", "Hidratante/Antiarrugas", [CAMPO_PERECIVEL]),
      ]),
      CAT("higiene_beleza", "Higiene e Beleza", "Beauty & Care", "Higiene y Belleza", [
        SUB("sabonete_shampoo", "Sabonete/Shampoo", "Soap/Shampoo", "Jabón/Champú"),
        SUB("fralda_absorvente", "Fralda/Absorvente", "Diaper/Pad", "Pañal/Toalla"),
        SUB("perfumaria", "Perfumaria", "Fragrance", "Perfumería"),
      ]),
      CAT("vitaminas_suplementos", "Vitaminas/Suplementos", "Vitamins/Supplements", "Vitaminas/Suplementos", [
        SUB("vitamina_mineral", "Vitamina/Mineral", "Vitamin/Mineral", "Vitamina/Mineral", [CAMPO_PERECIVEL]),
        SUB("suplemento_esportivo", "Suplemento Esportivo", "Sports Supplement", "Suplemento Deportivo", [CAMPO_PERECIVEL]),
      ]),
    ],
  },
  {
    value: "autopecas", label: L("Autopeças", "Auto Parts", "Autopartes"), modo: "produto",
    categorias: [
      CAT("motor", "Motor", "Engine", "Motor", [SUB("filtro", "Filtro", "Filter", "Filtro"), SUB("correia_vela", "Correia/Vela de Ignição", "Belt/Spark Plug", "Correa/Bujía")]),
      CAT("freios", "Freios", "Brakes", "Frenos", [SUB("pastilha", "Pastilha", "Brake Pad", "Pastilla"), SUB("disco_lona", "Disco/Lona", "Disc/Shoe", "Disco/Balata")]),
      CAT("suspensao", "Suspensão", "Suspension", "Suspensión", [SUB("amortecedor", "Amortecedor", "Shock Absorber", "Amortiguador"), SUB("mola_bandeja", "Mola/Bandeja", "Spring/Control Arm", "Resorte/Horquilla")]),
      CAT("eletrica", "Elétrica", "Electrical", "Eléctrica", [SUB("bateria", "Bateria", "Battery", "Batería", [CAMPO_GARANTIA_MESES]), SUB("lampada_farol", "Lâmpada/Farol", "Bulb/Headlight", "Bombilla/Faro")]),
      CAT("pneus_rodas", "Pneus e Rodas", "Tires & Wheels", "Neumáticos y Ruedas", [SUB("pneu", "Pneu", "Tire", "Neumático", [CAMPO_GARANTIA_MESES]), SUB("roda_calota", "Roda/Calota", "Wheel/Hubcap", "Rueda/Tapacubos")]),
    ],
  },
  {
    value: "papelaria", label: L("Papelaria", "Stationery", "Papelería"), modo: "produto",
    categorias: [
      CAT("escrita", "Escrita", "Writing", "Escritura", [SUB("caneta_lapis", "Caneta/Lápis", "Pen/Pencil", "Bolígrafo/Lápiz"), SUB("marca_texto", "Marca-texto", "Highlighter", "Marcador")]),
      CAT("cadernos_papel", "Cadernos e Papel", "Notebooks & Paper", "Cuadernos y Papel", [SUB("caderno", "Caderno", "Notebook", "Cuaderno"), SUB("papel_sulfite", "Papel Sulfite", "Printer Paper", "Papel Bond")]),
      CAT("escritorio", "Escritório", "Office", "Oficina", [SUB("grampeador_clips", "Grampeador/Clips", "Stapler/Clips", "Engrapadora/Clips"), SUB("pasta_envelope", "Pasta/Envelope", "Folder/Envelope", "Carpeta/Sobre")]),
      CAT("arte_escolar", "Arte e Escolar", "Art & School", "Arte y Escolar", [SUB("tinta_cola_tesoura", "Tinta/Cola/Tesoura", "Paint/Glue/Scissors", "Pintura/Pegamento/Tijera")]),
    ],
  },
  {
    value: "pet", label: L("Pet", "Pet", "Mascotas"), modo: "produto",
    categorias: [
      CAT("racao", "Ração", "Pet Food", "Alimento para Mascotas", [
        SUB("cao", "Cão", "Dog", "Perro", [CAMPO_PERECIVEL]), SUB("gato", "Gato", "Cat", "Gato", [CAMPO_PERECIVEL]), SUB("outros", "Outros", "Other", "Otro", [CAMPO_PERECIVEL]),
      ]),
      CAT("higiene_pet", "Higiene Pet", "Pet Hygiene", "Higiene para Mascotas", [SUB("shampoo_pet", "Shampoo Pet", "Pet Shampoo", "Champú Mascota"), SUB("areia_sanitaria", "Areia Sanitária", "Litter", "Arena Sanitaria")]),
      CAT("acessorios_pet", "Acessórios Pet", "Pet Accessories", "Accesorios para Mascotas", [SUB("coleira_guia", "Coleira/Guia", "Collar/Leash", "Collar/Correa"), SUB("brinquedo", "Brinquedo", "Toy", "Juguete")]),
      CAT("saude_pet", "Saúde Pet", "Pet Health", "Salud para Mascotas", [SUB("antipulgas_vermifugo", "Antipulgas/Vermífugo", "Flea/Dewormer", "Antipulgas/Desparasitante", [CAMPO_PERECIVEL])]),
    ],
  },
  {
    value: "eletronicos", label: L("Eletrônicos", "Electronics", "Electrónica"), modo: "produto",
    categorias: [
      CAT("celulares_acessorios", "Celulares e Acessórios", "Phones & Accessories", "Celulares y Accesorios", [
        SUB("celular", "Celular", "Phone", "Celular", [CAMPO_GARANTIA_MESES]), SUB("acessorio", "Capinha/Carregador/Fone", "Case/Charger/Headphone", "Funda/Cargador/Audífono"),
      ]),
      CAT("informatica", "Informática", "Computers", "Informática", [SUB("notebook_pc", "Notebook/PC", "Laptop/PC", "Notebook/PC", [CAMPO_GARANTIA_MESES]), SUB("periferico", "Periférico", "Peripheral", "Periférico")]),
      CAT("audio_video", "Áudio e Vídeo", "Audio & Video", "Audio y Video", [SUB("som_fone", "Caixa de Som/Fone", "Speaker/Headphone", "Altavoz/Audífono", [CAMPO_GARANTIA_MESES]), SUB("tv", "Televisão", "TV", "Televisor", [CAMPO_GARANTIA_MESES])]),
      CAT("eletrodomesticos", "Eletrodomésticos", "Home Appliances", "Electrodomésticos", [SUB("linha_branca", "Linha Branca", "Major Appliance", "Línea Blanca", [CAMPO_GARANTIA_MESES]), SUB("pequenos_eletros", "Pequenos Eletros", "Small Appliance", "Pequeño Electrodoméstico", [CAMPO_GARANTIA_MESES])]),
    ],
  },

  // ============================================================================
  // MODO PRODUTO — novos (sem equivalente hoje no Estoque, sem dado ainda)
  // ============================================================================
  {
    value: "padaria_confeitaria", label: L("Padaria/Confeitaria", "Bakery/Pastry Shop", "Panadería/Pastelería"), modo: "produto",
    categorias: [
      CAT("paes", "Pães", "Bread", "Panes", [SUB("pao_frances", "Pão Francês", "French Bread", "Pan Francés", [CAMPO_PERECIVEL]), SUB("pao_doce_especial", "Pão Doce/Especial", "Sweet/Specialty Bread", "Pan Dulce/Especial", [CAMPO_PERECIVEL])]),
      CAT("confeitaria", "Confeitaria", "Pastry", "Pastelería", [SUB("bolo", "Bolo", "Cake", "Torta", [CAMPO_PERECIVEL]), SUB("salgado", "Salgado", "Savory Pastry", "Salado", [CAMPO_PERECIVEL])]),
      CAT("bebidas_consumo_local", "Bebidas", "Beverages", "Bebidas", [SUB("cafe_suco", "Café/Suco", "Coffee/Juice", "Café/Jugo", [CAMPO_PERECIVEL])]),
    ],
  },
  {
    value: "roupas", label: L("Roupas", "Apparel", "Ropa"), modo: "produto",
    categorias: [
      CAT("camisetas", "Camisetas", "T-Shirts", "Camisetas", [
        SUB("masculina", "Masculina", "Men's", "Masculina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("feminina", "Feminina", "Women's", "Femenina", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
        SUB("infantil", "Infantil", "Kids", "Infantil", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]),
      ]),
      CAT("calcas", "Calças", "Pants", "Pantalones", [SUB("jeans", "Jeans", "Jeans", "Jeans", [CAMPO_TAMANHO_ROUPA, CAMPO_COR]), SUB("legging_moletom", "Legging/Moletom", "Leggings/Sweatpants", "Legging/Buzo", [CAMPO_TAMANHO_ROUPA, CAMPO_COR])]),
      CAT("acessorios_vestuario", "Acessórios", "Accessories", "Accesorios", [SUB("cinto_bone_bolsa", "Cinto/Boné/Bolsa", "Belt/Cap/Bag", "Cinturón/Gorra/Bolso", [CAMPO_COR])]),
    ],
  },
  {
    value: "calcados_tenis", label: L("Calçados/Tênis", "Footwear", "Calzado"), modo: "produto",
    categorias: [
      CAT("tenis", "Tênis", "Sneakers", "Zapatillas", [
        SUB("esportivo", "Esportivo", "Athletic", "Deportivo", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("casual", "Casual", "Casual", "Casual", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
      CAT("sapato_sandalia", "Sapato/Sandália", "Shoes/Sandals", "Zapato/Sandalia", [
        SUB("social", "Social", "Dress Shoe", "Formal", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
        SUB("chinelo_sandalia", "Chinelo/Sandália", "Flip-flop/Sandal", "Chancla/Sandalia", [CAMPO_NUMERACAO_CALCADO, CAMPO_COR]),
      ]),
    ],
  },
  {
    value: "cosmeticos_perfumaria", label: L("Cosméticos/Perfumaria", "Cosmetics/Perfumery", "Cosméticos/Perfumería"), modo: "produto",
    categorias: [
      CAT("maquiagem", "Maquiagem", "Makeup", "Maquillaje", [SUB("rosto", "Rosto", "Face", "Rostro", [CAMPO_PERECIVEL]), SUB("olhos_labios", "Olhos/Lábios", "Eyes/Lips", "Ojos/Labios", [CAMPO_PERECIVEL])]),
      CAT("perfumaria_cosm", "Perfumaria", "Fragrance", "Perfumería", [SUB("perfume", "Perfume", "Perfume", "Perfume"), SUB("colonia", "Colônia", "Cologne", "Colonia")]),
      CAT("skincare", "Skincare", "Skincare", "Cuidado de la Piel", [SUB("hidratante_skincare", "Hidratante", "Moisturizer", "Hidratante", [CAMPO_PERECIVEL]), SUB("protetor_solar_skincare", "Protetor Solar", "Sunscreen", "Protector Solar", [CAMPO_PERECIVEL])]),
    ],
  },
  {
    value: "bebidas_adega", label: L("Bebidas/Adega", "Beverages/Wine Shop", "Bebidas/Vinoteca"), modo: "produto",
    categorias: [
      CAT("vinho", "Vinho", "Wine", "Vino", [SUB("tinto", "Tinto", "Red", "Tinto", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("branco_rose", "Branco/Rosé", "White/Rosé", "Blanco/Rosado", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO])]),
      CAT("destilado", "Destilado", "Spirits", "Destilado", [SUB("whisky_vodka_gin", "Whisky/Vodka/Gin", "Whisky/Vodka/Gin", "Whisky/Vodka/Gin", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO])]),
      CAT("cerveja_adega", "Cerveja", "Beer", "Cerveza", [SUB("artesanal", "Artesanal", "Craft", "Artesanal", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO]), SUB("comercial", "Comercial", "Mainstream", "Comercial", [CAMPO_VOLUME, CAMPO_TEOR_ALCOOLICO])]),
    ],
  },

  // ============================================================================
  // MODO MISTO — food service granular (restaurante_food do Estoque intocado)
  // ============================================================================
  {
    value: "lanchonete", label: L("Lanchonete", "Snack Bar", "Cafetería"), modo: "misto",
    categorias: [
      CAT("insumos_lanchonete", "Insumos", "Raw Ingredients", "Insumos", [SUB("pao_carne_queijo", "Pão/Carne/Queijo", "Bread/Meat/Cheese", "Pan/Carne/Queso", [CAMPO_PERECIVEL])]),
      CAT("bebidas_lanchonete", "Bebidas", "Beverages", "Bebidas", [SUB("refrigerante_suco", "Refrigerante/Suco", "Soda/Juice", "Refresco/Jugo", [CAMPO_PERECIVEL])]),
      CAT("descartaveis_lanchonete", "Descartáveis", "Disposables", "Desechables", [SUB("embalagem_guardanapo", "Embalagem/Guardanapo", "Packaging/Napkin", "Empaque/Servilleta")]),
    ],
  },
  {
    value: "pizzaria", label: L("Pizzaria", "Pizzeria", "Pizzería"), modo: "misto",
    categorias: [
      CAT("insumos_pizzaria", "Insumos", "Raw Ingredients", "Insumos", [SUB("massa_molho_queijo", "Massa/Molho/Queijo", "Dough/Sauce/Cheese", "Masa/Salsa/Queso", [CAMPO_PERECIVEL])]),
      CAT("embalagens_pizzaria", "Embalagens", "Packaging", "Empaques", [SUB("caixa_pizza", "Caixa de Pizza", "Pizza Box", "Caja de Pizza")]),
    ],
  },
  {
    value: "sorveteria_acai", label: L("Sorveteria/Açaí", "Ice Cream/Açaí Shop", "Heladería/Açaí"), modo: "misto",
    categorias: [
      CAT("insumos_sorveteria", "Insumos", "Raw Ingredients", "Insumos", [
        SUB("sorvete_acai_base", "Sorvete/Açaí Base", "Ice Cream/Açaí Base", "Helado/Açaí Base", [CAMPO_PERECIVEL]),
        SUB("cobertura_complemento", "Cobertura/Complemento", "Topping", "Cobertura/Complemento", [CAMPO_PERECIVEL]),
      ]),
      CAT("descartaveis_sorveteria", "Descartáveis", "Disposables", "Desechables", [SUB("copo_casquinha", "Copo/Casquinha", "Cup/Cone", "Vaso/Cono")]),
    ],
  },
  {
    value: "marmita_comida_pronta", label: L("Marmita/Comida Pronta", "Meal Prep/Ready Food", "Vianda/Comida Preparada"), modo: "misto",
    categorias: [
      CAT("insumos_marmita", "Insumos", "Raw Ingredients", "Insumos", [SUB("proteina_guarnicao", "Proteína/Guarnição", "Protein/Side", "Proteína/Guarnición", [CAMPO_PERECIVEL])]),
      CAT("embalagens_marmita", "Embalagens", "Packaging", "Empaques", [SUB("marmita_talher", "Marmita/Talher Descartável", "Container/Disposable Cutlery", "Vianda/Cubiertos Desechables")]),
    ],
  },

  // ============================================================================
  // MODO SERVIÇO — sem EAN, sem estoque, sem validade (servicos do Estoque intocado)
  // ============================================================================
  {
    value: "salao_barbearia", label: L("Salão/Barbearia", "Salon/Barbershop", "Salón/Barbería"), modo: "servico",
    categorias: [
      CAT("corte", "Corte", "Haircut", "Corte", [SUB("corte_masculino", "Corte Masculino", "Men's Haircut", "Corte Masculino", CAMPOS_SERVICO_PADRAO), SUB("corte_feminino", "Corte Feminino", "Women's Haircut", "Corte Femenino", CAMPOS_SERVICO_PADRAO)]),
      CAT("coloracao", "Coloração", "Coloring", "Coloración", [SUB("tintura", "Tintura", "Hair Dye", "Tintura", CAMPOS_SERVICO_PADRAO), SUB("luzes_mechas", "Luzes/Mechas", "Highlights", "Luces/Mechas", CAMPOS_SERVICO_PADRAO)]),
      CAT("barba", "Barba", "Beard", "Barba", [SUB("barba_completa", "Barba Completa", "Full Beard Service", "Barba Completa", CAMPOS_SERVICO_PADRAO)]),
    ],
  },
  {
    value: "manicure_estetica", label: L("Manicure/Estética", "Nail Care/Aesthetics", "Manicura/Estética"), modo: "servico",
    categorias: [
      CAT("manicure_pedicure", "Manicure/Pedicure", "Manicure/Pedicure", "Manicura/Pedicura", [
        SUB("manicure_simples", "Manicure Simples", "Basic Manicure", "Manicura Simple", CAMPOS_SERVICO_PADRAO),
        SUB("pedicure_simples", "Pedicure Simples", "Basic Pedicure", "Pedicura Simple", CAMPOS_SERVICO_PADRAO),
      ]),
      CAT("estetica_facial", "Estética Facial", "Facial Aesthetics", "Estética Facial", [SUB("limpeza_pele", "Limpeza de Pele", "Facial Cleansing", "Limpieza Facial", CAMPOS_SERVICO_PADRAO)]),
    ],
  },
  {
    value: "servicos_tecnicos", label: L("Serviços Técnicos", "Technical Services", "Servicios Técnicos"), modo: "servico",
    categorias: [
      CAT("eletrica_servico", "Elétrica", "Electrical", "Eléctrica", [SUB("instalacao_reparo_eletrico", "Instalação/Reparo", "Installation/Repair", "Instalación/Reparación", CAMPOS_SERVICO_PADRAO)]),
      CAT("hidraulica_servico", "Hidráulica", "Plumbing", "Plomería", [SUB("instalacao_reparo_hidraulico", "Instalação/Reparo", "Installation/Repair", "Instalación/Reparación", CAMPOS_SERVICO_PADRAO)]),
    ],
  },
  {
    value: "servicos_domesticos", label: L("Serviços Domésticos", "Domestic Services", "Servicios Domésticos"), modo: "servico",
    categorias: [
      CAT("diarista", "Diarista", "House Cleaning", "Limpieza del Hogar", [SUB("diaria_padrao", "Diária Padrão", "Standard Day Rate", "Tarifa Diaria Estándar", CAMPOS_SERVICO_PADRAO)]),
      CAT("costura", "Costura", "Sewing", "Costura", [SUB("ajuste_reparo", "Ajuste/Reparo", "Alteration/Repair", "Ajuste/Reparación", CAMPOS_SERVICO_PADRAO)]),
    ],
  },

  // ============================================================================
  // GENÉRICO — reaproveita o segmento existente, sem categoria fixa
  // ============================================================================
  { value: "generico", label: L("Genérico", "Generic", "Genérico"), modo: "produto", categorias: [] },
];

// ============================================================================
// LOOKUPS — únicas funções de acesso à árvore (nunca reconstruir em outro arquivo)
// ============================================================================

export function buscarNicho(nicho: string): NichoPdvDef | undefined {
  return NICHOS_PDV.find((n) => n.value === nicho);
}

export function buscarCategoria(nicho: string, categoria: string): CategoriaPdv | undefined {
  return buscarNicho(nicho)?.categorias.find((c) => c.value === categoria);
}

export function buscarSubNicho(nicho: string, categoria: string, subNicho: string): SubNichoPdv | undefined {
  return buscarCategoria(nicho, categoria)?.subNichos.find((s) => s.value === subNicho);
}
