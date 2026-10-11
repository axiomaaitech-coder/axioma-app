// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '20 - Balancete.docx',
  titulo: 'Manual 20 — Balancete de Verificação',
  subtitulo: 'O saldo de todas as contas no período, agrupado por tipo — e a prova de que a contabilidade fecha',
  info: ['Menu: Contabilidade → Balancete  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Lista **todas as contas** com débito, crédito e saldo do período, agrupadas em **Ativo, Passivo, Patrimônio Líquido, Receita e Despesa**, com subtotal de cada grupo e o **TOTAL GERAL**. É a checagem clássica de que a partida dobrada fecha: débito total = crédito total.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Contabilidade ▼** → **Balancete**.'] },

    { h1: 'As partes da tela' },
    { tabela: { colunas: ['Parte', 'O que mostra / faz'], larguras: [2800, 6226], linhas: [
      ['Seletor de período', 'Escolhe o período (Mês atual, Mês anterior, Trimestre, Ano, Últimos 12 meses, Personalizado).'],
      ['Selo **Balancete fechado**', 'Débito total = crédito total. Se aparecer **Não fecha** / "Atenção: débito total ≠ crédito total", há lançamento desequilibrado — abra o Contador.'],
      ['Tabela por grupo', 'Código, Conta, Débito, Crédito e Saldo; **Subtotal** por grupo e **TOTAL GERAL**.'],
      ['Clique numa conta', 'Abre o **Livro Razão** dela.'],
      ['**Compartilhar**', 'Envia o balancete.'],
    ] } },
    { nota: 'A leitura é feita em lotes, sem limite de linhas; se algo não carregar, a tela avisa que os números podem estar incompletos — nunca mostra um balancete parcial como se fosse completo.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '20 - Trial Balance.docx',
  titulo: 'Manual 20 — Trial Balance',
  subtitulo: 'Every account’s balance for the period, grouped by type — and proof the books balance',
  info: ['Menu: Accounting → Trial Balance  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Lists **every account** with the period’s debit, credit and balance, grouped into **Assets, Liabilities, Equity, Revenue and Expenses**, with a subtotal per group and the **GRAND TOTAL**. It is the classic check that double entry balances: total debits = total credits.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Accounting ▼** → **Trial Balance**.'] },

    { h1: 'Parts of the screen' },
    { tabela: { colunas: ['Part', 'What it shows / does'], larguras: [2800, 6226], linhas: [
      ['Period selector', 'Chooses the period (Current month, Previous month, Quarter, Year, Last 12 months, Custom).'],
      ['**Trial balance closed** tag', 'Total debits = total credits. If **Does not balance** / "Attention: total debit ≠ total credit" shows, there is an unbalanced entry — open the Accountant.'],
      ['Table by group', 'Code, Account, Debit, Credit and Balance; **Subtotal** per group and **GRAND TOTAL**.'],
      ['Click an account', 'Opens its **General Ledger**.'],
      ['**Share**', 'Sends the trial balance.'],
    ] } },
    { nota: 'Reading is done in batches, with no row limit; if something does not load, the screen warns that the numbers may be incomplete — it never shows a partial trial balance as if it were complete.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '20 - Balance de Comprobación.docx',
  titulo: 'Manual 20 — Balance de Comprobación',
  subtitulo: 'El saldo de todas las cuentas en el período, agrupado por tipo — y la prueba de que la contabilidad cuadra',
  info: ['Menú: Contabilidad → Balance de Comprobación  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Lista **todas las cuentas** con débito, crédito y saldo del período, agrupadas en **Activo, Pasivo, Patrimonio Neto, Ingreso y Gasto**, con subtotal por grupo y el **TOTAL GENERAL**. Es la verificación clásica de que la partida doble cuadra: débito total = crédito total.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Contabilidad ▼** → **Balance de Comprobación**.'] },

    { h1: 'Las partes de la pantalla' },
    { tabela: { colunas: ['Parte', 'Qué muestra / hace'], larguras: [2800, 6226], linhas: [
      ['Selector de período', 'Elige el período (Mes actual, Mes anterior, Trimestre, Año, Últimos 12 meses, Personalizado).'],
      ['Etiqueta **Balance cerrado**', 'Débito total = crédito total. Si aparece **No cuadra** / "Atención: débito total ≠ crédito total", hay un asiento desequilibrado — abra el Contador.'],
      ['Tabla por grupo', 'Código, Cuenta, Débito, Crédito y Saldo; **Subtotal** por grupo y **TOTAL GENERAL**.'],
      ['Clic en una cuenta', 'Abre su **Libro Mayor**.'],
      ['**Compartir**', 'Envía el balance.'],
    ] } },
    { nota: 'La lectura se hace por lotes, sin límite de filas; si algo no carga, la pantalla avisa que los números pueden estar incompletos — nunca muestra un balance parcial como si fuera completo.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
