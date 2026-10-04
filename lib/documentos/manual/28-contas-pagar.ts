// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '28 - Comercial - Contas a Pagar.docx',
  titulo: 'Manual 28 — Contas a Pagar',
  subtitulo: 'Central de obrigações com fornecedores',
  info: ['Menu: Comercial → Contas a Pagar  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Reúne tudo o que a empresa tem para pagar: vencimentos, baixas, anexos, aprovações, pedidos de compra e conferência de notas. Além de organizar, o Axioma **protege o caixa**: detecta duplicidades, multas evitáveis, descontos que ainda dá para aproveitar e aumentos silenciosos de preço.' },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['+ Nova Conta', 'Abre o cadastro de uma conta a pagar.'],
      ['Gerar de Custo Fixo', 'Lista os custos fixos do mês e cria a conta de cada um com um clique (sem duplicar no mesmo mês).'],
      ['Importar XML NF-e', 'Lê a nota fiscal eletrônica e preenche a conta sozinho. Se a nota já entrou pelo PDV, oferece vincular em vez de duplicar.'],
      ['Compartilhar', 'Envia o resumo das contas.'],
    ] } },

    { h1: 'Abas' },
    { h2: 'Command Center' },
    { p: 'Cards **Total em Aberto**, **Vencendo em 7 dias**, **Vencidas** e **Pagas no Mês** (clique em "Ver estas contas" para filtrar). Filtros por status, fornecedor e categoria, e a lista de contas. Em cada conta: **Anexar boleto/nota**, **Ver rastreabilidade**, **Dar baixa**, **Estornar pagamento**, **Editar** e **Excluir**. O selo mostra o score de saúde do fornecedor.' },
    { h2: 'Inteligência' },
    { lista: [
      '**O que merece sua atenção hoje**: o resumo dos pontos críticos.',
      '**Pergunte ao Axioma CFO**: pergunta livre (ex.: "quanto vou pagar em 30 dias?"). O Axioma envia ao motor de inteligência os dados reais de contas a pagar e um retrato da empresa; se a inteligência estiver fora, responde por regras e avisa.',
      '**Previsão de Caixa (AP Forecast)**: saldo em 30/60/90 dias nos cenários **Otimista** (em dia, sem multa) e **Pessimista** (com o atraso real da empresa), e se haverá ruptura.',
      '**Prioridade de Pagamento**: ordena o que pagar primeiro por um score; use **Fixar no topo** para manter uma conta em primeiro.',
      '**Despesas Recorrentes Detectadas**: mesmo fornecedor, valor parecido e intervalo regular em pelo menos 3 lançamentos. O botão **Transformar em Custo Fixo** cria o custo fixo (você confere antes; nada é criado sem aprovação).',
      '**Recuperação de Valor**: cobranças acima da média histórica, **multas evitáveis** (quando havia caixa para pagar em dia), possíveis duplicidades, **desconto ainda aproveitável** (com o efeito no caixa, inclusive de antecipar várias juntas) e **desconto perdido**. São sugestões para revisar: nada é alterado sozinho e o sistema nunca antecipa pagamento por conta própria.',
      '**Análise de Gasto**: por categoria, por fornecedor (Top 10), por centro de custo e evolução em 12 meses.',
      '**Pontos de Atenção**: valores muito acima do histórico e **aumento silencioso** (3 altas seguidas).',
    ] },
    { h2: 'Aprovações Pendentes' },
    { p: 'Contas acima do limite configurado aguardam aprovação. Quem é aprovador clica em **Aprovar** ou **Rejeitar** (motivo obrigatório). Os demais veem a fila em modo leitura.' },
    { h2: 'Pedidos de Compra' },
    { p: 'Crie um **Novo Pedido** com fornecedor, número, data e itens (descrição, código, quantidade, valor). Isso liga a conferência completa (Pedido × Recebimento × Nota) para aquele fornecedor. Pedidos com nota vinculada não podem ser excluídos, só cancelados.' },
    { h2: 'Conferência de Notas' },
    { p: 'O Axioma confere cada nota importada com o que entrou no estoque e com a conta a pagar: valores, preços e quantidades. Mostra as **Divergências** com o percentual de diferença. Ações: **Reconferir** e **Aprovar mesmo assim** (só dono, administrador ou financeiro).' },
    { h2: 'Histórico' },
    { p: 'Linha do tempo de tudo o que aconteceu com uma conta (auditoria). Dá para adicionar observação. Excluir um registro exige motivo e o envia para a **lixeira por 30 dias**, de onde pode ser **Restaurado**.' },
    { h2: 'Configuração AP' },
    { p: '**Limite de Aprovação Automática (R$)**, **Aprovadores** (o dono sempre pode aprovar), **bloquear duplicata quase certa** (semelhança de 90% ou mais), **janela de busca de duplicata** e **tolerâncias de valor e quantidade** para a conferência (ex.: 2% cobre frete ou arredondamento).' },

    { h1: 'Passo a passo: nova conta e baixa' },
    { numerada: [
      'Clique em **+ Nova Conta** e preencha fornecedor, descrição, valor total, categoria, emissão, vencimento, número da nota, forma de pagamento e centro de custo.',
      'Opcional: **Multa/Juros por Atraso** e **Desconto por Pagamento Antecipado** com a data limite.',
      'Clique em **Salvar Conta**. Se parecer duplicada, o Axioma mostra a conta parecida; você pode **Vincular a esta**, **Salvar mesmo assim** ou, se o bloqueio estiver ligado, só o dono força com a senha.',
      'Ao pagar, clique em **Dar Baixa**, informe valor e data e **Confirmar Baixa**. Errou? **Estornar pagamento** com motivo.',
    ] },
    { nota: 'Uma conta paga não pode ser excluída: estorne a baixa primeiro. Perfis somente leitura veem tudo, mas não alteram.' },
  ],
}

export default doc
