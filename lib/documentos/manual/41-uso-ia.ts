// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '41 - Configurações - Uso da IA.docx',
  titulo: 'Manual 41 — Uso da IA',
  subtitulo: 'Quanto a inteligência foi usada, por qual caminho e quanto custou',
  info: ['Menu: Config → Uso da IA  •  Manual de uso do Axioma AI.Tech  •  Versão 3.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Dá transparência total sobre a inteligência artificial do Axioma: quantas perguntas foram feitas, qual motor respondeu, quantas respostas foram conferidas e o custo estimado. **Nenhum conteúdo das conversas aparece aqui**: só números.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **⚙️ Config ▼** → **Uso da IA**.'] },

    { h1: 'Saldo de IA deste mês' },
    { p: 'O primeiro quadro da tela mostra quanto de IA a empresa ainda tem, em 3 partes: **IA comum (OpenAI)**, **IA avançada (Anthropic)** e **Notas lidas pela IA**. Em cada uma: quanto resta, quanto o plano dá no mês, quanto foi comprado de recarga e uma barra de uso. A frase no canto diz o dia em que o saldo do plano volta cheio (ou, no teste grátis, até quando a IA do teste vale).' },
    { lista: [
      'Com **mais de 80%** usado, a barra fica vermelha e aparece o aviso. Quando acaba, a IA responde com um aviso explicando como recarregar, e nada é cortado no meio de uma resposta.',
      'Botão **Recarregar** (em cada parte): abre o pagamento seguro do Stripe com o cartão. Ao concluir, você volta para esta tela e o saldo novo aparece em alguns segundos.',
      'Recargas: +100 IA comum R$ 29,90 · +20 IA avançada R$ 19,90 · +20 notas R$ 14,90. Valem para qualquer plano e não vencem enquanto a assinatura estiver ativa.',
      'Pergunta que a IA não respondeu (ou documento que ela não leu) não é descontada. Os limites de cada plano estão no manual 40.',
    ] },

    { h1: 'Como o motor escolhe quem responde' },
    { p: 'Perguntas simples e frequentes vão para a **OpenAI** (rápida e econômica). Análises e decisões grandes, e as telas premium (IA Financeira, IA Tributária, José no Nexus e relatórios complexos), vão para a **Anthropic**. Se a OpenAI não dá conta de uma pergunta, ela **sobe de nível sozinha**.' },
    { tabela: { colunas: ['Nível', 'Quem responde'], larguras: [3000, 6026], linhas: [
      ['Rotina', 'OpenAI'],
      ['Análise', 'Anthropic Sonnet'],
      ['Estratégica', 'Anthropic Opus'],
    ] } },

    { h1: 'Os indicadores' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [3000, 6026], linhas: [
      ['Perguntas', 'Total de perguntas e quantas foram respondidas.'],
      ['Perguntas por nível', 'Quantas foram para Rotina, Análise e Estratégica.'],
      ['Subiram de nível', 'Começaram na rotina e foram para a Anthropic.'],
      ['Consultas a dados', 'Vezes que a IA buscou detalhe (contas, clientes, estoque) para responder.'],
      ['Números conferidos', 'Respostas em que todo valor em R$ bateu com os dados da empresa.'],
      ['Custo Anthropic (estimado)', 'Pelo preço de tabela, já com o desconto do cache.'],
      ['Consumo OpenAI', 'Em tokens; o valor em dólar fica no painel da OpenAI.'],
      ['Telas que mais usaram', 'Ranking das telas com mais perguntas.'],
    ] } },
    { nota: 'Escolha o período no topo da tela (últimos 7, 30 ou 90 dias). Todos os registros do período são contados, sem limite de linhas; se a leitura falhar, a tela avisa. Os registros seguem a política de retenção e auditoria do Axioma, descrita na Política de Privacidade.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '41 - Settings - AI Usage.docx',
  titulo: 'Manual 41 — AI Usage',
  subtitulo: 'How much the intelligence was used, by which path and how much it cost',
  info: ['Menu: Settings → AI usage  •  Axioma AI.Tech user manual  •  Version 3.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Gives full transparency about Axioma’s artificial intelligence: how many questions were asked, which engine answered, how many answers were checked and the estimated cost. **No conversation content appears here**: only numbers.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **⚙️ Settings ▼** → **AI usage**.'] },

    { h1: 'This month’s AI balance' },
    { p: 'The first box on the screen shows how much AI the company still has, in 3 parts: **Standard AI (OpenAI)**, **Advanced AI (Anthropic)** and **Invoices read by AI**. For each: how much is left, how much the plan gives per month, how much was bought as a top-up and a usage bar. The sentence in the corner says the day the plan balance refills (or, in the free trial, until when the trial AI is valid).' },
    { lista: [
      'With **over 80%** used, the bar turns red and a warning appears. When it runs out, the AI replies with a notice explaining how to top up, and nothing is cut off mid-answer.',
      '**Top up** button (in each part): opens the secure Stripe payment with your card. When done, you return to this screen and the new balance shows in a few seconds.',
      'Top-ups: +100 standard AI R$ 29.90 · +20 advanced AI R$ 19.90 · +20 invoices R$ 14.90. Valid on any plan and they do not expire while the subscription is active.',
      'A question the AI did not answer (or a document it did not read) is not deducted. Each plan’s limits are in manual 40.',
    ] },

    { h1: 'How the engine chooses who answers' },
    { p: 'Simple, frequent questions go to **OpenAI** (fast and economical). Big analyses and decisions, and the premium screens (Financial AI, Tax AI, José in Nexus and complex reports), go to **Anthropic**. If OpenAI cannot handle a question, it **escalates by itself**.' },
    { tabela: { colunas: ['Level', 'Who answers'], larguras: [3000, 6026], linhas: [
      ['Routine', 'OpenAI'],
      ['Analysis', 'Anthropic Sonnet'],
      ['Strategic', 'Anthropic Opus'],
    ] } },

    { h1: 'The indicators' },
    { tabela: { colunas: ['Indicator', 'What it means'], larguras: [3000, 6026], linhas: [
      ['Questions', 'Total questions and how many were answered.'],
      ['Questions by level', 'How many went to Routine, Analysis and Strategic.'],
      ['Escalated', 'Started at routine and moved to Anthropic.'],
      ['Data lookups', 'Times the AI fetched detail (bills, clients, inventory) to answer.'],
      ['Numbers checked', 'Answers in which every R$ amount matched the company’s data.'],
      ['Anthropic cost (estimated)', 'At list price, already with the cache discount.'],
      ['OpenAI consumption', 'In tokens; the dollar amount is in the OpenAI dashboard.'],
      ['Screens that used it most', 'Ranking of the screens with the most questions.'],
    ] } },
    { nota: 'Choose the period at the top of the screen (last 7, 30 or 90 days). Every record in the period is counted, with no row limit; if loading fails, the screen warns you. Records follow Axioma’s retention and audit policy, described in the Privacy Policy.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '41 - Configuración - Uso de la IA.docx',
  titulo: 'Manual 41 — Uso de la IA',
  subtitulo: 'Cuánto se usó la inteligencia, por qué camino y cuánto costó',
  info: ['Menú: Config → Uso de la IA  •  Manual de uso de Axioma AI.Tech  •  Versión 3.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Da transparencia total sobre la inteligencia artificial de Axioma: cuántas preguntas se hicieron, qué motor respondió, cuántas respuestas se verificaron y el costo estimado. **Ningún contenido de las conversaciones aparece aquí**: solo números.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **⚙️ Config ▼** → **Uso de la IA**.'] },

    { h1: 'Saldo de IA de este mes' },
    { p: 'El primer cuadro de la pantalla muestra cuánta IA le queda a la empresa, en 3 partes: **IA común (OpenAI)**, **IA avanzada (Anthropic)** y **Facturas leídas por IA**. En cada una: cuánto queda, cuánto da el plan por mes, cuánto se compró de recarga y una barra de uso. La frase en la esquina indica el día en que el saldo del plan vuelve completo (o, en la prueba gratis, hasta cuándo vale la IA de la prueba).' },
    { lista: [
      'Con **más del 80%** usado, la barra se pone roja y aparece el aviso. Cuando se acaba, la IA responde con un aviso que explica cómo recargar, y nada se corta en medio de una respuesta.',
      'Botón **Recargar** (en cada parte): abre el pago seguro de Stripe con la tarjeta. Al concluir, vuelve a esta pantalla y el nuevo saldo aparece en unos segundos.',
      'Recargas: +100 IA común R$ 29,90 · +20 IA avanzada R$ 19,90 · +20 facturas R$ 14,90. Valen para cualquier plan y no vencen mientras la suscripción esté activa.',
      'Una pregunta que la IA no respondió (o un documento que no leyó) no se descuenta. Los límites de cada plan están en el manual 40.',
    ] },

    { h1: 'Cómo el motor elige quién responde' },
    { p: 'Las preguntas simples y frecuentes van a **OpenAI** (rápida y económica). Los análisis y decisiones grandes, y las pantallas premium (IA Financiera, IA Tributaria, José en Nexus e informes complejos), van a **Anthropic**. Si OpenAI no puede con una pregunta, **sube de nivel sola**.' },
    { tabela: { colunas: ['Nivel', 'Quién responde'], larguras: [3000, 6026], linhas: [
      ['Rutina', 'OpenAI'],
      ['Análisis', 'Anthropic Sonnet'],
      ['Estratégica', 'Anthropic Opus'],
    ] } },

    { h1: 'Los indicadores' },
    { tabela: { colunas: ['Indicador', 'Qué significa'], larguras: [3000, 6026], linhas: [
      ['Preguntas', 'Total de preguntas y cuántas fueron respondidas.'],
      ['Preguntas por nivel', 'Cuántas fueron a Rutina, Análisis y Estratégica.'],
      ['Subieron de nivel', 'Empezaron en rutina y pasaron a Anthropic.'],
      ['Consultas a datos', 'Veces que la IA buscó detalle (cuentas, clientes, inventario) para responder.'],
      ['Números verificados', 'Respuestas en las que todo valor en R$ coincidió con los datos de la empresa.'],
      ['Costo Anthropic (estimado)', 'Por precio de lista, ya con el descuento del caché.'],
      ['Consumo OpenAI', 'En tokens; el valor en dólares está en el panel de OpenAI.'],
      ['Pantallas que más usaron', 'Ranking de las pantallas con más preguntas.'],
    ] } },
    { nota: 'Elija el período arriba en la pantalla (últimos 7, 30 o 90 días). Todos los registros del período se cuentan, sin límite de filas; si la lectura falla, la pantalla avisa. Los registros siguen la política de retención y auditoría de Axioma, descrita en la Política de Privacidad.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
