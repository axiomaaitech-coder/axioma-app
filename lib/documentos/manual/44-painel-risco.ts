// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '44 - Painel de Risco.docx',
  titulo: 'Manual 44 — Painel de Risco e Métricas do CFO',
  subtitulo: 'O que pode dar problema de dinheiro, com nota de 0 a 100 e o porquê em números',
  info: ['Menu: Financeiro → Painel de Risco  •  Manual de uso do Axioma AI.Tech  •  Versão 1.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Junta numa tela só **os riscos de dinheiro da empresa** e as **métricas que um diretor financeiro acompanha**. Cada risco ganha uma nota de 0 a 100 (100 = nenhum risco à vista) e uma frase com os números que explicam a nota. Só leitura: nada é gravado aqui.' },
    { nota: 'Os números vêm do mesmo retrato da empresa que a IA usa (médias mensais dos últimos 12 meses, caixa realizado de hoje, contas em aberto). Assim o painel e a IA nunca falam números diferentes.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Financeiro ▼** → **Painel de Risco**.'] },

    { h1: 'Nota geral de risco' },
    { p: 'No topo: a média das notas que têm dado. **Clique na nota** para abrir o pior risco da lista.' },

    { h1: 'Os 6 riscos (o pior aparece primeiro)' },
    { tabela: { colunas: ['Risco', 'Como é medido', 'Leva para'], larguras: [2600, 4200, 2226], linhas: [
      ['Liquidez', 'Caixa de hoje ÷ contas a pagar dos próximos 30 dias. 1,5x ou mais = 100.', 'Tesouraria'],
      ['Clientes atrasando', '% do a receber que já venceu. Até 5% = 100.', 'Inadimplência'],
      ['Dependência do maior cliente', '% do a receber concentrado em um cliente. Até 20% = 100.', 'Clientes'],
      ['Margem de lucro', 'Lucro ÷ receita. 15% ou mais = 100; prejuízo = 15.', 'DRE'],
      ['Dívida pesando', 'Saldo devedor ÷ receita do ano. Até 20% = 100.', 'Endividamento'],
      ['Contas e impostos atrasados', '% do a pagar vencido; obrigação fiscal atrasada derruba para 40.', 'Contas a Pagar'],
    ] } },
    { p: 'Cada cartão tem um selo com a nota e o nível — **Tranquilo** (100), **Atenção** (70 a 99), **Risco** (abaixo de 70) ou **Sem dado**. **O selo e o botão Ver detalhes** abrem o módulo daquele risco. Sem dado (ex.: nenhuma conta a receber) não entra na média — o Axioma não inventa nota.' },

    { h1: 'Métricas do CFO' },
    { tabela: { colunas: ['Métrica', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['Margem de lucro', 'Lucro ÷ receita, média mensal de 12 meses.'],
      ['Ponto de equilíbrio', 'Quanto precisa vender por mês para não ter prejuízo.'],
      ['Prazo médio para receber', 'Da emissão até o dinheiro entrar (contas recebidas em 12 meses, ponderado pelo valor). "—" se ainda não há conta recebida.'],
      ['Prazo médio para pagar', 'Da emissão até você pagar (contas pagas em 12 meses).'],
      ['Ciclo de caixa', 'Receber − pagar. Positivo: você paga antes de receber e o caixa banca a operação.'],
      ['Quanto o caixa aguenta', 'Caixa ÷ saídas do mês, se nenhuma venda entrar.'],
    ] } },
    { alerta: 'Use o painel para decidir onde agir primeiro: comece pelo cartão vermelho de nota mais baixa.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '44 - Risk Panel.docx',
  titulo: 'Manual 44 — Risk Panel and CFO Metrics',
  subtitulo: 'What could cause money trouble, with a 0–100 score and the reason in numbers',
  info: ['Menu: Financial → Risk Panel  •  Axioma AI.Tech user manual  •  Version 1.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Brings together on one screen **the company\'s money risks** and the **metrics a CFO tracks**. Each risk gets a 0–100 score (100 = no risk in sight) and a sentence with the numbers behind it. Read-only: nothing is saved here.' },
    { nota: 'The numbers come from the same company snapshot the AI uses (monthly averages of the last 12 months, today\'s actual cash, open bills). So the panel and the AI never state different numbers.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Financial ▼** → **Risk Panel**.'] },

    { h1: 'Overall risk score' },
    { p: 'At the top: the average of the scores that have data. **Click the score** to open the worst risk on the list.' },

    { h1: 'The 6 risks (worst first)' },
    { tabela: { colunas: ['Risk', 'How it is measured', 'Takes you to'], larguras: [2600, 4200, 2226], linhas: [
      ['Liquidity', 'Today\'s cash ÷ bills due in the next 30 days. 1.5x or more = 100.', 'Treasury'],
      ['Late customers', '% of receivables already overdue. Up to 5% = 100.', 'Delinquency'],
      ['Reliance on the largest customer', '% of receivables in one customer. Up to 20% = 100.', 'Customers'],
      ['Profit margin', 'Profit ÷ revenue. 15% or more = 100; loss = 15.', 'P&L'],
      ['Debt load', 'Debt balance ÷ yearly revenue. Up to 20% = 100.', 'Debt'],
      ['Overdue bills and taxes', '% of payables overdue; an overdue tax obligation drops it to 40.', 'Payables'],
    ] } },
    { p: 'Each card has a tag with the score and level — **Fine** (100), **Watch** (70 to 99), **Risk** (below 70) or **No data**. **The tag and the See details button** open that risk\'s module. No data (e.g., no receivables) is left out of the average — Axioma does not make up a score.' },

    { h1: 'CFO metrics' },
    { tabela: { colunas: ['Metric', 'What it means'], larguras: [2800, 6226], linhas: [
      ['Profit margin', 'Profit ÷ revenue, 12-month monthly average.'],
      ['Break-even', 'How much you must sell per month to avoid a loss.'],
      ['Average collection period', 'From issue until the money arrives (bills received in 12 months, weighted by amount). "—" if no bill was received yet.'],
      ['Average payment period', 'From issue until you pay (bills paid in 12 months).'],
      ['Cash cycle', 'Collection − payment. Positive: you pay before you get paid and cash funds the operation.'],
      ['Cash runway', 'Cash ÷ monthly outflows, if no sale comes in.'],
    ] } },
    { alerta: 'Use the panel to decide where to act first: start with the red card with the lowest score.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '44 - Panel de Riesgo.docx',
  titulo: 'Manual 44 — Panel de Riesgo y Métricas del CFO',
  subtitulo: 'Lo que puede causar problemas de dinero, con nota de 0 a 100 y el porqué en números',
  info: ['Menú: Financiero → Panel de Riesgo  •  Manual de uso de Axioma AI.Tech  •  Versión 1.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Junta en una sola pantalla **los riesgos de dinero de la empresa** y las **métricas que sigue un director financiero**. Cada riesgo recibe una nota de 0 a 100 (100 = ningún riesgo a la vista) y una frase con los números que la explican. Solo lectura: aquí no se guarda nada.' },
    { nota: 'Los números vienen de la misma foto de la empresa que usa la IA (promedios mensuales de los últimos 12 meses, caja realizada de hoy, cuentas abiertas). Así el panel y la IA nunca dicen números distintos.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Financiero ▼** → **Panel de Riesgo**.'] },

    { h1: 'Nota general de riesgo' },
    { p: 'Arriba: el promedio de las notas que tienen dato. **Haga clic en la nota** para abrir el peor riesgo de la lista.' },

    { h1: 'Los 6 riesgos (el peor primero)' },
    { tabela: { colunas: ['Riesgo', 'Cómo se mide', 'Lleva a'], larguras: [2600, 4200, 2226], linhas: [
      ['Liquidez', 'Caja de hoy ÷ cuentas por pagar de los próximos 30 días. 1,5x o más = 100.', 'Tesorería'],
      ['Clientes atrasados', '% de lo por cobrar ya vencido. Hasta 5% = 100.', 'Morosidad'],
      ['Dependencia del mayor cliente', '% de lo por cobrar concentrado en un cliente. Hasta 20% = 100.', 'Clientes'],
      ['Margen de ganancia', 'Ganancia ÷ ingresos. 15% o más = 100; pérdida = 15.', 'Estado de Resultados'],
      ['Peso de la deuda', 'Saldo deudor ÷ ingresos del año. Hasta 20% = 100.', 'Endeudamiento'],
      ['Cuentas e impuestos atrasados', '% de lo por pagar vencido; una obligación fiscal atrasada la baja a 40.', 'Cuentas por Pagar'],
    ] } },
    { p: 'Cada tarjeta tiene una etiqueta con la nota y el nivel — **Tranquilo** (100), **Atención** (70 a 99), **Riesgo** (debajo de 70) o **Sin dato**. **La etiqueta y el botón Ver detalles** abren el módulo de ese riesgo. Sin dato (ej.: ninguna cuenta por cobrar) no entra en el promedio — Axioma no inventa notas.' },

    { h1: 'Métricas del CFO' },
    { tabela: { colunas: ['Métrica', 'Qué significa'], larguras: [2800, 6226], linhas: [
      ['Margen de ganancia', 'Ganancia ÷ ingresos, promedio mensual de 12 meses.'],
      ['Punto de equilibrio', 'Cuánto debe vender por mes para no tener pérdida.'],
      ['Plazo medio de cobro', 'De la emisión hasta que entra el dinero (cuentas cobradas en 12 meses, ponderado por valor). "—" si aún no hay cuenta cobrada.'],
      ['Plazo medio de pago', 'De la emisión hasta que usted paga (cuentas pagadas en 12 meses).'],
      ['Ciclo de caja', 'Cobro − pago. Positivo: usted paga antes de cobrar y la caja financia la operación.'],
      ['Cuánto aguanta la caja', 'Caja ÷ salidas del mes, si no entra ninguna venta.'],
    ] } },
    { alerta: 'Use el panel para decidir dónde actuar primero: empiece por la tarjeta roja con la nota más baja.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
