// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '20 - Contabilidade - Balancete.docx',
  titulo: 'Manual 20 — Balancete de Verificação',
  subtitulo: 'Saldo de todas as contas, agrupado por tipo',
  info: ['Menu: Contabilidade → Balancete  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Balancete mostra o saldo de **todas as contas** no período, agrupadas em **Ativo**, **Passivo**, **Patrimônio Líquido**, **Receita** e **Despesa**. Serve para conferir se a contabilidade está fechando: pela partida dobrada, o total de débitos precisa ser igual ao total de créditos.' },

    { h1: 'As partes da tela' },
    { h2: 'Selo de fechamento' },
    { p: 'No topo aparece **Balancete fechado** (débito total = crédito total) ou **Não fecha** (há diferença). Quando não fecha, a tela mostra o alerta "débito total ≠ crédito total".' },
    { h2: 'Tabela por grupo' },
    { p: 'Cada grupo lista **Código**, **Conta**, **Débito**, **Crédito** e **Saldo**, com o **Subtotal** do grupo. No fim, o **TOTAL GERAL**.' },
    { h1: 'Como usar' },
    { numerada: ['Escolha o período.', 'Confira o selo de fechamento.', 'Se não fechar, use o Livro Razão para achar a conta com problema e corrija com um Lançamento Manual no Contador.'] },
    { p: 'O botão **Compartilhar** envia o resumo do balancete.' },
  ],
}

export default doc
