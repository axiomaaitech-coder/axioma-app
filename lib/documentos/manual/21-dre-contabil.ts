// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '21 - Contabilidade - DRE Contábil.docx',
  titulo: 'Manual 21 — DRE Contábil',
  subtitulo: 'Demonstrativo de Resultado calculado direto do Livro Razão',
  info: ['Menu: Contabilidade → DRE  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'É a DRE no formato contábil, calculada **direto do Livro Razão**: receita, custo e despesa vêm dos lançamentos contábeis, não de planilha solta. É a versão que o contador reconhece e usa em balanços e declarações.' },
    { h2: 'Diferença para a DRE do Financeiro' },
    { p: 'A **DRE do Financeiro** (manual 14) é gerencial: foca em diagnóstico, margens, causas e projeções para decisão. A **DRE Contábil** segue o plano de contas e a partida dobrada. As duas usam a mesma base e devem contar a mesma história.' },

    { h1: 'As linhas' },
    { tabela: { colunas: ['Linha', 'O que é'], larguras: [3200, 5826], linhas: [
      ['Receita Bruta', 'Contas de receita no período.'],
      ['CMV / Custos', 'Custo das mercadorias vendidas e custos diretos.'],
      ['= Lucro Bruto', 'Receita menos custos.'],
      ['Despesas Operacionais', 'Despesas da operação.'],
      ['Despesas Financeiras', 'Juros e tarifas.'],
      ['Impostos', 'Impostos lançados.'],
      ['= Resultado Líquido', 'O resultado final.'],
    ] } },
    { p: 'Cada grupo pode ser aberto para ver as contas que o formam. Grupos vazios mostram "Sem contas neste grupo no período". Os destaques de **Lucro Bruto** e **Resultado Líquido** ficam no topo.' },
    { h1: 'Como usar' },
    { p: 'Escolha o período e leia de cima para baixo. Use **Compartilhar** para enviar o resumo ao contador ou aos sócios.' },
  ],
}

export default doc
