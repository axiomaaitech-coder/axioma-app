// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '30 - Comercial - Contas a Receber.docx',
  titulo: 'Manual 30 — Contas a Receber',
  subtitulo: 'Central de Inteligência Financeira de Recebimentos',
  info: ['Menu: Comercial → Contas a Receber  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Controla tudo o que os clientes devem à empresa e ajuda a **receber mais e mais rápido**: mostra quem paga em dia, quem atrasa, a fila de cobrança, a previsão de entrada de dinheiro e o efeito de antecipar recebíveis.' },

    { h1: 'Botões do cabeçalho' },
    { p: '**+ Nova Conta**, **Compartilhar**, seletor de período, busca (cliente, documento, responsável) e filtro de status.' },

    { h1: 'As partes da tela' },
    { h2: 'Dashboard Executivo' },
    { p: '**Valor Total a Receber**, **Recebido no Mês e no Ano**, **A Vencer**, **Índice de Inadimplência**, **Índice de Pontualidade**, **Prazo Médio de Recebimento (DSO)**, **Receita Prevista**, **Confirmada** e **em Risco**, **Clientes em Atraso**, **Clientes Críticos**, **Ticket Médio** e **Receita Recorrente / Não Recorrente**. Clique em um indicador para ver os itens que o formam.' },
    { h2: 'Alertas Inteligentes' },
    { p: 'Alertas críticos e de atenção, cada um com a **ação sugerida**.' },
    { h2: 'Envelhecimento da Carteira (Aging)' },
    { p: 'Quanto está vencido em cada faixa: **0-30**, **31-60**, **61-90** e **90+ dias**.' },
    { h2: 'Score Axioma do Cliente' },
    { p: 'Nota de cada cliente (Crítico, Atenção, Bom, Excelente) e a **média da carteira**. Clique para ver o detalhe do cálculo.' },
    { h2: 'Análise Explicativa Axioma' },
    { p: 'Explica a situação em quatro partes: **O que aconteceu**, **Por quê**, **Impacto** e **Ação**. Funciona por regras: nenhum texto é gerado por modelo de linguagem.' },
    { h2: 'Fila de Cobrança Priorizada' },
    { p: 'Clientes com saldo vencido, ordenados pelo Score (pior nota e maior valor primeiro), com os dias em atraso.' },
    { h2: 'Régua de Cobrança' },
    { p: 'Organize os passos da cobrança: em quantos dias antes ou depois do vencimento, por qual **canal** e com qual **mensagem-modelo**. **Usar régua padrão** cria uma régua pronta; **Nova Etapa** adiciona passos. Nesta fase a régua organiza os passos; nenhuma mensagem é enviada automaticamente.' },
    { h2: 'Previsão de Caixa' },
    { p: 'O que deve entrar em cada horizonte, classificado por confiança: **Previsto**, **Provável**, **Em Risco** e **Perdido**. Não é só o valor bruto: considera o Score e a probabilidade de recebimento.' },
    { h2: 'Simulador Executivo' },
    { p: 'Ajuste **Δ Inadimplência**, **Redução do DSO**, **% Antecipado**, **Deságio da Antecipação** e **Desconto Oferecido** e veja lucro líquido, EBITDA e caixa em quatro cenários. Inclui a calculadora de **Antecipação de Recebíveis** (quanto custa antecipar e quanto sobra) e o **Impacto do Split Payment** da Reforma Tributária (quanto do recebido iria direto ao governo).' },
    { h2: 'Painéis Analíticos' },
    { p: '**Heatmap de Inadimplência**, **Evolução da Carteira (12 meses)**, **Curva ABC de Clientes**, **Recorrente vs Não Recorrente**, **Concentração Top 5** e distribuição por segmento, estado e cidade.' },
    { h2: 'Central de Recebimentos' },
    { p: 'A tabela completa com cliente, documento, vencimento, dias de atraso, valores (original, desconto, juros, multa, atualizado), responsável, prioridade, score e risco. Ações: **Receber**, **Estornar recebimento**, **Cobrança**, **Editar** e **Excluir**.' },
    { h2: 'Central de Cobrança da conta' },
    { p: 'Mostra a **chance de receber no prazo**, a próxima ação da régua, os contatos registrados (contato, negociação, nota, telefone, presencial) e as **Promessas e Acordos**, marcados como **Cumprido** ou **Quebrado**.' },

    { h1: 'Passo a passo' },
    { numerada: [
      'Clique em **+ Nova Conta**: cliente, descrição, número do documento, valor, já recebido, desconto, juros, multa, forma de recebimento, parcelas, centro de custo e se é recorrente.',
      'Clique em **Salvar Conta**.',
      'Ao receber, clique em **Receber**, informe o valor (pode ser parcial) e **Confirmar**.',
      'Errou? **Estornar recebimento** com o motivo.',
    ] },
    { nota: 'Conta já recebida não pode ser excluída: estorne o recebimento primeiro. Contas vencidas aparecem automaticamente em Inadimplência.' },
  ],
}

export default doc
