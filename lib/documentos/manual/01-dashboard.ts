// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '01 - Dashboard.docx',
  titulo: 'Manual 01 — Dashboard',
  subtitulo: 'A visão geral da empresa em uma única tela',
  info: ['Menu: 🏠 Dashboard  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Dashboard é a primeira tela depois do login. Ele junta, em um só lugar, os números mais importantes de todos os módulos: receita, custos, caixa, dívidas, metas, clientes, recebíveis e investimentos. Serve para você saber, em poucos segundos, **como a empresa está** e onde precisa olhar com mais atenção.' },
    { nota: 'O Dashboard só mostra dados reais da sua empresa. Se quiser ver como ele fica cheio, use o botão **Ver demonstração** (dados fictícios, claramente marcados).' },

    { h1: 'As partes da tela, de cima para baixo' },
    { h2: '1. Boas-vindas' },
    { p: 'No topo há um vídeo de fundo com o logo do Axioma, a saudação (**Bom dia / Boa tarde / Boa noite**, com o seu nome), o nome da empresa ativa e a frase "Seu CFO Digital — powered by IA".' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Compartilhar', 'Abre o Centro de Compartilhamento com o resumo do Dashboard (receita, custos, saldo, dívida, metas, clientes, recebíveis). Escolha WhatsApp, Gmail, Outlook, Telegram, e-mail ou Copiar.'],
      ['PDF', 'Gera um PDF do Dashboard para salvar ou enviar.'],
      ['Escuro / Tema Claro', 'Troca a aparência da tela.'],
    ] } },

    { h2: '2. Dashboard Financeiro' },
    { p: 'Bloco que resume a parte financeira: **Receita · Custos · Fluxo de Caixa · Endividamento**.' },
    { h3: 'Botão Ver demonstração / Ver meus dados' },
    { p: 'Liga ou desliga o modo demonstração. Em demonstração aparece a faixa "MODO DEMONSTRAÇÃO — dados fictícios, não são da sua empresa", para não serem confundidos com os números reais. Clique em **Ver meus dados** para voltar.' },
    { h3: 'Cards de indicadores' },
    { tabela: { colunas: ['Card', 'O que mostra', 'Ao clicar'], larguras: [2200, 4626, 2200], linhas: [
      ['Receita Total', 'Soma das receitas lançadas no período.', 'Abre Receitas'],
      ['Custos Fixos', 'Soma dos custos fixos mensais (aluguel, salários, assinaturas...).', 'Abre Custos Fixos'],
      ['Custos Variáveis', 'Soma dos custos que variam com as vendas.', 'Abre Custos Variáveis'],
      ['Saldo em Caixa', 'Entradas menos saídas realizadas no Fluxo de Caixa.', 'Abre Fluxo de Caixa'],
      ['Dívida Total', 'Saldo devedor de empréstimos e financiamentos.', 'Abre Endividamento'],
    ] } },
    { h3: 'Letreiro' },
    { p: 'A faixa azul-marinho repete esses números em movimento, para leitura rápida.' },
    { h3: 'Análise Financeira Anual (gráficos)' },
    { tabela: { colunas: ['Gráfico', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Endividamento', 'Quanto da dívida já foi **pago** e quanto ainda é **saldo devedor** (rosca), ou a evolução do saldo, da amortização e dos juros.'],
      ['Custos Fixos', 'Os custos fixos mês a mês.'],
      ['Custos Variáveis', 'Os custos variáveis mês a mês.'],
      ['Fluxo de Caixa', 'Entradas, saídas, valor investido e reserva.'],
      ['Receita', 'A receita dividida por categoria (vendas, serviços, recorrente, outros).'],
    ] } },
    { p: 'Cada gráfico tem o botão **Ver módulo →**, que abre a tela de origem daqueles dados. Quando ainda não há dados, o gráfico mostra uma mensagem explicando o que lançar (por exemplo, "Nenhuma receita registrada ainda").' },

    { h2: '3. Dashboard Comercial & Crescimento' },
    { p: 'Bloco que resume vendas e crescimento: **Metas · Clientes · Recebíveis · Investimentos**. Também tem o botão **Ver demonstração**.' },
    { tabela: { colunas: ['Card', 'O que mostra', 'Ao clicar'], larguras: [2200, 4626, 2200], linhas: [
      ['Metas Cadastradas', 'Quantas metas a empresa tem.', 'Abre Metas'],
      ['Clientes Ativos', 'Clientes com movimento.', 'Abre Clientes'],
      ['A Receber', 'Total de contas a receber em aberto.', 'Abre Contas a Receber'],
      ['Inadimplência', 'Valor em atraso.', 'Abre Inadimplência'],
      ['Investimentos', 'Total investido pela empresa.', 'Abre Investimentos'],
    ] } },
    { h3: 'Análise Comercial & Crescimento (gráficos)' },
    { tabela: { colunas: ['Gráfico', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Metas vs. Realizado', 'Meta, valor realizado e projeção.'],
      ['Novos Clientes', 'Clientes novos por mês.'],
      ['Inadimplência', 'Valor em atraso por mês.'],
      ['Contas a Receber', 'Divisão entre a vencer, vence em 30 dias, em atraso e renegociado.'],
      ['Investimentos', 'Carteira por tipo: renda fixa, renda variável, cripto, imóvel e outros.'],
    ] } },

    { h2: '4. Módulos Axioma (atalhos)' },
    { p: 'No fim da tela há atalhos para os módulos mais usados: Receitas, Custos Fixos, Custos Variáveis, DRE, Fluxo, Clientes, Relatórios, Empresa, IA Financeira, IA Tributária, Fornecedores e MEI. Clique para abrir.' },

    { h1: 'Passo a passo: rotina recomendada' },
    { numerada: [
      'Abra o Dashboard no início do dia.',
      'Olhe o **Saldo em Caixa** e a **Inadimplência**: se algum estiver em vermelho, clique no card para entender.',
      'Confira os gráficos de custos: um pico fora do normal merece atenção.',
      'Use **Compartilhar → WhatsApp** para mandar o resumo ao sócio ou ao contador.',
    ] },

    { h1: 'Perguntas frequentes' },
    { h3: 'Por que um card aparece zerado?' },
    { p: 'Porque ainda não há lançamentos daquele tipo. Abra o módulo correspondente e cadastre os dados, ou importe-os em Importar Documentos.' },
    { h3: 'Os dados da demonstração vão para a minha empresa?' },
    { p: 'Não. A demonstração é só visual e nunca grava nada.' },
  ],
}

export default doc
