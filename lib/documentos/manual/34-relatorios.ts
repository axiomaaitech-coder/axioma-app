// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '34 - Gestão - Relatórios.docx',
  titulo: 'Manual 34 — Relatórios',
  subtitulo: 'Relatórios executivos prontos para compartilhar',
  info: ['Menu: Gestão → Relatórios  •  Manual de uso do Axioma AI.Tech  •  Versão 2.3 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Reúne em um só lugar os relatórios que sócios, investidores, bancos e o contador costumam pedir, montados automaticamente com os dados do Axioma e prontos para enviar.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **🏢 Gestão ▼** → **Relatórios**.'] },

    { p: '**Pergunte à Inteligência Axioma (Diretor Financeiro Digital):** No alto da tela há uma conversa com a Inteligência Axioma: pergunte digitando ou pelo botão **Falar** e continue o assunto. Peça relatórios sob medida com os dados da sua Empresa, por exemplo "resumo executivo deste mês" ou "relatório das contas vencidas": ela usa o período escolhido na tela e consulta a DRE de qualquer mês ou período pelo mesmo cálculo da tela DRE (impostos aparecem como estimativa pelo regime). Embaixo de cada resposta há **🔊 Ouvir** (a voz do José), **"Quer que eu lembre disso?"** e **"Está errado?"**; abaixo ficam a **Conversa ao vivo** (continua se você mudar de tela) e o painel **Memória da IA**. Os números vêm dos dados da Empresa, conferidos.' },
    { h1: 'Relatório CFO com PDF' },
    { p: 'Logo abaixo da conversa fica o painel **📑 Relatório CFO com PDF**. Ele monta relatórios com os números oficiais do Axioma (os mesmos que a Inteligência Axioma consulta) e baixa um PDF com exatamente o que aparece na tela.' },
    { numerada: ['Em **Relatório**, escolha: Executivo, DRE, Fluxo de Caixa, Contas a Receber, Contas a Pagar, Receitas, Custos e Despesas, Endividamento, Tributos e Obrigações, PDV ou Conciliação.', 'Em **Período**, escolha um período pronto (este mês, mês anterior, trimestre, ano, últimos 12 meses…) ou **Período escolhido** e preencha **De** e **Até** (até 24 meses).', 'Marque **Comparar com o período anterior** para ver quanto mudou em reais e em %.', 'Clique em **Gerar relatório**. Aparece a prévia: situação dos dados, resumo, indicadores, tabelas, riscos com a evidência e a recomendação, limitações e a metodologia.', 'Clique em **Baixar PDF** para salvar o documento com a marca Axioma, data e hora, páginas numeradas e as fontes de cada número.'] },
    { p: 'Cada indicador diz se é **Fato** (lido nos registros), **Cálculo** (fórmula do Axioma) ou **Estimativa** (por exemplo, impostos pelo regime). Quando não há base no período anterior, a tela mostra "sem base para %" em vez de um percentual enganoso. Se uma consulta falhar, o relatório sai **Parcial**, o valor fica como "não consultado" (nunca zero) e o motivo aparece em Limitações; use **Tentar de novo**.' },
    { p: 'Pela conversa (aqui, na IA Financeira ou com o José no Nexus) você também pode pedir "gere a DRE do mês passado" ou "relatório executivo em PDF": a resposta usa os mesmos números e traz o botão **📑 Abrir relatório e PDF**, que abre este painel já preenchido.' },
    { nota: 'O relatório não gasta saldo de IA e nada é alterado nos seus lançamentos: duplicidades e divergências só são apontadas. O PDF é montado no seu navegador e não fica salvo em nenhum link público. O operador de caixa não acessa relatórios financeiros.' },
    { h1: 'Como usar' },
    { numerada: ['Escolha o **Período** (mês e ano).', 'Escolha a aba do relatório.', 'Clique em **Exportar PDF** ou **Compartilhar** para enviar.'] },

    { h1: 'As abas' },
    { tabela: { colunas: ['Aba', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Dashboard Executivo', '**Score CFO** (Excelente, Bom, Regular, Atenção, Crítico), mini indicadores, **Insights Automáticos** e a evolução dos últimos 6 meses.'],
      ['DRE Gerencial', 'Receita Bruta, Deduções (o imposto do seu regime; no MEI, o DAS da categoria certa), Receita Líquida, Custos Variáveis, Margem de Contribuição, Custos Fixos (só os vigentes), Lucro Operacional (EBITDA), Despesas Financeiras e Lucro Líquido, com o **% da Receita**.'],
      ['Evolução 12 Meses', 'Receita, custos, lucro e margem mês a mês.'],
      ['Distribuição de Custos', 'Para onde vai o dinheiro, por categoria — a mesma base da DRE: custos variáveis do período + custos fixos vigentes. Contas a pagar não entram de novo, porque conta paga já vira custo (antes o mesmo gasto aparecia 2 vezes).'],
      ['KPIs & Score CFO', '12 indicadores de **Rentabilidade**, **Liquidez**, **Endividamento**, **Operacional** e **Crescimento**, cada um comparado com a **Meta**. O **Runway** usa o saldo de caixa real (o mesmo do Fluxo de Caixa, com as vendas do PDV).'],
    ] } },
    { h1: 'Centro de Compartilhamento' },
    { p: 'Mostra uma prévia do **Resumo Executivo** e os canais de envio (WhatsApp, Gmail, Outlook, Telegram ou copiar o resumo / o detalhado). O texto, o PDF, os indicadores e as dicas saem no idioma escolhido no Axioma.' },
    { nota: 'Os números são lidos sem limite de linhas. Se alguma leitura falhar, a tela avisa em vez de montar o relatório com zero no lugar do dado que não veio. Sem lançamentos no período, a tela pede para cadastrar receitas e custos primeiro. Os relatórios são calculados por regras sobre os seus dados; para análises em conversa, use a IA Financeira.' },
    { nota: 'O ano inteiro é lido de uma vez, então o relatório abre em poucos segundos. Ao trocar o idioma do Axioma, o relatório é refeito no novo idioma.' },
    { nota: '**Relatório depois da consulta:** peça "gere um relatório" (ou DRE, fluxo de caixa, contas a receber…) e a resposta mostra o cartão **✅ Relatório gerado com sucesso**, com **⬇ Baixar PDF do relatório** (os mesmos números da tela Relatórios) e **📑 Ver na tela**. Embaixo de qualquer resposta há também **📄 Relatório desta resposta (PDF)**, que salva a pergunta e a resposta com o nome da Empresa e a data.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '34 - Management - Reports.docx',
  titulo: 'Manual 34 — Reports',
  subtitulo: 'Executive reports ready to share',
  info: ['Menu: Management → Reports  •  Axioma AI.Tech user manual  •  Version 2.3 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Gathers in one place the reports partners, investors, banks and the accountant usually ask for, built automatically from Axioma’s data and ready to send.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **🏢 Management ▼** → **Reports**.'] },

    { p: '**Ask Axioma Intelligence (Digital Finance Director):** At the top of the screen there is a conversation with Axioma Intelligence: ask by typing or with **Speak** and follow up. Ask for custom reports with your Company data, e.g. "executive summary of this month" or "report of overdue bills": it uses the period chosen on the screen and looks up the income statement for any month or period with the same calculation as the DRE screen (taxes shown as an estimate by tax regime). Below each answer there is **🔊 Listen** (José\'s voice), **"Should I remember this?"** and **"Is this wrong?"**; below are the **Live conversation** (it continues if you change screens) and the **AI Memory** panel. Numbers come from the Company data, checked.' },
    { h1: 'CFO Report with PDF' },
    { p: 'Right below the conversation is the **📑 CFO Report with PDF** panel. It builds reports with the official Axioma numbers (the same ones Axioma Intelligence queries) and downloads a PDF with exactly what appears on screen.' },
    { numerada: ['In **Report**, choose: Executive, Income Statement, Cash Flow, Accounts Receivable, Accounts Payable, Revenue, Costs and Expenses, Debt, Taxes and Obligations, POS or Reconciliation.', 'In **Period**, choose a ready period (this month, previous month, quarter, year, last 12 months…) or **Custom period** and fill in **From** and **To** (up to 24 months).', 'Check **Compare with the previous period** to see how much changed in reais and in %.', 'Click **Generate report**. The preview shows: data status, summary, indicators, tables, risks with evidence and recommendation, limitations and methodology.', 'Click **Download PDF** to save the document with the Axioma brand, date and time, numbered pages and the sources of each number.'] },
    { p: 'Each indicator says whether it is a **Fact** (read from records), a **Calculation** (Axioma formula) or an **Estimate** (for example, taxes by regime). When the previous period has no base, the screen shows "no base for %" instead of a misleading percentage. If a query fails, the report comes out **Partial**, the value shows "not queried" (never zero) and the reason appears under Limitations; use **Try again**.' },
    { p: 'In the conversation (here, in AI Finance or with José in Nexus) you can also ask "generate the income statement for last month" or "executive report in PDF": the answer uses the same numbers and brings the **📑 Open report and PDF** button, which opens this panel already filled in.' },
    { nota: 'The report does not use AI balance and nothing is changed in your entries: duplicates and divergences are only flagged. The PDF is built in your browser and is not stored at any public link. The cashier operator cannot access financial reports.' },
    { h1: 'How to use' },
    { numerada: ['Choose the **Period** (month and year).', 'Choose the report tab.', 'Click **Export PDF** or **Share** to send it.'] },

    { h1: 'The tabs' },
    { tabela: { colunas: ['Tab', 'What it shows'], larguras: [2600, 6426], linhas: [
      ['Executive Dashboard', '**CFO Score** (Excellent, Good, Fair, Attention, Critical), mini indicators, **Automatic Insights** and the evolution of the last 6 months.'],
      ['Income Statement', 'Gross Revenue, Deductions (your regime’s tax; for MEI, the DAS of the right category), Net Revenue, Variable Costs, Contribution Margin, Fixed Costs (only active ones), Operating Profit (EBITDA), Financial Expenses and Net Profit, with the **% of Revenue**.'],
      ['12-Month Evolution', 'Revenue, costs, profit and margin month by month.'],
      ['Cost Distribution', 'Where the money goes, by category — the same basis as the Income Statement: period variable costs + active fixed costs. Payables are not counted again, because a paid bill already becomes a cost (before, the same expense appeared twice).'],
      ['KPIs & CFO Score', '12 indicators of **Profitability**, **Liquidity**, **Indebtedness**, **Operations** and **Growth**, each compared with the **Target**. **Runway** uses the real cash balance (the same as Cash Flow, including POS sales).'],
    ] } },
    { h1: 'Sharing Center' },
    { p: 'Shows a preview of the **Executive Summary** and the sending channels (WhatsApp, Gmail, Outlook, Telegram or copy the summary / the detailed version). The text, PDF, indicators and tips come out in the language chosen in Axioma.' },
    { nota: 'Numbers are read with no row limit. If any loading fails, the screen warns you instead of building the report with zero in place of the missing data. With no entries in the period, the screen asks you to register revenue and costs first. Reports are calculated by rules on your data; for conversational analysis, use Financial AI.' },
    { nota: 'The whole year is read at once, so the report opens in a few seconds. When you change Axioma’s language, the report is rebuilt in the new language.' },
    { nota: '**Report after the consultation:** ask "generate a report" (or income statement, cash flow, receivables…) and the answer shows the **✅ Report generated successfully** card, with **⬇ Download report PDF** (the same numbers as the Reports screen) and **📑 View on screen**. Under any answer there is also **📄 Report of this answer (PDF)**, which saves the question and the answer with the Company name and date.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '34 - Gestión - Informes.docx',
  titulo: 'Manual 34 — Informes',
  subtitulo: 'Informes ejecutivos listos para compartir',
  info: ['Menú: Gestión → Informes  •  Manual de uso de Axioma AI.Tech  •  Versión 2.3 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Reúne en un solo lugar los informes que socios, inversionistas, bancos y el contador suelen pedir, armados automáticamente con los datos de Axioma y listos para enviar.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **🏢 Gestión ▼** → **Informes**.'] },

    { p: '**Pregunte a la Inteligencia Axioma (Director Financiero Digital):** Arriba en la pantalla hay una conversación con la Inteligencia Axioma: pregunte escribiendo o con **Hablar** y continúe el tema. Pida informes a medida con los datos de su Empresa, por ejemplo "resumen ejecutivo del mes" o "informe de cuentas vencidas": usa el período elegido en la pantalla y consulta el estado de resultados de cualquier mes o período con el mismo cálculo de la pantalla DRE (los impuestos aparecen como estimación por régimen). Debajo de cada respuesta hay **🔊 Escuchar** (la voz de José), **"¿Quiere que recuerde esto?"** y **"¿Está mal?"**; abajo están la **Conversación en vivo** (continúa si cambia de pantalla) y el panel **Memoria de la IA**. Los números vienen de los datos de la Empresa, verificados.' },
    { h1: 'Informe CFO con PDF' },
    { p: 'Justo debajo de la conversación está el panel **📑 Informe CFO con PDF**. Arma informes con los números oficiales de Axioma (los mismos que consulta la Inteligencia Axioma) y descarga un PDF con exactamente lo que aparece en pantalla.' },
    { numerada: ['En **Informe**, elija: Ejecutivo, Estado de Resultados, Flujo de Caja, Cuentas por Cobrar, Cuentas por Pagar, Ingresos, Costos y Gastos, Endeudamiento, Tributos y Obligaciones, PDV o Conciliación.', 'En **Período**, elija un período listo (este mes, mes anterior, trimestre, año, últimos 12 meses…) o **Período elegido** y complete **Desde** y **Hasta** (hasta 24 meses).', 'Marque **Comparar con el período anterior** para ver cuánto cambió en reales y en %.', 'Haga clic en **Generar informe**. Aparece la vista previa: situación de los datos, resumen, indicadores, tablas, riesgos con la evidencia y la recomendación, limitaciones y la metodología.', 'Haga clic en **Descargar PDF** para guardar el documento con la marca Axioma, fecha y hora, páginas numeradas y las fuentes de cada número.'] },
    { p: 'Cada indicador dice si es **Hecho** (leído en los registros), **Cálculo** (fórmula de Axioma) o **Estimación** (por ejemplo, impuestos por régimen). Cuando no hay base en el período anterior, la pantalla muestra "sin base para %" en lugar de un porcentaje engañoso. Si una consulta falla, el informe sale **Parcial**, el valor queda como "no consultado" (nunca cero) y el motivo aparece en Limitaciones; use **Intentar de nuevo**.' },
    { p: 'En la conversación (aquí, en la IA Financiera o con José en Nexus) también puede pedir "genere el estado de resultados del mes pasado" o "informe ejecutivo en PDF": la respuesta usa los mismos números y trae el botón **📑 Abrir informe y PDF**, que abre este panel ya completado.' },
    { nota: 'El informe no gasta saldo de IA y nada se altera en sus registros: duplicidades y divergencias solo se señalan. El PDF se arma en su navegador y no queda guardado en ningún enlace público. El operador de caja no accede a informes financieros.' },
    { h1: 'Cómo usar' },
    { numerada: ['Elija el **Período** (mes y año).', 'Elija la pestaña del informe.', 'Haga clic en **Exportar PDF** o **Compartir** para enviar.'] },

    { h1: 'Las pestañas' },
    { tabela: { colunas: ['Pestaña', 'Qué muestra'], larguras: [2600, 6426], linhas: [
      ['Dashboard Ejecutivo', '**Score CFO** (Excelente, Bueno, Regular, Atención, Crítico), mini indicadores, **Insights Automáticos** y la evolución de los últimos 6 meses.'],
      ['Estado de Resultados', 'Ingreso Bruto, Deducciones (el impuesto de su régimen; en el MEI, el DAS de la categoría correcta), Ingreso Neto, Costos Variables, Margen de Contribución, Costos Fijos (solo los vigentes), Utilidad Operativa (EBITDA), Gastos Financieros y Utilidad Neta, con el **% del Ingreso**.'],
      ['Evolución 12 Meses', 'Ingresos, costos, utilidad y margen mes a mes.'],
      ['Distribución de Costos', 'A dónde va el dinero, por categoría — la misma base del Estado de Resultados: costos variables del período + costos fijos vigentes. Las cuentas por pagar no entran de nuevo, porque una cuenta pagada ya se vuelve costo (antes el mismo gasto aparecía 2 veces).'],
      ['KPIs & Score CFO', '12 indicadores de **Rentabilidad**, **Liquidez**, **Endeudamiento**, **Operación** y **Crecimiento**, cada uno comparado con la **Meta**. El **Runway** usa el saldo real de caja (el mismo del Flujo de Caja, con las ventas del PDV).'],
    ] } },
    { h1: 'Centro de Compartir' },
    { p: 'Muestra una vista previa del **Resumen Ejecutivo** y los canales de envío (WhatsApp, Gmail, Outlook, Telegram o copiar el resumen / el detallado). El texto, el PDF, los indicadores y los consejos salen en el idioma elegido en Axioma.' },
    { nota: 'Los números se leen sin límite de filas. Si alguna lectura falla, la pantalla avisa en lugar de armar el informe con cero en lugar del dato que no llegó. Sin registros en el período, la pantalla pide registrar ingresos y costos primero. Los informes se calculan por reglas sobre sus datos; para análisis en conversación, use la IA Financiera.' },
    { nota: 'Todo el año se lee de una vez, así que el informe abre en pocos segundos. Al cambiar el idioma de Axioma, el informe se rehace en el nuevo idioma.' },
    { nota: '**Informe después de la consulta:** pida "genere un informe" (o estado de resultados, flujo de caja, cuentas por cobrar…) y la respuesta muestra la tarjeta **✅ Informe generado con éxito**, con **⬇ Descargar PDF del informe** (los mismos números de la pantalla Informes) y **📑 Ver en pantalla**. Debajo de cualquier respuesta también está **📄 Informe de esta respuesta (PDF)**, que guarda la pregunta y la respuesta con el nombre de la Empresa y la fecha.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
