// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '04 - MEI - Faturamento.docx',
  titulo: 'Manual 04 — Faturamento MEI',
  subtitulo: 'Acompanhe o faturamento mensal e o limite anual do MEI',
  info: ['Menu: MEI → Faturamento  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Aqui você acompanha **tudo o que o MEI faturou no ano** e o quanto isso consome do teto anual de R$ 81.000. A tela mostra o ritmo de vendas, avisa quando o teto está perto e gera o **Relatório Mensal de Receitas Brutas**, documento que o MEI precisa manter.' },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Exportar PDF', 'Gera o PDF do faturamento do ano.'],
      ['+ Novo lançamento', 'Abre a janela para lançar uma venda ou serviço.'],
      ['Compartilhar', 'Envia o resumo do faturamento por WhatsApp, e-mail, Telegram ou copia.'],
      ['Escuro / Tema Claro', 'Troca a aparência.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Cards resumo' },
    { tabela: { colunas: ['Card', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Faturamento', 'Total faturado no ano.'],
      ['Limite Restante', 'Quanto ainda pode faturar até o teto.'],
      ['Limite Usado', 'Porcentagem do teto já usada.'],
    ] } },
    { h2: 'Reserva automática de imposto' },
    { p: 'Mostra quanto do que entrou você deve reservar para impostos (DAS e IRPF), para não ser pego de surpresa.' },
    { h2: 'Velocímetro de Faturamento' },
    { p: 'Um medidor visual do teto. Abaixo dele aparecem:' },
    { lista: [
      '**Seu teto em (ano)**: o limite do ano. No primeiro ano é proporcional aos meses de atividade; nos demais aparece "teto cheio — ano completo de atividade".',
      '**Quanto ainda pode faturar por mês até dezembro**: o ritmo máximo para não estourar.',
      '**Mês provável de estouro**: ou "No ritmo atual, não estoura este ano."',
      'Avisos especiais: "Acima do teto, mas ainda dá até dezembro (DAS complementar)" quando passou até 20%; "Risco de desenquadramento retroativo — mais de 120% do teto" quando passou mais de 20%.',
    ] },
    { h2: 'Faturamento vs. Teto e Média' },
    { p: 'Gráfico com o **faturamento real** de cada mês, o **teto mensal recomendado** e a **sua média**. Ao lado, comparações "vs. sua média" e "vs. mês anterior".' },
    { h2: 'Análise Executiva Axioma' },
    { p: 'Clique em **Analisar** para a inteligência do Axioma explicar o seu faturamento: tendência, sazonalidade, risco de teto e o que fazer. Enquanto pensa, aparece "Analisando...". Se a IA não estiver disponível, a tela mostra uma análise por regras automaticamente.' },
    { h2: 'Faturamento Mensal' },
    { p: 'Tabela mês a mês com o total do ano. É a base do **Relatório Mensal de Receitas Brutas**.' },
    { h2: 'Lançamentos do Ano' },
    { p: 'Lista de todas as vendas lançadas, com descrição, valor, data, categoria e status (Recebido ou Pendente). Em cada linha:' },
    { tabela: { colunas: ['Controle', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Conta pro teto MEI (chave)', 'Liga ou desliga se aquele lançamento entra no cálculo do teto (por exemplo, um reembolso que não é faturamento).'],
      ['✏️ Lápis', 'Edita o lançamento.'],
      ['🗑️ Lixeira', 'Exclui. Pede confirmação ("Excluir este lançamento?").'],
    ] } },

    { h1: 'Passo a passo: lançar uma venda' },
    { numerada: [
      'Clique em **+ Novo lançamento**.',
      'Preencha **Descrição**, **Valor (R$)**, **Data**, **Categoria** e **Status** (Recebido ou Pendente).',
      'Clique em **Salvar**. Aparece "Lançamento salvo." e os cards se atualizam.',
    ] },
    { nota: 'Se faltar descrição ou valor, a tela avisa "Preencha descrição e valor antes de salvar."' },
  ],
}

export default doc
