// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '04 - MEI - Faturamento.docx',
  titulo: 'Manual 04 — Faturamento MEI',
  subtitulo: 'Tudo o que o MEI faturou no ano, o quanto isso consome do teto e as vendas lançadas',
  info: ['Menu: MEI → Faturamento  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Aqui você acompanha **tudo o que o MEI faturou no ano** e quanto isso consome do teto anual de R$ 81.000. A tela mostra o ritmo de vendas, avisa quando o teto está perto, separa quanto guardar para impostos de cada venda, permite **lançar vendas novas** e gera o **Relatório Mensal de Receitas Brutas**, documento que o MEI é obrigado a manter.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **MEI ▼** → **Faturamento**.', 'Painel MEI → linha **Entrou** ou atalho **Faturamento** no Acesso rápido.', 'Cockpit → cartão **Teto do MEI** → **Ver detalhe**.'] },

    { h1: 'Antes de começar' },
    { p: 'Configure o MEI em **Painel MEI → Configurar MEI** (Manual 02): a **Data de Abertura** define o teto proporcional do primeiro ano e a **Categoria** define o DAS usado na reserva de impostos.' },

    { h1: 'Mapa da tela (de cima para baixo)' },
    { numerada: [
      '**Cabeçalho** com Exportar PDF, Nova venda, Compartilhar e tema.',
      '**Letreiro** com faturamento, teto e projeção.',
      '**Cartões:** Faturamento do ano, Limite Restante e Limite Usado.',
      '**Reserva automática de imposto.**',
      '**Velocímetro de Faturamento** com o teto do ano, o ritmo máximo por mês e o mês provável de estouro.',
      '**Gráfico Faturamento vs. Teto e Média.**',
      '**Análise Executiva Axioma** (botão Analisar).',
      '**Faturamento Mensal** (tabela) e o botão do **Relatório Mensal de Receitas Brutas**.',
      '**Lançamentos do Ano** (lista de vendas).',
    ] },

    { h1: 'Botões e ações' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2300, 3700, 3026], linhas: [
      ['Exportar PDF', 'Gera o PDF do faturamento do ano.', 'O arquivo é baixado e aparece "PDF pronto — baixado". Nada é alterado.'],
      ['Nova venda', 'Abre a janela para lançar uma venda ou serviço.', 'Só grava ao clicar em Salvar (veja o passo a passo).'],
      ['Compartilhar', 'Abre o Centro de Compartilhamento com o resumo do faturamento.', 'Você escolhe o canal e envia.'],
      ['Tema (Escuro / Claro)', 'Troca a aparência.', 'Fica guardado no navegador.'],
      ['Cartão Faturamento', 'Atalho.', 'Rola a tela até a lista Lançamentos do Ano.'],
      ['Cartão Limite Restante', 'Atalho.', 'Abre o Cockpit MEI.'],
      ['Analisar', 'Pede à inteligência do Axioma uma análise do seu faturamento: tendência, sazonalidade, risco de teto e o que fazer.', 'Mostra "Analisando..." e depois o texto. Se a inteligência não responder, aparece uma análise por regras. Nada é gravado.'],
      ['Relatório Mensal de Receitas Brutas', 'Gera o PDF oficial do mês a mês do ano.', 'O arquivo é baixado. Guarde junto com as notas fiscais.'],
      ['Conta pro teto MEI (chave em cada venda)', 'Liga ou desliga se aquela venda entra no cálculo do teto (por exemplo, um reembolso que não é faturamento).', 'Grava na hora; os cartões e o velocímetro se atualizam. Se falhar, a chave volta e aparece o aviso de erro.'],
      ['✏️ Lápis', 'Abre a venda para editar.', 'Salvar grava a alteração; Cancelar descarta.'],
      ['🗑️ Lixeira', 'Pede confirmação: "Excluir este lançamento?".', 'Excluir apaga a venda em Receitas também (é o mesmo registro). Não há lixeira para recuperar.'],
    ] } },

    { h1: 'O que cada parte mostra' },
    { tabela: { colunas: ['Parte', 'O que mostra'], larguras: [2800, 6226], linhas: [
      ['Faturamento (ano)', 'Soma das vendas do ano que contam para o teto.'],
      ['Limite Restante', 'Quanto ainda pode faturar no ano sem passar do teto.'],
      ['Limite Usado', 'Porcentagem do teto já usada, com semáforo: verde (tranquilo), amarelo (atenção), laranja (acima do teto, até 120%) e vermelho (acima de 120%).'],
      ['Reserva automática de imposto', 'Quanto separar de cada venda nova para o DAS e o imposto de renda proporcional ("Reservar deste X% de cada receita nova"). Em cada venda da lista aparece o valor em reais.'],
      ['Seu teto em (ano)', 'O limite do ano. No ano de abertura é proporcional aos meses de atividade; nos demais aparece "teto cheio — ano completo de atividade".'],
      ['Quanto ainda pode faturar por mês até dezembro', 'O ritmo máximo para não estourar o teto.'],
      ['Mês provável de estouro', 'Em que mês o teto estoura no ritmo atual, ou "No ritmo atual, não estoura este ano."'],
      ['Faixa laranja', '"Acima do teto, mas ainda dá até dezembro (DAS complementar)." Passou até 20% do teto: continua MEI até o fim do ano e paga um DAS complementar sobre o excesso.'],
      ['Faixa vermelha', '"Risco de desenquadramento retroativo — mais de 120% do teto." O desenquadramento volta ao início do ano: procure o contador.'],
      ['Faturamento vs. Teto e Média', 'Gráfico com o faturamento de cada mês, o teto mensal recomendado e a sua média, com as comparações "vs. sua média" e "vs. mês anterior".'],
    ] } },

    { h1: 'Passo a passo' },
    { h2: 'Lançar uma venda' },
    { numerada: [
      'Clique em **Nova venda** no cabeçalho.',
      'Preencha **Descrição** e **Valor (R$)**. A **Data** já vem com hoje (pode mudar).',
      'Escolha a **Categoria** (Vendas de produtos, Prestação de serviços, Recorrentes, Eventuais ou Outras) e o **Status** (Recebido ou Pendente).',
      'Clique em **Salvar**. Aparece "Lançamento salvo." e os cartões, o velocímetro e a lista se atualizam.',
    ] },
    { nota: 'A venda é gravada em **Receitas** (Financeiro). Ela aparece lá também, entra no Dashboard, no Fluxo de Caixa e no DRE, e fica registrada na trilha de auditoria (quem lançou e quando). Se faltar descrição, valor maior que zero ou data, aparece o aviso em vermelho e a janela continua aberta.' },
    { h2: 'Tirar uma venda do teto' },
    { numerada: ['Na lista **Lançamentos do Ano**, ache a venda.', 'Desligue a chave **Conta pro teto MEI**.', 'Os números do teto se atualizam na hora. A venda continua em Receitas.'] },
    { h2: 'Gerar o Relatório Mensal de Receitas Brutas' },
    { numerada: ['Role até **Faturamento Mensal**.', 'Clique em **Relatório Mensal de Receitas Brutas**.', 'Guarde o PDF com as notas fiscais do período.'] },

    { h1: 'Ligações com outros módulos' },
    { tabela: { colunas: ['Módulo', 'Ligação'], larguras: [2800, 6226], linhas: [
      ['Receitas (Manual 10)', 'É a mesma tabela: lançar aqui aparece lá e vice-versa.'],
      ['Painel MEI e Cockpit', 'Usam o faturamento e o teto calculados aqui.'],
      ['DAS & Obrigações e Imposto de Renda', 'A reserva de imposto usa o DAS configurado e a regra do IRPF do MEI.'],
    ] } },

    { h1: 'Quem pode fazer o quê' },
    { p: 'Quem acessa o MEI vê a tela. Lançar, editar, excluir e ligar/desligar o teto exigem permissão de escrita; perfis somente leitura veem tudo, mas a gravação é recusada com aviso.' },

    { h1: 'Problemas comuns e soluções' },
    { tabela: { colunas: ['Problema', 'Solução'], larguras: [3400, 5626], linhas: [
      ['A reserva de imposto aparece 100% de cada venda.', 'Acontece quando o faturamento médio ainda é muito baixo perto do DAS fixo (o DAS sozinho já é maior que a média). Com mais vendas lançadas, a porcentagem cai para o real.'],
      ['O teto aparece menor que R$ 81.000.', 'É o teto proporcional do ano de abertura. Confira a Data de Abertura em Configurar MEI.'],
      ['Uma venda não entra no faturamento.', 'Veja se a chave Conta pro teto MEI está ligada e se a data é do ano atual.'],
      ['Excluí uma venda por engano.', 'Não há como recuperar: lance de novo com Nova venda.'],
      ['Os números sobem devagar quando a tela abre.', 'É a animação do contador; espere 1 segundo para ler o valor final.'],
    ] } },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '04 - MEI - Revenue.docx',
  titulo: 'Manual 04 — MEI Revenue',
  subtitulo: 'Everything the MEI billed this year, how much of the cap it uses and the sales entered',
  info: ['Menu: MEI → Revenue  •  Axioma AI.Tech user manual  •  Version 2.0'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Here you follow **everything the MEI billed this year** and how much of the R$ 81,000 annual cap it uses. The screen shows the sales pace, warns when the cap is near, shows how much to set aside for taxes from each sale, lets you **enter new sales** and generates the **Monthly Gross Revenue Report**, a document the MEI must keep.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **MEI ▼** → **Revenue**.', 'MEI Dashboard → **In** line or the **Revenue** quick-access shortcut.', 'Cockpit → **MEI Cap** card → **See detail**.'] },

    { h1: 'Before you start' },
    { p: 'Set up the MEI in **MEI Dashboard → Configure MEI** (Manual 02): the **Opening Date** sets the proportional cap in the first year and the **Category** sets the DAS used in the tax reserve.' },

    { h1: 'Screen map (top to bottom)' },
    { numerada: [
      '**Header** with Export PDF, New sale, Share and theme.',
      '**Ticker** with revenue, cap and projection.',
      '**Cards:** Revenue for the year, Remaining Limit and Limit Used.',
      '**Automatic tax reserve.**',
      '**Revenue Gauge** with the year\'s cap, the maximum monthly pace and the likely month to exceed it.',
      '**Revenue vs. Cap and Average chart.**',
      '**Axioma Executive Analysis** (Analyze button).',
      '**Monthly Revenue** (table) and the **Monthly Gross Revenue Report** button.',
      '**Year\'s Entries** (list of sales).',
    ] },

    { h1: 'Buttons and actions' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2300, 3700, 3026], linhas: [
      ['Export PDF', 'Generates the PDF of the year\'s revenue.', 'The file is downloaded and "PDF ready — downloaded" appears. Nothing is changed.'],
      ['New sale', 'Opens the window to enter a sale or service.', 'It only saves when you click Save (see step by step).'],
      ['Share', 'Opens the Sharing Center with the revenue summary.', 'You choose the channel and send.'],
      ['Theme (Dark / Light)', 'Changes the look.', 'Kept in the browser.'],
      ['Revenue card', 'Shortcut.', 'Scrolls down to the Year\'s Entries list.'],
      ['Remaining Limit card', 'Shortcut.', 'Opens the MEI Cockpit.'],
      ['Analyze', 'Asks Axioma\'s intelligence for an analysis of your revenue: trend, seasonality, cap risk and what to do.', 'Shows "Analyzing..." and then the text. If the intelligence does not respond, a rule-based analysis appears. Nothing is saved.'],
      ['Monthly Gross Revenue Report', 'Generates the official month-by-month PDF for the year.', 'The file is downloaded. Keep it with the invoices.'],
      ['Counts toward MEI cap (switch on each sale)', 'Turns on or off whether that sale counts toward the cap (for example, a refund that is not revenue).', 'Saved immediately; cards and gauge update. If it fails, the switch reverts and an error notice appears.'],
      ['✏️ Pencil', 'Opens the sale for editing.', 'Save stores the change; Cancel discards it.'],
      ['🗑️ Trash', 'Asks for confirmation: "Delete this entry?".', 'Delete also removes the sale from Revenue (it is the same record). There is no trash to recover it.'],
    ] } },

    { h1: 'What each part shows' },
    { tabela: { colunas: ['Part', 'What it shows'], larguras: [2800, 6226], linhas: [
      ['Revenue (year)', 'Sum of the year\'s sales that count toward the cap.'],
      ['Remaining Limit', 'How much you can still bill this year without exceeding the cap.'],
      ['Limit Used', 'Percentage of the cap already used, with a traffic light: green (calm), yellow (attention), orange (above the cap, up to 120%) and red (above 120%).'],
      ['Automatic tax reserve', 'How much to set aside from each new sale for the DAS and proportional income tax ("Set aside X% of every new revenue"). Each sale in the list shows the amount in reais.'],
      ['Your cap in (year)', 'The year\'s limit. In the opening year it is proportional to the months of activity; otherwise "full cap — full year of activity".'],
      ['How much you can still invoice per month until December', 'The maximum pace to stay under the cap.'],
      ['Likely month to exceed the cap', 'In which month the cap is exceeded at the current pace, or "At the current pace, you will not exceed it this year."'],
      ['Orange band', '"Above the cap, but still manageable until December (supplementary DAS)." Up to 20% over the cap: you remain an MEI until year-end and pay a supplementary DAS on the excess.'],
      ['Red band', '"Risk of retroactive reclassification — over 120% of the cap." Reclassification goes back to the start of the year: talk to your accountant.'],
      ['Revenue vs. Cap and Average', 'Chart with each month\'s revenue, the recommended monthly cap and your average, with "vs. your average" and "vs. previous month" comparisons.'],
    ] } },

    { h1: 'Step by step' },
    { h2: 'Enter a sale' },
    { numerada: [
      'Click **New sale** in the header.',
      'Fill in **Description** and **Amount (R$)**. The **Date** comes with today (you can change it).',
      'Choose the **Category** (Product sales, Services, Recurring, Occasional or Other) and the **Status** (Received or Pending).',
      'Click **Save**. "Entry saved." appears and the cards, gauge and list update.',
    ] },
    { nota: 'The sale is stored in **Revenue** (Financial). It also appears there, feeds the Dashboard, Cash Flow and Income Statement, and is recorded in the audit trail (who entered it and when). If the description, an amount above zero or the date is missing, a red notice appears and the window stays open.' },
    { h2: 'Exclude a sale from the cap' },
    { numerada: ['In the **Year\'s Entries** list, find the sale.', 'Turn off the **Counts toward MEI cap** switch.', 'The cap figures update immediately. The sale stays in Revenue.'] },
    { h2: 'Generate the Monthly Gross Revenue Report' },
    { numerada: ['Scroll to **Monthly Revenue**.', 'Click **Monthly Gross Revenue Report**.', 'Keep the PDF with the period\'s invoices.'] },

    { h1: 'Links with other modules' },
    { tabela: { colunas: ['Module', 'Link'], larguras: [2800, 6226], linhas: [
      ['Revenue (Manual 10)', 'It is the same table: entering here shows there and vice versa.'],
      ['MEI Dashboard and Cockpit', 'Use the revenue and cap calculated here.'],
      ['DAS & Obligations and Income Tax', 'The tax reserve uses the configured DAS and the MEI income tax rule.'],
    ] } },

    { h1: 'Who can do what' },
    { p: 'Anyone with MEI access sees the screen. Entering, editing, deleting and toggling the cap require write permission; read-only profiles see everything, but saving is refused with a notice.' },

    { h1: 'Common problems and solutions' },
    { tabela: { colunas: ['Problem', 'Solution'], larguras: [3400, 5626], linhas: [
      ['The tax reserve shows 100% of each sale.', 'This happens when average revenue is still very low compared with the fixed DAS (the DAS alone is larger than the average). As more sales are entered, the percentage drops to the real figure.'],
      ['The cap shows less than R$ 81,000.', 'It is the proportional cap for the opening year. Check the Opening Date in Configure MEI.'],
      ['A sale does not count in revenue.', 'Check that the Counts toward MEI cap switch is on and that the date is in the current year.'],
      ['I deleted a sale by mistake.', 'It cannot be recovered: enter it again with New sale.'],
      ['Figures count up slowly when the screen opens.', 'That is the counter animation; wait 1 second to read the final value.'],
    ] } },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '04 - MEI - Facturación.docx',
  titulo: 'Manual 04 — Facturación MEI',
  subtitulo: 'Todo lo que el MEI facturó en el año, cuánto consume del tope y las ventas registradas',
  info: ['Menú: MEI → Facturación  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Aquí usted sigue **todo lo que el MEI facturó en el año** y cuánto consume del tope anual de R$ 81.000. La pantalla muestra el ritmo de ventas, avisa cuando el tope está cerca, separa cuánto guardar para impuestos de cada venta, permite **registrar ventas nuevas** y genera el **Informe Mensual de Ingresos Brutos**, documento que el MEI está obligado a guardar.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **MEI ▼** → **Facturación**.', 'Panel MEI → línea **Entró** o atajo **Facturación** en Acceso rápido.', 'Cockpit → tarjeta **Techo del MEI** → **Ver detalle**.'] },

    { h1: 'Antes de empezar' },
    { p: 'Configure el MEI en **Panel MEI → Configurar MEI** (Manual 02): la **Fecha de Apertura** define el tope proporcional del primer año y la **Categoría** define el DAS usado en la reserva de impuestos.' },

    { h1: 'Mapa de la pantalla (de arriba abajo)' },
    { numerada: [
      '**Encabezado** con Exportar PDF, Nueva venta, Compartir y tema.',
      '**Marquesina** con facturación, tope y proyección.',
      '**Tarjetas:** Facturación del año, Límite Restante y Límite Usado.',
      '**Reserva automática de impuestos.**',
      '**Velocímetro de Facturación** con el tope del año, el ritmo máximo por mes y el mes probable de exceso.',
      '**Gráfico Facturación vs. Límite y Promedio.**',
      '**Análisis Ejecutivo Axioma** (botón Analizar).',
      '**Facturación Mensual** (tabla) y el botón del **Informe Mensual de Ingresos Brutos**.',
      '**Movimientos del Año** (lista de ventas).',
    ] },

    { h1: 'Botones y acciones' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2300, 3700, 3026], linhas: [
      ['Exportar PDF', 'Genera el PDF de la facturación del año.', 'El archivo se descarga y aparece "PDF listo — descargado". Nada se altera.'],
      ['Nueva venta', 'Abre la ventana para registrar una venta o servicio.', 'Solo graba al hacer clic en Guardar (vea el paso a paso).'],
      ['Compartir', 'Abre el Centro de Compartir con el resumen de la facturación.', 'Usted elige el canal y envía.'],
      ['Tema (Oscuro / Claro)', 'Cambia la apariencia.', 'Se guarda en el navegador.'],
      ['Tarjeta Facturación', 'Atajo.', 'Baja la pantalla hasta la lista Movimientos del Año.'],
      ['Tarjeta Límite Restante', 'Atajo.', 'Abre el Cockpit MEI.'],
      ['Analizar', 'Pide a la inteligencia de Axioma un análisis de su facturación: tendencia, estacionalidad, riesgo de tope y qué hacer.', 'Muestra "Analizando..." y luego el texto. Si la inteligencia no responde, aparece un análisis por reglas. Nada se graba.'],
      ['Informe Mensual de Ingresos Brutos', 'Genera el PDF oficial mes a mes del año.', 'El archivo se descarga. Guárdelo junto con las facturas.'],
      ['Cuenta para el límite MEI (interruptor en cada venta)', 'Activa o desactiva si esa venta entra en el cálculo del tope (por ejemplo, un reembolso que no es facturación).', 'Se graba al instante; las tarjetas y el velocímetro se actualizan. Si falla, el interruptor vuelve y aparece el aviso de error.'],
      ['✏️ Lápiz', 'Abre la venta para editar.', 'Guardar graba el cambio; Cancelar lo descarta.'],
      ['🗑️ Papelera', 'Pide confirmación: "¿Eliminar este movimiento?".', 'Eliminar borra la venta también en Ingresos (es el mismo registro). No hay papelera para recuperarla.'],
    ] } },

    { h1: 'Qué muestra cada parte' },
    { tabela: { colunas: ['Parte', 'Qué muestra'], larguras: [2800, 6226], linhas: [
      ['Facturación (año)', 'Suma de las ventas del año que cuentan para el tope.'],
      ['Límite Restante', 'Cuánto puede facturar todavía en el año sin pasar el tope.'],
      ['Límite Usado', 'Porcentaje del tope ya usado, con semáforo: verde (tranquilo), amarillo (atención), naranja (por encima del tope, hasta 120%) y rojo (más de 120%).'],
      ['Reserva automática de impuestos', 'Cuánto separar de cada venta nueva para el DAS y el impuesto a la renta proporcional ("Reservar X% de cada nuevo ingreso"). Cada venta de la lista muestra el valor en reales.'],
      ['Su límite en (año)', 'El límite del año. En el año de apertura es proporcional a los meses de actividad; en los demás aparece "límite completo — año completo de actividad".'],
      ['Cuánto aún puede facturar por mes hasta diciembre', 'El ritmo máximo para no superar el tope.'],
      ['Mes probable de superar el límite', 'En qué mes se supera el tope al ritmo actual, o "Al ritmo actual, no lo superará este año."'],
      ['Franja naranja', '"Por encima del límite, pero aún manejable hasta diciembre (DAS complementario)." Hasta 20% sobre el tope: sigue como MEI hasta fin de año y paga un DAS complementario sobre el exceso.'],
      ['Franja roja', '"Riesgo de reclasificación retroactiva — más del 120% del límite." La reclasificación vuelve al inicio del año: consulte al contador.'],
      ['Facturación vs. Límite y Promedio', 'Gráfico con la facturación de cada mes, el límite mensual recomendado y su promedio, con las comparaciones "vs. su promedio" y "vs. mes anterior".'],
    ] } },

    { h1: 'Paso a paso' },
    { h2: 'Registrar una venta' },
    { numerada: [
      'Haga clic en **Nueva venta** en el encabezado.',
      'Complete **Descripción** y **Valor (R$)**. La **Fecha** ya viene con hoy (puede cambiarla).',
      'Elija la **Categoría** (Venta de productos, Prestación de servicios, Recurrentes, Eventuales u Otras) y el **Estado** (Recibido o Pendiente).',
      'Haga clic en **Guardar**. Aparece "Movimiento guardado." y las tarjetas, el velocímetro y la lista se actualizan.',
    ] },
    { nota: 'La venta se graba en **Ingresos** (Financiero). Aparece allí también, entra en el Panel, el Flujo de Caja y el Estado de Resultados, y queda registrada en la pista de auditoría (quién la registró y cuándo). Si falta la descripción, un valor mayor que cero o la fecha, aparece el aviso en rojo y la ventana sigue abierta.' },
    { h2: 'Sacar una venta del tope' },
    { numerada: ['En la lista **Movimientos del Año**, busque la venta.', 'Desactive el interruptor **Cuenta para el límite MEI**.', 'Los números del tope se actualizan al instante. La venta sigue en Ingresos.'] },
    { h2: 'Generar el Informe Mensual de Ingresos Brutos' },
    { numerada: ['Baje hasta **Facturación Mensual**.', 'Haga clic en **Informe Mensual de Ingresos Brutos**.', 'Guarde el PDF con las facturas del período.'] },

    { h1: 'Conexiones con otros módulos' },
    { tabela: { colunas: ['Módulo', 'Conexión'], larguras: [2800, 6226], linhas: [
      ['Ingresos (Manual 10)', 'Es la misma tabla: registrar aquí aparece allá y viceversa.'],
      ['Panel MEI y Cockpit', 'Usan la facturación y el tope calculados aquí.'],
      ['DAS & Obligaciones e Impuesto a la Renta', 'La reserva de impuestos usa el DAS configurado y la regla del impuesto a la renta del MEI.'],
    ] } },

    { h1: 'Quién puede hacer qué' },
    { p: 'Quien accede al MEI ve la pantalla. Registrar, editar, eliminar y activar/desactivar el tope exigen permiso de escritura; los perfiles de solo lectura ven todo, pero la grabación se rechaza con aviso.' },

    { h1: 'Problemas comunes y soluciones' },
    { tabela: { colunas: ['Problema', 'Solución'], larguras: [3400, 5626], linhas: [
      ['La reserva de impuestos aparece en 100% de cada venta.', 'Ocurre cuando la facturación promedio todavía es muy baja frente al DAS fijo (el DAS solo ya es mayor que el promedio). Con más ventas registradas, el porcentaje baja al real.'],
      ['El tope aparece menor que R$ 81.000.', 'Es el tope proporcional del año de apertura. Revise la Fecha de Apertura en Configurar MEI.'],
      ['Una venta no entra en la facturación.', 'Verifique que el interruptor Cuenta para el límite MEI esté activado y que la fecha sea del año actual.'],
      ['Eliminé una venta por error.', 'No se puede recuperar: regístrela de nuevo con Nueva venta.'],
      ['Los números suben despacio al abrir la pantalla.', 'Es la animación del contador; espere 1 segundo para leer el valor final.'],
    ] } },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
