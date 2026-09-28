// ═══════════════════════════════════════════════════════════════
// MOTOR DE IA — Manuais especialistas por ÁREA ("skills" do Axioma).
// A triagem escolhe até 3 manuais pela pergunta e pela tela de origem; só
// eles entram no prompt (resposta mais cirúrgica, prompt menor e mais barato).
// O manual por SETOR fica em ./setores.ts. Arquivo puro (sem import).
// ═══════════════════════════════════════════════════════════════

export type Manual = { id: string; palavras: RegExp; texto: string }

export const MANUAIS: Manual[] = [
  { id: 'caixa', palavras: /caixa|fluxo|saldo|f[oô]lego|runway|capital de giro|liquidez|cash|flujo|tesour/i,
    texto: 'CAIXA E TESOURARIA: caixa é sobrevivência, lucro é opinião. Olhe saldo realizado, a receber x a pagar dos próximos 30/60/90 dias, fôlego em meses e ciclo financeiro (estoque + recebimento − pagamento). Prioridade: 1) nunca deixar o saldo projetado ficar negativo; 2) antecipar recebíveis só se o custo for menor que o dos juros evitados; 3) alongar pagamentos sem multa; 4) reserva mínima de 1 a 3 meses de custo fixo.' },
  { id: 'custos', palavras: /custo|despesa|gasto|cortar|economi|reduzir|desperd|cost|gasto|ahorr/i,
    texto: 'CUSTOS: separe fixo de variável e cite os itens PELO NOME com valor. Corte primeiro o que não afeta receita nem qualidade (assinaturas, contratos sem uso, taxas bancárias, desperdício); renegocie os 3 maiores fixos; custo variável se ataca com compra, perda e processo. Mostre o efeito em R$/mês e no ponto de equilíbrio.' },
  { id: 'precificacao', palavras: /pre[çc]o|precific|margem|markup|desconto|reajust|price|margin|precio/i,
    texto: 'PRECIFICAÇÃO: preço cobre custo variável + impostos sobre venda + parte do custo fixo + lucro. Use margem de contribuição e ponto de equilíbrio. Reajuste quando o custo subiu (cite qual) e o cliente percebe valor; desconto só com volume ou prazo que compense. Nunca sugira preço abaixo do custo variável + impostos.' },
  { id: 'divida', palavras: /d[ií]vida|empr[eé]stimo|financiamento|juros|parcela|renegoci|cr[eé]dito|banco|debt|loan|deuda|pr[eé]stamo/i,
    texto: 'DÍVIDA E CRÉDITO: ordene por custo (maior juro primeiro — método avalanche), compare parcela total com o lucro mensal (comprometimento) e dívida com a receita anual. Troque dívida cara por barata só se o custo total (juros + tarifas) cair. Com Selic caindo, renegocie spread e prazo. Nunca recomende tomar crédito para cobrir prejuízo recorrente sem corrigir a causa.' },
  { id: 'tributario', palavras: /imposto|tribut|regime|simples|presumido|lucro real|das\b|icms|iss\b|pis|cofins|irpj|csll|reforma|ibs|cbs|fiscal|nota|tax|impuesto/i,
    texto: 'TRIBUTÁRIO: use o regime e a alíquota efetiva calculados. Compare regimes só com os números dados e deixe claro que é estimativa. Reforma Tributária (IBS/CBS, transição 2026-2033): explique a premissa e a data, avise que regras podem mudar — nunca diga apenas "consulte um contador". Cite obrigações vencidas/pendentes quando houver.' },
  { id: 'cobranca', palavras: /inadimpl|receber|cobran|atras|calote|cliente devendo|receivable|cobro|moroso/i,
    texto: 'COBRANÇA: cite o total a receber, o vencido e a inadimplência %. Prioridade: maiores valores vencidos primeiro, régua de cobrança (lembrete antes, contato no vencimento, negociação após 15 dias), revisar crédito de quem atrasa repetido. Concentração: se poucos clientes são a maior parte do a receber, é risco de caixa.' },
  { id: 'estoque', palavras: /estoque|produto|ruptura|giro|invent[aá]rio|mercadoria|stock|inventario/i,
    texto: 'ESTOQUE: estoque é dinheiro parado. Olhe ruptura (perde venda), capital parado (acima do máximo), custo subindo e validade. Ação: comprar menos e mais vezes do que gira pouco, repor o que rompe, liquidar o parado antes que perca valor.' },
  { id: 'crescimento', palavras: /crescer|expandir|investir|nova loja|contratar|meta|plano|futuro|anos|cen[aá]rio|proje[çc]|grow|invest|crecer/i,
    texto: 'CRESCIMENTO: só cresce quem tem margem e caixa. Antes de investir: margem de contribuição positiva, fôlego de caixa, retorno esperado e prazo de payback. Cresça primeiro pelo que já funciona (clientes atuais, ticket, recorrência). Projeções são cenários com confiança explícita, nunca promessa.' },
  { id: 'vendas', palavras: /venda|faturamento|receita|clientes?|ticket|vender|revenue|sales|ventas|ingreso/i,
    texto: 'VENDAS E RECEITA: mostre a tendência dos últimos meses, ticket médio, concentração por cliente e sazonalidade. Queda de receita: separe volume (menos vendas) de preço (ticket menor). Ações: reativar clientes parados, aumentar recorrência, vender mais para quem já compra.' },
  { id: 'economia', palavras: /d[oó]lar|c[aâ]mbio|selic|infla[çc]|ipca|petr[oó]leo|economia|mercado|china|guerra|tarifa|dollar|exchange|inflation/i,
    texto: 'ECONOMIA: use só os indicadores e eventos do Nexus dados. Traduza em efeito na empresa (custo, preço, demanda, juros da dívida), priorizando os indicadores que pesam no setor dela. Cenário mais provável + o que pode mudar; nunca certeza.' },
]

// Manual padrão por tela (a tela de origem já diz muito do assunto).
export const MANUAIS_DA_TELA: Record<string, string[]> = {
  'ia-financeira': ['caixa', 'custos'], 'ia-tributaria': ['tributario'], 'nexus': ['economia'],
  'contas-pagar': ['caixa', 'divida'], 'contas-receber': ['cobranca', 'caixa'], 'inadimplencia': ['cobranca'],
  'fornecedores': ['custos'], 'centros-custo': ['custos'], 'tesouraria': ['caixa'], 'estoque': ['estoque'],
  'precificacao': ['precificacao'], 'endividamento': ['divida'], 'mei': ['tributario', 'caixa'],
  'mei-das': ['tributario'], 'mei-reforma': ['tributario'], 'mei-imposto-renda': ['tributario'], 'mei-faturamento': ['vendas', 'tributario'],
  'mei-precificacao': ['precificacao'], 'mei-ia-advisor': ['tributario', 'caixa'], 'nexus-simulacoes': ['economia'], 'clientes': ['vendas', 'cobranca'],
}

// Até 3 manuais: os que a pergunta cita (na ordem do catálogo) + os da tela.
export function escolherManuais(pergunta: string, tela?: string): Manual[] {
  const ids = MANUAIS.filter((m) => m.palavras.test(pergunta)).map((m) => m.id)
  for (const id of MANUAIS_DA_TELA[tela ?? ''] ?? []) if (!ids.includes(id)) ids.push(id)
  return ids.slice(0, 3).map((id) => MANUAIS.find((m) => m.id === id)!)
}
