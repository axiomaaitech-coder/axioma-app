// ═══════════════════════════════════════════════════════════════
// MOTOR DE IA — Perguntas-padrão (B2). Conjunto fixo de perguntas reais de
// dono de empresa, por área e por setor, com o NÍVEL mínimo esperado da
// triagem e o manual que precisa entrar. Roda de graça em
// scripts/check-ia-motor.mts a cada mudança: garante a trava (pergunta de
// plano/decisão grande nunca cai na IA barata; pergunta simples não paga caro).
// `nivel: null` = a regra fica em dúvida de propósito e a OpenAI classifica.
// Arquivo puro (sem import).
// ═══════════════════════════════════════════════════════════════

export type PerguntaPadrao = { pergunta: string; tela?: string; nivel: 'rotina' | 'analise' | 'estrategica' | null; manual?: string; setor?: string }

export const PERGUNTAS_PADRAO: PerguntaPadrao[] = [
  // ── Rotina (fato direto → OpenAI) ──
  { pergunta: 'Quanto faturei este mês?', nivel: 'rotina', manual: 'vendas' },
  { pergunta: 'Qual o meu saldo de caixa hoje?', nivel: 'rotina', manual: 'caixa' },
  { pergunta: 'Quando vence o DAS?', tela: 'mei-das', nivel: 'rotina', manual: 'tributario' },
  { pergunta: 'Quais contas a pagar vencem esta semana?', nivel: 'rotina', manual: 'caixa' },
  { pergunta: 'O que é ponto de equilíbrio?', nivel: 'rotina' },
  { pergunta: 'Quanto pago de imposto por mês?', nivel: 'rotina', manual: 'tributario' },
  { pergunta: 'Qual a minha margem de lucro?', nivel: 'rotina', manual: 'precificacao' },
  { pergunta: 'Quanto os clientes me devem?', nivel: 'rotina', manual: 'cobranca' },

  // ── Análise (causa, comparação, decisão do dia a dia → Sonnet) ──
  { pergunta: 'Por que meu lucro caiu nos últimos meses?', nivel: 'analise' },
  { pergunta: 'Onde posso cortar custos sem prejudicar as vendas?', nivel: 'analise', manual: 'custos' },
  { pergunta: 'Devo aumentar o preço dos meus produtos?', nivel: 'analise', manual: 'precificacao' },
  { pergunta: 'Minha inadimplência está alta, o que devo fazer?', nivel: 'analise', manual: 'cobranca' },
  { pergunta: 'Vale a pena renegociar meu empréstimo agora que a Selic caiu?', nivel: 'analise', manual: 'divida' },
  { pergunta: 'Tenho produtos parados no estoque, qual o risco?', nivel: 'analise', manual: 'estoque' },
  { pergunta: 'Compare meus custos fixos com a receita', nivel: 'analise', manual: 'custos' },
  { pergunta: 'O dólar subindo é um problema para mim?', nivel: 'analise', manual: 'economia' },

  // ── Estratégica (plano, projeção, decisão grande → Opus) ──
  { pergunta: 'Monte um plano para os próximos 3 anos', nivel: 'estrategica', manual: 'crescimento' },
  { pergunta: 'Vale a pena abrir uma nova loja?', nivel: 'estrategica', manual: 'crescimento' },
  { pergunta: 'Devo mudar de regime tributário?', nivel: 'estrategica', manual: 'tributario' },
  { pergunta: 'Como reestruturar minhas dívidas para sair do vermelho?', nivel: 'estrategica', manual: 'divida' },
  { pergunta: 'Qual cenário da minha empresa em 5 anos com juros altos?', nivel: 'estrategica', manual: 'economia' },
  { pergunta: 'Posso contratar mais dois funcionários?', nivel: 'estrategica' },

  // ── Por setor (o manual do setor entra pelo CNAE; aqui conferimos o nível) ──
  { pergunta: 'Como a safra e o preço da soja afetam meu caixa?', setor: 'agro', nivel: 'analise', manual: 'caixa' },
  { pergunta: 'O aço chinês barato ameaça minha margem?', setor: 'metalurgia', nivel: 'analise', manual: 'precificacao' },
  { pergunta: 'O diesel subiu, devo repassar no frete?', setor: 'transporte', nivel: 'analise' },
  { pergunta: 'Minhas vendas de fim de ano vão cobrir o estoque que comprei?', setor: 'varejo', nivel: 'analise', manual: 'estoque' },
  { pergunta: 'Quanto do meu faturamento vai para o CMV?', setor: 'alimentacao', nivel: 'rotina', manual: 'custos' },
  { pergunta: 'Qual o risco de depender de um convênio só?', setor: 'saude', nivel: 'analise' },
  { pergunta: 'Qual o churn dos meus clientes de assinatura?', setor: 'tecnologia', nivel: 'rotina', manual: 'vendas' },
  { pergunta: 'A evasão de alunos está comprometendo o caixa?', setor: 'educacao', nivel: 'analise', manual: 'caixa' },

  // ── Dúvida proposital (a regra não decide; a OpenAI classifica) ──
  { pergunta: 'bom dia', nivel: null },
  { pergunta: 'me ajuda com a empresa', nivel: null },
]
