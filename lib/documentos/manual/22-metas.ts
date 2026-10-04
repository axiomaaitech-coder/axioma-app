// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '22 - Crescimento - Metas.docx',
  titulo: 'Manual 22 — Metas',
  subtitulo: 'O antídoto contra meta vaga e esquecida',
  info: ['Menu: Crescimento → Metas  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Metas transforma objetivos em **número, prazo e responsável**, e acompanha o progresso **sozinho**, lendo os dados reais da empresa. Você não precisa atualizar a meta à mão: se a meta é de receita, o Axioma lê as Receitas; se é de redução de dívida, lê o Endividamento, e assim por diante.' },

    { h1: 'Botões do cabeçalho' },
    { p: '**Exportar PDF** (lista com alvo, atual e status), **+ Nova Meta**, **Escuro / Tema Claro** e **Compartilhar**.' },

    { h1: 'As partes da tela' },
    { h2: 'Cards principais e KPIs CFO' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [3000, 6026], linhas: [
      ['Total de Metas', 'Quantas metas estão ativas.'],
      ['No Ritmo', 'Metas que vão bater no prazo se continuarem assim.'],
      ['Em Risco', 'Metas abaixo do ritmo necessário.'],
      ['Valor em Jogo', 'A soma em reais do que as metas representam.'],
      ['Taxa de Sucesso Histórica', 'Quantas metas passadas foram batidas.'],
      ['Próximo Prazo', 'A meta que vence primeiro.'],
      ['Marcos', 'Etapas alcançadas (25%, 50%, 75%, 100%).'],
    ] } },
    { h2: 'Letreiro' },
    { p: 'Faixa azul-marinho com o resumo das metas passando.' },
    { h2: 'Árvore de Dependência entre Metas' },
    { p: 'Mostra como uma meta depende de outra. Exemplo: a meta de lucro depende da meta de receita e da de redução de custos. Se a meta-base está em risco, as que dependem dela também ficam.' },
    { h2: 'Análise de Metas' },
    { p: 'Janela com três gráficos: **Evolução**, **Progresso: Real vs Esperado** e **Status** das metas.' },
    { h2: 'Conselho CFO' },
    { p: 'Recomendações automáticas quando uma meta está em risco, é fácil demais ou praticamente impossível no prazo.' },
    { h2: 'Cards de meta' },
    { p: 'Cada meta mostra a barra de **Progresso Real** com a marca do progresso esperado para hoje, o semáforo (No Ritmo, Atenção ou Fora do Ritmo), o **Ritmo Necessário** para bater no prazo e a projeção de fechamento. Ao abrir **De onde veio esse número**, você vê o raciocínio do cálculo.' },
    { p: 'Ações em cada meta: ✏️ editar, **Arquivar** (tira da lista sem apagar; dá para **Desarquivar**) e 🗑️ excluir. Metas que chegam a 100% ficam como **Concluída** automaticamente.' },
    { h2: 'Classificação da meta' },
    { p: 'Comparando a meta com o ritmo histórico da empresa, o Axioma avisa quando ela é **Fácil demais** (pouco desafio) ou **Impossível** no prazo, para você ajustar antes de frustrar a equipe.' },

    { h1: 'Passo a passo: criar uma meta' },
    { numerada: [
      'Clique em **+ Nova Meta**.',
      'Dê o **Nome da Meta**.',
      'Em **Vincular a**, escolha o tipo (receita, lucro, margem, ticket médio, clientes, caixa, redução de dívida, redução de custos e outros). O tipo **não muda depois** de criado, porque define de onde o progresso é lido.',
      'Informe o **Valor Inicial** (o ponto de partida) e o **Valor Alvo**. Escolha a **Direção**: aumentar ou reduzir. Se a direção não bater com os valores, a tela avisa.',
      'Defina o **Prazo**, o **Responsável** e a **Estratégia** (como a meta vai ser batida).',
      'Clique em **Salvar Meta**.',
    ] },
    { nota: 'Metas antigas sem tipo vinculado aparecem com um aviso: reclassifique para ativar o acompanhamento automático.' },
    { h1: 'Como a inteligência funciona aqui' },
    { p: 'Todo o acompanhamento é feito por **regras e cálculos sobre os dados reais**: ritmo atual, ritmo histórico, progresso esperado e projeção de fechamento. Nenhum número é inventado, e cada conta pode ser conferida em "De onde veio esse número".' },
  ],
}

export default doc
