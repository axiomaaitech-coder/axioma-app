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

    { h1: 'Compartilhar' },
    { p: 'O botão **Compartilhar**, no topo, abre a mesma central de compartilhamento dos outros módulos (WhatsApp, Gmail, Outlook, Telegram, copiar e outros) com um resumo pronto: vencido a receber e a pagar, recuperado e taxa, promessas, divergências e as três maiores prioridades de cobrança.' },

    { h1: 'Letreiro' },
    { p: 'A faixa azul-marinho no alto passa os números do momento: vencido a receber e a pagar, recuperado no período, taxa de recuperação, promessas descumpridas, divergências abertas e quanto está em até 30 dias (referência de mercado 75–80%). Passe o mouse para pausar.' },

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
    { p: 'Gráfico de colunas com o saldo em cada faixa: **A vencer** (cinza), até 30 dias (verde-menta), 31 a 90 dias (azul-marinho) e acima de 90 dias (vermelho, atraso grave) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 e acima de 360 dias. Passe o mouse (ou toque) numa coluna para ver o valor, a quantidade de contas e o peso no total. No alto, **Até 30 dias (com a vencer)** compara com a referência de mercado de 75% a 80%. No celular o gráfico aparece deitado, com o nome de cada faixa na lateral. Os botões **A receber** e **A pagar** trocam o lado. Embaixo: juros e multa estimados e quanto o maior devedor representa do vencido.' },

    { h1: 'Previsão e evolução' },
    { p: 'Quanto deve ser recuperado em 7, 15, 30, 60 e 90 dias, com o nível de confiança. A **evolução** mostra o total vencido a receber dia a dia — ela começa a ser registrada no primeiro dia em que a tela é aberta.' },

    { h1: 'Ligações com outros módulos' },
    { p: 'Botões no topo levam a **Contas a Receber**, **Contas a Pagar**, **Inadimplência** (régua e negociação), **Clientes**, **Fornecedores**, **Tesouraria** e **Fluxo de Caixa**. No caminho de volta, o Dashboard, Contas a Receber, Contas a Pagar, Inadimplência e Tesouraria mostram um cartão com o total vencido e o botão **Abrir Contas Vencidas**. Nos detalhes e no dossiê, o título de cada quadro tem um caminho (›) para o módulo dono daquela informação: Valores → Contas a Receber/Pagar, Contatos e Comunicações → régua de cobrança (Inadimplência), Identificação → cadastro, Previsão e Simulação → Tesouraria, DNA → Inteligência de Clientes, Importância → Fornecedores.' },

    { h1: 'Perguntar às IAs' },
    { p: 'As IAs do Axioma (IA Financeira, Relatórios, José e as demais) consultam esta mesma análise. Exemplos: "Quanto temos vencido?", "Quem são os maiores inadimplentes?", "Quais promessas foram descumpridas?", "Qual fornecedor pagar primeiro?", "Se recuperarmos 70% em 30 dias, como fica o caixa?". Os números vêm calculados pelo Axioma; a IA explica e nunca cobra, negocia ou apaga nada.' },

    { h1: 'Explicação da próxima ação' },
    { p: 'No detalhe de cada conta (a receber e a pagar), a próxima ação vem explicada por inteiro: **Por quê** (o motivo da escolha), **Dados usados** (dias de atraso, saldo, nota de risco ou prioridade, causa provável, comportamento, promessa, negociação, último contato, valor contestado e total com encargos), **Benefício**, **Risco de não fazer** e **Próximo passo** (onde clicar). A explicação só traduz o que o Axioma já calculou; quem decide e executa é você.' },

    { h1: 'Quem pode fazer o quê' },
    { p: 'Todos da Equipe veem Contas Vencidas. **Registrar contato, promessa, negociação, divergência e marcar alerta como tratado** é para dono, sócio, administrador e financeiro; leitor e contábil só consultam. **Regras do piloto e faixas de atraso** só dono, sócio ou administrador mudam. Ninguém apaga de vez: o que sai vai para a lixeira de 60 dias, e o histórico nunca é apagado nem alterado.' },

    { h1: 'Relatório de Contas Vencidas' },
    { p: 'O cartão **Relatório de Contas Vencidas** (acima do Piloto automático) gera um arquivo com tudo o que está na tela, já com o período e os filtros escolhidos: resumo (totais, recuperado, valor em risco, promessas, divergências e previsão), atraso por faixa, ações de hoje, alertas e as contas a receber e a pagar vencidas (vencimento, dias, saldo, total atualizado, nota de risco e próxima ação). **Relatório PDF** baixa o documento para enviar ou imprimir; **Relatório Excel** baixa uma planilha com uma aba para cada parte.' },

    { h1: 'Piloto automático — ações de hoje' },
    { p: 'Fica acima da Central de alertas e lista o que precisa ser feito hoje, pela ordem de urgência: **Fornecedor essencial vencido**, **Promessa descumprida**, **Divergência parada** (prazo vencido ou 15 dias sem atualização), **Sem contato há 15 dias** (mais de 30 dias de atraso), **Confirmar promessa** (promessa no prazo sem contato há 3 dias) e **Lembrete de início** (venceu há até 7 dias sem lembrete). Cada linha mostra o nome, o saldo, os dias de atraso e o que fazer. **Nada é enviado sozinho**: **Abrir ›** leva até a conta com a mensagem sugerida já escolhida; a ação sai da lista quando o contato é registrado. **Regras do piloto** liga ou desliga cada regra para a Empresa toda (só dono, sócio ou administrador). Promessa que vence sem pagamento entra sozinha no histórico da conta, uma vez só.' },

    { h1: 'Central de alertas' },
    { p: 'Mostra os alertas do mais grave para o mais leve, em 4 níveis: **Crítico** (vermelho cheio — agir hoje: fornecedor essencial vencido, caixa de 30 dias negativo), **Alto risco** (contorno vermelho — promessa descumprida, nota de risco 700 ou mais, caixa abaixo da reserva, metade do vencido piorando de faixa), **Atenção** (azul-marinho — cliente pagando mais tarde, prazo de divergência vencido, mais de 30 dias de atraso sem contato há 15 dias) e **Normal** (verde-menta — promessa no prazo, só acompanhar). Filtre por nível. **Abrir** leva à conta; **Marcar como tratado** pede o que foi feito e guarda no histórico — o alerta sai por 7 dias e volta se a situação continuar. Alertas gerais (caixa, faixas) somem sozinhos quando a situação muda. **Histórico de tratados** mostra os últimos 90 dias; nada é apagado.' },

    { h1: 'Pergunte à Inteligência Axioma' },
    { p: 'O chat logo abaixo dos atalhos dos módulos (o mesmo de Contas a Pagar) responde sobre as contas vencidas com os números do Axioma: quem cobrar primeiro, quanto deve entrar, promessas em risco, "e se recuperarmos 50%?" e o que pagar primeiro. Tem perguntas prontas, ditado e Ouvir, conversa ao vivo, conversas salvas e relatório. A IA só consulta e explica: não cobra, não paga e não grava nada — quem decide é você, na tela.' },

    { h1: 'Simulador de recuperação' },
    { p: 'Responde "e se?" sobre o caixa, sem gravar nada. Escolha quanto do vencido a receber recuperar (30% a 90% ou a régua), em quantos dias (15, 30, 60 ou 90), quantas promessas podem ser descumpridas (botões 0% a 100% ou a régua) e se as negociações seguem no ritmo normal ou são antecipadas; logo abaixo de cada escolha aparece quanto entra. As duas réguas e os botões aparecem sempre, no computador e no celular; sem promessa ou negociação em aberto, a tela avisa embaixo onde registrar. Aparecem o recuperado, o caixa no prazo com o risco de faltar caixa (verde-menta baixo, azul-marinho médio, vermelho alto), a cobertura das obrigações, a folga sobre a reserva mínima, a liquidez imediata e o capital de giro, mais uma tabela comparando 30%, 50%, 70% e 90%. O caixa vem da Tesouraria (link no título). O mesmo dinheiro nunca conta duas vezes: promessas e negociações saem do restante antes do percentual.' },

    { h1: 'Central de divergências' },
    { p: 'Aparece quando há divergência aberta: lista as dos dois lados (a receber e a pagar) com o valor contestado, o responsável, o prazo e quantas evidências há. As **paradas** (prazo vencido ou 15 dias sem atualização) vêm primeiro, com borda vermelha. **Abrir** leva direto à conta.' },

    { h1: 'Contas a receber vencidas' },
    { p: 'Tabela com cliente, descrição, vencimento e dias de atraso, valor original, **saldo**, **juros e multa**, **risco** (0 a 1000, ou "sem histórico"), **prioridade**, **último contato** e **próxima ação**. No celular cada conta vira um cartão.' },
    { lista: [
      '**Ordenar**: mais prioritárias, mais atrasadas, maior saldo ou cliente de A a Z. A lista mostra 20 por página (**Anterior** / **Próxima**).',
      '**Marcar**: a caixinha de cada linha (ou a do topo, para a página toda). Com contas marcadas, **PDF** e **Excel** levam só elas; sem marcação, levam a lista filtrada inteira.',
      '**Detalhes**: toque na linha. Aparecem os valores (original, saldo, multa, juros, correção pelo IPCA e total atualizado) com a base legal, a próxima ação e o porquê, a causa provável (confirmada ou a confirmar), os motivos da nota de risco e o comportamento de pagamento do cliente.',
      '**DNA de pagamento** (embaixo dos detalhes): atraso médio, pagamentos com atraso, regularidade, prazo e valor médios, promessas cumpridas e descumpridas, acordos, exposição (vencido e em aberto) e um gráfico com os dias de atraso de cada pagamento (verde-menta = em dia; azul-marinho = até 30 dias; vermelho = mais de 30 dias). Nota de risco e tendência também usam essas cores: vermelho = risco alto ou piorando. A **tendência** (piorando, melhorando ou estável) vem com os números que a sustentam; com menos de 4 pagamentos o cliente não é classificado.',
      '**Registrar contato**: escolha o canal e a data, escreva o que foi conversado e toque em **Registrar contato**. O **lápis** corrige o texto; a **lixeira** tira o contato da lista (sem senha).',
      '**Registrar promessa**: valor (até o saldo) e data a partir de hoje. Promessa não conta como dinheiro em caixa.',
      '**Divergência** (também nas contas a pagar): **Registrar divergência** abre o motivo (valor incorreto, nota fiscal, entrega, qualidade, devolução, cobrança em duplicidade, contrato, desconto ou outros), a situação (aberta, em análise, resolvida a nosso favor, resolvida a favor da outra parte, cancelada), o valor contestado (até o saldo), o prazo, o responsável e as evidências (descrição e link do arquivo). O valor contestado sai da cobrança e da previsão; o restante continua sendo cobrado. Para encerrar, escreva como foi resolvida. O lápis corrige; nada é apagado — tudo fica no histórico.',
      '**Negociação**: compara lado a lado À vista, Entrada 30% + 3 parcelas, 10% de desconto à vista, Novo vencimento em 30 dias e uma alternativa **Personalizada** (entrada, parcelas, desconto, prazo, pagamento parcial, dispensar juros e multa). Cada uma mostra o devido, o desconto, o total negociado, as parcelas com datas, o caixa em 30/60/90 dias, o custo do tempo (premissa de 1% ao mês) e a **recuperação esperada**; a melhor vem marcada como **Recomendada**. **Propor esta** registra a proposta; só **dono, sócio ou admin** podem **Aprovar** ou **Recusar**, sempre com motivo. Aprovada, ela vira um **acordo** no acompanhamento de promessas. Nada muda na conta até a aprovação, e a IA nunca concede desconto.',
      '**Mensagem ao cliente**: escolha o modelo (lembrete, aviso de vencimento, cobrança cordial, pedido de previsão, confirmação de promessa, convite para negociar ou agradecimento) e o idioma; o texto vem pronto com os dados reais da conta e pode ser editado. **Copiar texto**, **Abrir no WhatsApp** ou **Abrir no e-mail** (usam o telefone e o e-mail do cadastro do cliente). Quem envia é você; depois toque em **Marcar como enviada** e o contato entra no histórico. O Axioma não envia nada sozinho. Os modelos aparecem como botões (o **sugerido** pelo atraso vem marcado) e os textos são cordiais e firmes, com pedido claro e o ganho de regularizar — sem ameaça nem constrangimento (Código de Defesa do Consumidor, art. 42).',
      '**Registrar recebimento em Contas a Receber**: o recebimento é sempre lançado lá, num lugar só.',
      '**Dossiê**: toque no **nome do cliente** (no celular, no botão **Dossiê**). Reúne identificação (documento, telefone, e-mail, cidade, condição de pagamento, limite de crédito), exposição (vencido, a vencer, total), previsão de recuperação, todas as contas vencidas com a próxima ação (**Abrir** leva à conta), o DNA de pagamento e as comunicações. **Abrir Clientes** leva ao cadastro.',
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

    { h1: 'Share' },
    { p: 'The **Share** button at the top opens the same sharing center as the other modules (WhatsApp, Gmail, Outlook, Telegram, copy and more) with a ready summary: overdue receivable and payable, recovered and rate, promises, disputes and the three top collection priorities.' },

    { h1: 'Ticker' },
    { p: 'The navy strip at the top scrolls the current numbers: overdue receivable and payable, recovered in period, recovery rate, broken promises, open disputes and how much is within 30 days (market reference 75–80%). Hover to pause.' },

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
    { p: 'Column chart with the balance in each range: **Not due** (gray), up to 30 days (mint green), 31 to 90 days (navy) and over 90 days (red, serious delay) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 and over 360 days. Hover (or tap) a column to see the amount, the number of bills and the share of the total. At the top, **Up to 30 days (incl. not due)** is compared with the market reference of 75% to 80%. On a phone the chart is shown sideways, with each range name on the side. The **Receivable** and **Payable** buttons switch sides. Below: estimated interest and fines and how much the largest debtor represents of the overdue amount.' },

    { h1: 'Forecast and history' },
    { p: 'How much should be recovered in 7, 15, 30, 60 and 90 days, with the confidence level. The **history** shows the overdue receivable total day by day — it starts on the first day the screen is opened.' },

    { h1: 'Links to other modules' },
    { p: 'Buttons at the top lead to **Receivables**, **Payables**, **Delinquency** (schedule and negotiation), **Customers**, **Suppliers**, **Treasury** and **Cash Flow**. On the way back, the Dashboard, Receivables, Payables, Delinquency and Treasury show a card with the overdue total and the **Open Overdue Bills** button. In the details and the dossier, each box title has a path (›) to the module that owns that information: Amounts → Receivables/Payables, Contacts and Communications → collection schedule (Delinquency), Identification → record, Forecast and Simulation → Treasury, DNA → Customer Intelligence, Importance → Suppliers.' },

    { h1: 'Asking the AIs' },
    { p: 'Axioma AIs (Financial AI, Reports, José and the others) read this same analysis. Examples: "How much is overdue?", "Who are the biggest late payers?", "Which promises were broken?", "Which supplier should we pay first?", "If we recover 70% in 30 days, how does cash look?". The numbers are calculated by Axioma; the AI explains and never collects, negotiates or deletes anything.' },

    { h1: 'Next action explained' },
    { p: 'In each bill’s details (receivable and payable), the next action comes fully explained: **Why** (the reason for the choice), **Data used** (days overdue, balance, risk score or priority, likely cause, behaviour, promise, negotiation, last contact, disputed amount and total with charges), **Benefit**, **Risk of not doing it** and **Next step** (where to click). The explanation only puts into words what Axioma already calculated; you decide and act.' },

    { h1: 'Who can do what' },
    { p: 'Everyone on the Team sees Overdue Bills. **Recording contacts, promises, negotiations, disputes and marking alerts as handled** is for the owner, partner, admin and finance; viewer and accounting only look. **Autopilot rules and overdue ranges** can only be changed by the owner, partner or admin. Nobody deletes permanently: removed items go to the 60-day trash, and the history is never deleted or changed.' },

    { h1: 'Overdue Bills Report' },
    { p: 'The **Overdue Bills Report** card (above the Autopilot) creates a file with everything on the screen, using the chosen period and filters: summary (totals, recovered, amount at risk, promises, disputes and forecast), overdue by range, today’s actions, alerts and overdue receivables and payables (due date, days, balance, updated total, risk score and next action). **PDF report** downloads the document to send or print; **Excel report** downloads a spreadsheet with one tab per part.' },

    { h1: 'Autopilot — today’s actions' },
    { p: 'Sits above the Alert center and lists what needs doing today, by urgency: **Essential supplier overdue**, **Broken promise**, **Stalled dispute** (deadline passed or 15 days without update), **No contact for 15 days** (over 30 days overdue), **Confirm promise** (promise on time with no contact for 3 days) and **Early reminder** (overdue up to 7 days with no reminder). Each line shows the name, balance, days overdue and what to do. **Nothing is sent on its own**: **Open ›** takes you to the bill with the suggested message already chosen; the action leaves the list once the contact is recorded. **Autopilot rules** turns each rule on or off for the whole Company (owner, partner or admin only). A promise that expires unpaid goes into the bill’s history automatically, only once.' },

    { h1: 'Alert center' },
    { p: 'Shows alerts from most to least serious, in 4 levels: **Critical** (solid red — act today: essential supplier overdue, 30-day cash negative), **High risk** (red outline — broken promise, risk score 700 or more, cash below reserve, half of the overdue amount moving to worse ranges), **Attention** (navy — customer paying later, dispute deadline passed, over 30 days overdue with no contact for 15 days) and **Normal** (mint green — promise on time, just follow). Filter by level. **Open** takes you to the bill; **Mark as handled** asks what was done and keeps it in the history — the alert leaves for 7 days and comes back if the situation continues. General alerts (cash, ranges) disappear on their own when things change. **Handled history** shows the last 90 days; nothing is deleted.' },

    { h1: 'Ask Axioma Intelligence' },
    { p: 'The chat right below the module shortcuts (the same as in Payables) answers about overdue bills with Axioma’s numbers: who to collect from first, how much should come in, promises at risk, "what if we recover 50%?" and what to pay first. It has ready-made questions, dictation and Listen, live conversation, saved conversations and reports. The AI only looks up and explains: it does not collect, pay or save anything — you decide, on the screen.' },

    { h1: 'Recovery simulator' },
    { p: 'Answers "what if?" about cash, without saving anything. Choose how much of the overdue receivables to recover (30% to 90% or the slider), in how many days (15, 30, 60 or 90), how many promises may be broken (0% to 100% buttons or the slider) and whether negotiations keep their normal pace or are brought forward; right below each choice you see how much comes in. Both sliders and the buttons always show, on computer and phone; with no open promise or negotiation, the screen says below where to record one. It shows the amount recovered, cash at the end of the period with the risk of running short (mint green low, navy medium, red high), obligation coverage, margin over the minimum reserve, immediate liquidity and working capital, plus a table comparing 30%, 50%, 70% and 90%. Cash comes from Treasury (link in the title). The same money is never counted twice: promises and negotiations come out of the remainder before the percentage.' },

    { h1: 'Dispute center' },
    { p: 'Shows up when there is an open dispute: it lists them on both sides (receivable and payable) with the disputed amount, person in charge, deadline and number of evidence items. **Stalled** ones (deadline passed or 15 days without update) come first, with a red border. **Open** goes straight to the bill.' },

    { h1: 'Overdue receivables' },
    { p: 'Table with customer, description, due date and days overdue, original amount, **balance**, **interest and fines**, **risk** (0 to 1000, or "no history"), **priority**, **last contact** and **next action**. On a phone each bill becomes a card.' },
    { lista: [
      '**Sort**: highest priority, most overdue, largest balance or customer A to Z. The list shows 20 per page (**Previous** / **Next**).',
      '**Select**: the checkbox on each row (or the one at the top for the whole page). With bills selected, **PDF** and **Excel** export only those; with none, the whole filtered list.',
      '**Details**: tap the row. You see the amounts (original, balance, fine, interest, IPCA update and updated total) with the legal basis, the next action and why, the likely cause (confirmed or to be confirmed), the reasons for the risk score and the customer payment behaviour.',
      '**Payment DNA** (below the details): average delay, late payments, regularity, average term and amount, promises kept and broken, agreements, exposure (overdue and open) and a chart with the days late on each payment (mint green = on time; navy = up to 30 days; red = over 30 days). Risk score and trend use the same colors: red = high risk or getting worse. The **trend** (getting worse, improving or stable) comes with the numbers behind it; with fewer than 4 payments the customer is not classified.',
      '**Save contact**: pick the channel and date, write what was discussed and tap **Save contact**. The **pencil** fixes the text; the **trash** removes the contact from the list (no password).',
      '**Save promise**: amount (up to the balance) and a date from today on. A promise does not count as cash.',
      '**Dispute** (also on payables): **Record dispute** opens the reason (wrong amount, invoice, delivery, quality, return, duplicate charge, contract, discount or other), the status (open, under review, resolved in our favor, resolved for the other party, cancelled), the disputed amount (up to the balance), the deadline, the person in charge and the evidence (description and file link). The disputed amount leaves collection and forecast; the rest is still collected. To close it, write how it was resolved. The pencil corrects; nothing is deleted — everything stays in the history.',
      '**Negotiation**: compares side by side Pay in full, 30% down + 3 installments, 10% off in full, New due date in 30 days and a **Custom** option (down payment, installments, discount, term, partial payment, waive interest and fines). Each shows the amount owed, discount, negotiated total, installments with dates, cash in 30/60/90 days, the cost of time (1% a month premise) and the **expected recovery**; the best one is marked **Recommended**. **Propose this** saves the proposal; only **owner, partner or admin** can **Approve** or **Refuse**, always with a reason. Once approved it becomes an **agreement** in promise tracking. Nothing changes on the bill until approval, and the AI never grants a discount.',
      '**Message to the customer**: choose the template (reminder, due notice, friendly collection, payment date request, promise confirmation, negotiation invitation or thanks) and the language; the text comes ready with the real bill data and can be edited. **Copy text**, **Open in WhatsApp** or **Open in email** (use the phone and email on the customer record). You send it; then tap **Mark as sent** and the contact goes into the history. Axioma never sends anything on its own. Templates show as buttons (the one **suggested** by the delay is marked) and the texts are friendly and firm, with a clear request and the benefit of settling — no threats or embarrassment (Consumer Code, art. 42).',
      '**Record payment in Receivables**: payments are always recorded there, in one place.',
      '**Dossier**: tap the **customer name** (on a phone, the **Dossier** button). It gathers identification (tax ID, phone, email, city, payment terms, credit limit), exposure (overdue, not due, total), recovery forecast, all overdue bills with the next action (**Open** goes to the bill), the payment DNA and the communications. **Open Customers** goes to the customer record.',
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

    { h1: 'Compartir' },
    { p: 'El botón **Compartir**, arriba, abre la misma central de compartir de los demás módulos (WhatsApp, Gmail, Outlook, Telegram, copiar y otros) con un resumen listo: vencido por cobrar y por pagar, recuperado y tasa, promesas, divergencias y las tres mayores prioridades de cobranza.' },

    { h1: 'Marquesina' },
    { p: 'La franja azul marino de arriba muestra los números del momento: vencido por cobrar y por pagar, recuperado en el período, tasa de recuperación, promesas incumplidas, divergencias abiertas y cuánto está en hasta 30 días (referencia de mercado 75–80%). Pase el mouse para pausar.' },

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
    { p: 'Gráfico de columnas con el saldo en cada rango: **Por vencer** (gris), hasta 30 días (verde menta), 31 a 90 días (azul marino) y más de 90 días (rojo, atraso grave) — 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360 y más de 360 días. Pase el mouse (o toque) sobre una columna para ver el valor, la cantidad de cuentas y el peso en el total. Arriba, **Hasta 30 días (con por vencer)** se compara con la referencia de mercado de 75% a 80%. En el celular el gráfico aparece acostado, con el nombre de cada rango al costado. Los botones **Por cobrar** y **Por pagar** cambian el lado. Abajo: intereses y multas estimados y cuánto representa el mayor deudor de lo vencido.' },

    { h1: 'Previsión y evolución' },
    { p: 'Cuánto debe recuperarse en 7, 15, 30, 60 y 90 días, con el nivel de confianza. La **evolución** muestra el total vencido por cobrar día a día — empieza a registrarse el primer día que se abre la pantalla.' },

    { h1: 'Vínculos con otros módulos' },
    { p: 'Los botones de arriba llevan a **Cuentas por Cobrar**, **Cuentas por Pagar**, **Morosidad** (regla y negociación), **Clientes**, **Proveedores**, **Tesorería** y **Flujo de Caja**. De vuelta, el Dashboard, Cuentas por Cobrar, Cuentas por Pagar, Morosidad y Tesorería muestran una tarjeta con el total vencido y el botón **Abrir Cuentas Vencidas**. En los detalles y el expediente, el título de cada cuadro tiene un camino (›) al módulo dueño de esa información: Valores → Cuentas por Cobrar/Pagar, Contactos y Comunicaciones → regla de cobranza (Morosidad), Identificación → registro, Previsión y Simulación → Tesorería, ADN → Inteligencia de Clientes, Importancia → Proveedores.' },

    { h1: 'Preguntar a las IAs' },
    { p: 'Las IAs de Axioma (IA Financiera, Informes, José y las demás) consultan este mismo análisis. Ejemplos: "¿Cuánto tenemos vencido?", "¿Quiénes son los mayores morosos?", "¿Qué promesas se incumplieron?", "¿A qué proveedor pagar primero?", "Si recuperamos 70% en 30 días, ¿cómo queda la caja?". Los números los calcula Axioma; la IA explica y nunca cobra, negocia ni borra nada.' },

    { h1: 'Explicación de la próxima acción' },
    { p: 'En el detalle de cada cuenta (por cobrar y por pagar), la próxima acción viene explicada por completo: **Por qué** (el motivo de la elección), **Datos usados** (días de atraso, saldo, nota de riesgo o prioridad, causa probable, comportamiento, promesa, negociación, último contacto, valor disputado y total con cargos), **Beneficio**, **Riesgo de no hacerlo** y **Próximo paso** (dónde hacer clic). La explicación solo pone en palabras lo que Axioma ya calculó; quien decide y ejecuta es usted.' },

    { h1: 'Quién puede hacer qué' },
    { p: 'Todo el Equipo ve Cuentas Vencidas. **Registrar contacto, promesa, negociación, divergencia y marcar alerta como tratada** es para dueño, socio, administrador y financiero; lector y contable solo consultan. **Reglas del piloto y rangos de atraso** solo los cambian dueño, socio o administrador. Nadie borra para siempre: lo que sale va a la papelera de 60 días, y el historial nunca se borra ni se altera.' },

    { h1: 'Informe de Cuentas Vencidas' },
    { p: 'La tarjeta **Informe de Cuentas Vencidas** (sobre el Piloto automático) genera un archivo con todo lo que está en pantalla, con el período y los filtros elegidos: resumen (totales, recuperado, valor en riesgo, promesas, divergencias y previsión), atraso por rango, acciones de hoy, alertas y las cuentas por cobrar y por pagar vencidas (vencimiento, días, saldo, total actualizado, nota de riesgo y próxima acción). **Informe PDF** descarga el documento para enviar o imprimir; **Informe Excel** descarga una planilla con una pestaña por cada parte.' },

    { h1: 'Piloto automático — acciones de hoy' },
    { p: 'Está sobre la Central de alertas y lista lo que hay que hacer hoy, por urgencia: **Proveedor esencial vencido**, **Promesa incumplida**, **Divergencia detenida** (plazo vencido o 15 días sin actualización), **Sin contacto hace 15 días** (más de 30 días de atraso), **Confirmar promesa** (promesa en plazo sin contacto hace 3 días) y **Recordatorio inicial** (venció hace hasta 7 días sin recordatorio). Cada línea muestra el nombre, el saldo, los días de atraso y qué hacer. **Nada se envía solo**: **Abrir ›** lleva a la cuenta con el mensaje sugerido ya elegido; la acción sale de la lista cuando se registra el contacto. **Reglas del piloto** activa o desactiva cada regla para toda la Empresa (solo dueño, socio o administrador). La promesa que vence sin pago entra sola en el historial de la cuenta, una sola vez.' },

    { h1: 'Central de alertas' },
    { p: 'Muestra las alertas de la más grave a la más leve, en 4 niveles: **Crítico** (rojo lleno — actuar hoy: proveedor esencial vencido, caja a 30 días negativa), **Alto riesgo** (contorno rojo — promesa incumplida, nota de riesgo 700 o más, caja bajo la reserva, mitad de lo vencido empeorando de rango), **Atención** (azul marino — cliente pagando más tarde, plazo de divergencia vencido, más de 30 días de atraso sin contacto hace 15 días) y **Normal** (verde menta — promesa en plazo, solo seguir). Filtre por nivel. **Abrir** lleva a la cuenta; **Marcar como tratada** pide lo que se hizo y lo guarda en el historial — la alerta sale por 7 días y vuelve si la situación continúa. Las alertas generales (caja, rangos) desaparecen solas cuando la situación cambia. **Historial de tratadas** muestra los últimos 90 días; nada se borra.' },

    { h1: 'Pregunte a la Inteligencia Axioma' },
    { p: 'El chat justo debajo de los atajos de módulos (el mismo de Cuentas por Pagar) responde sobre las cuentas vencidas con los números de Axioma: a quién cobrar primero, cuánto debe entrar, promesas en riesgo, "¿y si recuperamos 50%?" y qué pagar primero. Tiene preguntas listas, dictado y Escuchar, conversación en vivo, conversaciones guardadas e informes. La IA solo consulta y explica: no cobra, no paga ni guarda nada — quien decide es usted, en la pantalla.' },

    { h1: 'Simulador de recuperación' },
    { p: 'Responde "¿y si?" sobre la caja, sin guardar nada. Elija cuánto de lo vencido por cobrar recuperar (30% a 90% o la regla), en cuántos días (15, 30, 60 o 90), cuántas promesas pueden incumplirse (botones 0% a 100% o la regla) y si las negociaciones siguen al ritmo normal o se anticipan; justo debajo de cada opción aparece cuánto entra. Las dos reglas y los botones aparecen siempre, en la computadora y en el celular; sin promesa o negociación abierta, la pantalla indica abajo dónde registrarla. Muestra lo recuperado, la caja al final del plazo con el riesgo de quedarse sin caja (verde menta bajo, azul marino medio, rojo alto), la cobertura de obligaciones, el margen sobre la reserva mínima, la liquidez inmediata y el capital de trabajo, además de una tabla que compara 30%, 50%, 70% y 90%. La caja viene de Tesorería (enlace en el título). El mismo dinero nunca cuenta dos veces: promesas y negociaciones salen del resto antes del porcentaje.' },

    { h1: 'Central de divergencias' },
    { p: 'Aparece cuando hay una divergencia abierta: las lista de los dos lados (por cobrar y por pagar) con el valor disputado, el responsable, el plazo y cuántas evidencias hay. Las **detenidas** (plazo vencido o 15 días sin actualización) aparecen primero, con borde rojo. **Abrir** lleva directo a la cuenta.' },

    { h1: 'Cuentas por cobrar vencidas' },
    { p: 'Tabla con cliente, descripción, vencimiento y días de atraso, valor original, **saldo**, **intereses y multas**, **riesgo** (0 a 1000, o "sin historial"), **prioridad**, **último contacto** y **próxima acción**. En el celular cada cuenta es una tarjeta.' },
    { lista: [
      '**Ordenar**: más prioritarias, más atrasadas, mayor saldo o cliente de la A a la Z. La lista muestra 20 por página (**Anterior** / **Siguiente**).',
      '**Marcar**: la casilla de cada fila (o la de arriba, para toda la página). Con cuentas marcadas, **PDF** y **Excel** llevan solo esas; sin marcar, toda la lista filtrada.',
      '**Detalles**: toque la fila. Aparecen los valores (original, saldo, multa, intereses, actualización por IPCA y total actualizado) con la base legal, la próxima acción y el porqué, la causa probable (confirmada o por confirmar), los motivos de la nota de riesgo y el comportamiento de pago del cliente.',
      '**ADN de pago** (debajo de los detalles): atraso promedio, pagos con atraso, regularidad, plazo y valor promedio, promesas cumplidas e incumplidas, acuerdos, exposición (vencido y abierto) y un gráfico con los días de atraso de cada pago (verde menta = a tiempo; azul marino = hasta 30 días; rojo = más de 30 días). La nota de riesgo y la tendencia usan los mismos colores: rojo = riesgo alto o empeorando. La **tendencia** (empeorando, mejorando o estable) viene con los números que la sostienen; con menos de 4 pagos el cliente no se clasifica.',
      '**Registrar contacto**: elija el canal y la fecha, escriba lo que se habló y toque **Registrar contacto**. El **lápiz** corrige el texto; la **papelera** quita el contacto de la lista (sin contraseña).',
      '**Registrar promesa**: valor (hasta el saldo) y fecha desde hoy. La promesa no cuenta como dinero en caja.',
      '**Divergencia** (también en las cuentas por pagar): **Registrar divergencia** abre el motivo (valor incorrecto, factura, entrega, calidad, devolución, cobro duplicado, contrato, descuento u otros), la situación (abierta, en análisis, resuelta a nuestro favor, resuelta a favor de la otra parte, cancelada), el valor disputado (hasta el saldo), el plazo, el responsable y las evidencias (descripción y enlace del archivo). El valor disputado sale de la cobranza y la previsión; el resto se sigue cobrando. Para cerrarla, escriba cómo se resolvió. El lápiz corrige; nada se borra — todo queda en el historial.',
      '**Negociación**: compara lado a lado Al contado, Entrada 30% + 3 cuotas, 10% de descuento al contado, Nuevo vencimiento en 30 días y una opción **Personalizada** (entrada, cuotas, descuento, plazo, pago parcial, dispensar intereses y multas). Cada una muestra lo adeudado, el descuento, el total negociado, las cuotas con fechas, la caja en 30/60/90 días, el costo del tiempo (premisa de 1% al mes) y la **recuperación esperada**; la mejor aparece como **Recomendada**. **Proponer esta** registra la propuesta; solo **dueño, socio o admin** pueden **Aprobar** o **Rechazar**, siempre con motivo. Aprobada, se convierte en un **acuerdo** en el seguimiento de promesas. Nada cambia en la cuenta hasta la aprobación, y la IA nunca concede descuentos.',
      '**Mensaje al cliente**: elija el modelo (recordatorio, aviso de vencimiento, cobranza cordial, pedido de fecha de pago, confirmación de promesa, invitación a negociar o agradecimiento) y el idioma; el texto viene listo con los datos reales de la cuenta y se puede editar. **Copiar texto**, **Abrir en WhatsApp** o **Abrir en correo** (usan el teléfono y el correo del registro del cliente). Usted lo envía; luego toque **Marcar como enviada** y el contacto entra en el historial. Axioma no envía nada solo. Los modelos aparecen como botones (el **sugerido** por el atraso viene marcado) y los textos son cordiales y firmes, con un pedido claro y el beneficio de regularizar — sin amenazas ni vergüenza (Código de Defensa del Consumidor, art. 42).',
      '**Registrar cobro en Cuentas por Cobrar**: el cobro siempre se registra allí, en un solo lugar.',
      '**Expediente**: toque el **nombre del cliente** (en el celular, el botón **Expediente**). Reúne identificación (documento, teléfono, correo, ciudad, condición de pago, límite de crédito), exposición (vencido, por vencer, total), previsión de recuperación, todas las cuentas vencidas con la próxima acción (**Abrir** lleva a la cuenta), el ADN de pago y las comunicaciones. **Abrir Clientes** lleva al registro.',
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
