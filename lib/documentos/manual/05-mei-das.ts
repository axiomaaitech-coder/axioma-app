// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '05 - MEI - DAS e Obrigacoes.docx',
  titulo: 'Manual 05 — DAS & Obrigações',
  subtitulo: 'O calendário fiscal do MEI: DAS mensal, declaração anual, Imposto de Renda, atrasos e parcelamento',
  info: ['Menu: MEI → DAS & Obrigações  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Esta tela organiza **todas as obrigações fiscais do MEI**: o DAS mensal, a declaração anual (DASN-SIMEI) e o Imposto de Renda da pessoa física. Mostra o que está em dia, o que está atrasado, **quanto custa o atraso hoje** e ajuda a simular um parcelamento. É aqui que você marca o que já pagou ou entregou — o Painel MEI, o Cockpit e o Score de Saúde leem esses status.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **MEI ▼** → **DAS & Obrigações**.', 'Cockpit → cartão **DAS & Obrigações** → **Ver detalhe**, ou o alerta "DAS vence em X dias / atrasado".', 'Painel MEI → **Acesso rápido**.'] },

    { h1: 'A regra do DAS (importante)' },
    { p: 'O DAS de um mês (a **competência**) vence no **dia 20 do mês seguinte**. Exemplo: o DAS de **setembro** vence em **20 de outubro**. Por isso, "o DAS deste mês" na tela é sempre o da competência do mês anterior. Se o dia de vencimento configurado no Painel MEI for outro, o Axioma usa o seu.' },
    { nota: 'Prazos usados pelo Axioma: DAS — dia 20 do mês seguinte à competência; DASN-SIMEI — 31 de maio; Imposto de Renda da pessoa física — último dia útil de maio (regra da Receita desde 2023, calculada sozinha a cada ano).' },

    { h1: 'Mapa da tela (de cima para baixo)' },
    { numerada: [
      '**Cabeçalho** com Exportar PDF, Compartilhar e tema.',
      '**Letreiro** com o DAS, a situação e a dívida.',
      '**Cartões resumo:** valor do DAS, situação e dívida atualizada.',
      '**Mapa de Consequências — DAS em Atraso** (só quando há DAS vencido e não pago).',
      '**Simulador de Parcelamento (PGMEI)** (só quando há atraso).',
      '**Análise Executiva Axioma** (botão Analisar).',
      '**Central de Obrigações:** DAS, DASN-SIMEI e IRPF, cada um com prazo e status.',
      '**Histórico do Ano:** a situação do DAS de cada competência.',
      '**Calculadora DASN-SIMEI** com o link para o portal oficial.',
    ] },

    { h1: 'Botões e ações' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2400, 3600, 3026], linhas: [
      ['Exportar PDF', 'Gera o PDF das obrigações e da dívida.', 'O arquivo é baixado. Nada é alterado.'],
      ['Compartilhar', 'Abre o Centro de Compartilhamento com o resumo.', 'Você escolhe o canal e envia.'],
      ['✏️ ao lado do valor do DAS', 'Abre o campo para mudar o valor do boleto.', '✓ grava (vale para todas as telas do MEI); ✕ cancela. Valor inválido mostra aviso e nada é gravado.'],
      ['✏️ ao lado do status (DAS, DASN, IRPF)', 'Mostra as opções de status.', 'Clicar numa opção grava na hora ("Obrigação atualizada.") com a data de entrega quando for "Entregue". O Cockpit e o Score passam a ler o novo status.'],
      ['Arraste "Número de parcelas"', 'Simula o parcelamento da dívida.', 'Mostra o valor de cada parcela. Não grava nada nem pede parcelamento.'],
      ['Abrir Portal do Simples Nacional (PGMEI)', 'Abre o site oficial da Receita numa nova aba.', 'É lá que se emite o DAS e se pede o parcelamento de verdade.'],
      ['Analisar', 'Pede à inteligência do Axioma uma análise da sua situação com prioridades.', 'Mostra "Analisando..." e o texto; sem inteligência, aparece uma análise por regras. Nada é gravado.'],
      ['Abrir Portal DASN-SIMEI', 'Abre a página oficial da declaração anual numa nova aba.', 'Use a Receita Bruta e a Categoria mostradas na calculadora para preencher.'],
    ] } },

    { h1: 'O que cada parte mostra' },
    { h2: 'Mapa de Consequências — DAS em Atraso' },
    { lista: [
      '**Dívida atualizada hoje** (todas as competências vencidas e não pagas) e **dias em atraso** da pior delas.',
      'A **fase de risco**: Em dia, Atrasado, Multa no teto (61 dias), CNPJ inapto (12 meses) ou Dívida Ativa da União (24 meses).',
      'Uma **linha do tempo** com esses marcos e o "Hoje" marcado.',
      'A **bola de neve**: "Se não pagar, sua dívida vira..." projetando o valor futuro.',
      'O aviso de que DAS em atraso suspende a contribuição ao INSS: o período não conta para aposentadoria e auxílio-doença.',
    ] },
    { nota: 'Cálculo: multa de 0,33% ao dia, limitada a 20%, mais juros pela Selic do dia (a mesma usada no Painel MEI e no Cockpit). É uma estimativa pelas regras vigentes; o valor oficial é o do PGMEI.' },
    { h2: 'Simulador de Parcelamento (PGMEI)' },
    { lista: ['A 1ª parcela precisa ser paga para ativar o acordo.', '3 parcelas atrasadas cancelam o acordo e a dívida volta inteira, com juros.'] },
    { h2: 'Central de Obrigações' },
    { tabela: { colunas: ['Obrigação', 'Prazo', 'Status possíveis'], larguras: [2600, 3000, 3426], linhas: [
      ['DAS mensal', 'Dia 20 do mês seguinte à competência', 'Pendente, Entregue, Atrasado'],
      ['DASN-SIMEI (Declaração Anual de Faturamento)', '31 de maio', 'Pendente, Entregue, Atrasado'],
      ['IRPF da pessoa física do MEI', 'Último dia útil de maio', 'Não obrigatório, Pendente, Entregue (a tela avisa se a renda passou do limite de isenção)'],
    ] } },
    { p: 'Cada obrigação mostra quantos dias faltam ou quantos dias está em atraso.' },
    { h2: 'Histórico do Ano' },
    { p: 'Grade com cada competência do ano que já venceu e a situação do DAS. É a mesma lista usada no cálculo da dívida e no Cockpit — por isso os números sempre batem entre as telas. Se nenhuma venceu ainda, aparece "Ainda não há competência de DAS vencida este ano."' },
    { h2: 'Calculadora DASN-SIMEI' },
    { p: 'Mostra a **Receita Bruta** do ano (a mesma do Faturamento) e a **Categoria** — os números pedidos na declaração anual.' },

    { h1: 'Passo a passo' },
    { h2: 'Depois de pagar o DAS' },
    { numerada: ['Na Central de Obrigações, clique no ✏️ do status do DAS.', 'Escolha **Entregue**.', 'Aparece "Obrigação atualizada."; o alerta do Cockpit some e o Score Fiscal melhora.'] },
    { h2: 'Regularizar DAS atrasado' },
    { numerada: [
      'Veja no **Mapa de Consequências** a dívida de hoje e a fase de risco.',
      'Simule as parcelas no **Simulador de Parcelamento**.',
      'Clique em **Abrir Portal do Simples Nacional (PGMEI)** e faça o pagamento ou o parcelamento lá.',
      'Volte e marque cada competência paga como **Entregue**.',
    ] },
    { h2: 'Entregar a declaração anual (DASN-SIMEI)' },
    { numerada: ['Confira a Receita Bruta e a Categoria na **Calculadora DASN-SIMEI**.', 'Clique em **Abrir Portal DASN-SIMEI** e entregue até 31 de maio.', 'Volte e marque a DASN como **Entregue**.'] },

    { h1: 'Ligações com outros módulos' },
    { tabela: { colunas: ['Módulo', 'Ligação'], larguras: [2800, 6226], linhas: [
      ['Painel MEI (Configurar MEI)', 'Valor do DAS, dia de vencimento e data de abertura.'],
      ['Faturamento / Receitas', 'Receita Bruta da calculadora DASN.'],
      ['Cockpit e Score de Saúde', 'Leem os status gravados aqui.'],
      ['Axioma Nexus', 'Selic do dia usada nos juros do atraso (mesma em todo o Axioma).'],
      ['Imposto de Renda (Manual 09)', 'Detalha se a declaração do IRPF é obrigatória.'],
    ] } },

    { h1: 'Quem pode fazer o quê' },
    { p: 'Quem acessa o MEI vê a tela. Mudar o valor do DAS e os status exige permissão de escrita; perfis somente leitura veem tudo, mas a gravação é recusada com aviso.' },

    { h1: 'Problemas comuns e soluções' },
    { tabela: { colunas: ['Problema', 'Solução'], larguras: [3400, 5626], linhas: [
      ['Paguei o DAS e a tela diz que está atrasado.', 'Marque a competência como Entregue na Central de Obrigações. O Axioma não vê o pagamento no banco sozinho.'],
      ['A dívida não bate com o valor do PGMEI.', 'O Axioma estima pela regra (0,33% ao dia até 20% + Selic). O valor oficial para pagar é sempre o do PGMEI.'],
      ['Mudei o valor do DAS e o Painel MEI mostra o antigo.', 'Recarregue o Painel: o valor é o mesmo para todas as telas do MEI.'],
      ['O IRPF aparece como "Não obrigatório" mas tenho dúvida.', 'Abra MEI → Imposto de Renda (Manual 09): a tela calcula a renda tributável e diz se a declaração é obrigatória.'],
    ] } },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '05 - MEI - DAS and Obligations.docx',
  titulo: 'Manual 05 — DAS & Obligations',
  subtitulo: 'The MEI tax calendar: monthly DAS, annual return, income tax, delays and installments',
  info: ['Menu: MEI → DAS & Obligations  •  Axioma AI.Tech user manual  •  Version 2.0'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'This screen organizes **all of the MEI\'s tax obligations**: the monthly DAS (the MEI tax slip), the annual return (DASN-SIMEI) and personal income tax. It shows what is up to date, what is overdue, **how much the delay costs today** and helps simulate an installment plan. This is where you mark what you have paid or filed — the MEI Dashboard, the Cockpit and the Health Score read these statuses.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **MEI ▼** → **DAS & Obligations**.', 'Cockpit → **DAS & Obligations** card → **See detail**, or the "DAS due in X days / overdue" alert.', 'MEI Dashboard → **Quick access**.'] },

    { h1: 'The DAS rule (important)' },
    { p: 'The DAS of a month (the **competence**) is due on **the 20th of the following month**. Example: the **September** DAS is due on **October 20**. That is why "this month\'s DAS" on screen is always the previous month\'s competence. If the due day set in the MEI Dashboard is different, Axioma uses yours.' },
    { nota: 'Deadlines used by Axioma: DAS — the 20th of the month after the competence; DASN-SIMEI — May 31; personal income tax — last business day of May (the tax authority\'s rule since 2023, calculated automatically each year).' },

    { h1: 'Screen map (top to bottom)' },
    { numerada: [
      '**Header** with Export PDF, Share and theme.',
      '**Ticker** with the DAS, the status and the debt.',
      '**Summary cards:** DAS amount, status and updated debt.',
      '**Consequences Map — Overdue DAS** (only when there is an overdue unpaid DAS).',
      '**Installment Simulator (PGMEI)** (only when there is a delay).',
      '**Axioma Executive Analysis** (Analyze button).',
      '**Obligations Center:** DAS, DASN-SIMEI and income tax, each with a deadline and status.',
      '**Year History:** the DAS status of each competence.',
      '**DASN-SIMEI Calculator** with the link to the official portal.',
    ] },

    { h1: 'Buttons and actions' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2400, 3600, 3026], linhas: [
      ['Export PDF', 'Generates the PDF of obligations and debt.', 'The file is downloaded. Nothing is changed.'],
      ['Share', 'Opens the Sharing Center with the summary.', 'You choose the channel and send.'],
      ['✏️ next to the DAS amount', 'Opens the field to change the slip amount.', '✓ saves (applies to every MEI screen); ✕ cancels. An invalid amount shows a notice and nothing is saved.'],
      ['✏️ next to the status (DAS, DASN, IRPF)', 'Shows the status options.', 'Clicking an option saves immediately ("Obligation updated.") with the filing date when it is "Filed". The Cockpit and the Score read the new status.'],
      ['Drag "Number of installments"', 'Simulates paying the debt in installments.', 'Shows each installment amount. It saves nothing and does not request an installment plan.'],
      ['Open Simples Nacional Portal (PGMEI)', 'Opens the official tax authority site in a new tab.', 'That is where the DAS is issued and the installment plan is actually requested.'],
      ['Analyze', 'Asks Axioma\'s intelligence for an analysis of your situation with priorities.', 'Shows "Analyzing..." and the text; without the intelligence, a rule-based analysis appears. Nothing is saved.'],
      ['Open DASN-SIMEI Portal', 'Opens the official annual return page in a new tab.', 'Use the Gross Revenue and Category shown in the calculator to fill it in.'],
    ] } },

    { h1: 'What each part shows' },
    { h2: 'Consequences Map — Overdue DAS' },
    { lista: [
      '**Debt updated today** (all overdue unpaid competences) and **days overdue** of the worst one.',
      'The **risk phase**: Up to date, Overdue, Fine at cap (61 days), CNPJ unfit (12 months) or Federal active debt (24 months).',
      'A **timeline** with these milestones and "Today" marked.',
      'The **snowball**: "If you don\'t pay, your debt becomes..." projecting the future amount.',
      'The notice that an overdue DAS suspends the social security (INSS) contribution: the period does not count toward retirement or sick pay.',
    ] },
    { nota: 'Calculation: a fine of 0.33% per day, capped at 20%, plus interest at the day\'s Selic rate (the same used on the MEI Dashboard and Cockpit). It is an estimate under current rules; the official amount is the one in PGMEI.' },
    { h2: 'Installment Simulator (PGMEI)' },
    { lista: ['The 1st installment must be paid to activate the agreement.', '3 late installments cancel the agreement and the full debt returns, with interest.'] },
    { h2: 'Obligations Center' },
    { tabela: { colunas: ['Obligation', 'Deadline', 'Possible statuses'], larguras: [2600, 3000, 3426], linhas: [
      ['Monthly DAS', 'The 20th of the month after the competence', 'Pending, Filed, Overdue'],
      ['DASN-SIMEI (Annual Revenue Declaration)', 'May 31', 'Pending, Filed, Overdue'],
      ['The MEI owner\'s personal income tax (IRPF)', 'Last business day of May', 'Not required, Pending, Filed (the screen warns if income exceeded the exemption limit)'],
    ] } },
    { p: 'Each obligation shows how many days are left or how many days it is overdue.' },
    { h2: 'Year History' },
    { p: 'A grid with each competence of the year that is already due and its DAS status. It is the same list used in the debt calculation and in the Cockpit — so the figures always match across screens. If none is due yet, "No DAS competence due this year yet" appears.' },
    { h2: 'DASN-SIMEI Calculator' },
    { p: 'Shows the year\'s **Gross Revenue** (the same as in Revenue) and the **Category** — the figures asked for in the annual return.' },

    { h1: 'Step by step' },
    { h2: 'After paying the DAS' },
    { numerada: ['In the Obligations Center, click the ✏️ next to the DAS status.', 'Choose **Filed**.', '"Obligation updated." appears; the Cockpit alert disappears and the Tax Score improves.'] },
    { h2: 'Settle an overdue DAS' },
    { numerada: [
      'Check today\'s debt and the risk phase in the **Consequences Map**.',
      'Simulate the installments in the **Installment Simulator**.',
      'Click **Open Simples Nacional Portal (PGMEI)** and pay or request the installment plan there.',
      'Come back and mark each paid competence as **Filed**.',
    ] },
    { h2: 'File the annual return (DASN-SIMEI)' },
    { numerada: ['Check the Gross Revenue and Category in the **DASN-SIMEI Calculator**.', 'Click **Open DASN-SIMEI Portal** and file by May 31.', 'Come back and mark the DASN as **Filed**.'] },

    { h1: 'Links with other modules' },
    { tabela: { colunas: ['Module', 'Link'], larguras: [2800, 6226], linhas: [
      ['MEI Dashboard (Configure MEI)', 'DAS amount, due day and opening date.'],
      ['Revenue', 'Gross Revenue in the DASN calculator.'],
      ['Cockpit and Health Score', 'Read the statuses saved here.'],
      ['Axioma Nexus', 'The day\'s Selic rate used in late interest (the same across Axioma).'],
      ['Income Tax (Manual 09)', 'Details whether the income tax return is required.'],
    ] } },

    { h1: 'Who can do what' },
    { p: 'Anyone with MEI access sees the screen. Changing the DAS amount and statuses requires write permission; read-only profiles see everything, but saving is refused with a notice.' },

    { h1: 'Common problems and solutions' },
    { tabela: { colunas: ['Problem', 'Solution'], larguras: [3400, 5626], linhas: [
      ['I paid the DAS and the screen says it is overdue.', 'Mark the competence as Filed in the Obligations Center. Axioma does not see the bank payment on its own.'],
      ['The debt does not match the PGMEI amount.', 'Axioma estimates by the rule (0.33% per day up to 20% + Selic). The official amount to pay is always the one in PGMEI.'],
      ['I changed the DAS amount and the MEI Dashboard shows the old one.', 'Reload the Dashboard: the amount is the same for every MEI screen.'],
      ['Income tax shows "Not required" but I am unsure.', 'Open MEI → Income Tax (Manual 09): it calculates taxable income and tells you whether the return is required.'],
    ] } },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '05 - MEI - DAS y Obligaciones.docx',
  titulo: 'Manual 05 — DAS & Obligaciones',
  subtitulo: 'El calendario fiscal del MEI: DAS mensual, declaración anual, impuesto a la renta, atrasos y pago en cuotas',
  info: ['Menú: MEI → DAS & Obligaciones  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Esta pantalla organiza **todas las obligaciones fiscales del MEI**: el DAS mensual (la boleta de impuestos del MEI), la declaración anual (DASN-SIMEI) y el impuesto a la renta de la persona física. Muestra lo que está al día, lo que está atrasado, **cuánto cuesta el atraso hoy** y ayuda a simular un pago en cuotas. Aquí usted marca lo que ya pagó o entregó — el Panel MEI, el Cockpit y el Score de Salud leen esos estados.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **MEI ▼** → **DAS & Obligaciones**.', 'Cockpit → tarjeta **DAS & Obligaciones** → **Ver detalle**, o la alerta "DAS vence en X días / atrasado".', 'Panel MEI → **Acceso rápido**.'] },

    { h1: 'La regla del DAS (importante)' },
    { p: 'El DAS de un mes (la **competencia**) vence el **día 20 del mes siguiente**. Ejemplo: el DAS de **septiembre** vence el **20 de octubre**. Por eso, "el DAS de este mes" en la pantalla es siempre el de la competencia del mes anterior. Si el día de vencimiento configurado en el Panel MEI es otro, Axioma usa el suyo.' },
    { nota: 'Plazos usados por Axioma: DAS — día 20 del mes siguiente a la competencia; DASN-SIMEI — 31 de mayo; impuesto a la renta de la persona física — último día hábil de mayo (regla de la Receita Federal desde 2023, calculada automáticamente cada año).' },

    { h1: 'Mapa de la pantalla (de arriba abajo)' },
    { numerada: [
      '**Encabezado** con Exportar PDF, Compartir y tema.',
      '**Marquesina** con el DAS, la situación y la deuda.',
      '**Tarjetas de resumen:** valor del DAS, situación y deuda actualizada.',
      '**Mapa de Consecuencias — DAS Atrasado** (solo cuando hay DAS vencido y no pagado).',
      '**Simulador de Cuotas (PGMEI)** (solo cuando hay atraso).',
      '**Análisis Ejecutivo Axioma** (botón Analizar).',
      '**Central de Obligaciones:** DAS, DASN-SIMEI e IRPF, cada uno con plazo y estado.',
      '**Historial del Año:** la situación del DAS de cada competencia.',
      '**Calculadora DASN-SIMEI** con el enlace al portal oficial.',
    ] },

    { h1: 'Botones y acciones' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2400, 3600, 3026], linhas: [
      ['Exportar PDF', 'Genera el PDF de las obligaciones y la deuda.', 'El archivo se descarga. Nada se altera.'],
      ['Compartir', 'Abre el Centro de Compartir con el resumen.', 'Usted elige el canal y envía.'],
      ['✏️ junto al valor del DAS', 'Abre el campo para cambiar el valor de la boleta.', '✓ graba (vale para todas las pantallas del MEI); ✕ cancela. Un valor inválido muestra aviso y nada se graba.'],
      ['✏️ junto al estado (DAS, DASN, IRPF)', 'Muestra las opciones de estado.', 'Hacer clic en una opción graba al instante ("Obligación actualizada.") con la fecha de entrega cuando es "Entregado". El Cockpit y el Score leen el nuevo estado.'],
      ['Arrastre "Número de cuotas"', 'Simula el pago de la deuda en cuotas.', 'Muestra el valor de cada cuota. No graba nada ni solicita el pago en cuotas.'],
      ['Abrir Portal del Simples Nacional (PGMEI)', 'Abre el sitio oficial de la Receita Federal en una nueva pestaña.', 'Allí se emite el DAS y se solicita de verdad el pago en cuotas.'],
      ['Analizar', 'Pide a la inteligencia de Axioma un análisis de su situación con prioridades.', 'Muestra "Analizando..." y el texto; sin la inteligencia, aparece un análisis por reglas. Nada se graba.'],
      ['Abrir Portal DASN-SIMEI', 'Abre la página oficial de la declaración anual en una nueva pestaña.', 'Use los Ingresos Brutos y la Categoría de la calculadora para completarla.'],
    ] } },

    { h1: 'Qué muestra cada parte' },
    { h2: 'Mapa de Consecuencias — DAS Atrasado' },
    { lista: [
      '**Deuda actualizada hoy** (todas las competencias vencidas y no pagadas) y **días de atraso** de la peor de ellas.',
      'La **fase de riesgo**: Al día, Atrasado, Multa en el tope (61 días), CNPJ inapto (12 meses) o Deuda Activa de la Unión (24 meses).',
      'Una **línea de tiempo** con esos hitos y el "Hoy" marcado.',
      'La **bola de nieve**: "Si no paga, su deuda se convierte en..." proyectando el valor futuro.',
      'El aviso de que el DAS atrasado suspende la contribución al INSS: el período no cuenta para jubilación ni subsidio por enfermedad.',
    ] },
    { nota: 'Cálculo: multa del 0,33% por día, limitada al 20%, más intereses según la Selic del día (la misma usada en el Panel MEI y el Cockpit). Es una estimación según las reglas vigentes; el valor oficial es el del PGMEI.' },
    { h2: 'Simulador de Cuotas (PGMEI)' },
    { lista: ['La 1ª cuota debe pagarse para activar el acuerdo.', '3 cuotas atrasadas cancelan el acuerdo y la deuda vuelve completa, con intereses.'] },
    { h2: 'Central de Obligaciones' },
    { tabela: { colunas: ['Obligación', 'Plazo', 'Estados posibles'], larguras: [2600, 3000, 3426], linhas: [
      ['DAS mensual', 'Día 20 del mes siguiente a la competencia', 'Pendiente, Entregado, Atrasado'],
      ['DASN-SIMEI (Declaración Anual de Facturación)', '31 de mayo', 'Pendiente, Entregado, Atrasado'],
      ['Impuesto a la renta (IRPF) de la persona física del MEI', 'Último día hábil de mayo', 'No obligatorio, Pendiente, Entregado (la pantalla avisa si la renta superó el límite de exención)'],
    ] } },
    { p: 'Cada obligación muestra cuántos días faltan o cuántos días lleva de atraso.' },
    { h2: 'Historial del Año' },
    { p: 'Cuadrícula con cada competencia del año ya vencida y la situación del DAS. Es la misma lista usada en el cálculo de la deuda y en el Cockpit — por eso los números siempre coinciden entre pantallas. Si todavía no venció ninguna, aparece "Aún no hay competencia de DAS vencida este año."' },
    { h2: 'Calculadora DASN-SIMEI' },
    { p: 'Muestra los **Ingresos Brutos** del año (los mismos de Facturación) y la **Categoría** — los números pedidos en la declaración anual.' },

    { h1: 'Paso a paso' },
    { h2: 'Después de pagar el DAS' },
    { numerada: ['En la Central de Obligaciones, haga clic en el ✏️ del estado del DAS.', 'Elija **Entregado**.', 'Aparece "Obligación actualizada."; la alerta del Cockpit desaparece y el Score Fiscal mejora.'] },
    { h2: 'Regularizar DAS atrasado' },
    { numerada: [
      'Vea en el **Mapa de Consecuencias** la deuda de hoy y la fase de riesgo.',
      'Simule las cuotas en el **Simulador de Cuotas**.',
      'Haga clic en **Abrir Portal del Simples Nacional (PGMEI)** y pague o solicite las cuotas allí.',
      'Vuelva y marque cada competencia pagada como **Entregado**.',
    ] },
    { h2: 'Entregar la declaración anual (DASN-SIMEI)' },
    { numerada: ['Revise los Ingresos Brutos y la Categoría en la **Calculadora DASN-SIMEI**.', 'Haga clic en **Abrir Portal DASN-SIMEI** y entréguela hasta el 31 de mayo.', 'Vuelva y marque la DASN como **Entregado**.'] },

    { h1: 'Conexiones con otros módulos' },
    { tabela: { colunas: ['Módulo', 'Conexión'], larguras: [2800, 6226], linhas: [
      ['Panel MEI (Configurar MEI)', 'Valor del DAS, día de vencimiento y fecha de apertura.'],
      ['Facturación / Ingresos', 'Ingresos Brutos de la calculadora DASN.'],
      ['Cockpit y Score de Salud', 'Leen los estados grabados aquí.'],
      ['Axioma Nexus', 'Selic del día usada en los intereses del atraso (la misma en todo Axioma).'],
      ['Impuesto a la Renta (Manual 09)', 'Detalla si la declaración del IRPF es obligatoria.'],
    ] } },

    { h1: 'Quién puede hacer qué' },
    { p: 'Quien accede al MEI ve la pantalla. Cambiar el valor del DAS y los estados exige permiso de escritura; los perfiles de solo lectura ven todo, pero la grabación se rechaza con aviso.' },

    { h1: 'Problemas comunes y soluciones' },
    { tabela: { colunas: ['Problema', 'Solución'], larguras: [3400, 5626], linhas: [
      ['Pagué el DAS y la pantalla dice que está atrasado.', 'Marque la competencia como Entregado en la Central de Obligaciones. Axioma no ve el pago en el banco por sí solo.'],
      ['La deuda no coincide con el valor del PGMEI.', 'Axioma estima por la regla (0,33% por día hasta 20% + Selic). El valor oficial a pagar es siempre el del PGMEI.'],
      ['Cambié el valor del DAS y el Panel MEI muestra el anterior.', 'Recargue el Panel: el valor es el mismo para todas las pantallas del MEI.'],
      ['El IRPF aparece como "No obligatorio" pero tengo dudas.', 'Abra MEI → Impuesto a la Renta (Manual 09): calcula la renta tributable y dice si la declaración es obligatoria.'],
    ] } },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
