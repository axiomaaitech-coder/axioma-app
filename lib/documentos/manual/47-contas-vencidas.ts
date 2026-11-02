// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '47 - Contas Vencidas.docx',
  titulo: 'Manual 47 — Contas Vencidas',
  subtitulo: 'O que está atrasado, a pagar e a receber, numa tela só — e o caminho para resolver',
  info: ['Menu: Comercial → Contas Vencidas  •  Manual de uso do Axioma AI.Tech  •  Versão 1.0 (novembro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Junta numa tela só tudo o que **passou do vencimento e ainda tem saldo**: as contas que a Empresa deve pagar e as que tem a receber. Serve para decidir rápido o que pagar primeiro e quem cobrar. A tela só mostra — o pagamento, o recebimento e a cobrança continuam nas telas de origem.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Comercial ▼** → **Contas Vencidas**.'] },

    { h1: 'Cartões do topo' },
    { tabela: { colunas: ['Cartão', 'O que mostra'], larguras: [3000, 6026], linhas: [
      ['A pagar vencido', 'Soma do que falta pagar nas contas a pagar vencidas e quantas são.'],
      ['A receber vencido', 'Soma do que falta receber nas contas a receber vencidas e quantas são.'],
      ['Diferença (receber − pagar)', 'Verde quando o atrasado a receber cobre o atrasado a pagar; vermelho quando não cobre.'],
    ] } },

    { h1: 'Listas' },
    { p: 'Duas listas, **A pagar vencidas** e **A receber vencidas**, com a descrição, o fornecedor ou cliente, a data em que venceu, o **saldo em aberto** e os **dias de atraso** (amarelo até 30 dias, vermelho acima). As mais antigas aparecem primeiro.' },
    { p: 'Clique em uma conta, ou nos botões **Pagar em Contas a Pagar** / **Receber em Contas a Receber**, para abrir a tela de origem já com a lista filtrada em **Vencido** — ali você registra o pagamento, o recebimento ou a cobrança.' },
    { nota: 'Conta paga ou recebida em parte aparece com o que ainda falta. Conta paga, recebida ou cancelada não aparece.' },
    { nota: 'Se algum dado não carregar, a tela avisa que a lista pode estar incompleta — atualize a página.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '47 - Overdue Bills.docx',
  titulo: 'Manual 47 — Overdue Bills',
  subtitulo: 'What is late, payable and receivable, on one screen — and the way to solve it',
  info: ['Menu: Commercial → Overdue Bills  •  Axioma AI.Tech user manual  •  Version 1.0 (November 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Brings together on one screen everything that is **past due and still has a balance**: the bills the Company must pay and the ones it has to receive. It helps decide quickly what to pay first and whom to collect from. The screen only shows — paying, receiving and collecting stay on the source screens.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Commercial ▼** → **Overdue Bills**.'] },

    { h1: 'Top cards' },
    { tabela: { colunas: ['Card', 'What it shows'], larguras: [3000, 6026], linhas: [
      ['Overdue payable', 'Total still to pay on overdue payables and how many there are.'],
      ['Overdue receivable', 'Total still to receive on overdue receivables and how many there are.'],
      ['Difference (receive − pay)', 'Green when the late receivables cover the late payables; red when they do not.'],
    ] } },

    { h1: 'Lists' },
    { p: 'Two lists, **Overdue payables** and **Overdue receivables**, with the description, the supplier or client, the due date, the **open balance** and the **days overdue** (yellow up to 30 days, red above). The oldest come first.' },
    { p: 'Click a bill, or the **Pay in Payables** / **Receive in Receivables** buttons, to open the source screen with the list already filtered on **Overdue** — there you record the payment, the receipt or the collection.' },
    { nota: 'A partly paid or received bill shows what is still missing. Paid, received or cancelled bills do not appear.' },
    { nota: 'If some data does not load, the screen warns that the list may be incomplete — refresh the page.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '47 - Cuentas Vencidas.docx',
  titulo: 'Manual 47 — Cuentas Vencidas',
  subtitulo: 'Lo que está atrasado, por pagar y por cobrar, en una sola pantalla — y el camino para resolverlo',
  info: ['Menú: Comercial → Cuentas Vencidas  •  Manual de uso de Axioma AI.Tech  •  Versión 1.0 (noviembre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Reúne en una sola pantalla todo lo que **pasó del vencimiento y aún tiene saldo**: las cuentas que la Empresa debe pagar y las que tiene por cobrar. Sirve para decidir rápido qué pagar primero y a quién cobrar. La pantalla solo muestra — el pago, el cobro y la gestión de cobranza siguen en las pantallas de origen.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Comercial ▼** → **Cuentas Vencidas**.'] },

    { h1: 'Tarjetas superiores' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra'], larguras: [3000, 6026], linhas: [
      ['Por pagar vencido', 'Suma de lo que falta pagar en las cuentas por pagar vencidas y cuántas son.'],
      ['Por cobrar vencido', 'Suma de lo que falta cobrar en las cuentas por cobrar vencidas y cuántas son.'],
      ['Diferencia (cobrar − pagar)', 'Verde cuando lo atrasado por cobrar cubre lo atrasado por pagar; rojo cuando no lo cubre.'],
    ] } },

    { h1: 'Listas' },
    { p: 'Dos listas, **Por pagar vencidas** y **Por cobrar vencidas**, con la descripción, el proveedor o cliente, la fecha de vencimiento, el **saldo pendiente** y los **días de atraso** (amarillo hasta 30 días, rojo por encima). Las más antiguas aparecen primero.' },
    { p: 'Haga clic en una cuenta, o en los botones **Pagar en Cuentas por Pagar** / **Cobrar en Cuentas por Cobrar**, para abrir la pantalla de origen con la lista ya filtrada en **Vencido** — allí registra el pago, el cobro o la gestión de cobranza.' },
    { nota: 'Una cuenta pagada o cobrada en parte aparece con lo que aún falta. Las cuentas pagadas, cobradas o canceladas no aparecen.' },
    { nota: 'Si algún dato no carga, la pantalla avisa que la lista puede estar incompleta — actualice la página.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
