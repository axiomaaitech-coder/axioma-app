// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '28 - Comercial - Contas a Pagar.docx',
  titulo: 'Manual 28 — Contas a Pagar',
  subtitulo: 'Central de obrigações com fornecedores',
  info: ['Menu: Comercial → Contas a Pagar  •  Manual de uso do Axioma AI.Tech  •  Versão 2.5 (outubro de 2026)'],
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

    { h1: 'Ditado por voz' },
    { p: 'Quando o ditado estiver liberado para a sua empresa, aparece um botão de microfone na pergunta ao CFO e na Descrição da conta. Toque e fale (ou segure e solte); o navegador pede permissão ao microfone só no primeiro uso. Para sozinho depois de um silêncio ou em 60 segundos, e o botão ✕ cancela. O texto entra no campo, junto do que você já tinha digitado, para você revisar — **nada é enviado nem gravado sozinho**. Cada ditado concluído usa 1 pergunta de IA comum do saldo; falha, silêncio ou áudio não entendido não consome. O áudio não é guardado pelo Axioma.' },
    { p: '**Pergunte à Inteligência Axioma (Assistente Financeiro):** No lugar da antiga caixa "Pergunte ao Axioma CFO", há uma conversa com a Inteligência Axioma: pergunte digitando ou pelo botão **Falar** e continue o assunto. Ela responde com os números desta tela; se a inteligência estiver fora do ar, responde pelas regras do Axioma, com aviso. Embaixo de cada resposta há **🔊 Ouvir** (a voz do José), **"Quer que eu lembre disso?"** e **"Está errado?"**; abaixo ficam a **Conversa ao vivo** (continua se você mudar de tela) e o painel **Memória da IA**. Os números vêm dos dados da Empresa, conferidos.' },
    { nota: '**Relatório depois da consulta:** peça "gere um relatório" (ou DRE, fluxo de caixa, contas a receber…) e a IA monta o relatório completo com os dados reais, avisa "seu relatório está feito e está aí embaixo, em PDF" e mostra o cartão com o botão grande **⬇ Baixar relatório em PDF** (os mesmos números da tela Relatórios). Vale também na conversa por voz.' },
    { nota: '**Conversas salvas:** a conversa e os relatórios gerados ficam guardados mesmo se você sair do módulo. Use **＋ Nova conversa** para começar outra e **🗂 Conversas salvas** para reabrir as anteriores ou apagar (🗑, com confirmação). No cartão do relatório há **✏️ Anotar** para escrever uma observação e **🗑 Apagar** para tirá-lo da conversa. Cada conversa é só sua: outras pessoas da Empresa não a veem, e nenhuma outra Empresa tem acesso. Nada é apagado sozinho.' },
    { nota: '**Previsão de caixa, multas evitáveis, antecipação de descontos e score de fornecedores** usam várias leituras ao mesmo tempo. Se alguma falhar, aparece o aviso "Alguns dados não puderam ser carregados" e esses números ficam incompletos: atualize a página antes de decidir antecipar um pagamento.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '28 - Commercial - Accounts Payable.docx',
  titulo: 'Manual 28 — Accounts Payable',
  subtitulo: 'Control center for supplier obligations',
  info: ['Menu: Commercial → Accounts Payable  •  Axioma AI.Tech user manual  •  Version 2.5 (October 2026)'],
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

    { h1: 'Voice dictation' },
    { p: 'When dictation is enabled for your company, a microphone button appears in the CFO question and in the bill Description. Tap and speak (or hold and release); the browser asks for microphone permission only the first time. It stops by itself after a silence or at 60 seconds, and the ✕ button cancels. The text goes into the field, after what you had already typed, for you to review — **nothing is sent or saved on its own**. Each completed dictation uses 1 standard AI question from the balance; failures, silence or unintelligible audio do not count. Axioma does not keep the audio.' },
    { p: '**Ask Axioma Intelligence (Financial Assistant):** Instead of the old "Ask Axioma CFO" box, there is a conversation with Axioma Intelligence: ask by typing or with **Speak** and follow up. It answers with this screen\'s numbers; if the intelligence is down, it answers by Axioma\'s rules, with a notice. Below each answer there is **🔊 Listen** (José\'s voice), **"Should I remember this?"** and **"Is this wrong?"**; below are the **Live conversation** (it continues if you change screens) and the **AI Memory** panel. Numbers come from the Company data, checked.' },
    { nota: '**Report after the consultation:** ask "generate a report" (or income statement, cash flow, receivables…) and the AI builds the full report with the real data, says "your report is done and it is right below, in PDF" and shows the card with the big **⬇ Download report as PDF** button (the same numbers as the Reports screen). It also works in the voice conversation.' },
    { nota: '**Saved conversations:** the conversation and the generated reports stay saved even if you leave the module. Use **＋ New conversation** to start another one and **🗂 Saved conversations** to reopen previous ones or delete them (🗑, with confirmation). On the report card there is **✏️ Add note** to write a remark and **🗑 Delete** to remove it from the conversation. Each conversation is yours only: other people in the Company cannot see it, and no other Company has access. Nothing is deleted automatically.' },
    { nota: '**Cash forecast, avoidable fines, early-payment discounts and supplier score** use several reads at once. If any fails, the notice "Some data could not be loaded" appears and those numbers are incomplete: refresh the page before deciding to pay early.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '28 - Comercial - Cuentas por Pagar.docx',
  titulo: 'Manual 28 — Cuentas por Pagar',
  subtitulo: 'Central de obligaciones con proveedores',
  info: ['Menú: Comercial → Cuentas por Pagar  •  Manual de uso de Axioma AI.Tech  •  Versión 2.5 (octubre de 2026)'],
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

    { h1: 'Dictado por voz' },
    { p: 'Cuando el dictado esté habilitado para su empresa, aparece un botón de micrófono en la pregunta al CFO y en la Descripción de la cuenta. Toque y hable (o mantenga y suelte); el navegador pide permiso al micrófono solo la primera vez. Se detiene solo después de un silencio o a los 60 segundos, y el botón ✕ cancela. El texto entra en el campo, junto con lo que ya había escrito, para que lo revise — **nada se envía ni se guarda solo**. Cada dictado completado usa 1 pregunta de IA común del saldo; fallas, silencio o audio no entendido no consumen. Axioma no guarda el audio.' },
    { p: '**Pregunte a la Inteligencia Axioma (Asistente Financiero):** En lugar de la antigua caja "Pregunte al Axioma CFO", hay una conversación con la Inteligencia Axioma: pregunte escribiendo o con **Hablar** y continúe el tema. Responde con los números de esta pantalla; si la inteligencia no está disponible, responde por las reglas de Axioma, con aviso. Debajo de cada respuesta hay **🔊 Escuchar** (la voz de José), **"¿Quiere que recuerde esto?"** y **"¿Está mal?"**; abajo están la **Conversación en vivo** (continúa si cambia de pantalla) y el panel **Memoria de la IA**. Los números vienen de los datos de la Empresa, verificados.' },
    { nota: '**Informe después de la consulta:** pida "genere un informe" (o estado de resultados, flujo de caja, cuentas por cobrar…) y la IA arma el informe completo con los datos reales, avisa "su informe está hecho y está justo abajo, en PDF" y muestra la tarjeta con el botón grande **⬇ Descargar informe en PDF** (los mismos números de la pantalla Informes). También funciona en la conversación por voz.' },
    { nota: '**Conversaciones guardadas:** la conversación y los informes generados quedan guardados aunque salga del módulo. Use **＋ Nueva conversación** para empezar otra y **🗂 Conversaciones guardadas** para reabrir las anteriores o borrarlas (🗑, con confirmación). En la tarjeta del informe está **✏️ Anotar** para escribir una observación y **🗑 Borrar** para quitarlo de la conversación. Cada conversación es solo suya: otras personas de la Empresa no la ven y ninguna otra Empresa tiene acceso. Nada se borra solo.' },
    { nota: '**Previsión de caja, multas evitables, anticipo de descuentos y puntaje de proveedores** usan varias lecturas a la vez. Si alguna falla, aparece el aviso "Algunos datos no se pudieron cargar" y esos números quedan incompletos: actualice la página antes de decidir anticipar un pago.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
