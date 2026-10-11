// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '41 - Configurações - Uso da IA.docx',
  titulo: 'Manual 41 — Uso da IA',
  subtitulo: 'Quanto a inteligência foi usada, por qual caminho e quanto custou',
  info: ['Menu: Config → Uso da IA  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Dá transparência total sobre a inteligência artificial do Axioma: quantas perguntas foram feitas, qual motor respondeu, quantas respostas foram conferidas e o custo estimado. **Nenhum conteúdo das conversas aparece aqui**: só números.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **⚙️ Config ▼** → **Uso da IA**.'] },

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
  info: ['Menu: Settings → AI usage  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Gives full transparency about Axioma’s artificial intelligence: how many questions were asked, which engine answered, how many answers were checked and the estimated cost. **No conversation content appears here**: only numbers.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **⚙️ Settings ▼** → **AI usage**.'] },

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
  info: ['Menú: Config → Uso de la IA  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Da transparencia total sobre la inteligencia artificial de Axioma: cuántas preguntas se hicieron, qué motor respondió, cuántas respuestas se verificaron y el costo estimado. **Ningún contenido de las conversaciones aparece aquí**: solo números.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **⚙️ Config ▼** → **Uso de la IA**.'] },

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
