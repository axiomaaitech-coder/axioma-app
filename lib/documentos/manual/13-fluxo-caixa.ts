// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '13 - Financeiro - Fluxo de Caixa.docx',
  titulo: 'Manual 13 — Fluxo de Caixa',
  subtitulo: 'Entradas, saídas e previsão de 30, 60 e 90 dias',
  info: ['Menu: Financeiro → Fluxo de Caixa  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Fluxo de Caixa mostra o **dinheiro de verdade**: o que entrou, o que saiu, quanto há em caixa hoje e quanto haverá nas próximas semanas. Seu ponto mais importante é o **Alerta de Ruptura de Caixa**, que avisa com antecedência se o dinheiro vai faltar.' },

    { h1: 'Botões do cabeçalho' },
    { p: '**Exportar PDF** (lista do período e resumo), **+ Novo Lançamento**, **Escuro / Tema Claro** e, abaixo, o seletor de período e **Compartilhar**.' },

    { h1: 'As partes da tela' },
    { h2: 'Cards do topo (respeitam o período escolhido)' },
    { tabela: { colunas: ['Card', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Total Entradas', 'Entradas do período.'],
      ['Total Saídas', 'Saídas do período.'],
      ['Saldo Atual', 'O saldo real em caixa hoje (só o que foi realizado).'],
    ] } },
    { h2: 'Indicadores CFO' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['Saldo Atual', 'Dinheiro realizado em caixa.'],
      ['Total Entradas / Total Saídas', 'Do período, com a comparação ao período anterior.'],
      ['Saldo do Período', 'Entradas menos saídas no período escolhido.'],
      ['Alerta de Ruptura de Caixa', 'Em quantos dias o caixa ficaria negativo, se ficar; "—" quando não há risco.'],
      ['Precisão da Previsão', 'O quanto as previsões passadas acertaram o que de fato aconteceu.'],
    ] } },
    { h2: 'O que mudou' },
    { p: 'Frase automática explicando a variação do período.' },
    { h2: 'Previstos Automáticos' },
    { p: 'O Axioma puxa sozinho, de outros módulos, o que ainda vai entrar e sair, **sem você precisar lançar de novo**:' },
    { lista: ['**Contas a Receber** em aberto (entradas previstas).', '**Contas a Pagar** em aberto (saídas previstas).', '**Custos Fixos** recorrentes (projetados todo mês).', '**Parcelas de Dívidas** (do Endividamento).'] },
    { p: 'A chave **Incluir previstos automáticos na projeção** liga ou desliga esse recurso. Se você já lança esses itens à mão no Fluxo, desligue para não contar em dobro.' },
    { h2: 'Previsão (próximos 3 meses)' },
    { p: 'Gráfico do saldo projetado em três cenários: **Otimista**, **Previsto** e **Pessimista**. Botões **Visão Semanal (13 semanas)** e **Visão Mensal** mudam o detalhamento.' },
    { h2: 'Total Entradas × Total Saídas' },
    { p: 'Gráfico de barras comparando entradas e saídas ao longo do período.' },
    { h2: 'Lançamentos do Período' },
    { p: 'Tabela com descrição, tipo (Entrada ou Saída), data, status (Realizado ou Previsto) e valor, com ✏️ editar e 🗑️ excluir. Mostra 25 por página.' },

    { h1: 'Passo a passo: lançar uma movimentação' },
    { numerada: ['Clique em **+ Novo Lançamento**.', 'Escolha o tipo (**Entrada** ou **Saída**), descrição, valor, data e status (**Realizado** se já aconteceu; **Previsto** se ainda vai acontecer).', 'Clique em **Salvar Lançamento**.'] },
    { alerta: 'Se aparecer o **Alerta de Ruptura de Caixa**, aja logo: antecipe recebimentos, renegocie pagamentos ou reforce o caixa. Quanto antes, mais opções existem.' },
    { nota: 'Conectando o banco em Open Finance, o extrato real entra no Axioma e o caixa fica ainda mais fiel.' },
  ],
}

export default doc
