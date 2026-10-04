// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '14 - Financeiro - DRE.docx',
  titulo: 'Manual 14 — DRE',
  subtitulo: 'Diagnóstico de Resultado: lucratividade e caixa',
  info: ['Menu: Financeiro → DRE  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A DRE (Demonstração do Resultado do Exercício) mostra se a empresa **dá lucro ou prejuízo** e por quê. No Axioma ela não é só um relatório: é um **diagnóstico**, que explica a causa de cada variação e compara o lucro com o dinheiro que de fato entrou no caixa.' },
    { nota: 'A DRE é montada automaticamente com os dados de Receitas, Custos Variáveis, Custos Fixos, impostos pelo regime tributário e juros das dívidas. Você não precisa lançar nada aqui.' },

    { h1: 'Botões' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Exportar PDF', 'Gera o PDF da DRE do período.'],
      ['Seletor de período', 'Escolhe o período analisado.'],
      ['Ver Histórico', 'Mostra os resultados dos períodos anteriores. Períodos fechados ficam congelados; o atual aparece como "Em andamento".'],
      ['Compartilhar', 'Envia o resumo do resultado.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Cards principais' },
    { p: '**Receita Bruta**, **Lucro Líquido** e **Margem Líquida** do período.' },
    { h2: 'Semáforo de Saúde' },
    { p: 'Cor geral (verde, amarelo ou vermelho) formada por quatro sinais: **Margem Líquida**, **EBITDA em Queda**, **Peso do Custo Fixo** e **Concentração de Clientes**. A cor final é a pior entre eles, para nada ficar escondido.' },
    { h2: 'Indicadores CFO' },
    { p: '**Lucro Líquido**, **EBITDA** (resultado antes de juros, impostos, depreciação e amortização), **Margem Líquida**, **Margem de Contribuição**, **Margem de Segurança** e **Runway** (em quantos meses o resultado fica crítico se a tendência continuar).' },
    { h2: 'Diagnóstico de Lucratividade' },
    { p: 'Explica a **causa raiz** da variação do lucro: quanto veio da receita, dos impostos, dos custos variáveis, dos custos fixos e das despesas financeiras. Exemplo: "O lucro líquido subiu R$ 3.376, puxado principalmente por Custos Variáveis".' },
    { h2: 'Ponte Lucro × Caixa' },
    { p: 'Compara o lucro com o movimento real do caixa e aponta a causa provável da diferença, como recebíveis parados, pagamento de dívida ou custos lançados que ainda não foram pagos.' },
    { h2: 'Cascata do Resultado' },
    { p: 'A DRE em degraus:' },
    { tabela: { colunas: ['Linha', 'O que é'], larguras: [3600, 5426], linhas: [
      ['Receita Bruta', 'Tudo o que foi faturado.'],
      ['(-) Deduções e Impostos', 'Impostos sobre a venda, pelo regime da empresa.'],
      ['Receita Líquida', 'O que sobra depois dos impostos.'],
      ['(-) Custos Variáveis', 'Custos que acompanham as vendas.'],
      ['Margem de Contribuição', 'O que sobra para pagar a estrutura.'],
      ['(-) Custos Fixos', 'A estrutura mensal.'],
      ['EBITDA', 'Resultado operacional.'],
      ['(-) Despesas Financeiras (Juros)', 'Juros das dívidas.'],
      ['Lucro Líquido', 'O resultado final.'],
    ] } },
    { p: 'Ao lado de cada linha: **AV%** (análise vertical, peso sobre a receita líquida) e **AH%** (análise horizontal, variação contra o período anterior). Abaixo, a **Previsão** do lucro para os próximos 3 meses.' },
    { h2: 'Conselho CFO' },
    { p: 'Recomendações práticas quando há algo crítico. Se o período está no prejuízo, o conselho diz isso claramente e sugere segurar gastos novos e rever custos ou aumentar a receita.' },
    { h2: 'Histórico de Resultados' },
    { p: 'A DRE guarda um retrato de cada período fechado para você comparar a evolução ao longo do tempo.' },
  ],
}

export default doc
