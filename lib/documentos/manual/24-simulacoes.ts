// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '24 - Crescimento - Simulações.docx',
  titulo: 'Manual 24 — Simulações Estratégicas',
  subtitulo: 'Teste decisões antes de arriscar o caixa',
  info: ['Menu: Crescimento → Simulações  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Responde perguntas do tipo **"e se?"**: e se a receita cair 20%? e se os juros subirem? e se eu quiser dobrar o faturamento? A tela parte dos **números reais** da empresa, aplica as mudanças e mostra lucro, caixa, risco de ruptura e o impacto em cada regime tributário.' },

    { h1: 'As partes da tela' },
    { h2: 'Ponto de Partida (dados reais)' },
    { p: '**Receita Mensal Média**, **Custo Fixo Mensal**, **Custo Variável Mensal**, **Dívida Total Ativa**, **Caixa Disponível** e **Regime Atual**. Sem Receitas, Custos Fixos e Custos Variáveis cadastrados, a tela pede o cadastro primeiro.' },
    { h2: 'Indicadores de Mercado' },
    { p: 'Selic, CDI, IPCA e Dólar do Banco Central.' },
    { h2: 'Objetivos Rápidos' },
    { p: 'Botões que já preenchem os choques para objetivos comuns: **Dobrar Faturamento**, **Triplicar Lucro**, **Melhorar Fluxo de Caixa**, **Reduzir Custos**, **Reduzir Dívida**, **Cenário de Crise** e **Expansão**.' },
    { h2: 'Motor de Simulação (choques)' },
    { p: 'Ajuste **Receita (%)**, **Custo Fixo (%)**, **Custo Variável (%)**, **Juros da Dívida (pontos)**, **Aporte** e seu retorno, o **Horizonte de Simulação (meses)** e, se a empresa tiver custos em dólar, o **Choque Cambial** com a **Exposição Cambial**. Clique em **Rodar Simulação**.' },
    { h2: 'Cenários Simulados' },
    { p: 'Quatro cenários (**Conservador**, **Base**, **Otimista**, **Adverso**) com Lucro Líquido/Mês, Saldo projetado em 12 meses e Runway crítico, além da **Probabilidade de Lucro Positivo**, da **Probabilidade de Ruptura de Caixa** e do **Nível de Confiança** (Baixo, Médio, Alto).' },
    { h2: 'Análise de Sensibilidade' },
    { p: 'Mostra quais variáveis mais mexem no lucro, com o **peso** de cada uma e o efeito **Desfavorável** e **Favorável**. Ajuda a saber onde focar.' },
    { h2: 'Simulação Monte Carlo' },
    { p: 'Roda milhares de **iterações simuladas** com variações aleatórias realistas e mostra a faixa provável de resultado (com a **mediana**). É a técnica usada por bancos e seguradoras para medir risco.' },
    { h2: 'Impacto por Regime Tributário' },
    { p: 'Calcula o **Imposto Mensal Estimado** e o **Lucro Líquido** em Simples Nacional, Lucro Presumido e Lucro Real, marcando o melhor regime para aquele cenário.' },
    { h2: 'Conselho Executivo' },
    { p: 'Relatório final com **Resumo Executivo**, **Riscos**, **Oportunidades**, **Premissas Utilizadas**, **Plano de Ação Recomendado** e **Limitações**. Exemplos de plano de ação: revisar o fator de maior sensibilidade antes de comprometer caixa, aumentar a reserva antes de executar o cenário, ou manter o monitoramento quando não há risco crítico.' },

    { h1: 'Passo a passo' },
    { numerada: ['Confira o Ponto de Partida.', 'Escolha um Objetivo Rápido ou ajuste os choques à mão.', 'Clique em **Rodar Simulação**.', 'Leia os cenários, a sensibilidade e o Conselho Executivo.', 'Use **Compartilhar** para enviar o resultado aos sócios.'] },
    { h1: 'Transparência' },
    { p: 'Esta análise é **100% baseada em regras e nos números reais** da sua empresa: nenhum texto aqui é gerado por modelo de linguagem. A projeção não prevê eventos fora do modelo (como mudança regulatória súbita) e não garante resultado futuro.' },
    { nota: 'Para simulações em conversa livre com inteligência artificial, use a IA Financeira (manual 36).' },
  ],
}

export default doc
