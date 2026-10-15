// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '32 - Gestão - Centros de Custo.docx',
  titulo: 'Manual 32 — Centros de Custo',
  subtitulo: 'Gerencie e distribua seus custos por área',
  info: ['Menu: Gestão → Centros de Custo  •  Manual de uso do Axioma AI.Tech  •  Versão 2.1 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Centros de custo dividem a empresa em áreas (loja, filial, departamento, projeto) para saber **quanto cada área gasta, quanto fatura e se dá resultado**. Também controla orçamento, aponta desperdícios e permite simular decisões por área.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **🏢 Gestão ▼** → **Centros de Custo**.'] },

    { h1: 'Botões do cabeçalho' },
    { p: '**+ Novo Centro**, **+ Novo Lançamento**, **Ratear Custo**, **Compartilhar** e o seletor de período.' },
    { h2: 'Cards de resumo' },
    { p: '**Total de Centros**, **Total em Custos**, **Total em Receitas** e **Saldo Geral**, além do **Score do Módulo** (disciplina orçamentária, anomalias, oportunidades capturadas e quanto dos lançamentos está atribuído a algum centro).' },

    { h1: 'Abas' },
    { tabela: { colunas: ['Aba', 'O que mostra e faz'], larguras: [2400, 6626], linhas: [
      ['Visão Geral', '**Orçado vs Realizado** por centro (dentro ou acima do orçamento), **Meta vs Realizado de Receita** ("Meta atingida!" ou quanto falta) e **Resultado, Margem e Participação** de cada centro.'],
      ['Centros', 'Lista dos centros com responsável. Botão **Definir orçamento deste mês** para cada um.'],
      ['Lançamentos', 'Lançamentos atribuídos aos centros, com busca, ✏️ editar e 🗑️ excluir.'],
      ['Insights', '**Economia Potencial Total**, **5 Maiores Riscos**, **5 Maiores Oportunidades**, **5 Maiores Desperdícios**, **5 Melhores Resultados** e as **Prioridades da Semana e do Mês**.'],
      ['Causa Raiz', 'Aumentos fora do padrão em cada centro (**Acima da média**, **Aumento recorrente**), quando aconteceram, e o botão **Gerar plano de ação**.'],
      ['Oportunidades', '**Orçamento Vivo**: projeção de fechamento do mês contra o orçado, e as oportunidades de economia identificadas.'],
      ['Simulador', 'Cenários: **Reduzir custos**, **Expandir equipe**, **Abrir filial**, **Encerrar centro/projeto**, **Trocar fornecedor**, **Alterar preços**, **Renegociar contratos**, **Variar inflação** e **Variar câmbio**. Escolha o centro, o percentual e o horizonte. Mostra Receita, Lucro Líquido, Capital de Giro e Caixa Projetado e o **Mapa de Impacto**, recalculado com os dados reais. Nada é gravado.'],
      ['Copiloto', 'Pergunta livre sobre os centros de custo (ver abaixo).'],
      ['Ações', 'Planos de ação com status **Pendente**, **Em andamento**, **Concluído** ou **Cancelado**, prazo e economia esperada.'],
      ['Planilha', 'Visão em planilha de todos os lançamentos por centro, com gráficos, para quem prefere trabalhar em tabela.'],
    ] } },

    { h1: 'O que a inteligência faz' },
    { p: 'Os indicadores, insights, causa raiz e simulações são **calculados por regras** sobre os dados reais. O **Copiloto** usa o motor de inteligência artificial: você pergunta (ex.: "qual centro está estourando o orçamento?"), o Axioma envia os números dos centros desta tela e um retrato da empresa, e a resposta volta em linguagem simples. Se a inteligência estiver fora, responde por regras. A inteligência só lê: nunca apaga nem altera dados.' },

    { h1: 'Passo a passo' },
    { h2: 'Criar um centro' },
    { p: 'Clique em **+ Novo Centro**: nome (obrigatório — sem ele a tela avisa), código, descrição, cor, responsável, **Orçamento Mensal (R$)** e **Meta Receita (R$)**. Opcional: cadastro com tipo (jurídica ou física, com CNPJ/CPF validado), endereço, **headcount** e **área (m²)**, que servem de base para o rateio automático.' },
    { h2: 'Ratear um custo' },
    { numerada: [
      'Clique em **Ratear Custo** e escolha um lançamento que já existe (ex.: o aluguel em Custos Fixos — só aparecem custos fixos vigentes).',
      'Divida o valor entre os centros por percentual: **Igualmente**, **Por headcount** ou **Por área (m²)**, ou à mão.',
      'Confira o **Total distribuído** e o **Restante** e clique em **Aplicar Rateio**.',
    ] },
    { nota: 'O rateio não cria um custo novo: só reparte o que já existe. Para desfazer, use **Remover rateio atual**.' },
    { h2: 'Criar um plano de ação' },
    { p: 'Em **Ações**, clique em **Novo Plano**: título, objetivo, tarefas (uma por linha), responsável, prazo, impacto esperado e economia estimada. Clique em **Salvar Plano** e acompanhe o status.' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápis', 'Edita o centro ou o lançamento.'],
      ['🗑️ Lixeira', 'Pede motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador).'],
    ] } },
    { nota: 'Centros, lançamentos, rateios, orçamentos e lançamentos de origem são lidos sem limite de linhas. Se alguma leitura falhar, a tela avisa que os dados podem estar incompletos.' },

    { h1: 'Datas e dados confiáveis' },
    { p: 'As datas desta tela seguem o dia da sua empresa (fuso do estado cadastrado): depois das 21h o Axioma não pula mais para o dia seguinte. Se algum dado não puder ser lido, o Axioma tenta de novo sozinho; só se ainda assim falhar aparece no topo o aviso **Alguns dados não puderam ser carregados** — o valor faltante nunca é mostrado como zero. O mês que a tela abre como "mês atual" é o mês da sua empresa, também no último dia do mês depois das 21h.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '32 - Management - Cost Centers.docx',
  titulo: 'Manual 32 — Cost Centers',
  subtitulo: 'Manage and allocate your costs by area',
  info: ['Menu: Management → Cost Centers  •  Axioma AI.Tech user manual  •  Version 2.1 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Cost centers split the company into areas (store, branch, department, project) so you know **how much each area spends, how much it bills and whether it pays off**. It also controls budget, points out waste and lets you simulate decisions by area.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **🏢 Management ▼** → **Cost Centers**.'] },

    { h1: 'Header buttons' },
    { p: '**+ New Center**, **+ New Entry**, **Allocate Cost**, **Share** and the period selector.' },
    { h2: 'Summary cards' },
    { p: '**Total Centers**, **Total Costs**, **Total Revenue** and **Overall Balance**, plus the **Module Score** (budget discipline, anomalies, captured opportunities and how much of the entries are assigned to a center).' },

    { h1: 'Tabs' },
    { tabela: { colunas: ['Tab', 'What it shows and does'], larguras: [2400, 6626], linhas: [
      ['Overview', '**Budget vs Actual** by center (within or over budget), **Revenue Target vs Actual** ("Target reached!" or how much is left) and each center’s **Result, Margin and Share**.'],
      ['Centers', 'List of centers with the person in charge. **Set budget this month** button for each.'],
      ['Entries', 'Entries assigned to centers, with search, ✏️ edit and 🗑️ delete.'],
      ['Insights', '**Total Potential Savings**, **Top 5 Risks**, **Top 5 Opportunities**, **Top 5 Waste**, **Top 5 Results** and the **Priorities of the Week and Month**.'],
      ['Root Cause', 'Out-of-pattern increases in each center (**Above average**, **Recurring increase**), when they happened, and the **Create action plan** button.'],
      ['Opportunities', '**Living Budget**: month-end projection against budget, and the savings opportunities found.'],
      ['Simulator', 'Scenarios: **Cut costs**, **Expand team**, **Open branch**, **Close center/project**, **Switch supplier**, **Change prices**, **Renegotiate contracts**, **Vary inflation** and **Vary exchange rate**. Choose the center, percentage and horizon. Shows Revenue, Net Profit, Working Capital and Projected Cash and the **Impact Map**, recalculated with real data. Nothing is saved.'],
      ['Copilot', 'Free question about the cost centers (see below).'],
      ['Actions', 'Action plans with status **Pending**, **In progress**, **Done** or **Canceled**, deadline and expected savings.'],
      ['Spreadsheet', 'Spreadsheet view of all entries by center, with charts, for those who prefer working in a table.'],
    ] } },

    { h1: 'What the intelligence does' },
    { p: 'Indicators, insights, root cause and simulations are **calculated by rules** on real data. The **Copilot** uses the AI engine: you ask (e.g., "which center is over budget?"), Axioma sends the numbers of the centers on this screen and a snapshot of the company, and the answer comes back in plain language. If the AI is down, it answers by rules. The AI only reads: it never deletes or changes data.' },

    { h1: 'Step by step' },
    { h2: 'Create a center' },
    { p: 'Click **+ New Center**: name (required — without it the screen warns you), code, description, color, person in charge, **Monthly Budget (R$)** and **Revenue Target (R$)**. Optional: registration with type (company or individual, with validated CNPJ/CPF), address, **headcount** and **area (m²)**, which serve as the basis for automatic allocation.' },
    { h2: 'Allocate a cost' },
    { numerada: [
      'Click **Allocate Cost** and choose an existing entry (e.g., rent in Fixed Costs — only active fixed costs appear).',
      'Split the amount among centers by percentage: **Equally**, **By headcount** or **By area (m²)**, or by hand.',
      'Check the **Total distributed** and **Remaining** and click **Apply**.',
    ] },
    { nota: 'Allocation does not create a new cost: it only splits what already exists. To undo it, use **Remove current allocation**.' },
    { h2: 'Create an action plan' },
    { p: 'In **Actions**, click **New Plan**: title, objective, tasks (one per line), person in charge, deadline, expected impact and estimated savings. Click **Save Plan** and track the status.' },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['✏️ Pencil', 'Edits the center or the entry.'],
      ['🗑️ Trash', 'Asks for a reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator).'],
    ] } },
    { nota: 'Centers, entries, allocations, budgets and source entries are read with no row limit. If any loading fails, the screen warns that data may be incomplete.' },

    { h1: 'Reliable dates and data' },
    { p: 'Dates on this screen follow your company’s day (time zone of the registered state): after 9 p.m. Axioma no longer jumps to the next day. If some data cannot be read, Axioma retries on its own; only if it still fails does the notice **Some data could not be loaded** appear at the top — the missing value is never shown as zero. The month the screen opens as "current month" is your company’s month, also on the last day of the month after 9 p.m.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '32 - Gestión - Centros de Costo.docx',
  titulo: 'Manual 32 — Centros de Costo',
  subtitulo: 'Gestione y distribuya sus costos por área',
  info: ['Menú: Gestión → Centros de Costo  •  Manual de uso de Axioma AI.Tech  •  Versión 2.1 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Los centros de costo dividen la empresa en áreas (tienda, sucursal, departamento, proyecto) para saber **cuánto gasta cada área, cuánto factura y si da resultado**. También controla presupuesto, señala desperdicios y permite simular decisiones por área.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **🏢 Gestión ▼** → **Centros de Costo**.'] },

    { h1: 'Botones del encabezado' },
    { p: '**+ Nuevo Centro**, **+ Nuevo Registro**, **Distribuir Costo**, **Compartir** y el selector de período.' },
    { h2: 'Tarjetas de resumen' },
    { p: '**Total Centros**, **Total Costos**, **Total Ingresos** y **Saldo General**, además del **Score del Módulo** (disciplina presupuestaria, anomalías, oportunidades capturadas y cuánto de los registros está asignado a algún centro).' },

    { h1: 'Pestañas' },
    { tabela: { colunas: ['Pestaña', 'Qué muestra y hace'], larguras: [2400, 6626], linhas: [
      ['Visión General', '**Presupuestado vs Realizado** por centro (dentro o por encima del presupuesto), **Meta vs Realizado de Ingresos** ("¡Meta alcanzada!" o cuánto falta) y **Resultado, Margen y Participación** de cada centro.'],
      ['Centros', 'Lista de los centros con responsable. Botón **Definir presupuesto de este mes** para cada uno.'],
      ['Registros', 'Registros asignados a los centros, con búsqueda, ✏️ editar y 🗑️ eliminar.'],
      ['Insights', '**Ahorro Potencial Total**, **5 Mayores Riesgos**, **5 Mayores Oportunidades**, **5 Mayores Desperdicios**, **5 Mejores Resultados** y las **Prioridades de la Semana y del Mes**.'],
      ['Causa Raíz', 'Aumentos fuera del patrón en cada centro (**Por encima del promedio**, **Aumento recurrente**), cuándo ocurrieron, y el botón **Generar plan de acción**.'],
      ['Oportunidades', '**Presupuesto Vivo**: proyección del cierre del mes frente a lo presupuestado, y las oportunidades de ahorro identificadas.'],
      ['Simulador', 'Escenarios: **Reducir costos**, **Ampliar equipo**, **Abrir sucursal**, **Cerrar centro/proyecto**, **Cambiar proveedor**, **Cambiar precios**, **Renegociar contratos**, **Variar inflación** y **Variar tipo de cambio**. Elija el centro, el porcentaje y el horizonte. Muestra Ingresos, Utilidad Neta, Capital de Trabajo y Caja Proyectada y el **Mapa de Impacto**, recalculado con los datos reales. Nada se guarda.'],
      ['Copiloto', 'Pregunta libre sobre los centros de costo (ver abajo).'],
      ['Acciones', 'Planes de acción con estado **Pendiente**, **En curso**, **Concluido** o **Cancelado**, plazo y ahorro esperado.'],
      ['Planilla', 'Vista de planilla de todos los registros por centro, con gráficos, para quien prefiere trabajar en tabla.'],
    ] } },

    { h1: 'Qué hace la inteligencia' },
    { p: 'Los indicadores, insights, causa raíz y simulaciones se **calculan por reglas** sobre los datos reales. El **Copiloto** usa el motor de inteligencia artificial: usted pregunta (ej.: "¿qué centro está excediendo el presupuesto?"), Axioma envía los números de los centros de esta pantalla y un retrato de la empresa, y la respuesta vuelve en lenguaje simple. Si la inteligencia está caída, responde por reglas. La inteligencia solo lee: nunca borra ni altera datos.' },

    { h1: 'Paso a paso' },
    { h2: 'Crear un centro' },
    { p: 'Haga clic en **+ Nuevo Centro**: nombre (obligatorio — sin él la pantalla avisa), código, descripción, color, responsable, **Presupuesto Mensual (R$)** y **Meta de Ingresos (R$)**. Opcional: registro con tipo (jurídica o física, con CNPJ/CPF validado), dirección, **headcount** y **área (m²)**, que sirven de base para la distribución automática.' },
    { h2: 'Distribuir un costo' },
    { numerada: [
      'Haga clic en **Distribuir Costo** y elija un registro que ya existe (ej.: el alquiler en Costos Fijos — solo aparecen costos fijos vigentes).',
      'Divida el valor entre los centros por porcentaje: **Igualmente**, **Por headcount** o **Por área (m²)**, o a mano.',
      'Revise el **Total distribuido** y el **Restante** y haga clic en **Aplicar Distribución**.',
    ] },
    { nota: 'La distribución no crea un costo nuevo: solo reparte lo que ya existe. Para deshacerla, use **Eliminar distribución actual**.' },
    { h2: 'Crear un plan de acción' },
    { p: 'En **Acciones**, haga clic en **Nuevo Plan**: título, objetivo, tareas (una por línea), responsable, plazo, impacto esperado y ahorro estimado. Haga clic en **Guardar Plan** y siga el estado.' },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápiz', 'Edita el centro o el registro.'],
      ['🗑️ Papelera', 'Pide motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador).'],
    ] } },
    { nota: 'Centros, registros, distribuciones, presupuestos y registros de origen se leen sin límite de filas. Si alguna lectura falla, la pantalla avisa que los datos pueden estar incompletos.' },

    { h1: 'Fechas y datos confiables' },
    { p: 'Las fechas de esta pantalla siguen el día de su empresa (huso del estado registrado): después de las 21 h Axioma ya no salta al día siguiente. Si algún dato no se puede leer, Axioma reintenta por su cuenta; solo si aun así falla aparece arriba el aviso **Algunos datos no se pudieron cargar** — el valor faltante nunca se muestra como cero. El mes que la pantalla abre como "mes actual" es el mes de su empresa, también el último día del mes después de las 21 h.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
