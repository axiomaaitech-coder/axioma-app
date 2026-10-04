// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '12 - Financeiro - Custos Variáveis.docx',
  titulo: 'Manual 12 — Custos Variáveis',
  subtitulo: 'Gerencie os custos que acompanham as vendas',
  info: ['Menu: Financeiro → Custos Variáveis  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Custos variáveis sobem e descem junto com as vendas: mercadoria, matéria-prima, comissões, fretes, taxas de cartão e embalagens. Esta tela mostra **quanto sobra de cada venda** (margem de contribuição), **quanto a empresa precisa vender para não ter prejuízo** (ponto de equilíbrio) e detecta custos que estão subindo de forma silenciosa.' },

    { h1: 'Botões do cabeçalho' },
    { p: '**Exportar PDF**, **+ Novo Custo Variável** e **Escuro / Tema Claro**.' },

    { h1: 'As partes da tela' },
    { h2: 'Cards principais' },
    { tabela: { colunas: ['Card', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Total do Mês', 'Soma dos custos variáveis no período.'],
      ['Lançamentos', 'Quantidade de lançamentos.'],
      ['Maior Custo', 'O item mais caro do período.'],
    ] } },
    { h2: 'Visão CFO (com comparação ao período anterior)' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['Margem de Contribuição', 'Quanto sobra da receita depois dos custos variáveis, para pagar os custos fixos e gerar lucro.'],
      ['Ponto de Equilíbrio', 'A receita mínima para empatar (sem lucro nem prejuízo). Quando os custos variáveis consomem toda a receita, aparece "Sem equilíbrio possível".'],
      ['Margem de Segurança', 'Quanto a receita pode cair antes de virar prejuízo.'],
      ['Volatilidade', 'O quanto os custos variam de um mês para outro.'],
      ['Custo Variável do Mês', 'Total do mês, comparado ao anterior.'],
    ] } },
    { h2: 'O que mudou' },
    { p: 'Uma frase automática explica a variação, sempre dizendo de onde veio o número (por exemplo: "Os custos variáveis subiram 12%, puxado por Frete").' },
    { h2: 'Análise de Margem' },
    { p: 'Janela com o gráfico **Receita · Custo Variável · Ponto de Equilíbrio** ao longo do tempo.' },
    { h2: 'Anomalias Detectadas' },
    { p: 'Lista itens que **subiram de forma consistente nos últimos meses** (vale renegociar) ou que **vieram bem acima do que costumam custar** (vale conferir o motivo). É a detecção de aumento silencioso de preço dos fornecedores.' },
    { h2: 'Sugestões Axioma' },
    { p: 'Ações práticas com a **economia potencial** de cada uma.' },
    { h2: 'Insights' },
    { lista: ['Sem ponto de equilíbrio: revise preço ou custo com urgência.', 'Margem de segurança baixa: pouca folga até o prejuízo.', 'Custos muito instáveis: dificultam a previsão de caixa.', 'Custo crescendo mais rápido que a receita: a margem está sendo corroída.', 'Margem de segurança saudável.'] },
    { h2: 'Busca e lista' },
    { p: 'Campo **Buscar custo...**; tabela com descrição, valor, data, categoria e **% do Total**. Em cada linha, ✏️ editar e 🗑️ excluir.' },

    { h1: 'Passo a passo: lançar um custo variável' },
    { numerada: ['Clique em **+ Novo Custo Variável**.', 'Preencha descrição, valor, data e categoria (e o centro de custo, se usar).', 'Clique em **Salvar Custo**.'] },
    { nota: 'Compras de mercadoria por nota fiscal podem ser lançadas em Importar Documentos: o Axioma pergunta se a compra é custo variável, custo fixo, estoque ou investimento e lança no lugar certo.' },
  ],
}

export default doc
