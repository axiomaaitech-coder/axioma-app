// 🦅 AXIOMA AI.TECH — PDV Fase 2.1: autocomplete com dicionário-semente
// Custo zero, sem chamada externa. Combina um dicionário estático (produtos
// comuns por sub-nicho — cobertura inicial, pra empresa nova não começar do
// zero) com o histórico real da empresa (que cresce e domina com o uso —
// mesmo princípio de "aprendizado por empresa" já usado em
// lib/categoriaInteligente.ts, não é sistema paralelo).
//
// Dicionário representativo dos sub-nichos de maior giro (mercado, açougue,
// hortifruti, farmácia) — não é exaustivo pros ~150 sub-nichos da árvore de
// propósito: à medida que a empresa cadastra, o histórico dela passa a
// dominar a sugestão, então o dicionário só precisa cobrir bem o começo.

const DICIONARIO_SEMENTE: Record<string, string[]> = {
  // Mercado > Bebidas
  refrigerante: ["Coca-Cola", "Coca-Cola Zero", "Guaraná Antarctica", "Fanta Laranja", "Fanta Uva", "Sprite", "Pepsi"],
  cerveja: ["Skol", "Brahma", "Antarctica", "Heineken", "Budweiser", "Original", "Itaipava"],
  agua: ["Crystal", "Bonafont", "Minalba", "Água com Gás"],
  suco: ["Suco de Laranja", "Suco de Uva", "Del Valle", "Suco Integral"],
  energetico_isotonico: ["Red Bull", "Monster", "Gatorade", "Powerade"],
  // Mercado > Mercearia Seca / Enlatados
  graos_massas: ["Arroz", "Feijão Carioca", "Feijão Preto", "Macarrão Espaguete", "Macarrão Parafuso"],
  oleo_farinha_acucar_sal: ["Óleo de Soja", "Azeite", "Farinha de Trigo", "Açúcar Refinado", "Sal"],
  cafe_achocolatado_po: ["Café Torrado e Moído", "Nescafé", "Nescau", "Toddy"],
  biscoitos_snacks: ["Biscoito Recheado", "Biscoito Cream Cracker", "Salgadinho", "Bolacha Maisena"],
  enlatados: ["Atum em Lata", "Milho em Conserva", "Ervilha em Conserva", "Molho de Tomate"],
  // Mercado > Laticínios/Frios
  leite: ["Leite Integral", "Leite Desnatado", "Leite em Pó"],
  iogurte: ["Iogurte Natural", "Iogurte Grego", "Danone", "Nestlé Yogurt"],
  queijo: ["Queijo Mussarela", "Queijo Prato", "Queijo Minas", "Requeijão"],
  embutido: ["Presunto", "Mortadela", "Salame"],
  // Açougue / Hortifruti
  carne_bovina: ["Picanha", "Alcatra", "Patinho", "Contrafilé", "Carne Moída"],
  frango: ["Peito de Frango", "Coxa e Sobrecoxa", "Frango Inteiro", "Filé de Frango"],
  fruta: ["Banana", "Maçã", "Laranja", "Mamão", "Uva"],
  fruta_nacional: ["Banana", "Maçã", "Laranja", "Mamão", "Uva"],
  verdura_legume: ["Tomate", "Batata", "Cebola", "Alface", "Cenoura"],
  // Farmácia
  isento_receita: ["Dipirona", "Paracetamol", "Ibuprofeno", "Vitamina C"],
  higiene_bucal: ["Creme Dental", "Escova de Dente", "Enxaguante Bucal"],
  // Padaria
  pao_frances: ["Pão Francês", "Pão de Sal"],
  bolo: ["Bolo de Chocolate", "Bolo de Cenoura", "Pão de Mel"],
};

// Sinônimos coloquiais que não batem por substring direto ("bolacha" não
// contém "biscoito", mas é a mesma coisa no dia a dia do balconista).
const SINONIMOS: Record<string, string> = {
  bolacha: "biscoito", refri: "refrigerante", leite_po: "leite em pó", achocolatado: "nescau",
};

function normalizar(s: string): string {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Busca tolerante: sem acento, minúsculo, termo PARCIAL ("coca" acha
// "Coca-Cola") — nunca bloqueia digitação livre, é só sugestão (datalist).
export function buscarSugestoesSemente(subNicho: string | undefined, termo: string, historicoEmpresa: string[] = [], limite = 8): string[] {
  const termoNorm = normalizar(termo);
  if (!termoNorm) return [];
  const termoExpandido = SINONIMOS[termoNorm] || termoNorm;

  const candidatos = [
    ...historicoEmpresa, // histórico real da empresa tem prioridade (mais provável de bater)
    ...(subNicho ? DICIONARIO_SEMENTE[subNicho] || [] : []),
  ];

  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const c of candidatos) {
    const cNorm = normalizar(c);
    if ((cNorm.includes(termoNorm) || cNorm.includes(termoExpandido)) && !vistos.has(c)) {
      vistos.add(c);
      resultado.push(c);
      if (resultado.length >= limite) break;
    }
  }
  return resultado;
}
