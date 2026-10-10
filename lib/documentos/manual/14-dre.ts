// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '14 - DRE.docx',
  titulo: 'Manual 14 — DRE (Demonstração do Resultado)',
  subtitulo: 'Lucro ou prejuízo, por quê, e o que fazer — montada sozinha, por competência',
  info: ['Menu: Financeiro → DRE  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A DRE mostra se a empresa **dá lucro ou prejuízo** e explica a **causa**. Não precisa lançar nada aqui: ela é montada com Receitas, Contas a Receber, vendas do PDV, Custos Variáveis, Contas a Pagar, Custos Fixos, impostos pelo regime tributário e juros.' },

    { h1: 'Como o Axioma monta a DRE (competência)' },
    { lista: [
      'A venda entra no mês em que **aconteceu** (emissão da conta a receber, data da receita, dia da venda no PDV) — não no mês em que o dinheiro entrou. Venda do PDV cancelada vira **devolução** no mês do cancelamento.',
      'A compra entra no mês da **emissão** da conta a pagar ou da data do custo. A mesma compra nunca conta duas vezes (nota importada + conta gerada).',
      '**Custo fixo** entra só nos meses entre "Vale desde" e "Até" do cadastro.',
      'Impostos pelo **regime tributário** da empresa (Simples pelo anexo da atividade; MEI pelo DAS do mês).',
      '**Despesas financeiras** = juros **pagos** de verdade (multas e juros de contas pagas com atraso) + juros **estimados** das dívidas (saldo devedor × taxa). Os dois aparecem separados.',
    ] },
    { nota: 'Quando algum dado não carrega, a tela avisa "Alguns dados não carregaram — a DRE pode estar incompleta". As premissas usadas (ex.: custo fixo sem data de início conta desde o cadastro) aparecem escritas na tela.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Financeiro ▼** → **DRE**.', 'Cartões **Total Anual** (Custos Fixos) e **Total do Mês** (Custos Variáveis).'] },

    { h1: 'Botões' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera o PDF da DRE do período.', 'O arquivo é baixado.'],
      ['Seletor de período', 'Escolhe o período (Mês atual, Mês anterior, Trimestre, Ano, Últimos 12 meses, Personalizado).', 'Tudo recalcula, inclusive a comparação com o período anterior.'],
      ['**Ver Histórico**', 'Mostra os resultados guardados de cada período.', 'Período fechado fica congelado; o atual aparece "Em andamento".'],
      ['**Compartilhar**', 'Abre a Central de Compartilhamento com o resultado.', 'WhatsApp, e-mail, copiar ou PDF.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Cartões e Semáforo de Saúde' },
    { p: '**Receita Bruta**, **Lucro Líquido** e **Margem Líquida** do período. O **Semáforo** (verde, amarelo ou vermelho) junta quatro sinais — Margem Líquida, EBITDA em queda, Peso do Custo Fixo e Concentração de Clientes — e fica com a pior cor.' },
    { h2: 'Indicadores CFO' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['💰 Lucro Líquido', 'O resultado final do período.'],
      ['📈 EBITDA', 'Resultado da operação, antes de juros.'],
      ['Margem Líquida', 'Lucro ÷ receita. Acima de 10% verde; de 0 a 10% amarelo; negativa vermelho.'],
      ['📊 Margem de Contribuição', 'Quanto sobra das vendas para pagar a estrutura.'],
      ['Margem de Segurança', 'Quanto a receita pode cair antes do prejuízo.'],
      ['⏳ Runway', 'Em prejuízo, quantos meses o caixa aguenta no ritmo atual; "—" quando há lucro.'],
    ] } },
    { h2: 'Diagnóstico de Lucratividade (causa raiz)' },
    { p: 'Explica quanto da variação do lucro veio da receita, dos impostos, dos custos variáveis, dos fixos e dos juros. Ex.: "O lucro líquido subiu R$ 3.376, puxado principalmente por Custos Variáveis".' },
    { h2: 'Ponte Lucro × Caixa' },
    { p: 'Compara o lucro com o dinheiro que realmente entrou e saiu (inclusive PDV) e aponta a causa provável da diferença: recebíveis parados, pagamento de dívida, custos lançados ainda não pagos.' },
    { h2: 'Cascata do Resultado' },
    { tabela: { colunas: ['Linha', 'O que é'], larguras: [3600, 5426], linhas: [
      ['Receita Bruta', 'Tudo o que foi vendido no período.'],
      ['(-) Devoluções e cancelamentos', 'Aparece só quando há (vendas do PDV canceladas).'],
      ['(-) Deduções e Impostos', 'Impostos sobre a venda, pelo regime da empresa.'],
      ['Receita Líquida', 'O que sobra depois dos impostos.'],
      ['(-) Custos Variáveis', 'Custos que acompanham as vendas.'],
      ['Margem de Contribuição', 'O que sobra para pagar a estrutura.'],
      ['(-) Custos Fixos', 'A estrutura do período (pela vigência).'],
      ['EBITDA', 'Resultado operacional.'],
      ['(-) Despesas Financeiras', 'Juros pagos + juros estimados das dívidas.'],
      ['Lucro Líquido', 'O resultado final.'],
    ] } },
    { p: 'Ao lado de cada linha: **AV%** (peso sobre a receita líquida) e **AH%** (variação contra o período anterior). Abaixo, a **Previsão** do lucro para os próximos 3 meses.' },
    { h2: 'Conselho CFO' },
    { p: 'Recomendações práticas quando há algo crítico. No prejuízo, o conselho diz isso claramente e sugere segurar gastos novos, rever custos ou aumentar a receita — nunca "está tudo sob controle" com prejuízo.' },
    { h2: 'Histórico de Resultados' },
    { p: 'A DRE guarda um retrato de cada período para comparar a evolução. Para conferir se a DRE bate com a Contabilidade mês a mês, use **Contabilidade → Conferência**.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '14 - Income Statement.docx',
  titulo: 'Manual 14 — Income Statement (P&L)',
  subtitulo: 'Profit or loss, why, and what to do — built automatically, on an accrual basis',
  info: ['Menu: Financial → Income Statement  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'The P&L shows whether the company **makes a profit or a loss** and explains **why**. You do not enter anything here: it is built from Revenue, Receivables, POS sales, Variable Costs, Payables, Fixed Costs, taxes by tax regime and interest.' },

    { h1: 'How Axioma builds the P&L (accrual basis)' },
    { lista: [
      'A sale counts in the month it **happened** (receivable issue date, revenue date, POS sale day) — not the month the money came in. A cancelled POS sale becomes a **return** in the month of cancellation.',
      'A purchase counts in the month of the payable\'s **issue date** or the cost date. The same purchase never counts twice (imported invoice + generated bill).',
      'A **fixed cost** counts only in the months between its "Valid from" and "Until".',
      'Taxes by the company\'s **tax regime** (Simples by activity annex; MEI by the month\'s DAS).',
      '**Financial expenses** = interest actually **paid** (late fees and interest on bills paid late) + **estimated** debt interest (balance × rate). Both are shown separately.',
    ] },
    { nota: 'When some data does not load, the screen warns "Some data did not load — the P&L may be incomplete". The assumptions used (e.g., a fixed cost without a start date counts from registration) are written on the screen.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Financial ▼** → **Income Statement**.', '**Annual Total** (Fixed Costs) and **Month Total** (Variable Costs) cards.'] },

    { h1: 'Buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates the P&L PDF for the period.', 'The file is downloaded.'],
      ['Period selector', 'Chooses the period (Current month, Previous month, Quarter, Year, Last 12 months, Custom).', 'Everything recalculates, including the comparison with the previous period.'],
      ['**View History**', 'Shows the saved results of each period.', 'Closed periods are frozen; the current one shows "In progress".'],
      ['**Share**', 'Opens the Sharing Center with the result.', 'WhatsApp, email, copy or PDF.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: 'Cards and Health Light' },
    { p: '**Gross Revenue**, **Net Profit** and **Net Margin** for the period. The **Health Light** (green, yellow or red) combines four signals — Net Margin, falling EBITDA, Fixed Cost Weight and Customer Concentration — and takes the worst color.' },
    { h2: 'CFO indicators' },
    { tabela: { colunas: ['Indicator', 'What it means'], larguras: [2800, 6226], linhas: [
      ['💰 Net Profit', 'The final result for the period.'],
      ['📈 EBITDA', 'Operating result, before interest.'],
      ['Net Margin', 'Profit ÷ revenue. Above 10% green; 0 to 10% yellow; negative red.'],
      ['📊 Contribution Margin', 'What is left from sales to pay the structure.'],
      ['Margin of Safety', 'How much revenue can drop before a loss.'],
      ['⏳ Runway', 'At a loss, how many months cash lasts at the current pace; "—" when profitable.'],
    ] } },
    { h2: 'Profitability Diagnosis (root cause)' },
    { p: 'Explains how much of the profit change came from revenue, taxes, variable costs, fixed costs and interest. E.g., "Net profit rose R$ 3,376, driven mainly by Variable Costs".' },
    { h2: 'Profit × Cash Bridge' },
    { p: 'Compares profit with the money that actually came in and went out (including POS) and points to the likely cause of the difference: stuck receivables, debt payments, costs entered but not yet paid.' },
    { h2: 'Result Waterfall' },
    { tabela: { colunas: ['Line', 'What it is'], larguras: [3600, 5426], linhas: [
      ['Gross Revenue', 'Everything sold in the period.'],
      ['(-) Returns & cancellations', 'Shows only when there are any (cancelled POS sales).'],
      ['(-) Deductions and Taxes', 'Sales taxes, by the company\'s regime.'],
      ['Net Revenue', 'What is left after taxes.'],
      ['(-) Variable Costs', 'Costs that follow sales.'],
      ['Contribution Margin', 'What is left to pay the structure.'],
      ['(-) Fixed Costs', 'The period\'s structure (by validity).'],
      ['EBITDA', 'Operating result.'],
      ['(-) Financial Expenses', 'Interest paid + estimated debt interest.'],
      ['Net Profit', 'The final result.'],
    ] } },
    { p: 'Next to each line: **VA%** (weight on net revenue) and **HA%** (change versus the previous period). Below, the profit **Forecast** for the next 3 months.' },
    { h2: 'CFO Advice' },
    { p: 'Practical recommendations when something is critical. At a loss, the advice says so clearly and suggests holding new spending, reviewing costs or increasing revenue — never "all under control" with a loss.' },
    { h2: 'Results History' },
    { p: 'The P&L keeps a snapshot of each period to compare over time. To check whether the P&L matches Accounting month by month, use **Accounting → Reconciliation**.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '14 - Estado de Resultados.docx',
  titulo: 'Manual 14 — Estado de Resultados',
  subtitulo: 'Ganancia o pérdida, por qué y qué hacer — armado solo, por devengo',
  info: ['Menú: Financiero → Estado de Resultados  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'El Estado de Resultados muestra si la empresa **gana o pierde** y explica **por qué**. No hay que registrar nada aquí: se arma con Ingresos, Cuentas por Cobrar, ventas del PDV, Costos Variables, Cuentas por Pagar, Costos Fijos, impuestos por régimen tributario e intereses.' },

    { h1: 'Cómo arma Axioma el Estado de Resultados (devengo)' },
    { lista: [
      'La venta cuenta en el mes en que **ocurrió** (emisión de la cuenta por cobrar, fecha del ingreso, día de la venta en el PDV) — no en el mes en que entró el dinero. Una venta del PDV cancelada pasa a ser **devolución** en el mes de la cancelación.',
      'La compra cuenta en el mes de **emisión** de la cuenta por pagar o en la fecha del costo. La misma compra nunca cuenta dos veces (factura importada + cuenta generada).',
      'El **costo fijo** cuenta solo en los meses entre "Vigente desde" y "Hasta".',
      'Impuestos según el **régimen tributario** de la empresa (Simples por el anexo de la actividad; MEI por el DAS del mes).',
      '**Gastos financieros** = intereses **pagados** de verdad (multas e intereses de cuentas pagadas con atraso) + intereses **estimados** de las deudas (saldo × tasa). Ambos aparecen separados.',
    ] },
    { nota: 'Cuando algún dato no carga, la pantalla avisa "Algunos datos no cargaron — el estado de resultados puede estar incompleto". Las premisas usadas (ej.: costo fijo sin fecha de inicio cuenta desde el registro) aparecen escritas en la pantalla.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Financiero ▼** → **Estado de Resultados**.', 'Tarjetas **Total Anual** (Costos Fijos) y **Total del Mes** (Costos Variables).'] },

    { h1: 'Botones' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera el PDF del período.', 'El archivo se descarga.'],
      ['Selector de período', 'Elige el período (Mes actual, Mes anterior, Trimestre, Año, Últimos 12 meses, Personalizado).', 'Todo se recalcula, incluida la comparación con el período anterior.'],
      ['**Ver Historial**', 'Muestra los resultados guardados de cada período.', 'El período cerrado queda congelado; el actual aparece "En curso".'],
      ['**Compartir**', 'Abre el Centro de Compartir con el resultado.', 'WhatsApp, correo, copiar o PDF.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Tarjetas y Semáforo de Salud' },
    { p: '**Ingreso Bruto**, **Ganancia Neta** y **Margen Neto** del período. El **Semáforo** (verde, amarillo o rojo) junta cuatro señales — Margen Neto, EBITDA en caída, Peso del Costo Fijo y Concentración de Clientes — y queda con el peor color.' },
    { h2: 'Indicadores CFO' },
    { tabela: { colunas: ['Indicador', 'Qué significa'], larguras: [2800, 6226], linhas: [
      ['💰 Ganancia Neta', 'El resultado final del período.'],
      ['📈 EBITDA', 'Resultado de la operación, antes de intereses.'],
      ['Margen Neto', 'Ganancia ÷ ingresos. Por encima de 10% verde; de 0 a 10% amarillo; negativo rojo.'],
      ['📊 Margen de Contribución', 'Cuánto queda de las ventas para pagar la estructura.'],
      ['Margen de Seguridad', 'Cuánto pueden caer los ingresos antes de la pérdida.'],
      ['⏳ Runway', 'Con pérdida, cuántos meses aguanta la caja al ritmo actual; "—" cuando hay ganancia.'],
    ] } },
    { h2: 'Diagnóstico de Rentabilidad (causa raíz)' },
    { p: 'Explica cuánto de la variación de la ganancia vino de los ingresos, impuestos, costos variables, fijos e intereses. Ej.: "La ganancia neta subió R$ 3.376, impulsada principalmente por Costos Variables".' },
    { h2: 'Puente Ganancia × Caja' },
    { p: 'Compara la ganancia con el dinero que realmente entró y salió (incluido el PDV) y señala la causa probable de la diferencia: cuentas por cobrar paradas, pago de deudas, costos registrados aún no pagados.' },
    { h2: 'Cascada del Resultado' },
    { tabela: { colunas: ['Línea', 'Qué es'], larguras: [3600, 5426], linhas: [
      ['Ingreso Bruto', 'Todo lo vendido en el período.'],
      ['(-) Devoluciones y cancelaciones', 'Aparece solo cuando hay (ventas del PDV canceladas).'],
      ['(-) Deducciones e Impuestos', 'Impuestos sobre la venta, según el régimen de la empresa.'],
      ['Ingreso Neto', 'Lo que queda después de impuestos.'],
      ['(-) Costos Variables', 'Costos que acompañan las ventas.'],
      ['Margen de Contribución', 'Lo que queda para pagar la estructura.'],
      ['(-) Costos Fijos', 'La estructura del período (por vigencia).'],
      ['EBITDA', 'Resultado operativo.'],
      ['(-) Gastos Financieros', 'Intereses pagados + intereses estimados de las deudas.'],
      ['Ganancia Neta', 'El resultado final.'],
    ] } },
    { p: 'Junto a cada línea: **AV%** (peso sobre el ingreso neto) y **AH%** (variación frente al período anterior). Abajo, la **Previsión** de la ganancia para los próximos 3 meses.' },
    { h2: 'Consejo CFO' },
    { p: 'Recomendaciones prácticas cuando hay algo crítico. Con pérdida, el consejo lo dice claramente y sugiere frenar gastos nuevos, revisar costos o aumentar ingresos — nunca "todo bajo control" con pérdida.' },
    { h2: 'Historial de Resultados' },
    { p: 'El Estado de Resultados guarda una foto de cada período para comparar la evolución. Para revisar si coincide con la Contabilidad mes a mes, use **Contabilidad → Conciliación**.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
