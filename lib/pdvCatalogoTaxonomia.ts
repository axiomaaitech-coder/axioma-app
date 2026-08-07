// 🦅 AXIOMA AI.TECH — PDV: taxonomia única de Nicho → Categoria → Sub-nicho
// Fonte ÚNICA da verdade da navegação do Catálogo do PDV (Fase 1). Nunca
// reescrever esta árvore em outro arquivo — quem precisar de nicho, categoria
// ou sub-nicho importa daqui. Categoria só existe dentro de um nicho
// (NichoPdvDef.categorias), sub-nicho só existe dentro de uma categoria
// (CategoriaPdv.subNichos) — a estrutura de tipos por si só impede categoria
// órfã ou sub-nicho solto, não tem como declarar um fora do outro.
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
// CHECK constraint no banco — zero ALTER TABLE) com uma string nova, nunca
// usada antes, então não colide com nada que o Estoque já lê.
//
// categoria/subNicho usam {value, label}, mesmo padrão de SEGMENTOS em
// categoriaInteligente.ts. O `value` é só chave interna/React key; o filtro
// contra o banco usa label[idioma] — é isso que o Estoque já grava hoje na
// coluna categoria (texto traduzido, não slug, herança do dicionário
// existente). Ver lib/pdvHelpers.ts.

import type { Idioma } from "./translations";

export type ModoNicho = "produto" | "misto" | "servico";

export type SubNichoPdv = { value: string; label: Record<Idioma, string> };
export type CategoriaPdv = { value: string; label: Record<Idioma, string>; subNichos: SubNichoPdv[] };

export type NichoPdv =
  | "mercado" | "farmacia" | "autopecas" | "papelaria" | "pet" | "eletronicos" | "generico"
  | "roupas" | "calcados_tenis" | "padaria_confeitaria" | "cosmeticos_perfumaria" | "bebidas_adega"
  | "lanchonete" | "pizzaria" | "sorveteria_acai" | "marmita_comida_pronta"
  | "salao_barbearia" | "manicure_estetica" | "servicos_tecnicos" | "servicos_domesticos";

export type NichoPdvDef = { value: NichoPdv; label: Record<Idioma, string>; modo: ModoNicho; categorias: CategoriaPdv[] };

const L = (pt: string, en: string, es: string): Record<Idioma, string> => ({ pt, en, es });
const SUB = (value: string, pt: string, en: string, es: string): SubNichoPdv => ({ value, label: L(pt, en, es) });
const CAT = (value: string, pt: string, en: string, es: string, subNichos: SubNichoPdv[]): CategoriaPdv => ({ value, label: L(pt, en, es), subNichos });

export const NICHOS_PDV: NichoPdvDef[] = [
  // ============================================================================
  // MODO PRODUTO — reaproveitam o segmento existente do Estoque (dado real)
  // ============================================================================
  {
    value: "mercado", label: L("Mercado/Mercearia", "Grocery Store", "Mercado/Almacén"), modo: "produto",
    categorias: [
      CAT("bebidas", "Bebidas", "Beverages", "Bebidas", [
        SUB("refrigerante", "Refrigerante", "Soda", "Refresco"), SUB("cerveja", "Cerveja", "Beer", "Cerveza"),
        SUB("agua", "Água", "Water", "Agua"), SUB("suco", "Suco", "Juice", "Jugo"),
      ]),
      CAT("frios", "Frios", "Deli", "Fiambres", [
        SUB("queijo", "Queijo", "Cheese", "Queso"), SUB("embutido", "Presunto/Embutido", "Ham/Cold Cuts", "Jamón/Fiambre"),
      ]),
      CAT("laticinios", "Laticínios", "Dairy", "Lácteos", [
        SUB("leite", "Leite", "Milk", "Leche"), SUB("iogurte", "Iogurte", "Yogurt", "Yogur"),
        SUB("manteiga_requeijao", "Manteiga/Requeijão", "Butter/Cream Cheese", "Mantequilla/Queso Crema"),
      ]),
      CAT("higiene", "Higiene", "Personal Care", "Higiene", [
        SUB("sabonete", "Sabonete", "Soap", "Jabón"), SUB("higiene_bucal", "Higiene Bucal", "Oral Care", "Higiene Bucal"),
      ]),
      CAT("limpeza", "Limpeza", "Cleaning", "Limpieza", [
        SUB("detergente", "Detergente", "Detergent", "Detergente"), SUB("desinfetante_amaciante", "Desinfetante/Amaciante", "Disinfectant/Softener", "Desinfectante/Suavizante"),
      ]),
      CAT("mercearia", "Mercearia", "Grocery", "Almacén", [
        SUB("graos_massas", "Grãos/Massas", "Grains/Pasta", "Granos/Pastas"), SUB("oleo_farinha_acucar_sal", "Óleo/Farinha/Açúcar/Sal", "Oil/Flour/Sugar/Salt", "Aceite/Harina/Azúcar/Sal"),
      ]),
      CAT("hortifruti", "Hortifruti", "Produce", "Frutas y Verduras", [
        SUB("fruta", "Fruta", "Fruit", "Fruta"), SUB("verdura_legume", "Verdura/Legume", "Vegetable", "Verdura"),
      ]),
    ],
  },
  {
    value: "farmacia", label: L("Farmácia", "Pharmacy", "Farmacia"), modo: "produto",
    categorias: [
      CAT("medicamentos", "Medicamentos", "Medications", "Medicamentos", [
        SUB("isento_receita", "Isento de Receita", "Over-the-counter", "Sin Receta"), SUB("com_retencao", "Com Retenção (tarja)", "Prescription Retained", "Con Retención"), SUB("controlado", "Controlado (SNGPC)", "Controlled (SNGPC)", "Controlado (SNGPC)"),
      ]),
      CAT("dermocosmetico", "Dermocosmético", "Dermocosmetics", "Dermocosmética", [
        SUB("protetor_solar", "Protetor Solar", "Sunscreen", "Protector Solar"), SUB("hidratante_antirrugas", "Hidratante/Antirrugas", "Moisturizer/Anti-aging", "Hidratante/Antiarrugas"),
      ]),
      CAT("higiene_beleza", "Higiene e Beleza", "Beauty & Care", "Higiene y Belleza", [
        SUB("sabonete_shampoo", "Sabonete/Shampoo", "Soap/Shampoo", "Jabón/Champú"), SUB("fralda_absorvente", "Fralda/Absorvente", "Diaper/Pad", "Pañal/Toalla"), SUB("perfumaria", "Perfumaria", "Fragrance", "Perfumería"),
      ]),
      CAT("vitaminas_suplementos", "Vitaminas/Suplementos", "Vitamins/Supplements", "Vitaminas/Suplementos", [
        SUB("vitamina_mineral", "Vitamina/Mineral", "Vitamin/Mineral", "Vitamina/Mineral"), SUB("suplemento_esportivo", "Suplemento Esportivo", "Sports Supplement", "Suplemento Deportivo"),
      ]),
    ],
  },
  {
    value: "autopecas", label: L("Autopeças", "Auto Parts", "Autopartes"), modo: "produto",
    categorias: [
      CAT("motor", "Motor", "Engine", "Motor", [SUB("filtro", "Filtro", "Filter", "Filtro"), SUB("correia_vela", "Correia/Vela de Ignição", "Belt/Spark Plug", "Correa/Bujía")]),
      CAT("freios", "Freios", "Brakes", "Frenos", [SUB("pastilha", "Pastilha", "Brake Pad", "Pastilla"), SUB("disco_lona", "Disco/Lona", "Disc/Shoe", "Disco/Balata")]),
      CAT("suspensao", "Suspensão", "Suspension", "Suspensión", [SUB("amortecedor", "Amortecedor", "Shock Absorber", "Amortiguador"), SUB("mola_bandeja", "Mola/Bandeja", "Spring/Control Arm", "Resorte/Horquilla")]),
      CAT("eletrica", "Elétrica", "Electrical", "Eléctrica", [SUB("bateria", "Bateria", "Battery", "Batería"), SUB("lampada_farol", "Lâmpada/Farol", "Bulb/Headlight", "Bombilla/Faro")]),
      CAT("pneus_rodas", "Pneus e Rodas", "Tires & Wheels", "Neumáticos y Ruedas", [SUB("pneu", "Pneu", "Tire", "Neumático"), SUB("roda_calota", "Roda/Calota", "Wheel/Hubcap", "Rueda/Tapacubos")]),
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
      CAT("racao", "Ração", "Pet Food", "Alimento para Mascotas", [SUB("cao", "Cão", "Dog", "Perro"), SUB("gato", "Gato", "Cat", "Gato"), SUB("outros", "Outros", "Other", "Otro")]),
      CAT("higiene_pet", "Higiene Pet", "Pet Hygiene", "Higiene para Mascotas", [SUB("shampoo_pet", "Shampoo Pet", "Pet Shampoo", "Champú Mascota"), SUB("areia_sanitaria", "Areia Sanitária", "Litter", "Arena Sanitaria")]),
      CAT("acessorios_pet", "Acessórios Pet", "Pet Accessories", "Accesorios para Mascotas", [SUB("coleira_guia", "Coleira/Guia", "Collar/Leash", "Collar/Correa"), SUB("brinquedo", "Brinquedo", "Toy", "Juguete")]),
      CAT("saude_pet", "Saúde Pet", "Pet Health", "Salud para Mascotas", [SUB("antipulgas_vermifugo", "Antipulgas/Vermífugo", "Flea/Dewormer", "Antipulgas/Desparasitante")]),
    ],
  },
  {
    value: "eletronicos", label: L("Eletrônicos", "Electronics", "Electrónica"), modo: "produto",
    categorias: [
      CAT("celulares_acessorios", "Celulares e Acessórios", "Phones & Accessories", "Celulares y Accesorios", [SUB("celular", "Celular", "Phone", "Celular"), SUB("acessorio", "Capinha/Carregador/Fone", "Case/Charger/Headphone", "Funda/Cargador/Audífono")]),
      CAT("informatica", "Informática", "Computers", "Informática", [SUB("notebook_pc", "Notebook/PC", "Laptop/PC", "Notebook/PC"), SUB("periferico", "Periférico", "Peripheral", "Periférico")]),
      CAT("audio_video", "Áudio e Vídeo", "Audio & Video", "Audio y Video", [SUB("som_fone", "Caixa de Som/Fone", "Speaker/Headphone", "Altavoz/Audífono"), SUB("tv", "Televisão", "TV", "Televisor")]),
      CAT("eletrodomesticos", "Eletrodomésticos", "Home Appliances", "Electrodomésticos", [SUB("linha_branca", "Linha Branca", "Major Appliance", "Línea Blanca"), SUB("pequenos_eletros", "Pequenos Eletros", "Small Appliance", "Pequeño Electrodoméstico")]),
    ],
  },

  // ============================================================================
  // MODO PRODUTO — novos (sem equivalente hoje no Estoque, sem dado ainda)
  // ============================================================================
  {
    value: "padaria_confeitaria", label: L("Padaria/Confeitaria", "Bakery/Pastry Shop", "Panadería/Pastelería"), modo: "produto",
    categorias: [
      CAT("paes", "Pães", "Bread", "Panes", [SUB("pao_frances", "Pão Francês", "French Bread", "Pan Francés"), SUB("pao_doce_especial", "Pão Doce/Especial", "Sweet/Specialty Bread", "Pan Dulce/Especial")]),
      CAT("confeitaria", "Confeitaria", "Pastry", "Pastelería", [SUB("bolo", "Bolo", "Cake", "Torta"), SUB("salgado", "Salgado", "Savory Pastry", "Salado")]),
      CAT("bebidas_consumo_local", "Bebidas", "Beverages", "Bebidas", [SUB("cafe_suco", "Café/Suco", "Coffee/Juice", "Café/Jugo")]),
    ],
  },
  {
    value: "roupas", label: L("Roupas", "Apparel", "Ropa"), modo: "produto",
    categorias: [
      CAT("camisetas", "Camisetas", "T-Shirts", "Camisetas", [SUB("masculina", "Masculina", "Men's", "Masculina"), SUB("feminina", "Feminina", "Women's", "Femenina"), SUB("infantil", "Infantil", "Kids", "Infantil")]),
      CAT("calcas", "Calças", "Pants", "Pantalones", [SUB("jeans", "Jeans", "Jeans", "Jeans"), SUB("legging_moletom", "Legging/Moletom", "Leggings/Sweatpants", "Legging/Buzo")]),
      CAT("acessorios_vestuario", "Acessórios", "Accessories", "Accesorios", [SUB("cinto_bone_bolsa", "Cinto/Boné/Bolsa", "Belt/Cap/Bag", "Cinturón/Gorra/Bolso")]),
    ],
  },
  {
    value: "calcados_tenis", label: L("Calçados/Tênis", "Footwear", "Calzado"), modo: "produto",
    categorias: [
      CAT("tenis", "Tênis", "Sneakers", "Zapatillas", [SUB("esportivo", "Esportivo", "Athletic", "Deportivo"), SUB("casual", "Casual", "Casual", "Casual")]),
      CAT("sapato_sandalia", "Sapato/Sandália", "Shoes/Sandals", "Zapato/Sandalia", [SUB("social", "Social", "Dress Shoe", "Formal"), SUB("chinelo_sandalia", "Chinelo/Sandália", "Flip-flop/Sandal", "Chancla/Sandalia")]),
    ],
  },
  {
    value: "cosmeticos_perfumaria", label: L("Cosméticos/Perfumaria", "Cosmetics/Perfumery", "Cosméticos/Perfumería"), modo: "produto",
    categorias: [
      CAT("maquiagem", "Maquiagem", "Makeup", "Maquillaje", [SUB("rosto", "Rosto", "Face", "Rostro"), SUB("olhos_labios", "Olhos/Lábios", "Eyes/Lips", "Ojos/Labios")]),
      CAT("perfumaria_cosm", "Perfumaria", "Fragrance", "Perfumería", [SUB("perfume", "Perfume", "Perfume", "Perfume"), SUB("colonia", "Colônia", "Cologne", "Colonia")]),
      CAT("skincare", "Skincare", "Skincare", "Cuidado de la Piel", [SUB("hidratante_skincare", "Hidratante", "Moisturizer", "Hidratante"), SUB("protetor_solar_skincare", "Protetor Solar", "Sunscreen", "Protector Solar")]),
    ],
  },
  {
    value: "bebidas_adega", label: L("Bebidas/Adega", "Beverages/Wine Shop", "Bebidas/Vinoteca"), modo: "produto",
    categorias: [
      CAT("vinho", "Vinho", "Wine", "Vino", [SUB("tinto", "Tinto", "Red", "Tinto"), SUB("branco_rose", "Branco/Rosé", "White/Rosé", "Blanco/Rosado")]),
      CAT("destilado", "Destilado", "Spirits", "Destilado", [SUB("whisky_vodka_gin", "Whisky/Vodka/Gin", "Whisky/Vodka/Gin", "Whisky/Vodka/Gin")]),
      CAT("cerveja_adega", "Cerveja", "Beer", "Cerveza", [SUB("artesanal", "Artesanal", "Craft", "Artesanal"), SUB("comercial", "Comercial", "Mainstream", "Comercial")]),
    ],
  },

  // ============================================================================
  // MODO MISTO — food service granular (restaurante_food do Estoque intocado)
  // ============================================================================
  {
    value: "lanchonete", label: L("Lanchonete", "Snack Bar", "Cafetería"), modo: "misto",
    categorias: [
      CAT("insumos_lanchonete", "Insumos", "Raw Ingredients", "Insumos", [SUB("pao_carne_queijo", "Pão/Carne/Queijo", "Bread/Meat/Cheese", "Pan/Carne/Queso")]),
      CAT("bebidas_lanchonete", "Bebidas", "Beverages", "Bebidas", [SUB("refrigerante_suco", "Refrigerante/Suco", "Soda/Juice", "Refresco/Jugo")]),
      CAT("descartaveis_lanchonete", "Descartáveis", "Disposables", "Desechables", [SUB("embalagem_guardanapo", "Embalagem/Guardanapo", "Packaging/Napkin", "Empaque/Servilleta")]),
    ],
  },
  {
    value: "pizzaria", label: L("Pizzaria", "Pizzeria", "Pizzería"), modo: "misto",
    categorias: [
      CAT("insumos_pizzaria", "Insumos", "Raw Ingredients", "Insumos", [SUB("massa_molho_queijo", "Massa/Molho/Queijo", "Dough/Sauce/Cheese", "Masa/Salsa/Queso")]),
      CAT("embalagens_pizzaria", "Embalagens", "Packaging", "Empaques", [SUB("caixa_pizza", "Caixa de Pizza", "Pizza Box", "Caja de Pizza")]),
    ],
  },
  {
    value: "sorveteria_acai", label: L("Sorveteria/Açaí", "Ice Cream/Açaí Shop", "Heladería/Açaí"), modo: "misto",
    categorias: [
      CAT("insumos_sorveteria", "Insumos", "Raw Ingredients", "Insumos", [SUB("sorvete_acai_base", "Sorvete/Açaí Base", "Ice Cream/Açaí Base", "Helado/Açaí Base"), SUB("cobertura_complemento", "Cobertura/Complemento", "Topping", "Cobertura/Complemento")]),
      CAT("descartaveis_sorveteria", "Descartáveis", "Disposables", "Desechables", [SUB("copo_casquinha", "Copo/Casquinha", "Cup/Cone", "Vaso/Cono")]),
    ],
  },
  {
    value: "marmita_comida_pronta", label: L("Marmita/Comida Pronta", "Meal Prep/Ready Food", "Vianda/Comida Preparada"), modo: "misto",
    categorias: [
      CAT("insumos_marmita", "Insumos", "Raw Ingredients", "Insumos", [SUB("proteina_guarnicao", "Proteína/Guarnição", "Protein/Side", "Proteína/Guarnición")]),
      CAT("embalagens_marmita", "Embalagens", "Packaging", "Empaques", [SUB("marmita_talher", "Marmita/Talher Descartável", "Container/Disposable Cutlery", "Vianda/Cubiertos Desechables")]),
    ],
  },

  // ============================================================================
  // MODO SERVIÇO — sem EAN, sem estoque, sem validade (servicos do Estoque intocado)
  // ============================================================================
  {
    value: "salao_barbearia", label: L("Salão/Barbearia", "Salon/Barbershop", "Salón/Barbería"), modo: "servico",
    categorias: [
      CAT("corte", "Corte", "Haircut", "Corte", [SUB("corte_masculino", "Corte Masculino", "Men's Haircut", "Corte Masculino"), SUB("corte_feminino", "Corte Feminino", "Women's Haircut", "Corte Femenino")]),
      CAT("coloracao", "Coloração", "Coloring", "Coloración", [SUB("tintura", "Tintura", "Hair Dye", "Tintura"), SUB("luzes_mechas", "Luzes/Mechas", "Highlights", "Luces/Mechas")]),
      CAT("barba", "Barba", "Beard", "Barba", [SUB("barba_completa", "Barba Completa", "Full Beard Service", "Barba Completa")]),
    ],
  },
  {
    value: "manicure_estetica", label: L("Manicure/Estética", "Nail Care/Aesthetics", "Manicura/Estética"), modo: "servico",
    categorias: [
      CAT("manicure_pedicure", "Manicure/Pedicure", "Manicure/Pedicure", "Manicura/Pedicura", [SUB("manicure_simples", "Manicure Simples", "Basic Manicure", "Manicura Simple"), SUB("pedicure_simples", "Pedicure Simples", "Basic Pedicure", "Pedicura Simple")]),
      CAT("estetica_facial", "Estética Facial", "Facial Aesthetics", "Estética Facial", [SUB("limpeza_pele", "Limpeza de Pele", "Facial Cleansing", "Limpieza Facial")]),
    ],
  },
  {
    value: "servicos_tecnicos", label: L("Serviços Técnicos", "Technical Services", "Servicios Técnicos"), modo: "servico",
    categorias: [
      CAT("eletrica_servico", "Elétrica", "Electrical", "Eléctrica", [SUB("instalacao_reparo_eletrico", "Instalação/Reparo", "Installation/Repair", "Instalación/Reparación")]),
      CAT("hidraulica_servico", "Hidráulica", "Plumbing", "Plomería", [SUB("instalacao_reparo_hidraulico", "Instalação/Reparo", "Installation/Repair", "Instalación/Reparación")]),
    ],
  },
  {
    value: "servicos_domesticos", label: L("Serviços Domésticos", "Domestic Services", "Servicios Domésticos"), modo: "servico",
    categorias: [
      CAT("diarista", "Diarista", "House Cleaning", "Limpieza del Hogar", [SUB("diaria_padrao", "Diária Padrão", "Standard Day Rate", "Tarifa Diaria Estándar")]),
      CAT("costura", "Costura", "Sewing", "Costura", [SUB("ajuste_reparo", "Ajuste/Reparo", "Alteration/Repair", "Ajuste/Reparación")]),
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
