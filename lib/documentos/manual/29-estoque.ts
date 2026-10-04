// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '29 - Comercial - Estoque.docx',
  titulo: 'Manual 29 — Estoque',
  subtitulo: 'Saldo, custo médio, validade e centro de avisos',
  info: ['Menu: Comercial → Estoque  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Controla os produtos, as entradas e saídas, o custo médio e a validade dos lotes. Avisa sobre ruptura, estoque baixo, capital parado e produtos vencendo, e sugere o que repor e o que promover. É integrado ao PDV e às notas fiscais de compra.' },

    { h1: 'Botões' },
    { p: '**+ Novo Produto**, **+ Nova Movimentação**, **Compartilhar** e o campo de busca (por nome, código, SKU, categoria, marca, fornecedor ou localização; também aceita leitor de código de barras).' },

    { h1: 'Abas' },
    { h2: 'Painel' },
    { p: '**Valor Total em Estoque**, **Produtos Ativos**, **Produtos Inativos**, **Em Ruptura**, **Baixo Estoque**, **Próx. da Validade**, **Vencidos** e **Capital Parado**. Gráficos de **Estoque por Categoria**, **por Fornecedor** e **Entradas × Saídas** (6 meses).' },
    { h2: 'Produtos' },
    { p: 'Lista com nome, código, categoria, saldo, custo médio, preço de venda e status. Selecione vários para **Editar em Lote**. Também: **Exportar Excel/CSV**, **Importar Excel/CSV**, **Gerar Etiquetas** e **Imprimir**.' },
    { h2: 'Movimentações' },
    { p: 'Todas as entradas e saídas. Movimentos **Em trânsito** (comprados, aguardando chegada) têm o botão para confirmar o recebimento, e só então entram no saldo.' },
    { h2: 'Avisos' },
    { p: '**Ruptura**, **Baixo estoque**, **Capital parado**, **Custo subindo** e **Validade (FEFO)**: lotes vencidos, no último dia, e em 7, 30, 60 e 90 dias.' },
    { h2: 'Inteligência' },
    { lista: [
      '**Curva ABC / Pareto**: Classe A (alto valor), B, C e itens sem giro.',
      '**Giro e Tempo em Estoque**: giro em 90 dias, consumo por dia, capital imobilizado, dias sem giro.',
      '**Rentabilidade Projetada**: margem pelo preço sugerido × custo médio (não é lucro realizado).',
      '**Ponto de Reposição e Risco de Ruptura**: quando comprar e quantos dias restam (precisa do prazo de entrega no cadastro).',
      '**Comparação de Fornecedores**: preço médio de compra, entregas e última entrada.',
    ] },
    { h2: 'Copiloto' },
    { p: 'Resume o que fazer: o que está **parado há mais tempo**, quanto **dinheiro está parado**, **o que repor**, **o que promover** (Classe C parado) e o **risco de ruptura**. É calculado por regras a partir das movimentações reais.' },

    { h1: 'Passo a passo: cadastrar um produto' },
    { numerada: [
      'Clique em **+ Novo Produto**. Digite o código de barras e use **Buscar dados pelo código de barras** para preencher pelo catálogo (revise antes de salvar).',
      '**Identificação**: nome, códigos (interno, EAN, SKU), categoria, marca, fabricante, fornecedor, unidade.',
      '**Dimensões** e **Localização Física** (rua, prateleira, nível, posição), centro de custo e conta contábil.',
      '**Preços**: custo, markup, preço sugerido, mínimo, promocional e preço de venda (o botão "usar sugestão" aplica o sugerido).',
      '**Fiscal** (opcional): NCM, CEST, CFOP e alíquotas.',
      '**Controle**: estoque mínimo e máximo, lote inicial com validade, imagem e observações. Você pode criar até 3 **campos personalizados**.',
      'Clique em **Salvar**.',
    ] },
    { h1: 'Passo a passo: movimentação' },
    { p: 'Clique em **+ Nova Movimentação**, escolha o produto e o **Tipo**: Entrada, Saída, Transferência, Perda, Ajuste, Inventário ou Devolução. Informe quantidade, custo unitário, situação (confirmada ou em trânsito), lote e validade (o Axioma sugere o lote que vence primeiro, regra FEFO), documento e motivo.' },
    { nota: 'Produto com movimentação não é apagado: vira inativo, para manter o histórico. Produto com venda registrada não pode ser excluído.' },
  ],
}

export default doc
