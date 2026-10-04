// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '32 - Gestão - Centros de Custo.docx',
  titulo: 'Manual 32 — Centros de Custo',
  subtitulo: 'Gerencie e distribua seus custos por área',
  info: ['Menu: Gestão → Centros de Custo  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Centros de custo dividem a empresa em áreas (loja, filial, departamento, projeto) para saber **quanto cada área gasta, quanto fatura e se dá resultado**. Também controla orçamento, aponta desperdícios e permite simular decisões por área.' },

    { h1: 'Botões do cabeçalho' },
    { p: '**+ Novo Centro**, **+ Novo Lançamento**, **Ratear Custo**, **Compartilhar** e o seletor de período.' },
    { h2: 'Cards de resumo' },
    { p: '**Total de Centros**, **Total em Custos**, **Total em Receitas** e **Saldo Geral**, além do **Score do Módulo** (disciplina orçamentária, anomalias, oportunidades capturadas e quanto dos lançamentos está atribuído a algum centro).' },

    { h1: 'Abas' },
    { tabela: { colunas: ['Aba', 'O que mostra e faz'], larguras: [2400, 6626], linhas: [
      ['Visão Geral', '**Orçado vs Realizado** por centro (dentro ou acima do orçamento), **Meta vs Realizado de Receita** ("Meta atingida!" ou quanto falta) e **Resultado, Margem e Participação** de cada centro.'],
      ['Centros', 'Lista dos centros com responsável. Botão **Definir orçamento deste mês** para cada um.'],
      ['Lançamentos', 'Lançamentos atribuídos aos centros, com busca, editar e excluir.'],
      ['Insights', '**Economia Potencial Total**, **5 Maiores Riscos**, **5 Maiores Oportunidades**, **5 Maiores Desperdícios**, **5 Melhores Resultados** e as **Prioridades da Semana e do Mês**.'],
      ['Causa Raiz', 'Aumentos fora do padrão em cada centro (**Acima da média**, **Aumento recorrente**), quando aconteceram, e o botão **Gerar plano de ação**.'],
      ['Oportunidades', '**Orçamento Vivo**: projeção de fechamento do mês contra o orçado, e as oportunidades de economia identificadas.'],
      ['Simulador', 'Cenários: **Reduzir custos**, **Expandir equipe**, **Abrir filial**, **Encerrar centro/projeto**, **Trocar fornecedor**, **Alterar preços**, **Renegociar contratos**, **Variar inflação** e **Variar câmbio**. Escolha o centro, o percentual e o horizonte. Mostra Receita, Lucro Líquido, Capital de Giro e Caixa Projetado e o **Mapa de Impacto**, recalculado com os dados reais.'],
      ['Copiloto', 'Pergunta livre sobre os centros de custo (ver abaixo).'],
      ['Ações', 'Planos de ação com status **Pendente**, **Em andamento**, **Concluído** ou **Cancelado**, prazo e economia esperada.'],
      ['Planilha', 'Visão em planilha de todos os lançamentos por centro, com gráficos, para quem prefere trabalhar em tabela.'],
    ] } },

    { h1: 'O que a inteligência faz' },
    { p: 'Os indicadores, insights, causa raiz e simulações são **calculados por regras** sobre os dados reais. O **Copiloto** usa o motor de inteligência artificial: você pergunta (ex.: "qual centro está estourando o orçamento?"), o Axioma envia os números dos centros desta tela e um retrato da empresa, e a resposta volta em linguagem simples. Se a inteligência estiver fora, responde por regras.' },

    { h1: 'Passo a passo' },
    { h2: 'Criar um centro' },
    { p: 'Clique em **+ Novo Centro**: nome, código, descrição, cor, responsável, **Orçamento Mensal (R$)** e **Meta Receita (R$)**. Opcional: cadastro com tipo (jurídica ou física), endereço, **headcount** e **área (m²)**, que servem de base para o rateio automático.' },
    { h2: 'Ratear um custo' },
    { numerada: [
      'Clique em **Ratear Custo** e escolha um lançamento que já existe (ex.: o aluguel em Custos Fixos).',
      'Divida o valor entre os centros por percentual: **Igualmente**, **Por headcount** ou **Por área (m²)**, ou à mão.',
      'Confira o **Total distribuído** e o **Restante** e clique em **Aplicar Rateio**.',
    ] },
    { nota: 'O rateio não cria um custo novo: só reparte o que já existe. Para desfazer, use **Remover rateio atual**.' },
    { h2: 'Criar um plano de ação' },
    { p: 'Em **Ações**, clique em **Novo Plano**: título, objetivo, tarefas (uma por linha), responsável, prazo, impacto esperado e economia estimada. Clique em **Salvar Plano** e acompanhe o status.' },
  ],
}

export default doc
