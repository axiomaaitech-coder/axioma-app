// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '21 - DRE Contábil.docx',
  titulo: 'Manual 21 — DRE Contábil',
  subtitulo: 'O resultado calculado direto do Livro Razão — receita, custo e despesa vindos da contabilidade',
  info: ['Menu: Contabilidade → DRE Contábil  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'É a DRE **do contador**: monta o resultado a partir das contas de receita, custo e despesa do Livro Razão, não de planilhas. Serve para conferir a **DRE gerencial** (Financeiro → DRE, Manual 14). Se as duas não batem num mês, a **Conferência** (Manual 45) mostra a diferença.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Contabilidade ▼** → **DRE Contábil**.'] },

    { h1: 'As linhas' },
    { tabela: { colunas: ['Linha', 'O que é'], larguras: [3000, 6026], linhas: [
      ['Receita Bruta', 'Contas de receita (grupo 6).'],
      ['Impostos', 'Impostos sobre a venda.'],
      ['CMV / Custos', 'Custo da mercadoria vendida e custos diretos.'],
      ['= Lucro Bruto', 'Receita − impostos − custos.'],
      ['Despesas Operacionais', 'Despesas da operação.'],
      ['Despesas Financeiras', 'Juros e encargos (inclusive multas e juros de contas pagas com atraso).'],
      ['= Resultado Líquido', 'O resultado final pela contabilidade.'],
    ] } },
    { p: '**Clique num grupo** para abrir as contas que o compõem; **clique numa conta** para ir ao Livro Razão dela. Use o seletor de período e **Compartilhar** como nas outras telas. Grupo sem movimento mostra "Sem contas neste grupo no período".' },
    { nota: 'A leitura é feita em lotes, sem limite de linhas; se algo não carregar, a tela avisa que os números podem estar incompletos.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '21 - Accounting Income Statement.docx',
  titulo: 'Manual 21 — Accounting Income Statement',
  subtitulo: 'The result calculated straight from the General Ledger — revenue, cost and expense from the books',
  info: ['Menu: Accounting → Accounting Income Statement  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'It is the **accountant’s** P&L: it builds the result from the revenue, cost and expense accounts in the General Ledger, not from spreadsheets. Use it to check the **management P&L** (Financial → Income Statement, Manual 14). If the two do not match in a month, **Reconciliation** (Manual 45) shows the difference.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Accounting ▼** → **Accounting Income Statement**.'] },

    { h1: 'The lines' },
    { tabela: { colunas: ['Line', 'What it is'], larguras: [3000, 6026], linhas: [
      ['Gross Revenue', 'Revenue accounts (group 6).'],
      ['Taxes', 'Sales taxes.'],
      ['COGS / Costs', 'Cost of goods sold and direct costs.'],
      ['= Gross Profit', 'Revenue − taxes − costs.'],
      ['Operating Expenses', 'Operating expenses.'],
      ['Financial Expenses', 'Interest and charges (including late fees and interest on bills paid late).'],
      ['= Net Result', 'The final result according to the books.'],
    ] } },
    { p: '**Click a group** to open the accounts in it; **click an account** to go to its General Ledger. Use the period selector and **Share** as on the other screens. A group without movement shows "No accounts in this group for the period".' },
    { nota: 'Reading is done in batches, with no row limit; if something does not load, the screen warns that the numbers may be incomplete.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '21 - Estado de Resultados Contable.docx',
  titulo: 'Manual 21 — Estado de Resultados Contable',
  subtitulo: 'El resultado calculado directo del Libro Mayor — ingreso, costo y gasto de la contabilidad',
  info: ['Menú: Contabilidad → Estado de Resultados Contable  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Es el Estado de Resultados **del contador**: arma el resultado desde las cuentas de ingreso, costo y gasto del Libro Mayor, no desde planillas. Sirve para verificar el **Estado de Resultados gerencial** (Financiero → Estado de Resultados, Manual 14). Si los dos no cuadran en un mes, la **Conciliación** (Manual 45) muestra la diferencia.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Contabilidad ▼** → **Estado de Resultados Contable**.'] },

    { h1: 'Las líneas' },
    { tabela: { colunas: ['Línea', 'Qué es'], larguras: [3000, 6026], linhas: [
      ['Ingreso Bruto', 'Cuentas de ingreso (grupo 6).'],
      ['Impuestos', 'Impuestos sobre la venta.'],
      ['CMV / Costos', 'Costo de la mercadería vendida y costos directos.'],
      ['= Ganancia Bruta', 'Ingreso − impuestos − costos.'],
      ['Gastos Operativos', 'Gastos de la operación.'],
      ['Gastos Financieros', 'Intereses y cargos (incluidas multas e intereses de cuentas pagadas con atraso).'],
      ['= Resultado Neto', 'El resultado final según la contabilidad.'],
    ] } },
    { p: '**Haga clic en un grupo** para abrir sus cuentas; **haga clic en una cuenta** para ir a su Libro Mayor. Use el selector de período y **Compartir** como en las otras pantallas. Un grupo sin movimiento muestra "Sin cuentas en este grupo en el período".' },
    { nota: 'La lectura se hace por lotes, sin límite de filas; si algo no carga, la pantalla avisa que los números pueden estar incompletos.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
