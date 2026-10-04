// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '31 - Comercial - Inadimplência.docx',
  titulo: 'Manual 31 — Inadimplência',
  subtitulo: 'Centro de Inteligência de Recuperação Financeira',
  info: ['Menu: Comercial → Inadimplência  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Cuida do dinheiro que **já venceu e não foi pago**. Lê as contas vencidas direto de Contas a Receber (sem cadastro duplicado) e ajuda a recuperar: prioriza quem cobrar, sugere a melhor estratégia, organiza negociações e calcula a perda provável.' },

    { h1: 'Botões do cabeçalho' },
    { p: '**+ Novo Caso** (registra um título vencido direto em Contas a Receber), **Compartilhar**, seletor de período, busca por cliente e filtro de prioridade.' },

    { h1: 'As partes da tela' },
    { h2: 'Dashboard Executivo (15 indicadores)' },
    { p: '**Valor Total Inadimplente**, **Clientes Inadimplentes**, **% de Inadimplência**, **Recuperado no Mês e no Ano**, **Em Negociação**, **Perda Provável**, **DSO Ajustado**, **Índice de Recuperação**, **Tempo Médio de Recuperação**, **Receita em Risco**, **Fluxo de Caixa Comprometido**, **Impacto na Liquidez**, **Impacto no Capital de Giro** e **Score Médio da Carteira Inadimplente**.' },
    { h2: 'Alertas Inteligentes e Aging' },
    { p: 'Alertas com ação sugerida e o envelhecimento da dívida em 0-30, 31-60, 61-90 e 90+ dias.' },
    { h2: 'Score de Risco Axioma' },
    { p: 'Nota de cada cliente inadimplente e o **Ranking dos Maiores Riscos**.' },
    { h2: 'Prevenção Axioma' },
    { p: 'Explica **O que aconteceu**, **Por quê**, **Impacto** e a **Melhor estratégia**. Funciona por regras, sem texto de modelo de linguagem.' },
    { h2: 'Régua de Recuperação Escalonada' },
    { p: 'Os degraus da recuperação: **amigável → formal → protesto → jurídico → negativação**, cada um com gatilho (dias de atraso), canal e mensagem-modelo. **Usar escalonamento padrão** cria a régua pronta. Nesta fase a régua organiza os passos; nenhuma ação é disparada automaticamente.' },
    { h2: 'Mapa Executivo de Risco' },
    { p: 'Um cliente por linha: valor devido, dias de atraso, nº de títulos, último pagamento, histórico de atrasos, **probabilidade de recuperação** e **de perda**, score, prioridade, impacto financeiro, responsável e negociação.' },
    { h2: 'Simulador Executivo de Recuperação' },
    { p: 'Ajuste **Desconto à Vista**, **% que aceita parcelar**, **Redução de Juros**, **Aumento de Prazo**, **% de Recuperação Parcial**, **% de Perda Total** e **Antecipação** e veja recuperado, perda assumida, EBITDA e caixa em quatro cenários.' },
    { h2: 'Previsão de Recuperação e Provisão PCLD' },
    { p: 'Quanto tende a ser recuperado em cada prazo (Provável, Improvável) e a **Perda Esperada** por faixa de atraso. O bloco **Impacto Simulado na DRE** compara a margem atual com a margem após a provisão; o botão **Salvar provisão na DRE do período** grava a provisão (exige um fechamento de DRE no período).' },
    { h2: 'Custo de Cobrança × Valor Recuperável' },
    { p: 'Informe o custo médio de cobrança por título e o Axioma sinaliza títulos que **não vale a pena perseguir** porque custam mais do que recuperam.' },
    { h2: 'Análises Executivas' },
    { p: 'Heatmap, Evolução Mensal, distribuição por estado e segmento, Curva ABC da Inadimplência e **Ranking de Maior Recuperação**.' },

    { h1: 'Central de Negociação do cliente' },
    { p: 'Abra um cliente para ver os **Títulos em Aberto** (dar baixa, editar, excluir), a **Estratégia Recomendada** com a chance de recuperar, a **Timeline de Interações** e os acordos e promessas (Cumprido ou Quebrado).' },
    { numerada: [
      'Em **Registrar Contato**, anote o que foi tratado.',
      'Em **Registrar Negociação**, informe valor, parcelas, desconto, juros, multa e condições, e clique em **Salvar Negociação**.',
      'Quando o cliente pagar, clique em **Dar baixa**: a dívida é quitada e entra em "Recuperado".',
    ] },
  ],
}

export default doc
