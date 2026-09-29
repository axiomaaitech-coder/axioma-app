// ═══════════════════════════════════════════════════════════════
// MOTOR DE IA — Manuais especialistas por ÁREA ("skills" do Axioma).
// A triagem escolhe até 3 manuais pela pergunta e pela tela de origem; só
// eles entram no prompt (resposta mais cirúrgica, prompt menor e mais barato).
// O manual por SETOR fica em ./setores.ts. Arquivo puro (sem import).
// ═══════════════════════════════════════════════════════════════

export type Manual = { id: string; palavras: RegExp; texto: string }

export const MANUAIS: Manual[] = [
  { id: 'caixa', palavras: /caixa|fluxo|saldo|f[oô]lego|runway|capital de giro|liquidez|cash|flujo|tesour|a pagar|vence|vencimento|pagar esta|due|vence[nr]/i,
    texto: 'CAIXA E TESOURARIA: caixa é sobrevivência, lucro é opinião. Olhe saldo realizado, a receber x a pagar dos próximos 30/60/90 dias, fôlego em meses e ciclo financeiro (estoque + recebimento − pagamento). Prioridade: 1) nunca deixar o saldo projetado ficar negativo; 2) antecipar recebíveis só se o custo for menor que o dos juros evitados; 3) alongar pagamentos sem multa; 4) reserva mínima de 1 a 3 meses de custo fixo.' },
  { id: 'custos', palavras: /custo|despesa|gasto|cortar|economi|reduzir|desperd|\bcmv\b|mercadoria vendida|cost|ahorr/i,
    texto: 'CUSTOS: separe fixo de variável e cite os itens PELO NOME com valor. Corte primeiro o que não afeta receita nem qualidade (assinaturas, contratos sem uso, taxas bancárias, desperdício); renegocie os 3 maiores fixos; custo variável se ataca com compra, perda e processo. Mostre o efeito em R$/mês e no ponto de equilíbrio.' },
  { id: 'precificacao', palavras: /pre[çc]o|precific|margem|markup|desconto|reajust|price|margin|precio/i,
    texto: 'PRECIFICAÇÃO: preço cobre custo variável + impostos sobre venda + parte do custo fixo + lucro. Use margem de contribuição e ponto de equilíbrio. Reajuste quando o custo subiu (cite qual) e o cliente percebe valor; desconto só com volume ou prazo que compense. Nunca sugira preço abaixo do custo variável + impostos.' },
  { id: 'divida', palavras: /d[ií]vida|empr[eé]stimo|financiamento|juros|parcela|renegoci|cr[eé]dito|banco|debt|loan|deuda|pr[eé]stamo/i,
    texto: 'DÍVIDA E CRÉDITO: ordene por custo (maior juro primeiro — método avalanche), compare parcela total com o lucro mensal (comprometimento) e dívida com a receita anual. Troque dívida cara por barata só se o custo total (juros + tarifas) cair. Com Selic caindo, renegocie spread e prazo. Nunca recomende tomar crédito para cobrir prejuízo recorrente sem corrigir a causa.' },
  { id: 'tributario', palavras: /imposto|tribut|regime|simples|presumido|lucro real|das\b|icms|iss\b|pis|cofins|irpj|csll|reforma|ibs|cbs|fiscal|nota|tax|impuesto/i,
    texto: 'TRIBUTÁRIO: use o regime e a alíquota efetiva calculados. Compare regimes só com os números dados e deixe claro que é estimativa. Reforma Tributária (IBS/CBS, transição 2026-2033): explique a premissa e a data, avise que regras podem mudar — nunca diga apenas "consulte um contador". Cite obrigações vencidas/pendentes quando houver.' },
  { id: 'cobranca', palavras: /inadimpl|receber|cobran|atras|calote|devendo|me devem|me deve|receivable|owe|cobro|moroso|deben/i,
    texto: 'COBRANÇA: cite o total a receber, o vencido e a inadimplência %. Prioridade: maiores valores vencidos primeiro, régua de cobrança (lembrete antes, contato no vencimento, negociação após 15 dias), revisar crédito de quem atrasa repetido. Concentração: se poucos clientes são a maior parte do a receber, é risco de caixa.' },
  { id: 'estoque', palavras: /estoque|produto|ruptura|giro|invent[aá]rio|mercadoria|stock|inventario/i,
    texto: 'ESTOQUE: estoque é dinheiro parado. Olhe ruptura (perde venda), capital parado (acima do máximo), custo subindo e validade. Ação: comprar menos e mais vezes do que gira pouco, repor o que rompe, liquidar o parado antes que perca valor.' },
  { id: 'crescimento', palavras: /crescer|expandir|investir|nova loja|contratar|meta|plano|futuro|anos|cen[aá]rio|proje[çc]|grow|invest|crecer/i,
    texto: 'CRESCIMENTO: só cresce quem tem margem e caixa. Antes de investir: margem de contribuição positiva, fôlego de caixa, retorno esperado e prazo de payback. Cresça primeiro pelo que já funciona (clientes atuais, ticket, recorrência). Projeções são cenários com confiança explícita, nunca promessa.' },
  { id: 'vendas', palavras: /venda|fatur|receita|clientes?|ticket|vender|churn|revenue|sales|ventas|ingreso/i,
    texto: 'VENDAS E RECEITA: mostre a tendência dos últimos meses, ticket médio, concentração por cliente e sazonalidade. Queda de receita: separe volume (menos vendas) de preço (ticket menor). Ações: reativar clientes parados, aumentar recorrência, vender mais para quem já compra.' },
  { id: 'economia', palavras: /d[oó]lar|c[aâ]mbio|selic|juros altos|infla[çc]|ipca|petr[oó]leo|diesel|soja|a[çc]o chin|economia|mercado|china|chin[eê]s|guerra|tarifa|dollar|exchange|inflation|interest rates/i,
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
// Fase 4 — formato de uma BOA resposta por área. Marcadores [assim] no lugar dos
// números: a IA copia o jeito (diagnóstico com número → causa pelo nome → ações com
// impacto), nunca um valor — todo número real vem do retrato ou das ferramentas.
export const EXEMPLOS: Record<string, string> = {
  caixa: 'Seu caixa hoje é [caixa] e nos próximos 30 dias entram [a receber 30d] e saem [a pagar 30d] — sobra [diferença]. Mantido o ritmo, ele aguenta [fôlego] meses. O que mais pesa é [maior saída pelo nome]. Faça agora: 1) cobre [maior recebível vencido]; 2) negocie o vencimento de [conta] para depois de [data]; 3) monte uma reserva de 1 a 3 meses de custo fixo.',
  custos: 'Seus custos somam [total]/mês: [fixo] fixos e [variável] variáveis. Os 3 maiores fixos são [item 1], [item 2] e [item 3]. Onde agir: 1) renegociar [item 1] (10% a menos = [conta] por mês, estimativa); 2) cortar [item sem uso]; 3) medir a perda em [variável]. Com isso o ponto de equilíbrio cai de [antes] para [depois] (estimativa).',
  precificacao: 'Hoje cada venda deixa [margem de contribuição]% depois do custo variável e dos impostos. Para pagar [custo fixo] você precisa vender [ponto de equilíbrio]/mês. Um reajuste de [x]% em [produto] cobre a alta de [custo que subiu]. Desconto só com contrapartida: volume acima de [y] ou pagamento à vista.',
  divida: 'Você deve [dívida total] ([x]% da receita do ano). A mais cara é [dívida] a [juros]% ao mês — quite primeiro ela. As parcelas comprometem [y]% do lucro mensal. Peça ao banco troca de [dívida cara] por crédito mais barato; só vale se o custo total (juros + tarifas) cair.',
  tributario: 'No regime [regime] você paga [imposto]/mês ([alíquota]% da receita). Pela comparação de hoje, [outro regime] custaria [valor] (estimativa pelas regras vigentes em [data]; a Reforma Tributária está em transição até 2033 e isso pode mudar). Antes de trocar, confira [condição/prazo de opção]. Obrigações atrasadas: [quais].',
  cobranca: 'Você tem [a receber] em aberto, [vencido] já vencido ([inadimplência]%). Os maiores devedores são [cliente 1] e [cliente 2]. Faça hoje: 1) contato com [cliente 1]; 2) régua: lembrete 3 dias antes, contato no vencimento, proposta de acordo após 15 dias; 3) venda a prazo para quem atrasa repetido só com entrada.',
  estoque: '[n] produtos estão em falta ([produto 1], [produto 2]) — venda perdida. [m] estão acima do máximo (capital parado em [produto]). Reponha primeiro o que gira e rompe; compre menos e mais vezes o que gira pouco; faça promoção de [produto parado] antes que perca valor.',
  crescimento: 'Para crescer com segurança você precisa de margem positiva e fôlego — hoje a margem é [margem] e o fôlego [fôlego]. [Ideia] exige [investimento] e se paga em [meses] se trouxer [receita adicional] (estimativa). Cenário mais provável: [x]; o que pode mudar: [risco]. Comece pelo que já funciona: [produto/cliente que mais vende].',
  vendas: 'Sua receita dos últimos meses foi [série] — [subiu/caiu] [x]%. A variação veio de [volume ou ticket]. [Cliente/fonte] responde por [y]% — risco de concentração. Ações: 1) reativar [clientes parados]; 2) aumentar a recorrência de [produto]; 3) oferta para quem já compra [item].',
  economia: '[Indicador] foi de [antes] para [agora] em [período] (fonte [órgão]). Para uma empresa de [setor] isso mexe em [custo/preço/demanda]: [efeito na empresa, citando o custo pelo nome]. Cenário mais provável: [x]; pode mudar se [gatilho]. O que fazer agora: [ação].',
}

// Texto do manual pro prompt: instrução + formato de boa resposta.
export const textoManual = (m: Manual) => `${m.texto}\nFormato de boa resposta (${m.id}): ${EXEMPLOS[m.id] ?? '—'}`

export function escolherManuais(pergunta: string, tela?: string): Manual[] {
  const ids = MANUAIS.filter((m) => m.palavras.test(pergunta)).map((m) => m.id)
  for (const id of MANUAIS_DA_TELA[tela ?? ''] ?? []) if (!ids.includes(id)) ids.push(id)
  return ids.slice(0, 3).map((id) => MANUAIS.find((m) => m.id === id)!)
}
