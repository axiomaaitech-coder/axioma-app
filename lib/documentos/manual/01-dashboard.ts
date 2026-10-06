// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '01 - Dashboard.docx',
  titulo: 'Manual 01 — Dashboard',
  subtitulo: 'A visão geral da empresa em uma tela: financeiro, comercial e atalhos para todos os módulos',
  info: ['Menu: Dashboard (primeiro cartão do menu do topo)  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Dashboard é a primeira tela depois do login. Ele junta, em um só lugar, os números mais importantes de todos os módulos: receita, custos, sobra do mês, dívidas, metas, clientes, recebíveis, inadimplência e investimentos. Serve para você saber, em poucos segundos, **como a empresa está** e onde precisa olhar com mais atenção. Cada número leva, com um clique, à tela de onde ele vem.' },
    { nota: 'O Dashboard só mostra dados reais da sua empresa. Para ver como ele fica com dados, use o botão **Ver demonstração** (dados fictícios, claramente marcados, que nunca são gravados).' },

    { h1: 'Como chegar' },
    { lista: [
      'Clique em **Dashboard** no menu do topo (primeiro cartão, com o ícone de casinha).',
      'Clique no logo do Axioma no canto do menu.',
      'Ele também é a tela que abre logo depois de entrar no sistema.',
    ] },

    { h1: 'Antes de começar' },
    { p: 'O Dashboard não tem cadastro próprio: ele lê os outros módulos. Para os cartões saírem do zero, cadastre pelo menos:' },
    { tabela: { colunas: ['Para ver', 'Cadastre em'], larguras: [3000, 6026], linhas: [
      ['Receita Total e gráfico de Receita', 'Financeiro → Receitas (Manual 10)'],
      ['Custos Fixos', 'Financeiro → Custos Fixos (Manual 11)'],
      ['Custos Variáveis', 'Financeiro → Custos Variáveis (Manual 12)'],
      ['Dívida Total e gráfico de Endividamento', 'Financeiro → Endividamento (Manual 15)'],
      ['Metas', 'Crescimento → Metas (Manual 22)'],
      ['Clientes Ativos e Novos Clientes', 'Comercial → Clientes (Manual 26)'],
      ['A Receber e Inadimplência', 'Comercial → Contas a Receber (Manual 30)'],
      ['Investimentos', 'Crescimento → Investimentos (Manual 23)'],
    ] } },

    { h1: 'Mapa da tela (de cima para baixo)' },
    { numerada: [
      '**Boas-vindas:** vídeo de fundo com o logo do Axioma, a saudação (Bom dia / Boa tarde / Boa noite + o seu primeiro nome), o nome da empresa ativa e os botões Compartilhar, PDF e tema.',
      '**Letreiro "Dashboard Financeiro":** título da primeira parte.',
      '**Dashboard Financeiro:** botão Ver demonstração, cinco cartões (Receita Total, Custos Fixos, Custos Variáveis, Saldo em Caixa, Dívida Total), o letreiro com os números em movimento e o painel **Análise Financeira Anual** com cinco gráficos.',
      '**Letreiro "Dashboard Comercial":** título da segunda parte.',
      '**Dashboard Comercial & Crescimento:** botão Ver demonstração, cinco cartões (Metas Cadastradas, Clientes Ativos, A Receber, Inadimplência, Investimentos), letreiro e o painel **Análise Comercial & Crescimento** com cinco gráficos.',
      '**Módulos Axioma:** doze atalhos para os módulos mais usados.',
    ] },

    { h1: 'Botões e ações' },
    { tabela: { colunas: ['Botão', 'Onde fica', 'O que faz', 'O que acontece depois'], larguras: [1800, 1700, 2900, 2626], linhas: [
      ['Compartilhar', 'Boas-vindas (canto direito)', 'Abre o Centro de Compartilhamento com o resumo: empresa, Score 360°, receita, lucro e margem.', 'Você escolhe WhatsApp, Telegram, Gmail, Outlook, E-mail, Copiar ou PDF. Nada é enviado sem você confirmar no aplicativo escolhido.'],
      ['📄 PDF', 'Boas-vindas', 'Gera o PDF "axioma-dashboard.pdf" com receita, custos, lucro, margem, o Score 360° e a nota de cada dimensão do score.', 'O arquivo é baixado. Enquanto gera, o botão mostra "Gerando...". Nenhum dado é alterado.'],
      ['Tema (Escuro / Claro)', 'Boas-vindas', 'Troca a aparência da tela.', 'A escolha fica guardada neste navegador.'],
      ['Ver demonstração / Ver meus dados', 'Topo de cada parte (Financeiro e Comercial)', 'Liga ou desliga os dados fictícios daquela parte.', 'Aparece a faixa "MODO DEMONSTRAÇÃO — dados fictícios, não são da sua empresa" e o selo DEMO nos cartões. Clique em Ver meus dados para voltar. Nada é gravado.'],
      ['Cartões de indicadores', 'Dashboard Financeiro e Comercial', 'Cada cartão é clicável.', 'Abre o módulo de origem do número (veja as tabelas abaixo).'],
      ['Ver módulo →', 'Canto de cada gráfico', 'Atalho para a tela de origem do gráfico.', 'Abre o módulo correspondente.'],
      ['Atalhos "Módulos Axioma"', 'Fim da tela', 'Receitas, Custos Fixos, Custos Variáveis, DRE, Fluxo, Clientes, Relatórios, Empresa, IA Financeira, IA Tributária, Fornecedores e MEI.', 'Abre o módulo clicado.'],
    ] } },
    { nota: 'No celular, os botões Compartilhar e PDF do topo ficam escondidos para não cobrir a saudação. Use um computador ou tablet para exportar o Dashboard.' },

    { h1: 'Dashboard Financeiro — o que cada número significa' },
    { tabela: { colunas: ['Cartão', 'Como é calculado', 'Ao clicar abre'], larguras: [2000, 4826, 2200], linhas: [
      ['Receita Total', 'Soma das receitas lançadas **no mês atual** (do dia 1 ao último dia do mês).', 'Receitas'],
      ['Custos Fixos', 'Soma do valor mensal de **todos os custos fixos cadastrados**.', 'Custos Fixos'],
      ['Custos Variáveis', '**Média mensal** dos custos variáveis dos últimos 12 meses.', 'Custos Variáveis'],
      ['Saldo em Caixa', 'Receita do mês **menos** custos fixos **menos** custos variáveis do mês. É a **sobra estimada do mês**, não o saldo do banco.', 'Fluxo de Caixa'],
      ['Dívida Total', 'Saldo devedor de todas as dívidas: valor total menos o que já foi pago.', 'Endividamento'],
    ] } },
    { alerta: 'O cartão **Saldo em Caixa** mostra quanto sobra no mês pelo que foi lançado. O saldo real da conta bancária está em **Tesouraria** e em **Fluxo de Caixa** (e vem do banco quando ele está conectado em Open Finance).' },
    { h2: 'Painel Análise Financeira Anual' },
    { tabela: { colunas: ['Gráfico', 'O que mostra', 'Quando aparece vazio'], larguras: [2000, 4326, 2700], linhas: [
      ['Endividamento', 'Rosca com quanto da dívida já foi **Pago** e quanto é **Saldo Devedor**.', '"Nenhuma dívida cadastrada ainda"'],
      ['Custos Fixos', 'Barras com o valor mensal de cada **categoria** de custo fixo (aluguel, pessoal, sistemas...).', '"Nenhum custo fixo cadastrado ainda"'],
      ['Custos Variáveis', 'Barras com os custos variáveis de cada um dos **últimos 12 meses**.', '"Nenhum custo variável registrado ainda"'],
      ['Fluxo de Caixa', 'Rosca com **Entradas** (receita do mês) e **Saídas** (custos do mês).', '"Nenhuma receita registrada ainda"'],
      ['Receita', 'Rosca com a receita dos últimos 12 meses dividida por **categoria**.', '"Nenhuma receita registrada ainda"'],
    ] } },

    { h1: 'Dashboard Comercial & Crescimento — o que cada número significa' },
    { tabela: { colunas: ['Cartão', 'Como é calculado', 'Ao clicar abre'], larguras: [2000, 4826, 2200], linhas: [
      ['Metas Cadastradas', 'Quantas metas a empresa tem (ativas, concluídas e arquivadas).', 'Metas'],
      ['Clientes Ativos', 'Clientes com status **ativo** no cadastro.', 'Clientes'],
      ['A Receber', 'Soma do que falta receber de todas as contas que ainda não foram totalmente recebidas.', 'Contas a Receber'],
      ['Inadimplência', 'Parte do "A Receber" que **já venceu** e não foi paga.', 'Inadimplência'],
      ['Investimentos', 'Soma do valor de todos os investimentos cadastrados.', 'Investimentos'],
    ] } },
    { h2: 'Painel Análise Comercial & Crescimento' },
    { tabela: { colunas: ['Gráfico', 'O que mostra', 'Quando aparece vazio'], larguras: [2000, 4326, 2700], linhas: [
      ['Metas vs. Realizado', 'Quantas metas existem e um convite para abrir o módulo Metas, onde está o progresso de cada uma.', '"Nenhuma meta cadastrada ainda"'],
      ['Novos Clientes', 'Barras com quantos clientes foram cadastrados em cada um dos últimos 12 meses.', '"Nenhum cliente novo no período"'],
      ['Inadimplência', 'Barras com o valor vencido e não pago, pelo mês de vencimento.', '"Nenhuma conta em atraso — tudo em dia! 🎉"'],
      ['Contas a Receber', 'Rosca dividida em **A vencer** (mais de 30 dias), **Vence 30d** (nos próximos 30 dias) e **Em atraso**.', '"Nenhuma conta a receber registrada ainda"'],
      ['Investimentos', 'Rosca da carteira por tipo: Renda Fixa, Renda Variável, Criptomoeda, Imóvel e Outros.', '"Nenhum investimento registrado ainda"'],
    ] } },

    { h1: 'Passo a passo' },
    { h2: 'Rotina diária recomendada (2 minutos)' },
    { numerada: [
      'Abra o Dashboard no início do dia.',
      'Olhe **Inadimplência**: se houver valor, clique no cartão para ver quem está devendo e cobrar.',
      'Olhe **Saldo em Caixa**: se estiver negativo, o mês está gastando mais do que entra. Clique para abrir o Fluxo de Caixa e ver as próximas semanas.',
      'Confira os gráficos de custos: uma barra muito acima das outras merece atenção (clique em **Ver módulo →**).',
      'Use **Compartilhar → WhatsApp** para mandar o resumo ao sócio ou ao contador.',
    ] },
    { h2: 'Enviar o Dashboard em PDF' },
    { numerada: [
      'No computador, clique em **📄 PDF** no topo.',
      'Espere o botão voltar de "Gerando..." para "PDF".',
      'O arquivo axioma-dashboard.pdf aparece nos downloads do navegador. Anexe onde quiser.',
    ] },
    { h2: 'Ver como a tela fica cheia (demonstração)' },
    { numerada: [
      'Clique em **Ver demonstração** no topo do Dashboard Financeiro (e/ou do Comercial).',
      'Explore os cartões e gráficos com dados fictícios.',
      'Clique em **Ver meus dados** para voltar aos seus números.',
    ] },

    { h1: 'Ligações com outros módulos' },
    { p: 'O Dashboard **só lê**: nunca grava nem altera nada. Todos os números vêm de Receitas, Custos Fixos, Custos Variáveis, Endividamento, Metas, Clientes, Contas a Receber e Investimentos. O Score 360° do PDF e do Compartilhar é o mesmo usado pela IA Financeira.' },

    { h1: 'Quem pode fazer o quê' },
    { p: 'Todos os níveis de acesso, exceto o operador de caixa, veem o Dashboard. Como a tela não grava dados, não há diferença entre níveis aqui. O operador de caixa é levado direto ao PDV.' },

    { h1: 'Problemas comuns e soluções' },
    { tabela: { colunas: ['Problema', 'Solução'], larguras: [3400, 5626], linhas: [
      ['Receita Total aparece zerada, mas eu tenho receitas.', 'O cartão mostra só o **mês atual**. Se as receitas são de meses anteriores, veja em Receitas com o seletor de período.'],
      ['Saldo em Caixa é diferente do saldo do banco.', 'É esperado: o cartão é a sobra estimada do mês (receitas menos custos lançados). O saldo bancário está em Tesouraria e Fluxo de Caixa.'],
      ['Custos Variáveis parece baixo.', 'É a média dos últimos 12 meses. Num mês de gasto alto, a média sobe aos poucos.'],
      ['Um gráfico mostra uma mensagem em vez do desenho.', 'Ainda não há dados daquele tipo. A mensagem diz o que lançar; clique em Ver módulo → para ir à tela certa.'],
      ['A tela fica girando e não carrega.', 'Recarregue a página. Se persistir, confira a conexão com a internet; na primeira abertura do dia o servidor pode levar alguns segundos.'],
      ['Os dados da demonstração foram para a minha empresa?', 'Não. A demonstração é só visual e nunca grava nada.'],
    ] } },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '01 - Dashboard.docx',
  titulo: 'Manual 01 — Dashboard',
  subtitulo: 'The company overview on one screen: financial, commercial and shortcuts to every module',
  info: ['Menu: Dashboard (first card on the top menu)  •  Axioma AI.Tech user manual  •  Version 2.0'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'The Dashboard is the first screen after sign-in. It brings together, in one place, the most important figures from every module: revenue, costs, the month\'s surplus, debts, goals, clients, receivables, delinquency and investments. It lets you know, in a few seconds, **how the company is doing** and where you need to look more closely. Each figure leads, with one click, to the screen it comes from.' },
    { nota: 'The Dashboard only shows your company\'s real data. To see how it looks with data, use the **View demo** button (sample data, clearly labeled, never saved).' },

    { h1: 'How to get there' },
    { lista: [
      'Click **Dashboard** on the top menu (first card, with the house icon).',
      'Click the Axioma logo in the corner of the menu.',
      'It is also the screen that opens right after you sign in.',
    ] },

    { h1: 'Before you start' },
    { p: 'The Dashboard has no registration of its own: it reads the other modules. For the cards to show figures, register at least:' },
    { tabela: { colunas: ['To see', 'Register in'], larguras: [3000, 6026], linhas: [
      ['Total Revenue and the Revenue chart', 'Financial → Revenue (Manual 10)'],
      ['Fixed Costs', 'Financial → Fixed Costs (Manual 11)'],
      ['Variable Costs', 'Financial → Variable Costs (Manual 12)'],
      ['Total Debt and the Debt chart', 'Financial → Debt (Manual 15)'],
      ['Goals', 'Growth → Goals (Manual 22)'],
      ['Active Clients and New Clients', 'Commercial → Clients (Manual 26)'],
      ['Receivable and Delinquency', 'Commercial → Receivables (Manual 30)'],
      ['Investments', 'Growth → Investments (Manual 23)'],
    ] } },

    { h1: 'Screen map (top to bottom)' },
    { numerada: [
      '**Welcome:** background video with the Axioma logo, the greeting (Good morning / Good afternoon / Good evening + your first name), the active company name and the Share, PDF and theme buttons.',
      '**"Financial Dashboard" banner:** title of the first part.',
      '**Financial Dashboard:** View demo button, five cards (Total Revenue, Fixed Costs, Variable Costs, Cash Balance, Total Debt), the ticker with the figures scrolling and the **Annual Financial Analysis** panel with five charts.',
      '**"Commercial Dashboard" banner:** title of the second part.',
      '**Commercial & Growth Dashboard:** View demo button, five cards (Registered Goals, Active Clients, Receivable, Delinquency, Investments), ticker and the **Commercial & Growth Analysis** panel with five charts.',
      '**Axioma Modules:** twelve shortcuts to the most used modules.',
    ] },

    { h1: 'Buttons and actions' },
    { tabela: { colunas: ['Button', 'Where', 'What it does', 'What happens next'], larguras: [1800, 1700, 2900, 2626], linhas: [
      ['Share', 'Welcome (right corner)', 'Opens the Sharing Center with the summary: company, 360° Score, revenue, profit and margin.', 'You choose WhatsApp, Telegram, Gmail, Outlook, E-mail, Copy or PDF. Nothing is sent until you confirm in the chosen app.'],
      ['📄 PDF', 'Welcome', 'Generates "axioma-dashboard.pdf" with revenue, costs, profit, margin, the 360° Score and the grade of each score dimension.', 'The file is downloaded. While generating, the button shows "Gerando..." (Generating). No data is changed.'],
      ['Theme (Dark / Light)', 'Welcome', 'Changes the look of the screen.', 'The choice is kept in this browser.'],
      ['View demo / View my data', 'Top of each part (Financial and Commercial)', 'Turns sample data for that part on or off.', 'The bar "DEMO MODE — sample data, not your company\'s" and the DEMO tag on the cards appear. Click View my data to go back. Nothing is saved.'],
      ['Indicator cards', 'Financial and Commercial Dashboards', 'Every card is clickable.', 'Opens the module the figure comes from (see the tables below).'],
      ['View module →', 'Corner of each chart', 'Shortcut to the chart\'s source screen.', 'Opens the corresponding module.'],
      ['"Axioma Modules" shortcuts', 'End of the screen', 'Revenue, Fixed Costs, Variable Costs, Income Statement, Cash Flow, Clients, Reports, Company, Financial AI, Tax AI, Suppliers and MEI.', 'Opens the clicked module.'],
    ] } },
    { nota: 'On mobile, the top Share and PDF buttons are hidden so they do not cover the greeting. Use a computer or tablet to export the Dashboard.' },

    { h1: 'Financial Dashboard — what each figure means' },
    { tabela: { colunas: ['Card', 'How it is calculated', 'Click opens'], larguras: [2000, 4826, 2200], linhas: [
      ['Total Revenue', 'Sum of revenues entered **in the current month** (from the 1st to the last day of the month).', 'Revenue'],
      ['Fixed Costs', 'Sum of the monthly amount of **all registered fixed costs**.', 'Fixed Costs'],
      ['Variable Costs', '**Monthly average** of variable costs over the last 12 months.', 'Variable Costs'],
      ['Cash Balance', 'The month\'s revenue **minus** fixed costs **minus** the month\'s variable costs. It is the **estimated surplus for the month**, not the bank balance.', 'Cash Flow'],
      ['Total Debt', 'Outstanding balance of all debts: total amount minus what has already been paid.', 'Debt'],
    ] } },
    { alerta: 'The **Cash Balance** card shows how much is left over in the month based on what was entered. The real bank account balance is in **Treasury** and **Cash Flow** (and comes from the bank when it is connected in Open Finance).' },
    { h2: 'Annual Financial Analysis panel' },
    { tabela: { colunas: ['Chart', 'What it shows', 'When it appears empty'], larguras: [2000, 4326, 2700], linhas: [
      ['Debt', 'Donut with how much of the debt has been **Paid** and how much is **Outstanding Balance**.', '"Nenhuma dívida cadastrada ainda" (No debt registered yet)'],
      ['Fixed Costs', 'Bars with the monthly amount of each fixed cost **category** (rent, payroll, software...).', '"No fixed cost registered yet"'],
      ['Variable Costs', 'Bars with the variable costs of each of the **last 12 months**.', '"No variable cost recorded yet"'],
      ['Cash Flow', 'Donut with **Inflows** (the month\'s revenue) and **Outflows** (the month\'s costs).', '"No revenue recorded yet"'],
      ['Revenue', 'Donut with the last 12 months\' revenue split by **category**.', '"No revenue recorded yet"'],
    ] } },

    { h1: 'Commercial & Growth Dashboard — what each figure means' },
    { tabela: { colunas: ['Card', 'How it is calculated', 'Click opens'], larguras: [2000, 4826, 2200], linhas: [
      ['Registered Goals', 'How many goals the company has (active, completed and archived).', 'Goals'],
      ['Active Clients', 'Clients with **active** status in the register.', 'Clients'],
      ['Receivable', 'Sum of what is still to be received from all bills not yet fully received.', 'Receivables'],
      ['Delinquency', 'Part of "Receivable" that is **already overdue** and unpaid.', 'Default'],
      ['Investments', 'Sum of the value of all registered investments.', 'Investments'],
    ] } },
    { h2: 'Commercial & Growth Analysis panel' },
    { tabela: { colunas: ['Chart', 'What it shows', 'When it appears empty'], larguras: [2000, 4326, 2700], linhas: [
      ['Goals vs. Actual', 'How many goals exist and an invitation to open the Goals module, where each one\'s progress is shown.', '"No goal registered yet"'],
      ['New Clients', 'Bars with how many clients were registered in each of the last 12 months.', '"No new client in the period"'],
      ['Delinquency', 'Bars with the overdue unpaid amount, by due month.', '"No overdue accounts — all clear! 🎉"'],
      ['Receivables', 'Donut split into **Not yet due** (more than 30 days), **Due in 30d** (within 30 days) and **Overdue**.', '"No receivables registered yet"'],
      ['Investments', 'Donut of the portfolio by type: Fixed Income, Equities, Crypto, Real Estate and Other.', '"No investments registered yet"'],
    ] } },

    { h1: 'Step by step' },
    { h2: 'Recommended daily routine (2 minutes)' },
    { numerada: [
      'Open the Dashboard at the start of the day.',
      'Look at **Delinquency**: if there is an amount, click the card to see who owes and collect.',
      'Look at **Cash Balance**: if negative, the month is spending more than it brings in. Click to open Cash Flow and see the coming weeks.',
      'Check the cost charts: a bar much higher than the others deserves attention (click **View module →**).',
      'Use **Share → WhatsApp** to send the summary to your partner or accountant.',
    ] },
    { h2: 'Send the Dashboard as PDF' },
    { numerada: [
      'On a computer, click **📄 PDF** at the top.',
      'Wait for the button to change from "Gerando..." back to "PDF".',
      'The file axioma-dashboard.pdf appears in the browser downloads. Attach it wherever you want.',
    ] },
    { h2: 'See how the screen looks full (demo)' },
    { numerada: [
      'Click **View demo** at the top of the Financial Dashboard (and/or the Commercial one).',
      'Explore the cards and charts with sample data.',
      'Click **View my data** to return to your figures.',
    ] },

    { h1: 'Links with other modules' },
    { p: 'The Dashboard **only reads**: it never saves or changes anything. All figures come from Revenue, Fixed Costs, Variable Costs, Debt, Goals, Clients, Receivables and Investments. The 360° Score in the PDF and Share is the same one used by Financial AI.' },

    { h1: 'Who can do what' },
    { p: 'All access levels except the cashier see the Dashboard. Since the screen does not save data, there is no difference between levels here. The cashier is taken straight to the POS.' },

    { h1: 'Common problems and solutions' },
    { tabela: { colunas: ['Problem', 'Solution'], larguras: [3400, 5626], linhas: [
      ['Total Revenue shows zero, but I have revenues.', 'The card shows only the **current month**. If the revenues are from previous months, check Revenue with the period selector.'],
      ['Cash Balance differs from the bank balance.', 'This is expected: the card is the month\'s estimated surplus (revenues minus entered costs). The bank balance is in Treasury and Cash Flow.'],
      ['Variable Costs looks low.', 'It is the average of the last 12 months. In a high-spending month, the average rises gradually.'],
      ['A chart shows a message instead of a drawing.', 'There is no data of that type yet. The message says what to enter; click View module → to go to the right screen.'],
      ['The screen keeps loading.', 'Reload the page. If it persists, check your internet connection; on the first opening of the day the server may take a few seconds.'],
      ['Did the demo data go into my company?', 'No. The demo is visual only and never saves anything.'],
    ] } },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '01 - Dashboard.docx',
  titulo: 'Manual 01 — Panel (Dashboard)',
  subtitulo: 'La visión general de la empresa en una pantalla: financiero, comercial y atajos a todos los módulos',
  info: ['Menú: Panel (primera tarjeta del menú superior)  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'El Panel (Dashboard) es la primera pantalla después de ingresar. Reúne, en un solo lugar, los números más importantes de todos los módulos: ingresos, costos, sobrante del mes, deudas, metas, clientes, cuentas por cobrar, morosidad e inversiones. Sirve para saber, en pocos segundos, **cómo está la empresa** y dónde necesita mirar con más atención. Cada número lleva, con un clic, a la pantalla de donde viene.' },
    { nota: 'El Panel solo muestra datos reales de su empresa. Para ver cómo queda con datos, use el botón **Ver demostración** (datos ficticios, claramente marcados, que nunca se guardan).' },

    { h1: 'Cómo llegar' },
    { lista: [
      'Haga clic en **Panel** en el menú superior (primera tarjeta, con el ícono de casita).',
      'Haga clic en el logo de Axioma en la esquina del menú.',
      'También es la pantalla que se abre justo después de ingresar al sistema.',
    ] },

    { h1: 'Antes de empezar' },
    { p: 'El Panel no tiene registro propio: lee los otros módulos. Para que las tarjetas dejen de estar en cero, registre al menos:' },
    { tabela: { colunas: ['Para ver', 'Registre en'], larguras: [3000, 6026], linhas: [
      ['Ingreso Total y gráfico de Ingresos', 'Financiero → Ingresos (Manual 10)'],
      ['Costos Fijos', 'Financiero → Costos Fijos (Manual 11)'],
      ['Costos Variables', 'Financiero → Costos Variables (Manual 12)'],
      ['Deuda Total y gráfico de Endeudamiento', 'Financiero → Endeudamiento (Manual 15)'],
      ['Metas', 'Crecimiento → Metas (Manual 22)'],
      ['Clientes Activos y Nuevos Clientes', 'Comercial → Clientes (Manual 26)'],
      ['Por Cobrar y Morosidad', 'Comercial → Cuentas por Cobrar (Manual 30)'],
      ['Inversiones', 'Crecimiento → Inversiones (Manual 23)'],
    ] } },

    { h1: 'Mapa de la pantalla (de arriba abajo)' },
    { numerada: [
      '**Bienvenida:** video de fondo con el logo de Axioma, el saludo (Buenos días / Buenas tardes / Buenas noches + su primer nombre), el nombre de la empresa activa y los botones Compartir, PDF y tema.',
      '**Marquesina "Dashboard Financiero":** título de la primera parte.',
      '**Dashboard Financiero:** botón Ver demostración, cinco tarjetas (Ingreso Total, Costos Fijos, Costos Variables, Saldo en Caja, Deuda Total), la marquesina con los números en movimiento y el panel **Análisis Financiero Anual** con cinco gráficos.',
      '**Marquesina "Dashboard Comercial":** título de la segunda parte.',
      '**Dashboard Comercial y Crecimiento:** botón Ver demostración, cinco tarjetas (Metas Registradas, Clientes Activos, Por Cobrar, Morosidad, Inversiones), marquesina y el panel **Análisis Comercial y Crecimiento** con cinco gráficos.',
      '**Módulos Axioma:** doce atajos a los módulos más usados.',
    ] },

    { h1: 'Botones y acciones' },
    { tabela: { colunas: ['Botón', 'Dónde está', 'Qué hace', 'Qué pasa después'], larguras: [1800, 1700, 2900, 2626], linhas: [
      ['Compartir', 'Bienvenida (esquina derecha)', 'Abre el Centro de Compartir con el resumen: empresa, Puntuación 360°, ingresos, utilidad y margen.', 'Usted elige WhatsApp, Telegram, Gmail, Outlook, E-mail, Copiar o PDF. Nada se envía sin que usted confirme en la aplicación elegida.'],
      ['📄 PDF', 'Bienvenida', 'Genera el PDF "axioma-dashboard.pdf" con ingresos, costos, utilidad, margen, la Puntuación 360° y la nota de cada dimensión.', 'El archivo se descarga. Mientras se genera, el botón muestra "Gerando..." (Generando). No se altera ningún dato.'],
      ['Tema (Oscuro / Claro)', 'Bienvenida', 'Cambia la apariencia de la pantalla.', 'La elección se guarda en este navegador.'],
      ['Ver demostración / Ver mis datos', 'Parte superior de cada sección (Financiero y Comercial)', 'Activa o desactiva los datos ficticios de esa parte.', 'Aparece la franja "MODO DEMOSTRACIÓN — datos ficticios, no son de su empresa" y el sello DEMO en las tarjetas. Haga clic en Ver mis datos para volver. Nada se guarda.'],
      ['Tarjetas de indicadores', 'Dashboard Financiero y Comercial', 'Cada tarjeta es clicable.', 'Abre el módulo de origen del número (vea las tablas abajo).'],
      ['Ver módulo →', 'Esquina de cada gráfico', 'Atajo a la pantalla de origen del gráfico.', 'Abre el módulo correspondiente.'],
      ['Atajos "Módulos Axioma"', 'Final de la pantalla', 'Ingresos, Costos Fijos, Costos Variables, Estado de Resultados, Flujo, Clientes, Informes, Empresa, IA Financiera, IA Tributaria, Proveedores y MEI.', 'Abre el módulo seleccionado.'],
    ] } },
    { nota: 'En el celular, los botones Compartir y PDF de la parte superior quedan ocultos para no tapar el saludo. Use una computadora o tableta para exportar el Panel.' },

    { h1: 'Dashboard Financiero — qué significa cada número' },
    { tabela: { colunas: ['Tarjeta', 'Cómo se calcula', 'Al hacer clic abre'], larguras: [2000, 4826, 2200], linhas: [
      ['Ingreso Total', 'Suma de los ingresos registrados **en el mes actual** (del día 1 al último día del mes).', 'Ingresos'],
      ['Costos Fijos', 'Suma del valor mensual de **todos los costos fijos registrados**.', 'Costos Fijos'],
      ['Costos Variables', '**Promedio mensual** de los costos variables de los últimos 12 meses.', 'Costos Variables'],
      ['Saldo en Caja', 'Ingresos del mes **menos** costos fijos **menos** costos variables del mes. Es el **sobrante estimado del mes**, no el saldo del banco.', 'Flujo de Caja'],
      ['Deuda Total', 'Saldo deudor de todas las deudas: valor total menos lo ya pagado.', 'Endeudamiento'],
    ] } },
    { alerta: 'La tarjeta **Saldo en Caja** muestra cuánto sobra en el mes según lo registrado. El saldo real de la cuenta bancaria está en **Tesorería** y en **Flujo de Caja** (y viene del banco cuando está conectado en Open Finance).' },
    { h2: 'Panel Análisis Financiero Anual' },
    { tabela: { colunas: ['Gráfico', 'Qué muestra', 'Cuándo aparece vacío'], larguras: [2000, 4326, 2700], linhas: [
      ['Endeudamiento', 'Dona con cuánto de la deuda ya fue **Pagado** y cuánto es **Saldo Deudor**.', '"Aún no hay deudas registradas"'],
      ['Costos Fijos', 'Barras con el valor mensual de cada **categoría** de costo fijo (alquiler, personal, sistemas...).', '"Aún no hay costos fijos registrados"'],
      ['Costos Variables', 'Barras con los costos variables de cada uno de los **últimos 12 meses**.', '"Aún no hay costos variables registrados"'],
      ['Flujo de Caja', 'Dona con **Entradas** (ingresos del mes) y **Salidas** (costos del mes).', '"Aún no hay ingresos registrados"'],
      ['Ingresos', 'Dona con los ingresos de los últimos 12 meses divididos por **categoría**.', '"Aún no hay ingresos registrados"'],
    ] } },

    { h1: 'Dashboard Comercial y Crecimiento — qué significa cada número' },
    { tabela: { colunas: ['Tarjeta', 'Cómo se calcula', 'Al hacer clic abre'], larguras: [2000, 4826, 2200], linhas: [
      ['Metas Registradas', 'Cuántas metas tiene la empresa (activas, concluidas y archivadas).', 'Metas'],
      ['Clientes Activos', 'Clientes con estado **activo** en el registro.', 'Clientes'],
      ['Por Cobrar', 'Suma de lo que falta cobrar de todas las cuentas que aún no se cobraron por completo.', 'Cuentas por Cobrar'],
      ['Morosidad', 'Parte del "Por Cobrar" que **ya venció** y no se pagó.', 'Morosidad'],
      ['Inversiones', 'Suma del valor de todas las inversiones registradas.', 'Inversiones'],
    ] } },
    { h2: 'Panel Análisis Comercial y Crecimiento' },
    { tabela: { colunas: ['Gráfico', 'Qué muestra', 'Cuándo aparece vacío'], larguras: [2000, 4326, 2700], linhas: [
      ['Metas vs. Realizado', 'Cuántas metas existen y una invitación a abrir el módulo Metas, donde está el progreso de cada una.', '"Aún no hay metas registradas"'],
      ['Nuevos Clientes', 'Barras con cuántos clientes se registraron en cada uno de los últimos 12 meses.', '"Sin clientes nuevos en el período"'],
      ['Morosidad', 'Barras con el valor vencido y no pagado, por mes de vencimiento.', '"Sin cuentas atrasadas — ¡todo al día! 🎉"'],
      ['Cuentas por Cobrar', 'Dona dividida en **Por vencer** (más de 30 días), **Vence 30d** (en los próximos 30 días) y **Atrasado**.', '"Aún no hay cuentas por cobrar registradas"'],
      ['Inversiones', 'Dona de la cartera por tipo: Renta Fija, Renta Variable, Criptomoneda, Inmueble y Otros.', '"Aún no hay inversiones registradas"'],
    ] } },

    { h1: 'Paso a paso' },
    { h2: 'Rutina diaria recomendada (2 minutos)' },
    { numerada: [
      'Abra el Panel al inicio del día.',
      'Mire **Morosidad**: si hay valor, haga clic en la tarjeta para ver quién debe y cobrar.',
      'Mire **Saldo en Caja**: si es negativo, el mes está gastando más de lo que entra. Haga clic para abrir el Flujo de Caja y ver las próximas semanas.',
      'Revise los gráficos de costos: una barra muy por encima de las demás merece atención (haga clic en **Ver módulo →**).',
      'Use **Compartir → WhatsApp** para enviar el resumen al socio o al contador.',
    ] },
    { h2: 'Enviar el Panel en PDF' },
    { numerada: [
      'En la computadora, haga clic en **📄 PDF** en la parte superior.',
      'Espere que el botón vuelva de "Gerando..." a "PDF".',
      'El archivo axioma-dashboard.pdf aparece en las descargas del navegador. Adjúntelo donde quiera.',
    ] },
    { h2: 'Ver cómo queda la pantalla llena (demostración)' },
    { numerada: [
      'Haga clic en **Ver demostración** en la parte superior del Dashboard Financiero (y/o del Comercial).',
      'Explore las tarjetas y gráficos con datos ficticios.',
      'Haga clic en **Ver mis datos** para volver a sus números.',
    ] },

    { h1: 'Conexiones con otros módulos' },
    { p: 'El Panel **solo lee**: nunca guarda ni altera nada. Todos los números vienen de Ingresos, Costos Fijos, Costos Variables, Endeudamiento, Metas, Clientes, Cuentas por Cobrar e Inversiones. La Puntuación 360° del PDF y de Compartir es la misma que usa la IA Financiera.' },

    { h1: 'Quién puede hacer qué' },
    { p: 'Todos los niveles de acceso, excepto el cajero, ven el Panel. Como la pantalla no guarda datos, aquí no hay diferencia entre niveles. El cajero es llevado directamente al PDV.' },

    { h1: 'Problemas comunes y soluciones' },
    { tabela: { colunas: ['Problema', 'Solución'], larguras: [3400, 5626], linhas: [
      ['Ingreso Total aparece en cero, pero tengo ingresos.', 'La tarjeta muestra solo el **mes actual**. Si los ingresos son de meses anteriores, véalos en Ingresos con el selector de período.'],
      ['Saldo en Caja es diferente del saldo del banco.', 'Es lo esperado: la tarjeta es el sobrante estimado del mes (ingresos menos costos registrados). El saldo bancario está en Tesorería y Flujo de Caja.'],
      ['Costos Variables parece bajo.', 'Es el promedio de los últimos 12 meses. En un mes de gasto alto, el promedio sube de a poco.'],
      ['Un gráfico muestra un mensaje en lugar del dibujo.', 'Todavía no hay datos de ese tipo. El mensaje dice qué registrar; haga clic en Ver módulo → para ir a la pantalla correcta.'],
      ['La pantalla sigue cargando.', 'Recargue la página. Si persiste, revise la conexión a internet; en la primera apertura del día el servidor puede tardar unos segundos.'],
      ['¿Los datos de la demostración fueron a mi empresa?', 'No. La demostración es solo visual y nunca guarda nada.'],
    ] } },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
