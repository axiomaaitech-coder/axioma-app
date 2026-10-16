// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '34 - Gestão - Relatórios.docx',
  titulo: 'Manual 34 — Relatórios',
  subtitulo: 'Relatórios executivos prontos para compartilhar',
  info: ['Menu: Gestão → Relatórios  •  Manual de uso do Axioma AI.Tech  •  Versão 2.1 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Reúne em um só lugar os relatórios que sócios, investidores, bancos e o contador costumam pedir, montados automaticamente com os dados do Axioma e prontos para enviar.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **🏢 Gestão ▼** → **Relatórios**.'] },

    { p: '**Pergunte à Inteligência Axioma (Diretor Financeiro Digital):** No alto da tela há uma conversa com a Inteligência Axioma: pergunte digitando ou pelo botão **Falar** e continue o assunto. Peça relatórios sob medida com os dados da sua Empresa, por exemplo "resumo executivo deste mês" ou "relatório das contas vencidas": ela usa o período escolhido na tela. Embaixo de cada resposta há **🔊 Ouvir** (a voz do José), **"Quer que eu lembre disso?"** e **"Está errado?"**; abaixo ficam a **Conversa ao vivo** (continua se você mudar de tela) e o painel **Memória da IA**. Os números vêm dos dados da Empresa, conferidos.' },
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
  ],
}

const en: DocumentoAxioma = {
  arquivo: '34 - Management - Reports.docx',
  titulo: 'Manual 34 — Reports',
  subtitulo: 'Executive reports ready to share',
  info: ['Menu: Management → Reports  •  Axioma AI.Tech user manual  •  Version 2.1 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Gathers in one place the reports partners, investors, banks and the accountant usually ask for, built automatically from Axioma’s data and ready to send.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **🏢 Management ▼** → **Reports**.'] },

    { p: '**Ask Axioma Intelligence (Digital Finance Director):** At the top of the screen there is a conversation with Axioma Intelligence: ask by typing or with **Speak** and follow up. Ask for custom reports with your Company data, e.g. "executive summary of this month" or "report of overdue bills": it uses the period chosen on the screen. Below each answer there is **🔊 Listen** (José\'s voice), **"Should I remember this?"** and **"Is this wrong?"**; below are the **Live conversation** (it continues if you change screens) and the **AI Memory** panel. Numbers come from the Company data, checked.' },
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
  ],
}

const es: DocumentoAxioma = {
  arquivo: '34 - Gestión - Informes.docx',
  titulo: 'Manual 34 — Informes',
  subtitulo: 'Informes ejecutivos listos para compartir',
  info: ['Menú: Gestión → Informes  •  Manual de uso de Axioma AI.Tech  •  Versión 2.1 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Reúne en un solo lugar los informes que socios, inversionistas, bancos y el contador suelen pedir, armados automáticamente con los datos de Axioma y listos para enviar.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **🏢 Gestión ▼** → **Informes**.'] },

    { p: '**Pregunte a la Inteligencia Axioma (Director Financiero Digital):** Arriba en la pantalla hay una conversación con la Inteligencia Axioma: pregunte escribiendo o con **Hablar** y continúe el tema. Pida informes a medida con los datos de su Empresa, por ejemplo "resumen ejecutivo del mes" o "informe de cuentas vencidas": usa el período elegido en la pantalla. Debajo de cada respuesta hay **🔊 Escuchar** (la voz de José), **"¿Quiere que recuerde esto?"** y **"¿Está mal?"**; abajo están la **Conversación en vivo** (continúa si cambia de pantalla) y el panel **Memoria de la IA**. Los números vienen de los datos de la Empresa, verificados.' },
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
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
