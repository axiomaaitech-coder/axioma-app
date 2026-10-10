// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '05 - MEI - DAS e Obrigacoes.docx',
  titulo: 'Manual 05 — DAS & Obrigações',
  subtitulo: 'O calendário fiscal do MEI: DAS mês a mês, pagar por dentro do Axioma, cenários, declaração anual, atrasos e documentos para o contador',
  info: ['Menu: MEI → DAS & Obrigações  •  Manual de uso do Axioma AI.Tech  •  Versão 3.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Esta tela organiza **todas as obrigações fiscais do MEI**: o DAS de cada mês, a declaração anual (DASN-SIMEI) e o Imposto de Renda da pessoa física. Mostra **quanto já foi pago, quanto falta e quando vence**, deixa **pagar o DAS por dentro do Axioma**, simula cenários, calcula o custo do atraso e gera os **documentos para o contador** em PDF, Excel e CSV.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **MEI ▼** → **DAS & Obrigações**.', 'Cockpit → cartão **DAS & Obrigações** → **Ver detalhe**, ou o alerta "DAS vence em X dias / atrasado".', 'Painel MEI → **Acesso rápido**.'] },

    { h1: 'A regra do DAS (importante)' },
    { p: 'O DAS de um mês (a **competência**) vence no **dia 20 do mês seguinte**. Exemplo: o DAS de **setembro** vence em **20 de outubro**. Por isso o cartão "Janeiro de 2026" mostra a competência 12/2025.' },
    { nota: 'Valores oficiais de 2026 (salário mínimo de R$ 1.621): INSS de R$ 81,05 (5%) + R$ 1 de ICMS (comércio/indústria) e/ou R$ 5 de ISS (serviços). Caminhoneiro (MEI transportador): INSS de 12% = R$ 194,52. Valores conferidos em 10/10/2026; mudam todo ano com o salário mínimo.' },

    { h1: 'Mapa da tela (de cima para baixo)' },
    { numerada: [
      '**Cabeçalho** com Exportar PDF, Compartilhar e tema.',
      '**Letreiro e cartões resumo:** DAS do mês, DAS do ano e receita bruta.',
      '**DAS do ano:** abas de ano, valores confirmados, estimativas e os 12 meses em cartões.',
      '**Planejamento:** quanto reservar por mês e se o caixa cobre.',
      '**Cenários do DAS** e a nota sobre a Reforma Tributária, com **Salvar simulação**.',
      '**Análise Executiva Axioma** (botão Analisar).',
      '**Central de Obrigações:** DAS, DASN-SIMEI e IRPF, cada um com prazo e status.',
      '**Mapa de Consequências** e **Simulador de Parcelamento** (só quando há DAS vencido).',
      '**Histórico do Ano**, **Calculadora DASN-SIMEI** e **Documentos para o contador**.',
    ] },

    { h1: 'DAS do ano' },
    { p: 'Escolha o ano nas abas (ano passado, este ano e os dois seguintes). Cada mês tem um cartão com **Valor**, **Pago**, **Falta** e a situação: **A pagar**, **Pago**, **Pago em parte**, **Vencido**, **Estimativa** ou **Falta informar o pagamento**.' },
    { lista: [
      '**Valores confirmados:** já pago no ano (estornos descontados), falta pagar, vencido e próximo vencimento.',
      '**Estimativas:** meses que ainda não têm valor oficial (o ano seguinte, antes de sair o novo salário mínimo). A premissa da estimativa aparece escrita.',
      '**Falta informar o pagamento:** meses marcados como pagos sem valor — não contam como pago nem como dívida até você informar quanto e quando pagou.',
    ] },
    { tabela: { colunas: ['Botão no cartão do mês', 'O que faz', 'O que acontece depois'], larguras: [2400, 3600, 3026], linhas: [
      ['Pagar este DAS', 'Abre o passo a passo para pagar pela guia oficial (ver "Pagar o DAS por dentro do Axioma").', 'Ao confirmar, o mês fica Pago e a baixa vai para o Fluxo de Caixa e a Contabilidade.'],
      ['Registrar pagamento', 'Informa um pagamento já feito: data, valor, como pagou e o nº do documento (opcional).', 'O valor entra no mês. Valor acima do DAS é tratado como multa/juros.'],
      ['Detalhes', 'Lista os pagamentos do mês.', 'Em cada um: **Corrigir** (data, valor, forma) ou **Estornar**. Estornar não apaga: o original fica no histórico, marcado.'],
    ] } },
    { alerta: 'O DAS nunca é lançado como despesa operacional comum: ele vai para Impostos na Contabilidade e para o Fluxo de Caixa uma única vez. Pagar de novo com a mesma guia não duplica.' },

    { h1: 'Pagar o DAS por dentro do Axioma' },
    { numerada: [
      '**Gere a guia:** clique em **Abrir o PGMEI**, informe o CNPJ (botão **Copiar CNPJ**), marque o mês e clique em "Emitir DAS". Baixe o PDF.',
      '**Envie a guia:** clique em **Escolher arquivo** e envie o PDF ou uma foto. A inteligência do Axioma lê valor, data "pagar até", meses, código de barras e Pix.',
      '**Confira:** o Axioma confere os códigos por regra (dígito do Pix e do código de barras) e avisa se o CNPJ da guia é diferente. Leitura errada nunca vira pagamento errado.',
      '**Pague:** **Copiar Pix** ou **Copiar código de barras** e cole no app do banco; ou **Cartão de crédito (PGMEI → Pagar Online)**; ou **Pagar com Pix pelo Axioma** (em ativação).',
      '**Clique em Já paguei**, com a data e a forma de pagamento. A baixa sai com o nº da guia, e o extrato do banco reconhece sozinho.',
    ] },
    { nota: 'Cartão de crédito é aceito pela Receita desde setembro de 2025, no próprio PGMEI ("Pagar Online"). Os juros do cartão costumam ser bem maiores que o parcelamento oficial — compare antes. Cartão de débito não é aceito pelas regras oficiais que encontramos. O Pix pelo Axioma usa a Pluggy: você escolhe o banco e autoriza no app dele, e o Axioma nunca vê sua senha. Ele aparece como "em ativação" até a Pluggy liberar.' },
    { p: 'Guia com vários meses: o valor é dividido do mês mais antigo para o mais novo; o que passar dos DAS vira multa/juros.' },

    { h1: 'Planejamento e cenários' },
    { p: '**Planejamento** mostra quanto falta para quitar tudo até dezembro, a **reserva por mês** e se o caixa livre da Tesouraria cobre. É só planejamento: nenhum mês é marcado como pago.' },
    { p: '**Cenários do DAS** variam os meses que ainda não têm valor oficial: **Base (regra oficial)**, **Conservador +5%**, **Estresse +10%** ou **Personalizado** (você digita o %). Os números mudam na hora: estimativa base, neste cenário e impacto no caixa.' },
    { nota: 'Se o ano escolhido já tem todos os valores oficiais, o cenário simula sozinho o **ano seguinte** e mostra "Simulando 2027". Os percentuais são exemplos, não previsão oficial — nada altera seus dados.' },
    { p: '**Salvar simulação** guarda o cenário com nome; depois dá para **Editar**, **Duplicar** ou **Excluir**. Reforma Tributária: o Axioma não aplica aumento no DAS por conta própria; quando sair regra oficial para o MEI, ela entra com fonte e data.' },

    { h1: 'Central de Obrigações' },
    { tabela: { colunas: ['Obrigação', 'Prazo', 'Status possíveis'], larguras: [2600, 3000, 3426], linhas: [
      ['DAS mensal', 'Dia 20 do mês seguinte à competência', 'Pago, Pago em parte, A pagar, Falta informar o pagamento'],
      ['DASN-SIMEI (Declaração Anual de Faturamento)', '31 de maio', 'Pendente, Entregue, Atrasado'],
      ['IRPF da pessoa física do MEI', 'Último dia útil de maio', 'Não obrigatório, Pendente, Entregue (a tela avisa se a renda passou do limite de isenção)'],
    ] } },
    { p: 'O ✏️ ao lado do valor do DAS muda o valor usado nas outras telas do MEI. O ✏️ do status da DASN e do IRPF grava a entrega com a data.' },

    { h1: 'Atraso: Mapa de Consequências e parcelamento' },
    { lista: [
      '**Dívida atualizada hoje** e **dias em atraso** da pior competência.',
      'A **fase de risco**: Em dia, Atrasado, Multa no teto (61 dias), CNPJ inapto (12 meses) ou Dívida Ativa da União (24 meses).',
      'A **bola de neve**: "Se não pagar, sua dívida vira..."',
      'DAS em atraso suspende a contribuição ao INSS: o período não conta para aposentadoria e auxílio-doença.',
    ] },
    { nota: 'Cálculo: multa de 0,33% ao dia, limitada a 20%, mais juros pela Selic do dia. É uma estimativa; o valor oficial é o do PGMEI. No Simulador de Parcelamento, a 1ª parcela ativa o acordo e 3 parcelas atrasadas o cancelam.' },

    { h1: 'Calculadora DASN-SIMEI' },
    { tabela: { colunas: ['Parte', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['Receita Bruta do ano + Copiar', 'Soma das receitas do Faturamento que contam no limite do MEI. **Copiar** coloca o valor pronto para colar na declaração. Se houver receitas marcadas "fora do limite do MEI", aparece o aviso com quantas são, o valor e o link **Ver em Faturamento**.'],
      ['Campos da declaração + Copiar', 'A declaração pede a receita em 2 campos: **Comércio, indústria e transporte (ICMS)** e **Prestação de serviços (ISS)**. O tipo vem da categoria de cada receita ("Vendas de produtos" ou "Prestação de serviços"); sem tipo, segue a categoria do MEI. MEI "Comércio e Serviços" com receitas sem tipo mostra a linha "Sem tipo" para você dividir.'],
      ['Categoria + Alterar em Meu MEI', 'Mostra o que a categoria define: **DAS por mês**, **limite do ano** (R$ 81 mil; caminhoneiro R$ 251.600) e **lucro isento de IR** (8% comércio/indústria/transporte de cargas, 32% serviços). O botão leva ao Painel MEI para mudar.'],
      ['Abrir Portal DASN-SIMEI', 'Abre a página oficial da declaração numa nova aba. A declaração também pergunta se você teve empregado no ano.'],
    ] } },

    { h1: 'Documentos para o contador' },
    { p: 'Cada relatório baixa em **PDF** (para guardar ou enviar), **Excel** ou **CSV** (para o contador importar; os valores saem como número).' },
    { lista: [
      '**Relatório Mensal das Receitas Brutas:** mês a mês, separado por comércio/indústria/transporte e serviços, com o total e o que ficou fora do limite. O MEI deve guardar este relatório todo mês, com as notas fiscais de compra e de venda.',
      '**DAS do ano:** cada competência com vencimento, valor, pago, multa/juros, falta, data do pagamento e situação.',
      '**Receitas do ano:** a lista completa, marcando o que conta no limite do MEI.',
    ] },

    { h1: 'Passo a passo rápido' },
    { h2: 'Pagar o DAS do mês' },
    { numerada: ['Em **DAS do ano**, no cartão do mês, clique em **Pagar este DAS**.', 'Gere a guia no PGMEI, envie o PDF e confira o que foi lido.', 'Pague pelo app do banco e clique em **Já paguei**.', 'O cartão fica **Pago**; o Cockpit e o Score atualizam.'] },
    { h2: 'Entregar a declaração anual (DASN-SIMEI)' },
    { numerada: ['Na **Calculadora DASN-SIMEI**, use **Copiar** em cada campo.', 'Clique em **Abrir Portal DASN-SIMEI**, cole os valores e entregue até 31 de maio.', 'Volte e marque a DASN como **Entregue** na Central de Obrigações.'] },

    { h1: 'Ligações com outros módulos' },
    { tabela: { colunas: ['Módulo', 'Ligação'], larguras: [2800, 6226], linhas: [
      ['Painel MEI (Configurar MEI)', 'Categoria, CNPJ, dia de vencimento e data de abertura.'],
      ['Faturamento', 'Receita bruta, campos da declaração e o limite do MEI.'],
      ['Fluxo de Caixa e Contabilidade', 'Cada pagamento do DAS entra uma vez (Impostos), com rastro.'],
      ['Tesouraria', 'Caixa livre usado no Planejamento.'],
      ['Simulações', 'Os cenários salvos ficam guardados lá também.'],
      ['Axioma Nexus', 'Selic do dia usada nos juros do atraso.'],
    ] } },

    { h1: 'Quem pode fazer o quê' },
    { p: 'Quem acessa o MEI vê a tela. Registrar, corrigir e pagar exige permissão de escrita; **estornar** só dono, sócio, administrador, financeiro ou contábil. Perfis somente leitura veem tudo, mas a gravação é recusada com aviso.' },

    { h1: 'Problemas comuns e soluções' },
    { tabela: { colunas: ['Problema', 'Solução'], larguras: [3400, 5626], linhas: [
      ['Paguei e o mês continua "A pagar".', 'Clique em **Registrar pagamento** (ou **Pagar este DAS** → **Já paguei**). O Axioma só vê o pagamento quando você informa ou quando o Pix pelo Axioma é concluído.'],
      ['A Receita Bruta aparece R$ 0,00.', 'Veja o aviso abaixo dela: as receitas podem estar marcadas "fora do limite do MEI". Clique em **Ver em Faturamento** para conferir.'],
      ['A guia não foi lida.', 'Envie o PDF original ou uma foto mais nítida. Se o código não conferir, copie direto da guia.'],
      ['Cenário não muda os números.', 'Os cenários só variam meses estimados; num ano todo oficial, eles mostram o ano seguinte ("Simulando ...").'],
      ['A dívida não bate com o PGMEI.', 'O Axioma estima pela regra (0,33% ao dia até 20% + Selic). O valor oficial é sempre o do PGMEI.'],
    ] } },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '05 - MEI - DAS and Obligations.docx',
  titulo: 'Manual 05 — DAS & Obligations',
  subtitulo: 'The MEI tax calendar: DAS month by month, paying inside Axioma, scenarios, annual return, delays and documents for the accountant',
  info: ['Menu: MEI → DAS & Obligations  •  Axioma AI.Tech user manual  •  Version 3.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'This screen organizes **every MEI tax obligation**: the monthly DAS, the annual return (DASN-SIMEI) and personal income tax. It shows **what was paid, what is left and when it is due**, lets you **pay the DAS inside Axioma**, simulates scenarios, computes the cost of delays and creates **documents for the accountant** in PDF, Excel and CSV.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **MEI ▼** → **DAS & Obligations**.', 'Cockpit → **DAS & Obligations** card → **See detail**, or the "DAS due in X days / overdue" alert.', 'MEI Panel → **Quick access**.'] },

    { h1: 'The DAS rule (important)' },
    { p: 'The DAS for a month (the **period**) is due on **the 20th of the following month**. Example: the **September** DAS is due on **October 20**. That is why the "January 2026" card shows period 12/2025.' },
    { nota: 'Official 2026 amounts (minimum wage R$ 1,621): INSS R$ 81.05 (5%) + R$ 1 ICMS (trade/industry) and/or R$ 5 ISS (services). Truck driver (MEI transporter): INSS 12% = R$ 194.52. Checked on 10/10/2026; they change every year with the minimum wage.' },

    { h1: 'Screen map (top to bottom)' },
    { numerada: [
      '**Header** with Export PDF, Share and theme.',
      '**Ticker and summary cards:** month DAS, year DAS and gross revenue.',
      '**DAS for the year:** year tabs, confirmed amounts, estimates and the 12 months as cards.',
      '**Planning:** how much to set aside per month and whether cash covers it.',
      '**DAS scenarios** and the Tax Reform note, with **Save simulation**.',
      '**Axioma Executive Analysis** (Analyze button).',
      '**Obligations Center:** DAS, DASN-SIMEI and IRPF, each with deadline and status.',
      '**Consequences Map** and **Installment Simulator** (only when a DAS is overdue).',
      '**Year History**, **DASN-SIMEI Calculator** and **Documents for the accountant**.',
    ] },

    { h1: 'DAS for the year' },
    { p: 'Pick the year in the tabs (last year, this year and the next two). Each month has a card with **Amount**, **Paid**, **Left** and its status: **To pay**, **Paid**, **Partly paid**, **Overdue**, **Estimate** or **Payment details missing**.' },
    { lista: [
      '**Confirmed amounts:** paid this year (reversals removed), left to pay, overdue and next due date.',
      '**Estimates:** months without an official amount yet (next year, before the new minimum wage). The assumption is written on screen.',
      '**Payment details missing:** months marked as paid without an amount — they count neither as paid nor as debt until you enter how much and when.',
    ] },
    { tabela: { colunas: ['Button on the month card', 'What it does', 'What happens next'], larguras: [2400, 3600, 3026], linhas: [
      ['Pay this DAS', 'Opens the step-by-step to pay with the official slip (see "Paying the DAS inside Axioma").', 'Once confirmed, the month is Paid and the entry goes to Cash Flow and Accounting.'],
      ['Record payment', 'Enters a payment already made: date, amount, how you paid and the document number (optional).', 'The amount goes into the month. Anything above the DAS is treated as fine/interest.'],
      ['Details', 'Lists the month payments.', 'For each: **Fix** (date, amount, method) or **Reverse**. Reversing does not delete: the original stays in history, marked.'],
    ] } },
    { alerta: 'The DAS is never posted as a regular operating expense: it goes to Taxes in Accounting and to Cash Flow only once. Paying again with the same slip does not duplicate.' },

    { h1: 'Paying the DAS inside Axioma' },
    { numerada: [
      '**Issue the slip:** click **Open PGMEI**, enter the CNPJ (**Copy CNPJ** button), tick the month and click "Emitir DAS". Download the PDF.',
      '**Upload the slip:** click **Choose file** and send the PDF or a photo. Axioma intelligence reads amount, pay-by date, months, barcode and Pix.',
      '**Check:** Axioma checks the codes by rule (Pix and barcode check digits) and warns if the slip CNPJ is different. A wrong reading never becomes a wrong payment.',
      '**Pay:** **Copy Pix** or **Copy barcode** and paste in your bank app; or **Credit card (PGMEI → Pagar Online)**; or **Pay with Pix through Axioma** (being activated).',
      '**Click Already paid**, with the date and method. It is recorded with the slip number and the bank statement matches it automatically.',
    ] },
    { nota: 'Credit card is accepted by the Federal Revenue since September 2025 in PGMEI itself ("Pagar Online"). Card interest is usually much higher than the official installment plan — compare first. Debit card is not accepted under the official rules we found. Pix through Axioma uses Pluggy: you pick the bank and authorize in its app, and Axioma never sees your password. It shows "being activated" until Pluggy enables it.' },
    { p: 'Slip with several months: the amount is split from the oldest month to the newest; anything above the DAS becomes fine/interest.' },

    { h1: 'Planning and scenarios' },
    { p: '**Planning** shows what is left to clear everything by December, the **monthly reserve** and whether Treasury free cash covers it. It is planning only: no month is marked as paid.' },
    { p: '**DAS scenarios** vary months that have no official amount yet: **Base (official rule)**, **Conservative +5%**, **Stress +10%** or **Custom** (you type the %). Numbers change right away: base estimate, this scenario and cash impact.' },
    { nota: 'If the chosen year already has every official amount, the scenario automatically simulates the **next year** and shows "Simulating 2027". Percentages are examples, not official forecasts — nothing changes your data.' },
    { p: '**Save simulation** stores the scenario with a name; later you can **Edit**, **Duplicate** or **Delete** it. Tax Reform: Axioma does not raise the DAS on its own; when an official rule for MEI is published, it comes in with source and date.' },

    { h1: 'Obligations Center' },
    { tabela: { colunas: ['Obligation', 'Deadline', 'Possible statuses'], larguras: [2600, 3000, 3426], linhas: [
      ['Monthly DAS', '20th of the month after the period', 'Paid, Partly paid, To pay, Payment details missing'],
      ['DASN-SIMEI (Annual Revenue Declaration)', 'May 31', 'Pending, Filed, Overdue'],
      ['MEI owner personal income tax (IRPF)', 'Last business day of May', 'Not required, Pending, Filed (the screen warns if income passed the exemption limit)'],
    ] } },
    { p: 'The ✏️ next to the DAS amount changes the amount used on the other MEI screens. The ✏️ on the DASN and IRPF status records the filing with its date.' },

    { h1: 'Delays: Consequences Map and installments' },
    { lista: [
      '**Debt updated today** and **days overdue** of the worst period.',
      'The **risk stage**: Up to date, Overdue, Fine at cap (61 days), CNPJ inactive (12 months) or Federal Active Debt (24 months).',
      'The **snowball**: "If you do not pay, your debt becomes..."',
      'An overdue DAS suspends the INSS contribution: the period does not count toward retirement and sick pay.',
    ] },
    { nota: 'Calculation: 0.33% fine per day, capped at 20%, plus interest at the daily Selic. It is an estimate; the official amount is the one in PGMEI. In the Installment Simulator, the 1st installment activates the agreement and 3 late installments cancel it.' },

    { h1: 'DASN-SIMEI Calculator' },
    { tabela: { colunas: ['Part', 'What it does'], larguras: [2800, 6226], linhas: [
      ['Gross revenue for the year + Copy', 'Sum of the Revenue entries that count toward the MEI limit. **Copy** puts the value ready to paste in the declaration. If some revenues are marked "outside the MEI limit", a warning shows how many, the amount and the **See in Revenue** link.'],
      ['Declaration fields + Copy', 'The declaration asks for revenue in 2 fields: **Trade, industry and transport (ICMS)** and **Services (ISS)**. The type comes from each revenue category ("Vendas de produtos" or "Prestação de serviços"); without a type, it follows the MEI category. A "Trade and Services" MEI with untyped revenues shows a "No type" line for you to split.'],
      ['Category + Change in My MEI', 'Shows what the category sets: **DAS per month**, **yearly limit** (R$ 81k; truck driver R$ 251,600) and **income-tax free profit** (8% trade/industry/cargo transport, 32% services). The button opens the MEI Panel to change it.'],
      ['Open DASN-SIMEI Portal', 'Opens the official declaration page in a new tab. The declaration also asks whether you had an employee this year.'],
    ] } },

    { h1: 'Documents for the accountant' },
    { p: 'Each report downloads as **PDF** (to keep or send), **Excel** or **CSV** (for the accountant to import; amounts come out as numbers).' },
    { lista: [
      '**Monthly Gross Revenue Report:** month by month, split into trade/industry/transport and services, with the total and what was outside the limit. The MEI must keep this report every month, with purchase and sales invoices.',
      '**DAS for the year:** each period with due date, amount, paid, fine/interest, left, payment date and status.',
      '**Revenues for the year:** the full list, marking what counts toward the MEI limit.',
    ] },

    { h1: 'Quick step-by-step' },
    { h2: 'Paying the month DAS' },
    { numerada: ['In **DAS for the year**, on the month card, click **Pay this DAS**.', 'Issue the slip in PGMEI, upload the PDF and check what was read.', 'Pay in your bank app and click **Already paid**.', 'The card turns **Paid**; Cockpit and Score update.'] },
    { h2: 'Filing the annual return (DASN-SIMEI)' },
    { numerada: ['In the **DASN-SIMEI Calculator**, use **Copy** on each field.', 'Click **Open DASN-SIMEI Portal**, paste the values and file by May 31.', 'Come back and mark the DASN as **Filed** in the Obligations Center.'] },

    { h1: 'Links with other modules' },
    { tabela: { colunas: ['Module', 'Link'], larguras: [2800, 6226], linhas: [
      ['MEI Panel (Configure MEI)', 'Category, CNPJ, due day and opening date.'],
      ['Revenue', 'Gross revenue, declaration fields and the MEI limit.'],
      ['Cash Flow and Accounting', 'Each DAS payment goes in once (Taxes), with a trail.'],
      ['Treasury', 'Free cash used in Planning.'],
      ['Simulations', 'Saved scenarios are kept there too.'],
      ['Axioma Nexus', 'Daily Selic used for late interest.'],
    ] } },

    { h1: 'Who can do what' },
    { p: 'Anyone with MEI access sees the screen. Recording, fixing and paying require write permission; **reversing** only owner, partner, admin, finance or accounting. Read-only profiles see everything, but saving is refused with a warning.' },

    { h1: 'Common problems and solutions' },
    { tabela: { colunas: ['Problem', 'Solution'], larguras: [3400, 5626], linhas: [
      ['I paid and the month is still "To pay".', 'Click **Record payment** (or **Pay this DAS** → **Already paid**). Axioma only sees the payment when you enter it or when Pix through Axioma completes.'],
      ['Gross revenue shows R$ 0.00.', 'See the warning below it: revenues may be marked "outside the MEI limit". Click **See in Revenue** to check.'],
      ['The slip was not read.', 'Send the original PDF or a sharper photo. If a code does not check out, copy it from the slip.'],
      ['A scenario does not change the numbers.', 'Scenarios only vary estimated months; in a fully official year they show the next year ("Simulating ...").'],
      ['The debt does not match PGMEI.', 'Axioma estimates by rule (0.33% a day up to 20% + Selic). The official amount is always the one in PGMEI.'],
    ] } },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '05 - MEI - DAS y Obligaciones.docx',
  titulo: 'Manual 05 — DAS & Obligaciones',
  subtitulo: 'El calendario fiscal del MEI: DAS mes a mes, pagar dentro de Axioma, escenarios, declaración anual, atrasos y documentos para el contador',
  info: ['Menú: MEI → DAS & Obligaciones  •  Manual de uso de Axioma AI.Tech  •  Versión 3.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Esta pantalla organiza **todas las obligaciones fiscales del MEI**: el DAS de cada mes, la declaración anual (DASN-SIMEI) y el Impuesto de Renta de la persona física. Muestra **cuánto se pagó, cuánto falta y cuándo vence**, permite **pagar el DAS dentro de Axioma**, simula escenarios, calcula el costo del atraso y genera los **documentos para el contador** en PDF, Excel y CSV.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **MEI ▼** → **DAS & Obligaciones**.', 'Cockpit → tarjeta **DAS & Obligaciones** → **Ver detalle**, o la alerta "DAS vence en X días / atrasado".', 'Panel MEI → **Acceso rápido**.'] },

    { h1: 'La regla del DAS (importante)' },
    { p: 'El DAS de un mes (la **competencia**) vence el **día 20 del mes siguiente**. Ejemplo: el DAS de **septiembre** vence el **20 de octubre**. Por eso la tarjeta "Enero de 2026" muestra la competencia 12/2025.' },
    { nota: 'Valores oficiales de 2026 (salario mínimo R$ 1.621): INSS R$ 81,05 (5%) + R$ 1 de ICMS (comercio/industria) y/o R$ 5 de ISS (servicios). Camionero (MEI transportista): INSS 12% = R$ 194,52. Verificados el 10/10/2026; cambian cada año con el salario mínimo.' },

    { h1: 'Mapa de la pantalla (de arriba hacia abajo)' },
    { numerada: [
      '**Encabezado** con Exportar PDF, Compartir y tema.',
      '**Letrero y tarjetas resumen:** DAS del mes, DAS del año e ingreso bruto.',
      '**DAS del año:** pestañas de año, valores confirmados, estimaciones y los 12 meses en tarjetas.',
      '**Planificación:** cuánto reservar por mes y si la caja lo cubre.',
      '**Escenarios del DAS** y la nota sobre la Reforma Tributaria, con **Guardar simulación**.',
      '**Análisis Ejecutivo Axioma** (botón Analizar).',
      '**Central de Obligaciones:** DAS, DASN-SIMEI e IRPF, cada uno con plazo y estado.',
      '**Mapa de Consecuencias** y **Simulador de Parcelamiento** (solo con DAS vencido).',
      '**Historial del Año**, **Calculadora DASN-SIMEI** y **Documentos para el contador**.',
    ] },

    { h1: 'DAS del año' },
    { p: 'Elija el año en las pestañas (año pasado, este año y los dos siguientes). Cada mes tiene una tarjeta con **Valor**, **Pagado**, **Falta** y el estado: **A pagar**, **Pagado**, **Pagado en parte**, **Vencido**, **Estimación** o **Falta informar el pago**.' },
    { lista: [
      '**Valores confirmados:** pagado en el año (reversiones descontadas), falta pagar, vencido y próximo vencimiento.',
      '**Estimaciones:** meses aún sin valor oficial (el año siguiente, antes del nuevo salario mínimo). La premisa aparece escrita.',
      '**Falta informar el pago:** meses marcados como pagados sin valor — no cuentan como pagados ni como deuda hasta que informe cuánto y cuándo.',
    ] },
    { tabela: { colunas: ['Botón en la tarjeta del mes', 'Qué hace', 'Qué pasa después'], larguras: [2400, 3600, 3026], linhas: [
      ['Pagar este DAS', 'Abre el paso a paso para pagar con la guía oficial (vea "Pagar el DAS dentro de Axioma").', 'Al confirmar, el mes queda Pagado y el registro va al Flujo de Caja y a la Contabilidad.'],
      ['Registrar pago', 'Informa un pago ya hecho: fecha, valor, cómo pagó y el nº del documento (opcional).', 'El valor entra en el mes. Lo que pase del DAS se trata como multa/intereses.'],
      ['Detalles', 'Lista los pagos del mes.', 'En cada uno: **Corregir** (fecha, valor, forma) o **Revertir**. Revertir no borra: el original queda en el historial, marcado.'],
    ] } },
    { alerta: 'El DAS nunca se registra como gasto operativo común: va a Impuestos en la Contabilidad y al Flujo de Caja una sola vez. Pagar de nuevo con la misma guía no duplica.' },

    { h1: 'Pagar el DAS dentro de Axioma' },
    { numerada: [
      '**Genere la guía:** haga clic en **Abrir el PGMEI**, informe el CNPJ (botón **Copiar CNPJ**), marque el mes y haga clic en "Emitir DAS". Descargue el PDF.',
      '**Suba la guía:** haga clic en **Elegir archivo** y envíe el PDF o una foto. La inteligencia de Axioma lee valor, fecha "pagar hasta", meses, código de barras y Pix.',
      '**Verifique:** Axioma verifica los códigos por regla (dígito del Pix y del código de barras) y avisa si el CNPJ de la guía es diferente. Una lectura errada nunca se convierte en un pago errado.',
      '**Pague:** **Copiar Pix** o **Copiar código de barras** y pegue en la app del banco; o **Tarjeta de crédito (PGMEI → Pagar Online)**; o **Pagar con Pix por Axioma** (en activación).',
      '**Haga clic en Ya pagué**, con la fecha y la forma de pago. Se registra con el nº de la guía y el extracto del banco lo reconoce solo.',
    ] },
    { nota: 'La tarjeta de crédito es aceptada por la Receita desde septiembre de 2025 en el propio PGMEI ("Pagar Online"). Los intereses de la tarjeta suelen ser mucho mayores que el parcelamiento oficial — compare antes. La tarjeta de débito no es aceptada según las reglas oficiales encontradas. El Pix por Axioma usa Pluggy: usted elige el banco y autoriza en su app, y Axioma nunca ve su contraseña. Aparece "en activación" hasta que Pluggy lo libere.' },
    { p: 'Guía con varios meses: el valor se divide del mes más antiguo al más nuevo; lo que pase de los DAS se vuelve multa/intereses.' },

    { h1: 'Planificación y escenarios' },
    { p: '**Planificación** muestra cuánto falta para pagar todo hasta diciembre, la **reserva por mes** y si la caja libre de la Tesorería lo cubre. Es solo planificación: ningún mes se marca como pagado.' },
    { p: '**Escenarios del DAS** varían los meses aún sin valor oficial: **Base (regla oficial)**, **Conservador +5%**, **Estrés +10%** o **Personalizado** (usted escribe el %). Los números cambian al instante: estimación base, en este escenario e impacto en la caja.' },
    { nota: 'Si el año elegido ya tiene todos los valores oficiales, el escenario simula solo el **año siguiente** y muestra "Simulando 2027". Los porcentajes son ejemplos, no previsión oficial — nada altera sus datos.' },
    { p: '**Guardar simulación** guarda el escenario con nombre; después puede **Editar**, **Duplicar** o **Eliminar**. Reforma Tributaria: Axioma no aplica aumento al DAS por su cuenta; cuando salga una regla oficial para el MEI, entra con fuente y fecha.' },

    { h1: 'Central de Obligaciones' },
    { tabela: { colunas: ['Obligación', 'Plazo', 'Estados posibles'], larguras: [2600, 3000, 3426], linhas: [
      ['DAS mensual', 'Día 20 del mes siguiente a la competencia', 'Pagado, Pagado en parte, A pagar, Falta informar el pago'],
      ['DASN-SIMEI (Declaración Anual de Facturación)', '31 de mayo', 'Pendiente, Entregada, Atrasada'],
      ['IRPF de la persona física del MEI', 'Último día hábil de mayo', 'No obligatorio, Pendiente, Entregada (la pantalla avisa si la renta pasó el límite de exención)'],
    ] } },
    { p: 'El ✏️ junto al valor del DAS cambia el valor usado en las otras pantallas del MEI. El ✏️ del estado de la DASN y del IRPF registra la entrega con la fecha.' },

    { h1: 'Atraso: Mapa de Consecuencias y parcelamiento' },
    { lista: [
      '**Deuda actualizada hoy** y **días de atraso** de la peor competencia.',
      'La **fase de riesgo**: Al día, Atrasado, Multa al tope (61 días), CNPJ inapto (12 meses) o Deuda Activa de la Unión (24 meses).',
      'La **bola de nieve**: "Si no paga, su deuda se vuelve..."',
      'Un DAS atrasado suspende la contribución al INSS: el período no cuenta para jubilación ni auxilio por enfermedad.',
    ] },
    { nota: 'Cálculo: multa de 0,33% al día, limitada al 20%, más intereses por la Selic del día. Es una estimación; el valor oficial es el del PGMEI. En el Simulador de Parcelamiento, la 1ª cuota activa el acuerdo y 3 cuotas atrasadas lo cancelan.' },

    { h1: 'Calculadora DASN-SIMEI' },
    { tabela: { colunas: ['Parte', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['Ingreso bruto del año + Copiar', 'Suma de los ingresos de Facturación que cuentan en el límite del MEI. **Copiar** deja el valor listo para pegar en la declaración. Si hay ingresos marcados "fuera del límite del MEI", aparece el aviso con cuántos son, el valor y el enlace **Ver en Facturación**.'],
      ['Campos de la declaración + Copiar', 'La declaración pide el ingreso en 2 campos: **Comercio, industria y transporte (ICMS)** y **Prestación de servicios (ISS)**. El tipo viene de la categoría de cada ingreso ("Vendas de produtos" o "Prestação de serviços"); sin tipo, sigue la categoría del MEI. Un MEI "Comercio y Servicios" con ingresos sin tipo muestra la línea "Sin tipo" para que usted divida.'],
      ['Categoría + Cambiar en Mi MEI', 'Muestra lo que define la categoría: **DAS por mes**, **límite del año** (R$ 81 mil; camionero R$ 251.600) y **lucro exento de IR** (8% comercio/industria/transporte de carga, 32% servicios). El botón lleva al Panel MEI para cambiarla.'],
      ['Abrir Portal DASN-SIMEI', 'Abre la página oficial de la declaración en otra pestaña. La declaración también pregunta si tuvo empleado en el año.'],
    ] } },

    { h1: 'Documentos para el contador' },
    { p: 'Cada informe se descarga en **PDF** (para guardar o enviar), **Excel** o **CSV** (para que el contador lo importe; los valores salen como número).' },
    { lista: [
      '**Informe Mensual de Ingresos Brutos:** mes a mes, separado en comercio/industria/transporte y servicios, con el total y lo que quedó fuera del límite. El MEI debe guardar este informe cada mes, con las facturas de compra y de venta.',
      '**DAS del año:** cada competencia con vencimiento, valor, pagado, multa/intereses, falta, fecha de pago y estado.',
      '**Ingresos del año:** la lista completa, marcando lo que cuenta en el límite del MEI.',
    ] },

    { h1: 'Paso a paso rápido' },
    { h2: 'Pagar el DAS del mes' },
    { numerada: ['En **DAS del año**, en la tarjeta del mes, haga clic en **Pagar este DAS**.', 'Genere la guía en el PGMEI, suba el PDF y verifique lo leído.', 'Pague en la app del banco y haga clic en **Ya pagué**.', 'La tarjeta queda **Pagado**; el Cockpit y el Score se actualizan.'] },
    { h2: 'Entregar la declaración anual (DASN-SIMEI)' },
    { numerada: ['En la **Calculadora DASN-SIMEI**, use **Copiar** en cada campo.', 'Haga clic en **Abrir Portal DASN-SIMEI**, pegue los valores y entregue hasta el 31 de mayo.', 'Vuelva y marque la DASN como **Entregada** en la Central de Obligaciones.'] },

    { h1: 'Vínculos con otros módulos' },
    { tabela: { colunas: ['Módulo', 'Vínculo'], larguras: [2800, 6226], linhas: [
      ['Panel MEI (Configurar MEI)', 'Categoría, CNPJ, día de vencimiento y fecha de apertura.'],
      ['Facturación', 'Ingreso bruto, campos de la declaración y el límite del MEI.'],
      ['Flujo de Caja y Contabilidad', 'Cada pago del DAS entra una vez (Impuestos), con rastro.'],
      ['Tesorería', 'Caja libre usada en la Planificación.'],
      ['Simulaciones', 'Los escenarios guardados quedan también allí.'],
      ['Axioma Nexus', 'Selic del día usada en los intereses del atraso.'],
    ] } },

    { h1: 'Quién puede hacer qué' },
    { p: 'Quien accede al MEI ve la pantalla. Registrar, corregir y pagar exige permiso de escritura; **revertir** solo dueño, socio, administrador, financiero o contable. Los perfiles de solo lectura ven todo, pero la grabación se rechaza con aviso.' },

    { h1: 'Problemas comunes y soluciones' },
    { tabela: { colunas: ['Problema', 'Solución'], larguras: [3400, 5626], linhas: [
      ['Pagué y el mes sigue "A pagar".', 'Haga clic en **Registrar pago** (o **Pagar este DAS** → **Ya pagué**). Axioma solo ve el pago cuando usted lo informa o cuando el Pix por Axioma se concluye.'],
      ['El ingreso bruto aparece R$ 0,00.', 'Vea el aviso debajo: los ingresos pueden estar marcados "fuera del límite del MEI". Haga clic en **Ver en Facturación** para revisar.'],
      ['La guía no se leyó.', 'Envíe el PDF original o una foto más nítida. Si un código no confiere, cópielo de la guía.'],
      ['El escenario no cambia los números.', 'Los escenarios solo varían meses estimados; en un año todo oficial muestran el año siguiente ("Simulando ...").'],
      ['La deuda no coincide con el PGMEI.', 'Axioma estima por regla (0,33% al día hasta 20% + Selic). El valor oficial es siempre el del PGMEI.'],
    ] } },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
