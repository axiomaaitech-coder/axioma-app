// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '36 - IA Premium - IA Financeira.docx',
  titulo: 'Manual 36 — IA Financeira',
  subtitulo: 'Seu CFO Digital: análise inteligente com dados reais',
  info: ['Menu: IA Premium → IA Financeira  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A IA Financeira é o **diretor financeiro digital** da empresa. Junta todos os módulos em uma nota geral (Score 360°), aponta anomalias, projeta a receita, simula cenários, monta um plano de ação e conversa com você sobre as finanças, sempre com os dados reais.' },

    { h1: 'Como a inteligência funciona aqui' },
    { p: 'A tela combina duas camadas:' },
    { tabela: { colunas: ['Camada', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Cálculos do Axioma', 'Score 360°, Anomalias, Projeções, What-If, Plano de Ação, Resumo Executivo e Benchmark são **calculados por regras** a partir dos seus lançamentos. São instantâneos e sempre iguais para os mesmos dados.'],
      ['Chat CFO (inteligência artificial)', 'Usa o **motor de inteligência mais avançado do Axioma**. A cada pergunta, o Axioma monta um retrato atualizado da empresa (receitas, custos, caixa, dívidas, indicadores), envia junto com a pergunta e confere a resposta antes de mostrar. Perguntas complexas são encaminhadas aos modelos mais potentes.'],
    ] } },
    { nota: 'Toda chamada à inteligência artificial é registrada para auditoria, sem guardar o conteúdo das conversas no registro de auditoria.' },

    { h1: 'As abas' },
    { h2: '🏆 Score 360°' },
    { p: 'Nota geral da empresa com o gráfico de radar das **dimensões** (rentabilidade, liquidez, endividamento, eficiência, crescimento). Cada dimensão tem um card com os indicadores que a formam, a cor (Bom, Atenção, Crítico) e uma **sugestão**.' },
    { h2: '💬 Chat CFO' },
    { p: 'Escreva a pergunta em linguagem natural, por exemplo: "por que meu lucro caiu este mês?", "consigo contratar mais uma pessoa?", "qual custo devo cortar primeiro?". A resposta cita os números da empresa. O botão **🗑️ Limpar histórico** apaga as conversas.' },
    { h2: '🔍 Anomalias' },
    { p: 'Alertas sobre indicadores fora do esperado, classificados como **Alerta** ou **Info**.' },
    { h2: '🔮 Projeções' },
    { p: 'Receita dos próximos 6 meses em três cenários: **Otimista**, **Realista** e **Pessimista**. Precisa de pelo menos 2 meses de receitas.' },
    { h2: '⚡ What-If' },
    { p: 'Ajuste quanto a **receita**, os **custos fixos**, os **custos variáveis** e o **preço** sobem ou descem e clique em **Simular**. Mostra **Lucro Antes/Depois**, a **Diferença** e a **Margem Antes/Depois**.' },
    { h2: '🎯 Plano de Ação' },
    { p: '**5 ações prioritárias** baseadas nos dados reais, cada uma com **impacto estimado** e **prioridade**.' },
    { h2: '📊 Resumo Executivo' },
    { p: 'Relatório do mês narrado em texto, pronto para enviar aos sócios.' },
    { h2: '📈 Benchmark' },
    { p: 'Compara seus indicadores com a **faixa do setor**.' },

    { h1: 'Compartilhar e exportar' },
    { p: '**📤 Compartilhar** abre o Centro de Compartilhamento (WhatsApp, e-mail, Telegram, **Copiar**) e o **PDF Relatório**.' },
    { h1: 'Dicas para perguntar melhor' },
    { lista: ['Seja específico: cite o período ("em setembro") ou o módulo ("nos custos fixos").', 'Peça comparação: "compare com o mês passado".', 'Peça decisão: "o que você faria no meu lugar?".', 'Quanto mais completos os lançamentos, melhores as respostas.'] },
  ],
}

export default doc
