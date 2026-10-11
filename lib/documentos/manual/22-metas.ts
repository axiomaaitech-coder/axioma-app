// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '22 - Metas.docx',
  titulo: 'Manual 22 — Metas',
  subtitulo: 'Metas ligadas aos números reais: o progresso se atualiza sozinho e o Axioma diz se o ritmo dá conta',
  info: ['Menu: Crescimento → Metas  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Você define o alvo (ex.: faturar R$ 500 mil no ano) e o Axioma acompanha **sozinho**, com os dados reais da empresa: quanto já foi, o ritmo atual, o ritmo necessário e se a meta é realista. Nada de atualizar à mão.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Crescimento ▼** → **Metas**.'] },

    { h1: 'Tipos de meta (cada um lê um dado real)' },
    { tabela: { colunas: ['Tipo', 'De onde vem o número'], larguras: [2800, 6226], linhas: [
      ['Faturamento', 'Receitas desde o início da meta.'],
      ['Lucro / Margem', 'Resultado calculado como na DRE.'],
      ['Redução de Custo', 'Custos variáveis + custos fixos vigentes.'],
      ['Redução de Dívida', 'Saldo devedor das dívidas.'],
      ['Saldo de Caixa', 'O saldo de caixa de hoje — o mesmo número do Fluxo de Caixa, do Painel de Risco e da IA.'],
      ['Ticket Médio', 'Valor médio das receitas dos últimos 30 dias.'],
      ['Nº de Clientes Ativos', 'Clientes com status ativo.'],
    ] } },
    { p: 'Metas antigas sem tipo aparecem com o aviso para reclassificar — só assim o acompanhamento automático liga.' },

    { h1: 'As partes da tela' },
    { tabela: { colunas: ['Parte', 'O que mostra'], larguras: [2800, 6226], linhas: [
      ['Cartões', '**No Ritmo**, **Em Risco**, **Valor em Jogo**, **Taxa de Sucesso Histórica**, **Mais Próxima do Prazo** e **Marcos Conquistados**.'],
      ['Cada meta', 'Valor Inicial, Atual e Alvo; **Progresso Real × Progresso Esperado**; semáforo **No Ritmo / Atenção / Em Risco**; **Ritmo Necessário × Ritmo Atual** (por mês) e a classificação **Realista**, **Fácil demais** ou **Fora de alcance**.'],
      ['**De onde veio esse número**', 'Explica o cálculo de cada valor atual.'],
      ['**Árvore de Dependência entre Metas**', 'Mostra quando uma meta depende de outra que está em risco (ex.: lucro depende de faturamento).'],
      ['**Conselho CFO**', 'Recomendações quando há meta em risco; sem risco: "metas sob controle".'],
      ['Análise de Metas', 'Gráficos de Progresso Real × Esperado, Evolução até a Meta e Metas por Semáforo.'],
    ] } },
    { nota: 'Ao abrir a tela, o valor atual e o status de cada meta são recalculados e gravados (a meta vira **Concluída** sozinha ao bater 100%). Se algum dado não carregar, a tela **avisa e não grava nada** — um número incompleto nunca vira progresso da meta.' },

    { h1: 'Passo a passo: criar uma meta' },
    { numerada: [
      'Clique em **+ Nova Meta**.',
      'Escreva o título e escolha o **Tipo**.',
      'Informe o **Valor Alvo**, o **prazo** e, se quiser, o **Valor Inicial** (vazio = o valor real de hoje), a **Direção** (aumentar ou reduzir — o Axioma avisa se não combina com o tipo), o **Responsável** e uma **Descrição**.',
      'Clique em **Salvar**.',
    ] },
    { tabela: { colunas: ['Botão da meta', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápis', 'Edita a meta.'],
      ['Arquivar / Reativar', 'Tira a meta do acompanhamento sem apagar (fica como **Arquivada**).'],
      ['🗑️ Lixeira', 'Pede motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador).'],
    ] } },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '22 - Goals.docx',
  titulo: 'Manual 22 — Goals',
  subtitulo: 'Goals tied to real numbers: progress updates itself and Axioma tells you whether the pace is enough',
  info: ['Menu: Growth → Goals  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'You set the target (e.g., bill R$ 500k this year) and Axioma tracks it **on its own**, with the company’s real data: how far you are, the current pace, the required pace and whether the goal is realistic. No manual updates.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Growth ▼** → **Goals**.'] },

    { h1: 'Goal types (each reads real data)' },
    { tabela: { colunas: ['Type', 'Where the number comes from'], larguras: [2800, 6226], linhas: [
      ['Revenue', 'Revenue since the goal started.'],
      ['Profit / Margin', 'Result calculated as in the P&L.'],
      ['Cost Reduction', 'Variable costs + valid fixed costs.'],
      ['Debt Reduction', 'Debt balance.'],
      ['Cash Balance', 'Today’s cash balance — the same number as Cash Flow, the Risk Panel and the AI.'],
      ['Average Ticket', 'Average revenue value over the last 30 days.'],
      ['No. of Active Customers', 'Customers with active status.'],
    ] } },
    { p: 'Old goals without a type show a notice to reclassify them — only then does automatic tracking turn on.' },

    { h1: 'Parts of the screen' },
    { tabela: { colunas: ['Part', 'What it shows'], larguras: [2800, 6226], linhas: [
      ['Cards', '**On Track**, **At Risk**, **Value at Stake**, **Historical Success Rate**, **Closest to Deadline** and **Milestones Reached**.'],
      ['Each goal', 'Initial, Current and Target value; **Real Progress × Expected Progress**; **On Track / Attention / At Risk** light; **Required Pace × Current Pace** (per month) and the rating **Realistic**, **Too easy** or **Out of reach**.'],
      ['**Where this number came from**', 'Explains how each current value is calculated.'],
      ['**Goal Dependency Tree**', 'Shows when a goal depends on another one at risk (e.g., profit depends on revenue).'],
      ['**CFO Advice**', 'Recommendations when a goal is at risk; with no risk: "goals under control".'],
      ['Goals Analysis', 'Charts for Real × Expected Progress, Evolution to the Goal and Goals by Light.'],
    ] } },
    { nota: 'When the screen opens, each goal’s current value and status are recalculated and saved (a goal becomes **Completed** on its own at 100%). If some data does not load, the screen **warns and saves nothing** — an incomplete number never becomes goal progress.' },

    { h1: 'Step by step: creating a goal' },
    { numerada: [
      'Click **+ New Goal**.',
      'Write the title and choose the **Type**.',
      'Enter the **Target Value**, the **deadline** and, if you want, the **Initial Value** (empty = today’s real value), the **Direction** (increase or reduce — Axioma warns if it does not match the type), the **Owner** and a **Description**.',
      'Click **Save**.',
    ] },
    { tabela: { colunas: ['Goal button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['✏️ Pencil', 'Edits the goal.'],
      ['Archive / Reactivate', 'Removes the goal from tracking without deleting it (it shows as **Archived**).'],
      ['🗑️ Trash', 'Asks for a reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator).'],
    ] } },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '22 - Metas.docx',
  titulo: 'Manual 22 — Metas',
  subtitulo: 'Metas ligadas a los números reales: el progreso se actualiza solo y Axioma dice si el ritmo alcanza',
  info: ['Menú: Crecimiento → Metas  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Usted define el objetivo (ej.: facturar R$ 500 mil en el año) y Axioma lo sigue **solo**, con los datos reales de la empresa: cuánto se logró, el ritmo actual, el ritmo necesario y si la meta es realista. Nada de actualizar a mano.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Crecimiento ▼** → **Metas**.'] },

    { h1: 'Tipos de meta (cada uno lee un dato real)' },
    { tabela: { colunas: ['Tipo', 'De dónde viene el número'], larguras: [2800, 6226], linhas: [
      ['Facturación', 'Ingresos desde el inicio de la meta.'],
      ['Ganancia / Margen', 'Resultado calculado como en el Estado de Resultados.'],
      ['Reducción de Costo', 'Costos variables + costos fijos vigentes.'],
      ['Reducción de Deuda', 'Saldo deudor de las deudas.'],
      ['Saldo de Caja', 'El saldo de caja de hoy — el mismo número del Flujo de Caja, el Panel de Riesgo y la IA.'],
      ['Ticket Promedio', 'Valor promedio de los ingresos de los últimos 30 días.'],
      ['Nº de Clientes Activos', 'Clientes con estado activo.'],
    ] } },
    { p: 'Las metas antiguas sin tipo aparecen con el aviso para reclasificarlas — solo así se activa el seguimiento automático.' },

    { h1: 'Las partes de la pantalla' },
    { tabela: { colunas: ['Parte', 'Qué muestra'], larguras: [2800, 6226], linhas: [
      ['Tarjetas', '**En Ritmo**, **En Riesgo**, **Valor en Juego**, **Tasa de Éxito Histórica**, **Más Cercana al Plazo** e **Hitos Logrados**.'],
      ['Cada meta', 'Valor Inicial, Actual y Objetivo; **Progreso Real × Progreso Esperado**; semáforo **En Ritmo / Atención / En Riesgo**; **Ritmo Necesario × Ritmo Actual** (por mes) y la clasificación **Realista**, **Demasiado fácil** o **Fuera de alcance**.'],
      ['**De dónde vino este número**', 'Explica el cálculo de cada valor actual.'],
      ['**Árbol de Dependencia entre Metas**', 'Muestra cuándo una meta depende de otra en riesgo (ej.: la ganancia depende de la facturación).'],
      ['**Consejo CFO**', 'Recomendaciones cuando hay una meta en riesgo; sin riesgo: "metas bajo control".'],
      ['Análisis de Metas', 'Gráficos de Progreso Real × Esperado, Evolución hasta la Meta y Metas por Semáforo.'],
    ] } },
    { nota: 'Al abrir la pantalla, el valor actual y el estado de cada meta se recalculan y guardan (la meta pasa a **Concluida** sola al llegar al 100%). Si algún dato no carga, la pantalla **avisa y no guarda nada** — un número incompleto nunca se vuelve progreso de la meta.' },

    { h1: 'Paso a paso: crear una meta' },
    { numerada: [
      'Haga clic en **+ Nueva Meta**.',
      'Escriba el título y elija el **Tipo**.',
      'Informe el **Valor Objetivo**, el **plazo** y, si quiere, el **Valor Inicial** (vacío = el valor real de hoy), la **Dirección** (aumentar o reducir — Axioma avisa si no coincide con el tipo), el **Responsable** y una **Descripción**.',
      'Haga clic en **Guardar**.',
    ] },
    { tabela: { colunas: ['Botón de la meta', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápiz', 'Edita la meta.'],
      ['Archivar / Reactivar', 'Saca la meta del seguimiento sin borrarla (queda **Archivada**).'],
      ['🗑️ Papelera', 'Pide motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador).'],
    ] } },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
