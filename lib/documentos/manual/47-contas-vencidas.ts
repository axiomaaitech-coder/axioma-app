// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '47 - Contas Vencidas.docx',
  titulo: 'Manual 47 — Contas Vencidas',
  subtitulo: 'O que está atrasado, a pagar e a receber, numa tela só — e o caminho para resolver',
  info: ['Menu: Comercial → Contas Vencidas  •  Manual de uso do Axioma AI.Tech  •  Versão 1.3 (novembro de 2026)'],
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
    { p: 'Gráfico de colunas com o saldo em cada faixa: **A vencer** (cinza), até 60 dias (verde-menta) e acima de 60 dias (azul-marinho) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 e acima de 360 dias. Passe o mouse (ou toque) numa coluna para ver o valor, a quantidade de contas e o peso no total. No alto, **Até 30 dias (com a vencer)** compara com a referência de mercado de 75% a 80%. No celular o gráfico aparece deitado, com o nome de cada faixa na lateral. Os botões **A receber** e **A pagar** trocam o lado. Embaixo: juros e multa estimados e quanto o maior devedor representa do vencido.' },

    { h1: 'Previsão e evolução' },
    { p: 'Quanto deve ser recuperado em 7, 15, 30, 60 e 90 dias, com o nível de confiança. A **evolução** mostra o total vencido a receber dia a dia — ela começa a ser registrada no primeiro dia em que a tela é aberta.' },

    { h1: 'Ligações com outros módulos' },
    { p: 'Botões no topo levam a **Contas a Receber**, **Contas a Pagar**, **Inadimplência** (régua e negociação), **Clientes**, **Fornecedores**, **Tesouraria** e **Fluxo de Caixa**. No caminho de volta, o Dashboard, Contas a Receber, Contas a Pagar, Inadimplência e Tesouraria mostram um cartão com o total vencido e o botão **Abrir Contas Vencidas**.' },

    { h1: 'Perguntar às IAs' },
    { p: 'As IAs do Axioma (IA Financeira, Relatórios, José e as demais) consultam esta mesma análise. Exemplos: "Quanto temos vencido?", "Quem são os maiores inadimplentes?", "Quais promessas foram descumpridas?", "Qual fornecedor pagar primeiro?", "Se recuperarmos 70% em 30 dias, como fica o caixa?". Os números vêm calculados pelo Axioma; a IA explica e nunca cobra, negocia ou apaga nada.' },

    { h1: 'Contas a receber vencidas' },
    { p: 'Tabela com cliente, descrição, vencimento e dias de atraso, valor original, **saldo**, **juros e multa**, **risco** (0 a 1000, ou "sem histórico"), **prioridade**, **último contato** e **próxima ação**. No celular cada conta vira um cartão.' },
    { lista: [
      '**Ordenar**: mais prioritárias, mais atrasadas, maior saldo ou cliente de A a Z. A lista mostra 20 por página (**Anterior** / **Próxima**).',
      '**Marcar**: a caixinha de cada linha (ou a do topo, para a página toda). Com contas marcadas, **PDF** e **Excel** levam só elas; sem marcação, levam a lista filtrada inteira.',
      '**Detalhes**: toque na linha. Aparecem os valores (original, saldo, multa, juros, correção pelo IPCA e total atualizado) com a base legal, a próxima ação e o porquê, a causa provável (confirmada ou a confirmar), os motivos da nota de risco e o comportamento de pagamento do cliente.',
      '**DNA de pagamento** (embaixo dos detalhes): atraso médio, pagamentos com atraso, regularidade, prazo e valor médios, promessas cumpridas e descumpridas, acordos, exposição (vencido e em aberto) e um gráfico com os dias de atraso de cada pagamento (verde-menta = em dia; azul-marinho = com atraso). A **tendência** (piorando, melhorando ou estável) vem com os números que a sustentam; com menos de 4 pagamentos o cliente não é classificado.',
      '**Registrar contato**: escolha o canal e a data, escreva o que foi conversado e toque em **Registrar contato**. O **lápis** corrige o texto; a **lixeira** tira o contato da lista (sem senha).',
      '**Registrar promessa**: valor (até o saldo) e data a partir de hoje. Promessa não conta como dinheiro em caixa.',
      '**Registrar recebimento em Contas a Receber**: o recebimento é sempre lançado lá, num lugar só.',
    ] },
    { nota: 'Lixeira: o botão **Lixeira** mostra contatos e promessas apagados nos últimos 60 dias, com quantos dias faltam; **Recuperar** devolve o item para todas as telas.' },

    { h1: 'Contas a pagar vencidas' },
    { p: 'Lista com a descrição, o fornecedor, a data em que venceu, o **saldo em aberto** e os **dias de atraso** (destacados em vermelho acima de 30 dias). Clique numa conta, ou em **Pagar em Contas a Pagar**, para abrir a tela de origem já filtrada em **Vencido** — ali você registra o pagamento.' },
    { lista: [
      'A lista tem a mesma forma da central a receber: **ordenar**, 20 por página, **marcar**, **PDF** e **Excel**. As colunas próprias deste lado são **Importância** do fornecedor e **Negociação**.',
      '**Detalhes** (toque na linha): valores com juros e multa estimados, a próxima ação e os motivos da **prioridade de pagamento**.',
      '**Importância do fornecedor** (lápis): escolha Crítica, Alta, Média ou Baixa e marque se o atraso pode parar o fornecimento, afetar a produção ou as vendas; toque em **Salvar importância**. A prioridade é recalculada — um fornecedor essencial pode vir antes de uma conta maior ou mais antiga.',
      '**Simulação de pagamento**: marque contas e veja o caixa de hoje, o caixa depois de pagá-las (com juros e multa) e a folga sobre a reserva mínima da Tesouraria. É só simulação; o pagamento é lançado em Contas a Pagar.',
    ] },
    { nota: 'Conta paga ou recebida em parte aparece com o que ainda falta. Conta paga, recebida ou cancelada não aparece.' },
    { nota: 'Se algum dado não carregar, a tela avisa que a lista pode estar incompleta — atualize a página.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '47 - Overdue Bills.docx',
  titulo: 'Manual 47 — Overdue Bills',
  subtitulo: 'What is late, payable and receivable, on one screen — and the way to solve it',
  info: ['Menu: Commercial → Overdue Bills  •  Axioma AI.Tech user manual  •  Version 1.3 (November 2026)'],
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
    { p: 'Column chart with the balance in each range: **Not due** (gray), up to 60 days (mint green) and over 60 days (navy) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 and over 360 days. Hover (or tap) a column to see the amount, the number of bills and the share of the total. At the top, **Up to 30 days (incl. not due)** is compared with the market reference of 75% to 80%. On a phone the chart is shown sideways, with each range name on the side. The **Receivable** and **Payable** buttons switch sides. Below: estimated interest and fines and how much the largest debtor represents of the overdue amount.' },

    { h1: 'Forecast and history' },
    { p: 'How much should be recovered in 7, 15, 30, 60 and 90 days, with the confidence level. The **history** shows the overdue receivable total day by day — it starts on the first day the screen is opened.' },

    { h1: 'Links to other modules' },
    { p: 'Buttons at the top lead to **Receivables**, **Payables**, **Delinquency** (schedule and negotiation), **Customers**, **Suppliers**, **Treasury** and **Cash Flow**. On the way back, the Dashboard, Receivables, Payables, Delinquency and Treasury show a card with the overdue total and the **Open Overdue Bills** button.' },

    { h1: 'Asking the AIs' },
    { p: 'Axioma AIs (Financial AI, Reports, José and the others) read this same analysis. Examples: "How much is overdue?", "Who are the biggest late payers?", "Which promises were broken?", "Which supplier should we pay first?", "If we recover 70% in 30 days, how does cash look?". The numbers are calculated by Axioma; the AI explains and never collects, negotiates or deletes anything.' },

    { h1: 'Overdue receivables' },
    { p: 'Table with customer, description, due date and days overdue, original amount, **balance**, **interest and fines**, **risk** (0 to 1000, or "no history"), **priority**, **last contact** and **next action**. On a phone each bill becomes a card.' },
    { lista: [
      '**Sort**: highest priority, most overdue, largest balance or customer A to Z. The list shows 20 per page (**Previous** / **Next**).',
      '**Select**: the checkbox on each row (or the one at the top for the whole page). With bills selected, **PDF** and **Excel** export only those; with none, the whole filtered list.',
      '**Details**: tap the row. You see the amounts (original, balance, fine, interest, IPCA update and updated total) with the legal basis, the next action and why, the likely cause (confirmed or to be confirmed), the reasons for the risk score and the customer payment behaviour.',
      '**Payment DNA** (below the details): average delay, late payments, regularity, average term and amount, promises kept and broken, agreements, exposure (overdue and open) and a chart with the days late on each payment (mint green = on time; navy = late). The **trend** (getting worse, improving or stable) comes with the numbers behind it; with fewer than 4 payments the customer is not classified.',
      '**Save contact**: pick the channel and date, write what was discussed and tap **Save contact**. The **pencil** fixes the text; the **trash** removes the contact from the list (no password).',
      '**Save promise**: amount (up to the balance) and a date from today on. A promise does not count as cash.',
      '**Record payment in Receivables**: payments are always recorded there, in one place.',
    ] },
    { nota: 'Trash: the **Trash** button shows contacts and promises deleted in the last 60 days, with the days left; **Restore** brings the item back to every screen.' },

    { h1: 'Overdue payables' },
    { p: 'List with the description, the supplier, the due date, the **open balance** and the **days overdue** (highlighted in red above 30 days). Click a bill, or **Pay in Payables**, to open the source screen filtered on **Overdue** — there you record the payment.' },
    { lista: [
      'The list works like the receivables center: **sort**, 20 per page, **select**, **PDF** and **Excel**. The columns specific to this side are supplier **Importance** and **Negotiation**.',
      '**Details** (tap the row): amounts with estimated interest and fines, the next action and the reasons for the **payment priority**.',
      '**Supplier importance** (pencil): choose Critical, High, Medium or Low and tick whether the delay may stop supply, affect production or sales; tap **Save importance**. Priority is recalculated — an essential supplier may come before a larger or older bill.',
      '**Payment simulation**: select bills to see cash today, cash after paying them (with interest and fines) and the margin over the Treasury minimum reserve. Simulation only; payments are recorded in Payables.',
    ] },
    { nota: 'A partly paid or received bill shows what is still missing. Paid, received or cancelled bills do not appear.' },
    { nota: 'If some data does not load, the screen warns that the list may be incomplete — refresh the page.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '47 - Cuentas Vencidas.docx',
  titulo: 'Manual 47 — Cuentas Vencidas',
  subtitulo: 'Lo que está atrasado, por pagar y por cobrar, en una sola pantalla — y el camino para resolverlo',
  info: ['Menú: Comercial → Cuentas Vencidas  •  Manual de uso de Axioma AI.Tech  •  Versión 1.3 (noviembre de 2026)'],
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
    { p: 'Gráfico de columnas con el saldo en cada rango: **Por vencer** (gris), hasta 60 días (verde menta) y más de 60 días (azul marino) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 y más de 360 días. Pase el mouse (o toque) sobre una columna para ver el valor, la cantidad de cuentas y el peso en el total. Arriba, **Hasta 30 días (con por vencer)** se compara con la referencia de mercado de 75% a 80%. En el celular el gráfico aparece acostado, con el nombre de cada rango al costado. Los botones **Por cobrar** y **Por pagar** cambian el lado. Abajo: intereses y multas estimados y cuánto representa el mayor deudor de lo vencido.' },

    { h1: 'Previsión y evolución' },
    { p: 'Cuánto debe recuperarse en 7, 15, 30, 60 y 90 días, con el nivel de confianza. La **evolución** muestra el total vencido por cobrar día a día — empieza a registrarse el primer día que se abre la pantalla.' },

    { h1: 'Vínculos con otros módulos' },
    { p: 'Los botones de arriba llevan a **Cuentas por Cobrar**, **Cuentas por Pagar**, **Morosidad** (regla y negociación), **Clientes**, **Proveedores**, **Tesorería** y **Flujo de Caja**. De vuelta, el Dashboard, Cuentas por Cobrar, Cuentas por Pagar, Morosidad y Tesorería muestran una tarjeta con el total vencido y el botón **Abrir Cuentas Vencidas**.' },

    { h1: 'Preguntar a las IAs' },
    { p: 'Las IAs de Axioma (IA Financiera, Informes, José y las demás) consultan este mismo análisis. Ejemplos: "¿Cuánto tenemos vencido?", "¿Quiénes son los mayores morosos?", "¿Qué promesas se incumplieron?", "¿A qué proveedor pagar primero?", "Si recuperamos 70% en 30 días, ¿cómo queda la caja?". Los números los calcula Axioma; la IA explica y nunca cobra, negocia ni borra nada.' },

    { h1: 'Cuentas por cobrar vencidas' },
    { p: 'Tabla con cliente, descripción, vencimiento y días de atraso, valor original, **saldo**, **intereses y multas**, **riesgo** (0 a 1000, o "sin historial"), **prioridad**, **último contacto** y **próxima acción**. En el celular cada cuenta es una tarjeta.' },
    { lista: [
      '**Ordenar**: más prioritarias, más atrasadas, mayor saldo o cliente de la A a la Z. La lista muestra 20 por página (**Anterior** / **Siguiente**).',
      '**Marcar**: la casilla de cada fila (o la de arriba, para toda la página). Con cuentas marcadas, **PDF** y **Excel** llevan solo esas; sin marcar, toda la lista filtrada.',
      '**Detalles**: toque la fila. Aparecen los valores (original, saldo, multa, intereses, actualización por IPCA y total actualizado) con la base legal, la próxima acción y el porqué, la causa probable (confirmada o por confirmar), los motivos de la nota de riesgo y el comportamiento de pago del cliente.',
      '**ADN de pago** (debajo de los detalles): atraso promedio, pagos con atraso, regularidad, plazo y valor promedio, promesas cumplidas e incumplidas, acuerdos, exposición (vencido y abierto) y un gráfico con los días de atraso de cada pago (verde menta = a tiempo; azul marino = con atraso). La **tendencia** (empeorando, mejorando o estable) viene con los números que la sostienen; con menos de 4 pagos el cliente no se clasifica.',
      '**Registrar contacto**: elija el canal y la fecha, escriba lo que se habló y toque **Registrar contacto**. El **lápiz** corrige el texto; la **papelera** quita el contacto de la lista (sin contraseña).',
      '**Registrar promesa**: valor (hasta el saldo) y fecha desde hoy. La promesa no cuenta como dinero en caja.',
      '**Registrar cobro en Cuentas por Cobrar**: el cobro siempre se registra allí, en un solo lugar.',
    ] },
    { nota: 'Papelera: el botón **Papelera** muestra contactos y promesas borrados en los últimos 60 días, con los días que faltan; **Recuperar** devuelve el ítem a todas las pantallas.' },

    { h1: 'Cuentas por pagar vencidas' },
    { p: 'Lista con la descripción, el proveedor, la fecha de vencimiento, el **saldo pendiente** y los **días de atraso** (destacados en rojo por encima de 30 días). Haga clic en una cuenta, o en **Pagar en Cuentas por Pagar**, para abrir la pantalla de origen filtrada en **Vencido** — allí registra el pago.' },
    { lista: [
      'La lista funciona como la central por cobrar: **ordenar**, 20 por página, **marcar**, **PDF** y **Excel**. Las columnas propias de este lado son la **Importancia** del proveedor y la **Negociación**.',
      '**Detalles** (toque la fila): valores con intereses y multas estimados, la próxima acción y los motivos de la **prioridad de pago**.',
      '**Importancia del proveedor** (lápiz): elija Crítica, Alta, Media o Baja y marque si el atraso puede cortar el suministro, afectar la producción o las ventas; toque **Guardar importancia**. La prioridad se recalcula — un proveedor esencial puede ir antes que una cuenta mayor o más antigua.',
      '**Simulación de pago**: marque cuentas y vea la caja de hoy, la caja después de pagarlas (con intereses y multas) y el margen sobre la reserva mínima de Tesorería. Solo simulación; el pago se registra en Cuentas por Pagar.',
    ] },
    { nota: 'Una cuenta pagada o cobrada en parte aparece con lo que aún falta. Las cuentas pagadas, cobradas o canceladas no aparecen.' },
    { nota: 'Si algún dato no carga, la pantalla avisa que la lista puede estar incompleta — actualice la página.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
