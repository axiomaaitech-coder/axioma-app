// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '03 - MEI - Cockpit.docx',
  titulo: 'Manual 03 — Cockpit MEI',
  subtitulo: 'A foto do dia do MEI em quatro vereditos: teto, dinheiro que é seu, impostos e preço',
  info: ['Menu: MEI → Cockpit  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Cockpit é a "foto do dia" do MEI. Enquanto o Painel MEI mostra tudo em detalhe, o Cockpit resume em **um alerta e quatro vereditos** se você está bem ou se precisa agir hoje: teto, dinheiro que é seu, impostos e preço cobrado. É uma tela só de leitura: não grava nada.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **MEI ▼** → **Cockpit**.'] },

    { h1: 'Antes de começar' },
    { lista: [
      'Configure o MEI em **Painel MEI → Configurar MEI** (Manual 02).',
      'Lance as vendas em **Faturamento** (Manual 04) e as despesas nos módulos de custos.',
      'Para o veredito de preço, informe quanto você cobra hoje em **Precificação MEI** (Manual 07).',
    ] },

    { h1: 'Mapa da tela (de cima para baixo)' },
    { numerada: [
      '**Cabeçalho** com Compartilhar e tema.',
      '**Letreiro** com os números do dia.',
      '**Saudação e Score de Saúde do MEI:** "Olá, (nome da empresa) — aqui está a foto de hoje." e a nota de **0 a 1000**, com o nível (por exemplo, Saudável ou Atenção).',
      '**Alerta do dia:** o assunto mais urgente.',
      '**Quatro cartões de veredito.**',
      '**Faixa de indicadores de apoio.**',
    ] },

    { h1: 'Botões e ações' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2300, 3700, 3026], linhas: [
      ['Compartilhar', 'Abre o Centro de Compartilhamento com o retrato do dia (score, alerta e vereditos).', 'Você escolhe WhatsApp, Telegram, Gmail, Outlook, E-mail ou Copiar e envia.'],
      ['Tema (Escuro / Claro)', 'Troca a aparência.', 'Fica guardado no navegador.'],
      ['Alerta do dia (clicável)', 'Quando o alerta tem solução, a faixa inteira é um atalho.', 'Abre a tela que resolve o problema (veja a tabela de alertas).'],
      ['Ver detalhe → (em cada cartão)', 'Atalho do veredito.', 'Teto → Faturamento; O que é seu → Painel MEI; DAS → DAS & Obrigações; Trabalhando de graça → Precificação MEI.'],
    ] } },

    { h1: 'O alerta do dia' },
    { p: 'O Axioma confere os assuntos nesta ordem de prioridade e mostra o mais urgente:' },
    { tabela: { colunas: ['Mensagem', 'Quando aparece', 'Ao clicar abre'], larguras: [3600, 3400, 2026], linhas: [
      ['"DAS atrasado há X dias — juros e multa aumentando"', 'O DAS do mês passou do vencimento sem estar marcado como pago.', 'DAS & Obrigações'],
      ['"DAS vence em X dias"', 'Faltam 5 dias ou menos para o vencimento.', 'DAS & Obrigações'],
      ['"Teto do MEI em X% — risco de estourar o limite"', 'O faturamento passou de 90% do teto ou, no ritmo atual, estoura antes do fim do ano.', 'Faturamento'],
      ['"Teto do MEI em X% — de olho no limite"', 'O faturamento está entre 70% e 90% do teto.', 'Faturamento'],
      ['"O que é seu de verdade está negativo"', 'O pró-labore seguro do mês ficou abaixo de zero.', 'Painel MEI'],
      ['"Sobra do mês não cobre DAS + IRPF"', 'O que sobrou no mês é menor que o DAS mais a reserva do imposto de renda.', 'Painel MEI'],
      ['"Você está no prejuízo de R$ X por unidade cobrada"', 'O preço informado na Precificação é menor que o custo real.', 'Precificação MEI'],
      ['"Margem apertada: X%"', 'O preço cobre o custo, mas com pouca folga.', 'Precificação MEI'],
      ['"Faturamento caiu X% vs. o mês anterior"', 'O mês atual faturou menos que o anterior.', 'Faturamento'],
      ['"Tudo em ordem hoje — nenhum risco encontrado"', 'Nenhum dos casos acima.', '(não é clicável)'],
    ] } },

    { h1: 'Os quatro cartões de veredito' },
    { tabela: { colunas: ['Cartão', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Teto do MEI', 'Quanto do teto anual já foi usado (%), quanto resta e, no ritmo atual, em que mês estoura, ou "Sem risco de estouro neste ritmo".'],
      ['O que é seu de verdade', 'O pró-labore seguro do mês, depois de separar DAS, IRPF, contas do mês e reserva (mesmo cálculo do Cofre do Painel MEI).'],
      ['DAS & Obrigações', 'Se o DAS está **Em dia** ou **Atrasado**, quantos dias até vencer ou de atraso, e as consequências do atraso: multa até o teto de 20%, risco de CNPJ inapto e inscrição em dívida ativa da União.'],
      ['Você está trabalhando de graça?', 'Compara o preço que você cobra com o custo real: prejuízo por unidade, margem apertada ou margem saudável. Se você ainda não informou o preço, aparece "Complete em Precificação MEI".'],
    ] } },
    { p: 'A cor do cartão segue o semáforo: verde está bem, amarelo pede atenção, vermelho pede ação hoje.' },

    { h1: 'Faixa de indicadores de apoio' },
    { lista: ['**Faturamento acumulado** no ano.', '**Projeção anual** no ritmo atual.', '**Sobra do mês vs. o que precisa guardar** (DAS + IRPF).'] },

    { h1: 'Passo a passo: uso diário (1 minuto)' },
    { numerada: [
      'Abra o Cockpit pela manhã.',
      'Leia o alerta do dia; se ele for clicável, clique e resolva na tela que abrir.',
      'Veja se algum cartão está vermelho e clique em **Ver detalhe →**.',
      'Se quiser, **Compartilhar → WhatsApp** para mandar a foto do dia ao contador.',
    ] },

    { h1: 'Ligações com outros módulos' },
    { p: 'O Cockpit só lê: Configurar MEI (Painel MEI), Receitas/Faturamento, Custos Fixos, Custos Variáveis, Contas a Pagar do mês, status do DAS em DAS & Obrigações e o último preço salvo na Precificação MEI.' },

    { h1: 'Quem pode fazer o quê' },
    { p: 'Quem acessa o MEI vê o Cockpit. Não há gravação nesta tela.' },

    { h1: 'Problemas comuns e soluções' },
    { tabela: { colunas: ['Problema', 'Solução'], larguras: [3400, 5626], linhas: [
      ['Diz que o DAS está atrasado, mas eu paguei.', 'Marque o DAS como pago em DAS & Obrigações; o Cockpit lê esse status.'],
      ['O cartão de preço pede para completar a Precificação.', 'Abra Precificação MEI, informe quanto cobra hoje e salve.'],
      ['O score está baixo sem motivo aparente.', 'Abra o Painel MEI: o Score de Saúde mostra a nota de cada parte (Financeiro, Fiscal, Teto e Fluxo) e o que pesa.'],
      ['"Faturamento caiu" num mês que ainda não acabou.', 'A comparação usa o mês em andamento; no começo do mês é normal ele estar abaixo. Volte a olhar perto do fim do mês.'],
    ] } },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '03 - MEI - Cockpit.docx',
  titulo: 'Manual 03 — MEI Cockpit',
  subtitulo: 'The MEI\'s snapshot of the day in four verdicts: cap, money that is yours, taxes and price',
  info: ['Menu: MEI → Cockpit  •  Axioma AI.Tech user manual  •  Version 2.0'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'The Cockpit is the MEI\'s "snapshot of the day". While the MEI Dashboard shows everything in detail, the Cockpit sums up in **one alert and four verdicts** whether you are fine or need to act today: cap, money that is yours, taxes and the price you charge. It is a read-only screen: it saves nothing.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **MEI ▼** → **Cockpit**.'] },

    { h1: 'Before you start' },
    { lista: [
      'Set up the MEI in **MEI Dashboard → Configure MEI** (Manual 02).',
      'Enter sales in **Revenue** (Manual 04) and expenses in the cost modules.',
      'For the price verdict, enter how much you charge today in **MEI Pricing** (Manual 07).',
    ] },

    { h1: 'Screen map (top to bottom)' },
    { numerada: [
      '**Header** with Share and theme.',
      '**Ticker** with the day\'s figures.',
      '**Greeting and MEI Health Score:** "Hello, (company name) — here is today\'s snapshot." and the score from **0 to 1000**, with its level (for example, Healthy or Attention).',
      '**Alert of the day:** the most urgent matter.',
      '**Four verdict cards.**',
      '**Supporting indicators band.**',
    ] },

    { h1: 'Buttons and actions' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2300, 3700, 3026], linhas: [
      ['Share', 'Opens the Sharing Center with the day\'s snapshot (score, alert and verdicts).', 'You choose WhatsApp, Telegram, Gmail, Outlook, E-mail or Copy and send.'],
      ['Theme (Dark / Light)', 'Changes the look.', 'Kept in the browser.'],
      ['Alert of the day (clickable)', 'When the alert has a fix, the whole bar is a shortcut.', 'Opens the screen that solves the problem (see the alerts table).'],
      ['See detail → (on each card)', 'Verdict shortcut.', 'Cap → Revenue; What\'s really yours → MEI Dashboard; DAS → DAS & Obligations; Working for free → MEI Pricing.'],
    ] } },

    { h1: 'The alert of the day' },
    { p: 'Axioma checks the topics in this order of priority and shows the most urgent:' },
    { tabela: { colunas: ['Message', 'When it appears', 'Click opens'], larguras: [3600, 3400, 2026], linhas: [
      ['"DAS overdue by X days — interest and fine growing"', 'The month\'s DAS passed its due date without being marked as paid.', 'DAS & Obligations'],
      ['"DAS due in X days"', '5 days or fewer before the due date.', 'DAS & Obligations'],
      ['"MEI cap at X% — risk of breaking the limit"', 'Revenue passed 90% of the cap or, at the current pace, exceeds it before year-end.', 'Revenue'],
      ['"MEI cap at X% — keep an eye on the limit"', 'Revenue is between 70% and 90% of the cap.', 'Revenue'],
      ['"What\'s really yours is negative"', 'The month\'s safe owner\'s draw fell below zero.', 'MEI Dashboard'],
      ['"This month\'s leftover doesn\'t cover DAS + income tax"', 'What was left in the month is less than the DAS plus the income tax reserve.', 'MEI Dashboard'],
      ['"You\'re losing R$ X per unit charged"', 'The price entered in Pricing is below the real cost.', 'MEI Pricing'],
      ['"Tight margin: X%"', 'The price covers the cost, but with little room.', 'MEI Pricing'],
      ['"Revenue dropped X% vs. last month"', 'The current month billed less than the previous one.', 'Revenue'],
      ['"All good today — no risk found"', 'None of the cases above.', '(not clickable)'],
    ] } },

    { h1: 'The four verdict cards' },
    { tabela: { colunas: ['Card', 'What it shows'], larguras: [2600, 6426], linhas: [
      ['MEI Cap', 'How much of the annual cap has been used (%), how much is left and, at the current pace, in which month it will be exceeded, or "No risk of exceeding at this pace".'],
      ['What\'s really yours', 'The month\'s safe owner\'s draw, after setting aside DAS, income tax, the month\'s bills and reserve (same calculation as the MEI Dashboard Vault).'],
      ['DAS & Obligations', 'Whether the DAS is **Up to date** or **Overdue**, how many days until due or overdue, and the consequences of delay: fine up to the 20% cap, risk of the CNPJ becoming unfit and registration in the Federal Government\'s active debt.'],
      ['Are you working for free?', 'Compares the price you charge with the real cost: loss per unit, tight margin or healthy margin. If you have not entered the price yet, "Complete it in MEI Pricing" appears.'],
    ] } },
    { p: 'The card color follows the traffic light: green is fine, yellow calls for attention, red calls for action today.' },

    { h1: 'Supporting indicators band' },
    { lista: ['**Cumulative revenue** for the year.', '**Annual projection** at the current pace.', '**Month\'s surplus vs. what you need to set aside** (DAS + income tax).'] },

    { h1: 'Step by step: daily use (1 minute)' },
    { numerada: [
      'Open the Cockpit in the morning.',
      'Read the alert of the day; if it is clickable, click it and solve it on the screen that opens.',
      'See whether any card is red and click **See detail →**.',
      'If you want, **Share → WhatsApp** to send the day\'s snapshot to your accountant.',
    ] },

    { h1: 'Links with other modules' },
    { p: 'The Cockpit only reads: Configure MEI (MEI Dashboard), Revenue, Fixed Costs, Variable Costs, the month\'s Accounts Payable, the DAS status in DAS & Obligations and the last price saved in MEI Pricing.' },

    { h1: 'Who can do what' },
    { p: 'Anyone with MEI access sees the Cockpit. Nothing is saved on this screen.' },

    { h1: 'Common problems and solutions' },
    { tabela: { colunas: ['Problem', 'Solution'], larguras: [3400, 5626], linhas: [
      ['It says the DAS is overdue, but I paid it.', 'Mark the DAS as paid in DAS & Obligations; the Cockpit reads that status.'],
      ['The price card asks me to complete Pricing.', 'Open MEI Pricing, enter how much you charge today and save.'],
      ['The score is low for no apparent reason.', 'Open the MEI Dashboard: the Health Score shows the grade of each part (Financial, Tax, Cap and Flow) and what weighs on it.'],
      ['"Revenue dropped" in a month that is not over yet.', 'The comparison uses the month in progress; early in the month it is normal to be lower. Check again near the end of the month.'],
    ] } },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '03 - MEI - Cockpit.docx',
  titulo: 'Manual 03 — Cockpit MEI',
  subtitulo: 'La foto del día del MEI en cuatro veredictos: tope, dinero que es suyo, impuestos y precio',
  info: ['Menú: MEI → Cockpit  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'El Cockpit es la "foto del día" del MEI. Mientras el Panel MEI muestra todo en detalle, el Cockpit resume en **una alerta y cuatro veredictos** si usted está bien o si necesita actuar hoy: tope, dinero que es suyo, impuestos y precio cobrado. Es una pantalla solo de lectura: no guarda nada.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **MEI ▼** → **Cockpit**.'] },

    { h1: 'Antes de empezar' },
    { lista: [
      'Configure el MEI en **Panel MEI → Configurar MEI** (Manual 02).',
      'Registre las ventas en **Facturación** (Manual 04) y los gastos en los módulos de costos.',
      'Para el veredicto de precio, informe cuánto cobra hoy en **Precios MEI** (Manual 07).',
    ] },

    { h1: 'Mapa de la pantalla (de arriba abajo)' },
    { numerada: [
      '**Encabezado** con Compartir y tema.',
      '**Marquesina** con los números del día.',
      '**Saludo y Score de Salud del MEI:** "Hola, (nombre de la empresa) — aquí está la foto de hoy." y la nota de **0 a 1000**, con el nivel (por ejemplo, Saludable o Atención).',
      '**Alerta del día:** el asunto más urgente.',
      '**Cuatro tarjetas de veredicto.**',
      '**Franja de indicadores de apoyo.**',
    ] },

    { h1: 'Botones y acciones' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2300, 3700, 3026], linhas: [
      ['Compartir', 'Abre el Centro de Compartir con la foto del día (score, alerta y veredictos).', 'Usted elige WhatsApp, Telegram, Gmail, Outlook, E-mail o Copiar y envía.'],
      ['Tema (Oscuro / Claro)', 'Cambia la apariencia.', 'Se guarda en el navegador.'],
      ['Alerta del día (clicable)', 'Cuando la alerta tiene solución, toda la franja es un atajo.', 'Abre la pantalla que resuelve el problema (vea la tabla de alertas).'],
      ['Ver detalle → (en cada tarjeta)', 'Atajo del veredicto.', 'Techo → Facturación; Lo que es suyo → Panel MEI; DAS → DAS & Obligaciones; Trabajando gratis → Precios MEI.'],
    ] } },

    { h1: 'La alerta del día' },
    { p: 'Axioma revisa los asuntos en este orden de prioridad y muestra el más urgente:' },
    { tabela: { colunas: ['Mensaje', 'Cuándo aparece', 'Al hacer clic abre'], larguras: [3600, 3400, 2026], linhas: [
      ['"DAS atrasado hace X días — intereses y multa aumentando"', 'El DAS del mes pasó el vencimiento sin estar marcado como pagado.', 'DAS & Obligaciones'],
      ['"DAS vence en X días"', 'Faltan 5 días o menos para el vencimiento.', 'DAS & Obligaciones'],
      ['"Techo del MEI en X% — riesgo de superar el límite"', 'La facturación pasó el 90% del tope o, al ritmo actual, lo supera antes de fin de año.', 'Facturación'],
      ['"Techo del MEI en X% — atento al límite"', 'La facturación está entre el 70% y el 90% del tope.', 'Facturación'],
      ['"Lo que es realmente suyo está negativo"', 'El retiro seguro del mes quedó por debajo de cero.', 'Panel MEI'],
      ['"La sobra del mes no cubre DAS + IRPF"', 'Lo que sobró en el mes es menor que el DAS más la reserva del impuesto a la renta.', 'Panel MEI'],
      ['"Está perdiendo R$ X por unidad cobrada"', 'El precio informado en Precios es menor que el costo real.', 'Precios MEI'],
      ['"Margen ajustado: X%"', 'El precio cubre el costo, pero con poco margen.', 'Precios MEI'],
      ['"La facturación cayó X% vs. el mes anterior"', 'El mes actual facturó menos que el anterior.', 'Facturación'],
      ['"Todo en orden hoy — ningún riesgo encontrado"', 'Ninguno de los casos anteriores.', '(no es clicable)'],
    ] } },

    { h1: 'Las cuatro tarjetas de veredicto' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra'], larguras: [2600, 6426], linhas: [
      ['Techo del MEI', 'Cuánto del tope anual ya se usó (%), cuánto resta y, al ritmo actual, en qué mes se supera, o "Sin riesgo de exceso a este ritmo".'],
      ['Lo que es realmente suyo', 'El retiro seguro del mes, después de separar DAS, impuesto a la renta, cuentas del mes y reserva (mismo cálculo del Cofre del Panel MEI).'],
      ['DAS & Obligaciones', 'Si el DAS está **Al día** o **Atrasado**, cuántos días faltan para vencer o de atraso, y las consecuencias del atraso: multa hasta el tope del 20%, riesgo de CNPJ inapto e inscripción en la deuda activa de la Unión.'],
      ['¿Está trabajando gratis?', 'Compara el precio que cobra con el costo real: pérdida por unidad, margen ajustado o margen saludable. Si todavía no informó el precio, aparece "Complete en Precios MEI".'],
    ] } },
    { p: 'El color de la tarjeta sigue el semáforo: verde está bien, amarillo pide atención, rojo pide acción hoy.' },

    { h1: 'Franja de indicadores de apoyo' },
    { lista: ['**Facturación acumulada** del año.', '**Proyección anual** al ritmo actual.', '**Sobra del mes vs. lo que necesita guardar** (DAS + impuesto a la renta).'] },

    { h1: 'Paso a paso: uso diario (1 minuto)' },
    { numerada: [
      'Abra el Cockpit por la mañana.',
      'Lea la alerta del día; si es clicable, haga clic y resuelva en la pantalla que se abra.',
      'Vea si alguna tarjeta está en rojo y haga clic en **Ver detalle →**.',
      'Si quiere, **Compartir → WhatsApp** para enviar la foto del día al contador.',
    ] },

    { h1: 'Conexiones con otros módulos' },
    { p: 'El Cockpit solo lee: Configurar MEI (Panel MEI), Ingresos/Facturación, Costos Fijos, Costos Variables, Cuentas por Pagar del mes, estado del DAS en DAS & Obligaciones y el último precio guardado en Precios MEI.' },

    { h1: 'Quién puede hacer qué' },
    { p: 'Quien accede al MEI ve el Cockpit. En esta pantalla no se guarda nada.' },

    { h1: 'Problemas comunes y soluciones' },
    { tabela: { colunas: ['Problema', 'Solución'], larguras: [3400, 5626], linhas: [
      ['Dice que el DAS está atrasado, pero lo pagué.', 'Marque el DAS como pagado en DAS & Obligaciones; el Cockpit lee ese estado.'],
      ['La tarjeta de precio pide completar Precios.', 'Abra Precios MEI, informe cuánto cobra hoy y guarde.'],
      ['El score está bajo sin motivo aparente.', 'Abra el Panel MEI: el Score de Salud muestra la nota de cada parte (Financiero, Fiscal, Tope y Flujo) y lo que pesa.'],
      ['"La facturación cayó" en un mes que todavía no terminó.', 'La comparación usa el mes en curso; a principio de mes es normal que esté por debajo. Vuelva a mirar cerca del fin del mes.'],
    ] } },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
