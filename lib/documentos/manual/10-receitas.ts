// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '10 - Receitas.docx',
  titulo: 'Manual 10 — Receitas',
  subtitulo: 'Todas as entradas de dinheiro da empresa, com a visão de um diretor financeiro',
  info: ['Menu: Financeiro → Receitas  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Receitas guarda **todas as entradas de dinheiro**: vendas, serviços, contratos recorrentes e receitas eventuais. É a base da DRE, do Fluxo de Caixa, das Metas e da IA Financeira. Toda receita **recebida** vai sozinha para a **Contabilidade** e para o **Fluxo de Caixa** — você lança uma vez só.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Financeiro ▼** → **Receitas**.', 'Dashboard → cartões de receita.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera o PDF com a lista do período e os totais.', 'O arquivo é baixado.'],
      ['**+ Nova Receita**', 'Abre a janela de cadastro.', 'Veja o passo a passo abaixo.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Período e Compartilhar' },
    { p: 'O seletor escolhe o período dos cartões e da lista: **Mês atual**, **Mês anterior**, **Trimestre**, **Ano** (padrão), **Últimos 12 meses** ou **Personalizado** (com data de início e fim). **Compartilhar** abre a Central de Compartilhamento com o resumo.' },
    { h2: 'Cartões principais (clicáveis)' },
    { tabela: { colunas: ['Cartão', 'O que mostra', 'Ao clicar'], larguras: [2400, 3800, 2826], linhas: [
      ['Total de Receitas', 'Soma do período.', 'Desce até a lista.'],
      ['Recebido', 'O que já entrou de fato.', 'Abre o Fluxo de Caixa.'],
      ['Pendente', 'Lançado mas ainda não recebido.', 'Abre Contas a Receber.'],
    ] } },
    { h2: 'Camada CFO (indicadores)' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['🔄 Receita Recorrente (MRR)', 'Quanto entra todo mês da categoria **Recorrentes** (contratos, mensalidades).'],
      ['📅 Receita Anual (ARR)', 'A recorrente projetada para 12 meses.'],
      ['📈 Crescimento no Mês', 'Variação em relação ao mês anterior (▲ ou ▼).'],
      ['🎫 Ticket Médio', 'Valor médio de cada receita.'],
      ['♻️ % Recorrente', 'Quanto da receita é recorrente — quanto maior, mais previsível.'],
      ['🎯 Concentração Top 20%', 'Quanto vem dos 20% maiores lançamentos. Acima de 70% fica laranja: risco de depender de poucos.'],
    ] } },
    { p: 'Esses indicadores usam todo o histórico (os últimos 12 meses), não só o período escolhido.' },
    { h2: 'Letreiro, Análise Anual e Insights' },
    { p: 'O letreiro mostra os números principais. A **Análise Anual** tem três gráficos: **Evolução Mensal**, **Composição por Categoria** e **Previsão (próximos 3 meses)**, a projeção feita a partir do seu histórico. Os **Insights Inteligentes** são avisos por regra, como alta concentração, queda no mês ou baixa recorrência.' },
    { h2: 'Busca e lista' },
    { p: 'Campo **Buscar receita...** e filtro de categoria. A tabela mostra descrição (com o cliente, se houver), categoria, data, status e valor.' },
    { tabela: { colunas: ['Na linha', 'O que faz', 'O que acontece depois'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Lápis', 'Abre a receita para editar.', 'Ao salvar, o lançamento anterior é desfeito na Contabilidade e no Fluxo e o novo entra no lugar — sem duplicar.'],
      ['🗑️ Lixeira', 'Pede para excluir.', 'Aviso de exclusão: motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador). A receita sai também da Contabilidade e do Fluxo.'],
      ['Selo **Origem: …**', 'Aparece no lugar do lápis e da lixeira em receitas criadas por outro módulo (ex.: recebimento em Contas a Receber).', 'Clique para ir ao módulo de origem — é lá que se edita, para nada ficar diferente entre as telas.'],
    ] } },

    { h1: 'Passo a passo: lançar uma receita' },
    { numerada: [
      'Clique em **+ Nova Receita**.',
      'Preencha **Descrição**, **Valor (R$)** e **Data** (vazia = hoje).',
      'Escolha a **Categoria**: Vendas de produtos, Prestação de serviços, Recorrentes, Eventuais ou Outras.',
      'Opcional: o **Cliente** e o **Centro de Custo**.',
      'Clique em **Recebido** (o dinheiro já entrou) ou **Pendente** (ainda vai entrar).',
      'Clique em **Salvar Receita**.',
    ] },
    { tabela: { colunas: ['Situação', 'O que o Axioma faz'], larguras: [3000, 6026], linhas: [
      ['Faltou descrição ou valor', 'Avisa "Preencha a descrição e um valor maior que zero" e não salva.'],
      ['Mesmo valor, perto da mesma data, texto parecido', 'Bloqueia como **duplicata** e mostra onde o dinheiro já está; dá para lançar mesmo assim.'],
      ['Mesmo valor e data, texto diferente', 'Pergunta se é o mesmo dinheiro antes de salvar.'],
      ['Recebido', 'Lança na Contabilidade e no Fluxo de Caixa (realizado).'],
      ['Pendente', 'Fica só aqui até virar recebido. Para cobrar com vencimento, use Contas a Receber.'],
    ] } },
    { nota: 'Criar, editar e excluir ficam na auditoria da empresa. Se a auditoria ou a Contabilidade falhar, a tela avisa — a receita continua salva e o Guardião termina o caminho sozinho.' },
    { h1: 'Dicas' },
    { lista: ['Use categorias consistentes: elas alimentam a DRE e a Composição por Categoria.', 'Marque **Recebido** só quando o dinheiro entrar, para o caixa ficar fiel.', 'Notas fiscais de venda podem entrar por **Importar Documentos**, sem digitar.'] },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '10 - Revenue.docx',
  titulo: 'Manual 10 — Revenue',
  subtitulo: 'All money coming into the company, seen the way a CFO sees it',
  info: ['Menu: Financial → Revenue  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Revenue keeps **all money coming in**: sales, services, recurring contracts and one-off income. It feeds the P&L, Cash Flow, Goals and the Financial AI. Every **received** revenue goes automatically to **Accounting** and **Cash Flow** — you enter it once.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Financial ▼** → **Revenue**.', 'Dashboard → revenue cards.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates the PDF with the period list and totals.', 'The file is downloaded.'],
      ['**+ New Revenue**', 'Opens the entry window.', 'See the step by step below.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: 'Period and Share' },
    { p: 'The selector sets the period for the cards and the list: **Current month**, **Previous month**, **Quarter**, **Year** (default), **Last 12 months** or **Custom** (start and end dates). **Share** opens the Sharing Center with the summary.' },
    { h2: 'Main cards (clickable)' },
    { tabela: { colunas: ['Card', 'What it shows', 'On click'], larguras: [2400, 3800, 2826], linhas: [
      ['Total Revenue', 'Sum for the period.', 'Scrolls to the list.'],
      ['Received', 'What actually came in.', 'Opens Cash Flow.'],
      ['Pending', 'Entered but not yet received.', 'Opens Receivables.'],
    ] } },
    { h2: 'CFO layer (indicators)' },
    { tabela: { colunas: ['Indicator', 'What it means'], larguras: [2800, 6226], linhas: [
      ['🔄 Recurring Revenue (MRR)', 'What comes in every month from the **Recurring** category (contracts, subscriptions).'],
      ['📅 Annual Revenue (ARR)', 'Recurring revenue projected for 12 months.'],
      ['📈 Month Growth', 'Change versus the previous month (▲ or ▼).'],
      ['🎫 Average Ticket', 'Average value of each revenue.'],
      ['♻️ % Recurring', 'How much revenue is recurring — the higher, the more predictable.'],
      ['🎯 Top 20% Concentration', 'How much comes from the 20% largest entries. Above 70% turns orange: risk of depending on a few.'],
    ] } },
    { p: 'These indicators use the whole history (the last 12 months), not only the chosen period.' },
    { h2: 'Ticker, Annual Analysis and Insights' },
    { p: 'The ticker shows the main numbers. **Annual Analysis** has three charts: **Monthly Evolution**, **Composition by Category** and **Forecast (next 3 months)**, projected from your history. **Smart Insights** are rule-based warnings, such as high concentration, a monthly drop or low recurrence.' },
    { h2: 'Search and list' },
    { p: '**Search revenue...** field and category filter. The table shows description (with the customer, if any), category, date, status and amount.' },
    { tabela: { colunas: ['On the row', 'What it does', 'What happens next'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Pencil', 'Opens the revenue to edit.', 'On save, the previous entry is undone in Accounting and Cash Flow and the new one replaces it — no duplicates.'],
      ['🗑️ Trash', 'Asks to delete.', 'Deletion notice: reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator). The revenue also leaves Accounting and Cash Flow.'],
      ['**Origin: …** tag', 'Shows instead of pencil and trash on revenue created by another module (e.g., a receipt in Receivables).', 'Click to go to the source module — edit it there, so screens never disagree.'],
    ] } },

    { h1: 'Step by step: entering revenue' },
    { numerada: [
      'Click **+ New Revenue**.',
      'Fill in **Description**, **Amount (R$)** and **Date** (empty = today).',
      'Pick the **Category**: Product sales, Services, Recurring, One-off or Other.',
      'Optional: the **Customer** and the **Cost Center**.',
      'Click **Received** (money already came in) or **Pending** (still to come).',
      'Click **Save Revenue**.',
    ] },
    { tabela: { colunas: ['Situation', 'What Axioma does'], larguras: [3000, 6026], linhas: [
      ['Missing description or amount', 'Warns "Fill in the description and an amount above zero" and does not save.'],
      ['Same amount, near the same date, similar text', 'Blocks it as a **duplicate** and shows where the money already is; you can enter it anyway.'],
      ['Same amount and date, different text', 'Asks whether it is the same money before saving.'],
      ['Received', 'Posts to Accounting and Cash Flow (actual).'],
      ['Pending', 'Stays only here until it becomes received. To collect with a due date, use Receivables.'],
    ] } },
    { nota: 'Creating, editing and deleting are logged in the company audit. If the audit or Accounting fails, the screen warns you — the revenue stays saved and the Guardian finishes the path on its own.' },
    { h1: 'Tips' },
    { lista: ['Use consistent categories: they feed the P&L and the Composition by Category.', 'Mark **Received** only when the money comes in, so cash stays accurate.', 'Sales invoices can come in through **Import Documents**, without typing.'] },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '10 - Ingresos.docx',
  titulo: 'Manual 10 — Ingresos',
  subtitulo: 'Todo el dinero que entra en la empresa, con la mirada de un director financiero',
  info: ['Menú: Financiero → Ingresos  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Ingresos guarda **todo el dinero que entra**: ventas, servicios, contratos recurrentes e ingresos eventuales. Alimenta el Estado de Resultados, el Flujo de Caja, las Metas y la IA Financiera. Todo ingreso **cobrado** va solo a **Contabilidad** y al **Flujo de Caja** — se registra una sola vez.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Financiero ▼** → **Ingresos**.', 'Panel → tarjetas de ingresos.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera el PDF con la lista del período y los totales.', 'El archivo se descarga.'],
      ['**+ Nuevo Ingreso**', 'Abre la ventana de registro.', 'Vea el paso a paso abajo.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Período y Compartir' },
    { p: 'El selector elige el período de las tarjetas y de la lista: **Mes actual**, **Mes anterior**, **Trimestre**, **Año** (predeterminado), **Últimos 12 meses** o **Personalizado** (fecha de inicio y fin). **Compartir** abre el Centro de Compartir con el resumen.' },
    { h2: 'Tarjetas principales (con clic)' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra', 'Al hacer clic'], larguras: [2400, 3800, 2826], linhas: [
      ['Total de Ingresos', 'Suma del período.', 'Baja hasta la lista.'],
      ['Cobrado', 'Lo que ya entró de hecho.', 'Abre el Flujo de Caja.'],
      ['Pendiente', 'Registrado pero aún no cobrado.', 'Abre Cuentas por Cobrar.'],
    ] } },
    { h2: 'Capa CFO (indicadores)' },
    { tabela: { colunas: ['Indicador', 'Qué significa'], larguras: [2800, 6226], linhas: [
      ['🔄 Ingreso Recurrente (MRR)', 'Lo que entra cada mes de la categoría **Recurrentes** (contratos, mensualidades).'],
      ['📅 Ingreso Anual (ARR)', 'El recurrente proyectado a 12 meses.'],
      ['📈 Crecimiento del Mes', 'Variación frente al mes anterior (▲ o ▼).'],
      ['🎫 Ticket Promedio', 'Valor promedio de cada ingreso.'],
      ['♻️ % Recurrente', 'Cuánto del ingreso es recurrente — cuanto mayor, más previsible.'],
      ['🎯 Concentración Top 20%', 'Cuánto viene del 20% de mayores registros. Por encima de 70% se pone naranja: riesgo de depender de pocos.'],
    ] } },
    { p: 'Estos indicadores usan todo el historial (los últimos 12 meses), no solo el período elegido.' },
    { h2: 'Marquesina, Análisis Anual e Insights' },
    { p: 'La marquesina muestra los números principales. El **Análisis Anual** tiene tres gráficos: **Evolución Mensual**, **Composición por Categoría** y **Previsión (próximos 3 meses)**, proyectada desde su historial. Los **Insights Inteligentes** son avisos por regla, como alta concentración, caída en el mes o baja recurrencia.' },
    { h2: 'Búsqueda y lista' },
    { p: 'Campo **Buscar ingreso...** y filtro de categoría. La tabla muestra descripción (con el cliente, si hay), categoría, fecha, estado y valor.' },
    { tabela: { colunas: ['En la fila', 'Qué hace', 'Qué pasa después'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Lápiz', 'Abre el ingreso para editar.', 'Al guardar, el registro anterior se deshace en Contabilidad y Flujo y el nuevo entra en su lugar — sin duplicar.'],
      ['🗑️ Papelera', 'Pide eliminar.', 'Aviso de eliminación: motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador). El ingreso sale también de Contabilidad y del Flujo.'],
      ['Etiqueta **Origen: …**', 'Aparece en lugar del lápiz y la papelera en ingresos creados por otro módulo (ej.: un cobro en Cuentas por Cobrar).', 'Clic para ir al módulo de origen — allí se edita, para que nada quede distinto entre pantallas.'],
    ] } },

    { h1: 'Paso a paso: registrar un ingreso' },
    { numerada: [
      'Haga clic en **+ Nuevo Ingreso**.',
      'Complete **Descripción**, **Valor (R$)** y **Fecha** (vacía = hoy).',
      'Elija la **Categoría**: Venta de productos, Prestación de servicios, Recurrentes, Eventuales u Otras.',
      'Opcional: el **Cliente** y el **Centro de Costo**.',
      'Haga clic en **Cobrado** (el dinero ya entró) o **Pendiente** (aún va a entrar).',
      'Haga clic en **Guardar Ingreso**.',
    ] },
    { tabela: { colunas: ['Situación', 'Qué hace Axioma'], larguras: [3000, 6026], linhas: [
      ['Falta descripción o valor', 'Avisa "Complete la descripción y un valor mayor que cero" y no guarda.'],
      ['Mismo valor, cerca de la misma fecha, texto parecido', 'Lo bloquea como **duplicado** y muestra dónde ya está el dinero; se puede registrar igual.'],
      ['Mismo valor y fecha, texto distinto', 'Pregunta si es el mismo dinero antes de guardar.'],
      ['Cobrado', 'Registra en Contabilidad y en el Flujo de Caja (realizado).'],
      ['Pendiente', 'Queda solo aquí hasta pasar a cobrado. Para cobrar con vencimiento, use Cuentas por Cobrar.'],
    ] } },
    { nota: 'Crear, editar y eliminar quedan en la auditoría de la empresa. Si la auditoría o la Contabilidad falla, la pantalla avisa — el ingreso sigue guardado y el Guardián termina el camino solo.' },
    { h1: 'Consejos' },
    { lista: ['Use categorías consistentes: alimentan el Estado de Resultados y la Composición por Categoría.', 'Marque **Cobrado** solo cuando entre el dinero, para que la caja sea fiel.', 'Las facturas de venta pueden entrar por **Importar Documentos**, sin escribir.'] },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
