// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '47 - Contas Vencidas.docx',
  titulo: 'Manual 47 — Contas Vencidas',
  subtitulo: 'O que está atrasado, a pagar e a receber, numa tela só — e o caminho para resolver',
  info: ['Menu: Comercial → Contas Vencidas  •  Manual de uso do Axioma AI.Tech  •  Versão 1.1 (novembro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Junta numa tela só tudo o que **passou do vencimento e ainda tem saldo**: as contas que a Empresa deve pagar e as que tem a receber. Serve para decidir rápido o que pagar primeiro e quem cobrar. A tela só mostra — o pagamento, o recebimento e a cobrança continuam nas telas de origem.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Comercial ▼** → **Contas Vencidas**.'] },

    { h1: 'Filtros' },
    { p: 'No topo: **período** (vale para o "Recuperado no período"), **busca** por cliente, fornecedor ou descrição, **faixa de atraso** e **situação** (com promessa de pagamento, em negociação, com divergência ou sem acompanhamento). Os filtros valem para os números, para as faixas e para as listas. A Empresa é a que está escolhida no topo do Axioma.' },

    { h1: 'Cartões do topo' },
    { tabela: { colunas: ['Cartão', 'O que mostra'], larguras: [3000, 6026], linhas: [
      ['A pagar vencido', 'Soma do que falta pagar nas contas a pagar vencidas e quantas são.'],
      ['A receber vencido', 'Soma do que falta receber nas contas a receber vencidas e quantas são.'],
      ['Diferença (receber − pagar)', 'Verde quando o atrasado a receber cobre o atrasado a pagar; vermelho quando não cobre.'],
    ] } },

    { h1: 'Recuperação e acompanhamento' },
    { p: 'Oito números num bloco só. Toque em **De onde vem**, embaixo de cada um, para ver como ele é calculado.' },
    { tabela: { colunas: ['Número', 'O que mostra'], larguras: [3000, 6026], linhas: [
      ['Recuperado no período', 'O que clientes pagaram depois do vencimento, com o recebimento dentro do período. Pagamento em dia não conta.'],
      ['Taxa de recuperação', 'Recuperado ÷ (recuperado + o que continua vencido).'],
      ['Valor em risco', 'Saldo não contestado × nota de risco (0 a 1000) dos clientes com histórico. Cliente com menos de 4 pagamentos não recebe nota e aparece à parte.'],
      ['Previsão em 30 dias', 'Quanto do vencido deve entrar em 30 dias. É estimativa, não é caixa.'],
      ['Promessas em aberto', 'Promessas de pagamento que ainda não venceram, e o valor que falta.'],
      ['Promessas descumpridas', 'Promessas cuja data passou sem pagamento.'],
      ['Divergências abertas', 'Contas com divergência aberta e o valor contestado; o restante continua sendo cobrado ou pago.'],
      ['Sem previsão confiável', 'Saldo de clientes sem histórico suficiente: o Axioma não inventa previsão para eles.'],
    ] } },

    { h1: 'Atraso por faixa' },
    { p: 'Gráfico de colunas com o saldo em cada faixa: **A vencer** (verde-menta), até 60 dias (azul-marinho claro) e acima de 60 dias (azul-marinho) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 e acima de 360 dias. Passe o mouse (ou toque) numa coluna para ver o valor, a quantidade de contas e o peso no total. No alto, **Até 30 dias (com a vencer)** compara com a referência de mercado de 75% a 80%. Os botões **A receber** e **A pagar** trocam o lado. Embaixo: juros e multa estimados e quanto o maior devedor representa do vencido.' },

    { h1: 'Previsão e evolução' },
    { p: 'Quanto deve ser recuperado em 7, 15, 30, 60 e 90 dias, com o nível de confiança. A **evolução** mostra o total vencido a receber dia a dia — ela começa a ser registrada no primeiro dia em que a tela é aberta.' },

    { h1: 'Listas' },
    { p: 'Duas listas, **A pagar vencidas** e **A receber vencidas**, com a descrição, o fornecedor ou cliente, a data em que venceu, o **saldo em aberto** e os **dias de atraso** (destacados em vermelho acima de 30 dias). As mais antigas aparecem primeiro.' },
    { p: 'Clique em uma conta, ou nos botões **Pagar em Contas a Pagar** / **Receber em Contas a Receber**, para abrir a tela de origem já com a lista filtrada em **Vencido** — ali você registra o pagamento, o recebimento ou a cobrança.' },
    { nota: 'Conta paga ou recebida em parte aparece com o que ainda falta. Conta paga, recebida ou cancelada não aparece.' },
    { nota: 'Se algum dado não carregar, a tela avisa que a lista pode estar incompleta — atualize a página.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '47 - Overdue Bills.docx',
  titulo: 'Manual 47 — Overdue Bills',
  subtitulo: 'What is late, payable and receivable, on one screen — and the way to solve it',
  info: ['Menu: Commercial → Overdue Bills  •  Axioma AI.Tech user manual  •  Version 1.1 (November 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Brings together on one screen everything that is **past due and still has a balance**: the bills the Company must pay and the ones it has to receive. It helps decide quickly what to pay first and whom to collect from. The screen only shows — paying, receiving and collecting stay on the source screens.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Commercial ▼** → **Overdue Bills**.'] },

    { h1: 'Filters' },
    { p: 'At the top: **period** (used by "Recovered in period"), **search** by customer, supplier or description, **overdue range** and **status** (with payment promise, in negotiation, in dispute or not followed up). Filters apply to the numbers, the ranges and the lists. The Company is the one chosen at the top of Axioma.' },

    { h1: 'Top cards' },
    { tabela: { colunas: ['Card', 'What it shows'], larguras: [3000, 6026], linhas: [
      ['Overdue payable', 'Total still to pay on overdue payables and how many there are.'],
      ['Overdue receivable', 'Total still to receive on overdue receivables and how many there are.'],
      ['Difference (receive − pay)', 'Green when the late receivables cover the late payables; red when they do not.'],
    ] } },

    { h1: 'Recovery and follow-up' },
    { p: 'Eight numbers in one block. Tap **Where it comes from**, under each one, to see how it is calculated.' },
    { tabela: { colunas: ['Number', 'What it shows'], larguras: [3000, 6026], linhas: [
      ['Recovered in period', 'What customers paid after the due date, with the receipt inside the period. On-time payments do not count.'],
      ['Recovery rate', 'Recovered ÷ (recovered + what is still overdue).'],
      ['Value at risk', 'Undisputed balance × risk score (0 to 1000) of customers with history. Customers with fewer than 4 payments get no score and are shown apart.'],
      ['Forecast in 30 days', 'How much of the overdue amount should come in within 30 days. It is an estimate, not cash.'],
      ['Open promises', 'Payment promises not due yet, and the amount still missing.'],
      ['Broken promises', 'Promises whose date passed with no payment.'],
      ['Open disputes', 'Bills with an open dispute and the disputed amount; the rest is still collected or paid.'],
      ['No reliable forecast', 'Balance of customers without enough history: Axioma does not make up a forecast for them.'],
    ] } },

    { h1: 'Overdue by range' },
    { p: 'Column chart with the balance in each range: **Not due** (mint green), up to 60 days (light navy) and over 60 days (navy) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 and over 360 days. Hover (or tap) a column to see the amount, the number of bills and the share of the total. At the top, **Up to 30 days (incl. not due)** is compared with the market reference of 75% to 80%. The **Receivable** and **Payable** buttons switch sides. Below: estimated interest and fines and how much the largest debtor represents of the overdue amount.' },

    { h1: 'Forecast and history' },
    { p: 'How much should be recovered in 7, 15, 30, 60 and 90 days, with the confidence level. The **history** shows the overdue receivable total day by day — it starts on the first day the screen is opened.' },

    { h1: 'Lists' },
    { p: 'Two lists, **Overdue payables** and **Overdue receivables**, with the description, the supplier or client, the due date, the **open balance** and the **days overdue** (highlighted in red above 30 days). The oldest come first.' },
    { p: 'Click a bill, or the **Pay in Payables** / **Receive in Receivables** buttons, to open the source screen with the list already filtered on **Overdue** — there you record the payment, the receipt or the collection.' },
    { nota: 'A partly paid or received bill shows what is still missing. Paid, received or cancelled bills do not appear.' },
    { nota: 'If some data does not load, the screen warns that the list may be incomplete — refresh the page.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '47 - Cuentas Vencidas.docx',
  titulo: 'Manual 47 — Cuentas Vencidas',
  subtitulo: 'Lo que está atrasado, por pagar y por cobrar, en una sola pantalla — y el camino para resolverlo',
  info: ['Menú: Comercial → Cuentas Vencidas  •  Manual de uso de Axioma AI.Tech  •  Versión 1.1 (noviembre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Reúne en una sola pantalla todo lo que **pasó del vencimiento y aún tiene saldo**: las cuentas que la Empresa debe pagar y las que tiene por cobrar. Sirve para decidir rápido qué pagar primero y a quién cobrar. La pantalla solo muestra — el pago, el cobro y la gestión de cobranza siguen en las pantallas de origen.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Comercial ▼** → **Cuentas Vencidas**.'] },

    { h1: 'Filtros' },
    { p: 'Arriba: **período** (vale para "Recuperado en el período"), **búsqueda** por cliente, proveedor o descripción, **rango de atraso** y **situación** (con promesa de pago, en negociación, con divergencia o sin seguimiento). Los filtros valen para los números, los rangos y las listas. La Empresa es la elegida en la parte superior de Axioma.' },

    { h1: 'Tarjetas superiores' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra'], larguras: [3000, 6026], linhas: [
      ['Por pagar vencido', 'Suma de lo que falta pagar en las cuentas por pagar vencidas y cuántas son.'],
      ['Por cobrar vencido', 'Suma de lo que falta cobrar en las cuentas por cobrar vencidas y cuántas son.'],
      ['Diferencia (cobrar − pagar)', 'Verde cuando lo atrasado por cobrar cubre lo atrasado por pagar; rojo cuando no lo cubre.'],
    ] } },

    { h1: 'Recuperación y seguimiento' },
    { p: 'Ocho números en un solo bloque. Toque **De dónde viene**, debajo de cada uno, para ver cómo se calcula.' },
    { tabela: { colunas: ['Número', 'Qué muestra'], larguras: [3000, 6026], linhas: [
      ['Recuperado en el período', 'Lo que los clientes pagaron después del vencimiento, con el cobro dentro del período. El pago a tiempo no cuenta.'],
      ['Tasa de recuperación', 'Recuperado ÷ (recuperado + lo que sigue vencido).'],
      ['Valor en riesgo', 'Saldo no disputado × nota de riesgo (0 a 1000) de los clientes con historial. Un cliente con menos de 4 pagos no recibe nota y aparece aparte.'],
      ['Previsión en 30 días', 'Cuánto de lo vencido debe entrar en 30 días. Es una estimación, no es caja.'],
      ['Promesas abiertas', 'Promesas de pago que aún no vencieron, y el valor que falta.'],
      ['Promesas incumplidas', 'Promesas cuya fecha pasó sin pago.'],
      ['Divergencias abiertas', 'Cuentas con divergencia abierta y el valor disputado; el resto se sigue cobrando o pagando.'],
      ['Sin previsión confiable', 'Saldo de clientes sin historial suficiente: Axioma no inventa una previsión para ellos.'],
    ] } },

    { h1: 'Atraso por rango' },
    { p: 'Gráfico de columnas con el saldo en cada rango: **Por vencer** (verde menta), hasta 60 días (azul marino claro) y más de 60 días (azul marino) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 y más de 360 días. Pase el mouse (o toque) sobre una columna para ver el valor, la cantidad de cuentas y el peso en el total. Arriba, **Hasta 30 días (con por vencer)** se compara con la referencia de mercado de 75% a 80%. Los botones **Por cobrar** y **Por pagar** cambian el lado. Abajo: intereses y multas estimados y cuánto representa el mayor deudor de lo vencido.' },

    { h1: 'Previsión y evolución' },
    { p: 'Cuánto debe recuperarse en 7, 15, 30, 60 y 90 días, con el nivel de confianza. La **evolución** muestra el total vencido por cobrar día a día — empieza a registrarse el primer día que se abre la pantalla.' },

    { h1: 'Listas' },
    { p: 'Dos listas, **Por pagar vencidas** y **Por cobrar vencidas**, con la descripción, el proveedor o cliente, la fecha de vencimiento, el **saldo pendiente** y los **días de atraso** (destacados en rojo por encima de 30 días). Las más antiguas aparecen primero.' },
    { p: 'Haga clic en una cuenta, o en los botones **Pagar en Cuentas por Pagar** / **Cobrar en Cuentas por Cobrar**, para abrir la pantalla de origen con la lista ya filtrada en **Vencido** — allí registra el pago, el cobro o la gestión de cobranza.' },
    { nota: 'Una cuenta pagada o cobrada en parte aparece con lo que aún falta. Las cuentas pagadas, cobradas o canceladas no aparecen.' },
    { nota: 'Si algún dato no carga, la pantalla avisa que la lista puede estar incompleta — actualice la página.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
