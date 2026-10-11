// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '19 - Livro Razão.docx',
  titulo: 'Manual 19 — Livro Razão',
  subtitulo: 'Extrato de cada conta contábil, com saldo acumulado — direto do ledger',
  info: ['Menu: Contabilidade → Livro Razão  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra **tudo o que passou por uma conta contábil** (Bancos, Fornecedores, Receita de Serviços…) no período: cada débito, cada crédito e o saldo depois de cada movimento. Os lançamentos chegam sozinhos de todos os módulos pelo motor de rastreabilidade.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Contabilidade ▼** → **Livro Razão**.', 'Clique numa conta no **Balancete**, na **DRE Contábil** ou na **Tesouraria** — o Razão já abre nela.'] },

    { h1: 'Como usar' },
    { numerada: ['Escolha a **Conta** na lista (código e nome).', 'Escolha o período no seletor (Mês atual, Mês anterior, Trimestre, Ano, Últimos 12 meses, Personalizado).', 'Leia o extrato.'] },
    { tabela: { colunas: ['Parte da tela', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['**Saldo Anterior**', 'O saldo da conta no dia antes do período.'],
      ['Extrato', 'Data, Descrição, **Origem** (Contas a Pagar, Contas a Receber, Receitas, Custos Variáveis, Fluxo de Caixa, Dívidas, Venda PDV, Estoque, MEI — DAS, Lançamento manual), Débito, Crédito e Saldo após cada linha. Lançamento estornado aparece com o selo **ESTORNADO**.'],
      ['**Saldo Atual**', 'O saldo no fim do período.'],
    ] } },
    { p: '**Clique numa linha** para abrir o lançamento completo, com todas as suas partidas (débitos e créditos de outras contas). **Compartilhar** envia o extrato.' },
    { nota: 'O saldo segue a natureza da conta: contas devedoras (Ativo, Despesa) crescem com débito; credoras (Passivo, Receita, Patrimônio) crescem com crédito. A leitura é feita em lotes, sem limite de linhas; se algo não carregar, a tela avisa que os números podem estar incompletos.' },
    { alerta: 'Sem plano de contas cadastrado, aparece "Cadastre o plano de contas para ver o Razão". No período sem movimento: "Nenhum lançamento no período selecionado".' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '19 - General Ledger.docx',
  titulo: 'Manual 19 — General Ledger',
  subtitulo: 'Statement for each ledger account, with running balance — straight from the ledger',
  info: ['Menu: Accounting → General Ledger  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Shows **everything that went through a ledger account** (Banks, Suppliers, Service Revenue…) in the period: each debit, each credit and the balance after each movement. Entries arrive automatically from every module through the traceability engine.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Accounting ▼** → **General Ledger**.', 'Click an account in the **Trial Balance**, the **Accounting Income Statement** or **Treasury** — the Ledger opens on it.'] },

    { h1: 'How to use' },
    { numerada: ['Choose the **Account** in the list (code and name).', 'Choose the period in the selector (Current month, Previous month, Quarter, Year, Last 12 months, Custom).', 'Read the statement.'] },
    { tabela: { colunas: ['Part of the screen', 'What it shows'], larguras: [2600, 6426], linhas: [
      ['**Opening Balance**', 'The account balance on the day before the period.'],
      ['Statement', 'Date, Description, **Origin** (Payables, Receivables, Revenue, Variable Costs, Cash Flow, Debts, POS Sale, Inventory, MEI — DAS, Manual entry), Debit, Credit and Balance after each line. A reversed entry shows the **REVERSED** tag.'],
      ['**Current Balance**', 'The balance at the end of the period.'],
    ] } },
    { p: '**Click a line** to open the full entry, with all its lines (debits and credits in other accounts). **Share** sends the statement.' },
    { nota: 'The balance follows the account’s nature: debit accounts (Assets, Expenses) grow with debits; credit accounts (Liabilities, Revenue, Equity) grow with credits. Reading is done in batches, with no row limit; if something does not load, the screen warns that the numbers may be incomplete.' },
    { alerta: 'With no chart of accounts, it shows "Set up the chart of accounts to see the Ledger". In a period without movement: "No entries in the selected period".' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '19 - Libro Mayor.docx',
  titulo: 'Manual 19 — Libro Mayor',
  subtitulo: 'Extracto de cada cuenta contable, con saldo acumulado — directo del ledger',
  info: ['Menú: Contabilidad → Libro Mayor  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Muestra **todo lo que pasó por una cuenta contable** (Bancos, Proveedores, Ingreso por Servicios…) en el período: cada débito, cada crédito y el saldo después de cada movimiento. Los asientos llegan solos de todos los módulos por el motor de trazabilidad.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Contabilidad ▼** → **Libro Mayor**.', 'Haga clic en una cuenta en el **Balance de Comprobación**, el **Estado de Resultados Contable** o la **Tesorería** — el Mayor se abre en ella.'] },

    { h1: 'Cómo usar' },
    { numerada: ['Elija la **Cuenta** en la lista (código y nombre).', 'Elija el período en el selector (Mes actual, Mes anterior, Trimestre, Año, Últimos 12 meses, Personalizado).', 'Lea el extracto.'] },
    { tabela: { colunas: ['Parte de la pantalla', 'Qué muestra'], larguras: [2600, 6426], linhas: [
      ['**Saldo Anterior**', 'El saldo de la cuenta el día antes del período.'],
      ['Extracto', 'Fecha, Descripción, **Origen** (Cuentas por Pagar, Cuentas por Cobrar, Ingresos, Costos Variables, Flujo de Caja, Deudas, Venta PDV, Inventario, MEI — DAS, Asiento manual), Débito, Crédito y Saldo tras cada línea. El asiento revertido aparece con la etiqueta **ESTORNADO**.'],
      ['**Saldo Actual**', 'El saldo al final del período.'],
    ] } },
    { p: '**Haga clic en una línea** para abrir el asiento completo, con todas sus partidas (débitos y créditos en otras cuentas). **Compartir** envía el extracto.' },
    { nota: 'El saldo sigue la naturaleza de la cuenta: las deudoras (Activo, Gasto) crecen con débito; las acreedoras (Pasivo, Ingreso, Patrimonio) crecen con crédito. La lectura se hace por lotes, sin límite de filas; si algo no carga, la pantalla avisa que los números pueden estar incompletos.' },
    { alerta: 'Sin plan de cuentas registrado, aparece "Registre el plan de cuentas para ver el Mayor". En un período sin movimiento: "Ningún asiento en el período seleccionado".' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
