// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '28 - Comercial - Contas a Pagar.docx',
  titulo: 'Manual 28 — Contas a Pagar',
  subtitulo: 'Central de obrigações com fornecedores',
  info: ['Menu: Comercial → Contas a Pagar  •  Manual de uso do Axioma AI.Tech  •  Versão 2.1 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Reúne tudo o que a empresa tem para pagar: vencimentos, baixas, anexos, aprovações, pedidos de compra e conferência de notas. Além de organizar, o Axioma **protege o caixa**: detecta duplicidades, multas evitáveis, descontos que ainda dá para aproveitar e aumentos silenciosos de preço.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **👥 Comercial ▼** → **Contas a Pagar**.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['+ Nova Conta', 'Abre o cadastro de uma conta a pagar.'],
      ['Gerar de Custo Fixo', 'Lista os custos fixos **vigentes** do mês e cria a conta de cada um com um clique (sem duplicar no mesmo mês).'],
      ['Importar XML NF-e', 'Lê a nota fiscal eletrônica e preenche a conta sozinho. Se a nota já entrou pelo PDV, oferece vincular em vez de duplicar.'],
      ['Compartilhar', 'Envia o resumo das contas.'],
    ] } },

    { h1: 'Abas' },
    { h2: 'Command Center' },
    { p: 'Cards **Total em Aberto**, **Vencendo em 7 dias**, **Vencidas** e **Pagas no Mês** (clique em "Ver estas contas" para filtrar). Filtros por status, fornecedor e categoria, e a lista de contas. Em cada conta: **Anexar boleto/nota**, **🕘 Histórico da Conta**, **Ver rastreabilidade**, **Dar Baixa**, **Estornar pagamento**, **Editar** e **Excluir**. O selo mostra o score de saúde do fornecedor.' },
    { h2: 'Inteligência' },
    { lista: [
      '**O que merece sua atenção hoje**: o resumo dos pontos críticos.',
      '**Pergunte ao Axioma CFO**: pergunta livre (ex.: "quanto vou pagar em 30 dias?"). O Axioma envia ao motor de inteligência os dados reais de contas a pagar e um retrato da empresa; se a inteligência estiver fora, responde por regras e avisa.',
      '**Previsão de Caixa (AP Forecast)**: saldo em 30/60/90 dias nos cenários **Otimista** (em dia, sem multa) e **Pessimista** (com o atraso real da empresa), e se haverá ruptura.',
      '**Prioridade de Pagamento**: ordena o que pagar primeiro por um score; use **Fixar no topo** para manter uma conta em primeiro.',
      '**Despesas Recorrentes Detectadas**: mesmo fornecedor, valor parecido e intervalo regular em pelo menos 3 lançamentos. O botão **Transformar em Custo Fixo** cria o custo fixo (você confere antes; nada é criado sem aprovação).',
      '**Recuperação de Valor**: cobranças acima da média histórica, **multas evitáveis** (quando havia caixa para pagar em dia), possíveis duplicidades, **desconto ainda aproveitável** e **desconto perdido**. São sugestões para revisar: nada é alterado sozinho e o sistema nunca antecipa pagamento por conta própria.',
      '**Análise de Gasto**: por categoria, por fornecedor (Top 10), por centro de custo e evolução em 12 meses.',
      '**Pontos de Atenção**: valores muito acima do histórico e **aumento silencioso** (3 altas seguidas).',
    ] },
    { h2: 'Aprovações Pendentes' },
    { p: 'Contas acima do limite configurado aguardam aprovação. Quem é aprovador clica em **Aprovar** ou **Rejeitar** (motivo obrigatório). Os demais veem a fila em modo leitura. Editar uma conta nunca a tira da fila.' },
    { h2: 'Pedidos de Compra' },
    { p: 'Crie um **Novo Pedido** com fornecedor, número, data e itens (descrição, código, quantidade, valor). Isso liga a conferência completa (Pedido × Recebimento × Nota) para aquele fornecedor. Pedidos com nota vinculada não podem ser excluídos, só cancelados.' },
    { h2: 'Conferência de Notas' },
    { p: 'O Axioma confere cada nota importada com o que entrou no estoque e com a conta a pagar: valores, preços e quantidades. Mostra as **Divergências** com o percentual de diferença. Ações: **Reconferir** e **Aprovar mesmo assim** (só dono, administrador ou financeiro).' },
    { h2: 'Histórico' },
    { p: 'Linha do tempo de tudo o que aconteceu com as contas (auditoria). Dá para adicionar observação. Excluir um registro exige motivo e o envia para a **lixeira por 30 dias**, de onde pode ser **Restaurado**.' },
    { h2: 'Configuração AP' },
    { p: '**Limite de Aprovação Automática (R$)**, **Aprovadores** (o dono sempre pode aprovar), **bloquear duplicata quase certa** (semelhança de 90% ou mais), **janela de busca de duplicata** e **tolerâncias de valor e quantidade** para a conferência (ex.: 2% cobre frete ou arredondamento).' },

    { h1: 'Passo a passo: nova conta e baixa' },
    { numerada: [
      'Clique em **+ Nova Conta** e preencha fornecedor, descrição, valor total, categoria, emissão, vencimento, número da nota, forma de pagamento e centro de custo.',
      'Opcional: **Multa/Juros por Atraso (%/mês)** e **Desconto por Pagamento Antecipado (%)** com a data limite.',
      'Clique em **Salvar Conta**. Se parecer duplicada, o Axioma mostra a conta parecida; você pode **Vincular a esta**, **Salvar mesmo assim** ou, se o bloqueio estiver ligado, só o dono força com a senha.',
      'Ao pagar, clique em **Dar Baixa**, informe valor e data e **Confirmar Baixa**: o pagamento entra no Fluxo de Caixa, na DRE e na contabilidade. Pagou a mais por atraso? A diferença vira juros/multa (despesa financeira). Errou? **Estornar pagamento** com motivo.',
    ] },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['✏️ Editar', 'Nunca muda o que já foi pago; o valor não pode ficar abaixo do já pago.'],
      ['🗑️ Excluir', 'Pede motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador). Conta paga não pode ser excluída: estorne a baixa primeiro.'],
    ] } },
    { nota: 'Perfis somente leitura veem tudo, mas não alteram. As contas são lidas sem limite de linhas; se a leitura falhar, a tela avisa — nunca mostra "nenhuma conta" por engano.' },

    { h1: 'Pagar o DAS do Simples Nacional (ME/EPP)' },
    { p: 'Contas da categoria **Impostos** com "DAS" ou "Simples Nacional" na descrição ganham o botão verde **Pagar DAS** na linha da conta.' },
    { numerada: [
      'Clique em **Pagar DAS** → **Abrir o PGDAS-D**, faça a apuração do mês e clique em "Gerar DAS". Baixe o PDF.',
      'Envie a guia. A inteligência do Axioma lê valor, vencimento, meses e códigos, e confere os códigos por regra. Você confere tudo antes de confirmar.',
      'Use **Copiar Pix** ou **Copiar código de barras** no app do banco (ou **Pagar com Pix pelo Axioma**, quando estiver ativado).',
      'Informe a data e clique em **Já paguei**: a baixa sai nesta conta, com multa/juros da guia como encargos, e vai para o Fluxo de Caixa e a Contabilidade.',
    ] },
    { nota: 'O DAS do MEI não é pago por aqui: ele fica em MEI → DAS & Obrigações (Manual 05). Se tentar dar baixa nele por aqui, o Axioma avisa onde pagar.' },

    { h1: 'Datas e dados confiáveis' },
    { p: 'As datas desta tela seguem o dia da sua empresa (fuso do estado cadastrado): depois das 21h o Axioma não pula mais para o dia seguinte. Se algum dado não puder ser lido, o Axioma tenta de novo sozinho; só se ainda assim falhar aparece no topo o aviso **Alguns dados não puderam ser carregados** — o valor faltante nunca é mostrado como zero. Ao abrir uma conta a partir de uma NF-e, se não for possível conferir o fornecedor pelo CNPJ, aparece o aviso para escolher o fornecedor antes de salvar (o Axioma não escolhe sozinho, para não cadastrar o mesmo fornecedor duas vezes). A conferência da nota com o pedido, quando não consegue ler os dados, avisa em vez de dizer que está tudo certo.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '28 - Commercial - Accounts Payable.docx',
  titulo: 'Manual 28 — Accounts Payable',
  subtitulo: 'Control center for supplier obligations',
  info: ['Menu: Commercial → Accounts Payable  •  Axioma AI.Tech user manual  •  Version 2.1 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Brings together everything the company has to pay: due dates, payments, attachments, approvals, purchase orders and invoice matching. Beyond organizing, Axioma **protects your cash**: it detects duplicates, avoidable penalties, discounts you can still take and silent price increases.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **👥 Commercial ▼** → **Accounts Payable**.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['+ New Bill', 'Opens the form for a new bill.'],
      ['Generate from Fixed Cost', 'Lists the month’s **active** fixed costs and creates each bill with one click (no duplicates in the same month).'],
      ['Import NF-e XML', 'Reads the electronic invoice and fills in the bill automatically. If the invoice already came in through the POS, it offers to link instead of duplicating.'],
      ['Share', 'Sends the bills summary.'],
    ] } },

    { h1: 'Tabs' },
    { h2: 'Command Center' },
    { p: 'Cards **Total Outstanding**, **Due in 7 days**, **Overdue** and **Paid this Month** (click "See these bills" to filter). Filters by status, supplier and category, and the list of bills. On each bill: **Attach invoice/receipt**, **🕘 Bill History**, **View traceability**, **Register Payment**, **Reverse payment**, **Edit** and **Delete**. The tag shows the supplier’s health score.' },
    { h2: 'Intelligence' },
    { lista: [
      '**What deserves your attention today**: a summary of critical points.',
      '**Ask Axioma CFO**: free question (e.g., "how much will I pay in 30 days?"). Axioma sends the intelligence engine the real payables data and a snapshot of the company; if the AI is down, it answers by rules and says so.',
      '**Cash Forecast (AP Forecast)**: balance at 30/60/90 days in **Optimistic** (on time, no penalty) and **Pessimistic** (with the company’s real delay) scenarios, and whether cash will run out.',
      '**Payment Priority**: ranks what to pay first by a score; use **Pin to top** to keep a bill first.',
      '**Recurring Expenses Detected**: same supplier, similar amount and regular interval in at least 3 entries. **Turn into Fixed Cost** creates the fixed cost (you check it first; nothing is created without approval).',
      '**Value Recovery**: charges above the historical average, **avoidable penalties** (when there was cash to pay on time), possible duplicates, **discount still available** and **lost discount**. These are suggestions to review: nothing changes by itself and the system never prepays on its own.',
      '**Spend Analysis**: by category, by supplier (Top 10), by cost center and 12-month evolution.',
      '**Points of Attention**: amounts far above history and **silent increase** (3 rises in a row).',
    ] },
    { h2: 'Pending Approvals' },
    { p: 'Bills above the configured limit await approval. Approvers click **Approve** or **Reject** (reason required). Others see the queue read-only. Editing a bill never removes it from the queue.' },
    { h2: 'Purchase Orders' },
    { p: 'Create a **New Order** with supplier, number, date and items (description, code, quantity, amount). This turns on full matching (Order × Receipt × Invoice) for that supplier. Orders with a linked invoice cannot be deleted, only canceled.' },
    { h2: 'Invoice Matching' },
    { p: 'Axioma checks each imported invoice against what entered inventory and against the bill: amounts, prices and quantities. It shows **Discrepancies** with the percentage difference. Actions: **Re-check** and **Approve anyway** (owner, administrator or finance only).' },
    { h2: 'History' },
    { p: 'Timeline of everything that happened with the bills (audit). You can add a note. Deleting a record requires a reason and sends it to the **trash for 30 days**, from where it can be **Restored**.' },
    { h2: 'AP Configuration' },
    { p: '**Automatic Approval Limit (R$)**, **Approvers** (the owner can always approve), **block near-certain duplicates** (90% or more similarity), **duplicate search window** and **amount and quantity tolerances** for matching (e.g., 2% covers freight or rounding).' },

    { h1: 'Step by step: new bill and payment' },
    { numerada: [
      'Click **+ New Bill** and fill in supplier, description, total amount, category, issue date, due date, invoice number, payment method and cost center.',
      'Optional: **Late Penalty/Interest (%/month)** and **Early Payment Discount (%)** with the deadline.',
      'Click **Save Bill**. If it looks duplicated, Axioma shows the similar bill; you can **Link to this one**, **Save anyway** or, if blocking is on, only the owner can force it with the password.',
      'When paying, click **Register Payment**, enter amount and date and **Confirm Payment**: the payment goes into Cash Flow, the Income Statement and accounting. Paid more because of delay? The difference becomes interest/penalty (financial expense). Made a mistake? **Reverse payment** with a reason.',
    ] },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['✏️ Edit', 'Never changes what was already paid; the amount cannot go below what was paid.'],
      ['🗑️ Delete', 'Asks for a reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator). A paid bill cannot be deleted: reverse the payment first.'],
    ] } },
    { nota: 'Read-only profiles see everything but cannot change anything. Bills are read with no row limit; if loading fails, the screen warns you — it never shows "no bills" by mistake.' },

    { h1: 'Paying the Simples Nacional DAS (ME/EPP)' },
    { p: 'Bills in the **Taxes** category with "DAS" or "Simples Nacional" in the description get the green **Pay DAS** button on the bill row.' },
    { numerada: [
      'Click **Pay DAS** → **Open PGDAS-D**, do the month’s calculation and click "Gerar DAS". Download the PDF.',
      'Upload the slip. Axioma’s AI reads amount, due date, months and codes, and checks the codes by rule. You review everything before confirming.',
      'Use **Copy Pix** or **Copy barcode** in your bank app (or **Pay with Pix through Axioma**, once enabled).',
      'Enter the date and click **I’ve paid**: the payment is recorded on this bill, with the slip’s penalty/interest as charges, and goes to Cash Flow and Accounting.',
    ] },
    { nota: 'The MEI DAS is not paid here: it is in MEI → DAS & Obligations (Manual 05). If you try to register its payment here, Axioma tells you where to pay it.' },

    { h1: 'Reliable dates and data' },
    { p: 'Dates on this screen follow your company’s day (time zone of the registered state): after 9 p.m. Axioma no longer jumps to the next day. If some data cannot be read, Axioma retries on its own; only if it still fails does the notice **Some data could not be loaded** appear at the top — the missing value is never shown as zero. When opening a bill from an NF-e, if the supplier cannot be checked by tax ID, a notice asks you to choose the supplier before saving (Axioma does not pick one on its own, so the same supplier is never registered twice). Invoice matching, when it cannot read the data, warns you instead of saying everything matches.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '28 - Comercial - Cuentas por Pagar.docx',
  titulo: 'Manual 28 — Cuentas por Pagar',
  subtitulo: 'Central de obligaciones con proveedores',
  info: ['Menú: Comercial → Cuentas por Pagar  •  Manual de uso de Axioma AI.Tech  •  Versión 2.1 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Reúne todo lo que la empresa tiene que pagar: vencimientos, pagos, adjuntos, aprobaciones, órdenes de compra y conciliación de facturas. Además de organizar, Axioma **protege la caja**: detecta duplicados, multas evitables, descuentos que aún se pueden aprovechar y aumentos silenciosos de precio.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **👥 Comercial ▼** → **Cuentas por Pagar**.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['+ Nueva Cuenta', 'Abre el registro de una cuenta por pagar.'],
      ['Generar de Costo Fijo', 'Lista los costos fijos **vigentes** del mes y crea la cuenta de cada uno con un clic (sin duplicar en el mismo mes).'],
      ['Importar XML NF-e', 'Lee la factura electrónica y completa la cuenta sola. Si la factura ya entró por el PDV, ofrece vincular en lugar de duplicar.'],
      ['Compartir', 'Envía el resumen de las cuentas.'],
    ] } },

    { h1: 'Pestañas' },
    { h2: 'Command Center' },
    { p: 'Tarjetas **Total Abierto**, **Vence en 7 días**, **Vencidas** y **Pagadas este Mes** (haga clic en "Ver estas cuentas" para filtrar). Filtros por estado, proveedor y categoría, y la lista de cuentas. En cada cuenta: **Adjuntar boleta/factura**, **🕘 Historial de la Cuenta**, **Ver trazabilidad**, **Registrar Pago**, **Revertir pago**, **Editar** y **Eliminar**. La etiqueta muestra el score de salud del proveedor.' },
    { h2: 'Inteligencia' },
    { lista: [
      '**Lo que merece su atención hoy**: el resumen de los puntos críticos.',
      '**Pregunte al Axioma CFO**: pregunta libre (ej.: "¿cuánto voy a pagar en 30 días?"). Axioma envía al motor de inteligencia los datos reales de cuentas por pagar y un retrato de la empresa; si la inteligencia está caída, responde por reglas y avisa.',
      '**Previsión de Caja (AP Forecast)**: saldo a 30/60/90 días en los escenarios **Optimista** (al día, sin multa) y **Pesimista** (con el atraso real de la empresa), y si habrá ruptura.',
      '**Prioridad de Pago**: ordena qué pagar primero por un score; use **Fijar arriba** para mantener una cuenta primero.',
      '**Gastos Recurrentes Detectados**: mismo proveedor, valor parecido e intervalo regular en al menos 3 registros. **Convertir en Costo Fijo** crea el costo fijo (usted revisa antes; nada se crea sin aprobación).',
      '**Recuperación de Valor**: cobros por encima del promedio histórico, **multas evitables** (cuando había caja para pagar a tiempo), posibles duplicados, **descuento aún aprovechable** y **descuento perdido**. Son sugerencias para revisar: nada cambia solo y el sistema nunca anticipa pagos por su cuenta.',
      '**Análisis de Gasto**: por categoría, por proveedor (Top 10), por centro de costo y evolución en 12 meses.',
      '**Puntos de Atención**: valores muy por encima del historial y **aumento silencioso** (3 alzas seguidas).',
    ] },
    { h2: 'Aprobaciones Pendientes' },
    { p: 'Las cuentas por encima del límite configurado esperan aprobación. Quien es aprobador hace clic en **Aprobar** o **Rechazar** (motivo obligatorio). Los demás ven la fila en modo lectura. Editar una cuenta nunca la saca de la fila.' },
    { h2: 'Órdenes de Compra' },
    { p: 'Cree una **Nueva Orden** con proveedor, número, fecha e ítems (descripción, código, cantidad, valor). Esto activa la conciliación completa (Orden × Recepción × Factura) para ese proveedor. Las órdenes con factura vinculada no se pueden eliminar, solo cancelar.' },
    { h2: 'Conciliación de Facturas' },
    { p: 'Axioma compara cada factura importada con lo que entró al inventario y con la cuenta por pagar: valores, precios y cantidades. Muestra las **Divergencias** con el porcentaje de diferencia. Acciones: **Reconciliar** y **Aprobar de todos modos** (solo dueño, administrador o finanzas).' },
    { h2: 'Historial' },
    { p: 'Línea de tiempo de todo lo que pasó con las cuentas (auditoría). Se puede agregar una observación. Borrar un registro exige motivo y lo envía a la **papelera por 30 días**, de donde se puede **Restaurar**.' },
    { h2: 'Configuración AP' },
    { p: '**Límite de Aprobación Automática (R$)**, **Aprobadores** (el dueño siempre puede aprobar), **bloquear duplicado casi seguro** (semejanza de 90% o más), **ventana de búsqueda de duplicados** y **tolerancias de valor y cantidad** para la conciliación (ej.: 2% cubre flete o redondeo).' },

    { h1: 'Paso a paso: nueva cuenta y pago' },
    { numerada: [
      'Haga clic en **+ Nueva Cuenta** y complete proveedor, descripción, valor total, categoría, emisión, vencimiento, número de factura, forma de pago y centro de costo.',
      'Opcional: **Multa/Intereses por Atraso (%/mes)** y **Descuento por Pago Anticipado (%)** con la fecha límite.',
      'Haga clic en **Guardar Cuenta**. Si parece duplicada, Axioma muestra la cuenta parecida; puede **Vincular a esta**, **Guardar de todos modos** o, si el bloqueo está activo, solo el dueño puede forzar con la contraseña.',
      'Al pagar, haga clic en **Registrar Pago**, informe valor y fecha y **Confirmar Pago**: el pago entra en el Flujo de Caja, el Estado de Resultados y la contabilidad. ¿Pagó de más por atraso? La diferencia se vuelve intereses/multa (gasto financiero). ¿Se equivocó? **Revertir pago** con motivo.',
    ] },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['✏️ Editar', 'Nunca cambia lo ya pagado; el valor no puede quedar por debajo de lo pagado.'],
      ['🗑️ Eliminar', 'Pide motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador). Una cuenta pagada no se puede eliminar: revierta el pago primero.'],
    ] } },
    { nota: 'Los perfiles de solo lectura ven todo pero no modifican. Las cuentas se leen sin límite de filas; si la lectura falla, la pantalla avisa — nunca muestra "ninguna cuenta" por error.' },

    { h1: 'Pagar el DAS del Simples Nacional (ME/EPP)' },
    { p: 'Las cuentas de la categoría **Impuestos** con "DAS" o "Simples Nacional" en la descripción tienen el botón verde **Pagar DAS** en la línea de la cuenta.' },
    { numerada: [
      'Haga clic en **Pagar DAS** → **Abrir el PGDAS-D**, haga la liquidación del mes y haga clic en "Gerar DAS". Descargue el PDF.',
      'Suba la guía. La inteligencia de Axioma lee valor, vencimiento, meses y códigos, y verifica los códigos por regla. Usted revisa todo antes de confirmar.',
      'Use **Copiar Pix** o **Copiar código de barras** en la app del banco (o **Pagar con Pix por Axioma**, cuando esté activado).',
      'Informe la fecha y haga clic en **Ya pagué**: el pago se registra en esta cuenta, con la multa/intereses de la guía como cargos, y va al Flujo de Caja y a la Contabilidad.',
    ] },
    { nota: 'El DAS del MEI no se paga aquí: está en MEI → DAS y Obligaciones (Manual 05). Si intenta registrar su pago aquí, Axioma avisa dónde pagarlo.' },

    { h1: 'Fechas y datos confiables' },
    { p: 'Las fechas de esta pantalla siguen el día de su empresa (huso del estado registrado): después de las 21 h Axioma ya no salta al día siguiente. Si algún dato no se puede leer, Axioma reintenta por su cuenta; solo si aun así falla aparece arriba el aviso **Algunos datos no se pudieron cargar** — el valor faltante nunca se muestra como cero. Al abrir una cuenta desde una NF-e, si no se puede verificar el proveedor por CNPJ, aparece el aviso para elegir el proveedor antes de guardar (Axioma no elige solo, para no registrar el mismo proveedor dos veces). La conciliación de la factura, cuando no logra leer los datos, avisa en lugar de decir que todo coincide.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
