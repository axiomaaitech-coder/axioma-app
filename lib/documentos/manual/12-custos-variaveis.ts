// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '12 - Custos Variáveis.docx',
  titulo: 'Manual 12 — Custos Variáveis',
  subtitulo: 'Os gastos que sobem e descem com as vendas — margem de contribuição, ponto de equilíbrio e alerta de aumento silencioso',
  info: ['Menu: Financeiro → Custos Variáveis  •  Manual de uso do Axioma AI.Tech  •  Versão 2.2 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Custos variáveis acompanham as vendas: mercadoria, matéria-prima, comissões, fretes, embalagens, marketing. A tela mostra **quanto sobra de cada venda** (margem de contribuição), **quanto precisa vender para empatar** e avisa quando um custo está subindo sem ninguém perceber. Todo custo lançado aqui vai sozinho para a **Contabilidade** e para o **Fluxo de Caixa** (como pago).' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Financeiro ▼** → **Custos Variáveis**.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera o PDF com a lista do período e os totais.', 'O arquivo é baixado.'],
      ['**+ Novo Custo Variável**', 'Abre a janela de cadastro.', 'Veja o passo a passo abaixo.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Período e Compartilhar' },
    { p: 'O seletor escolhe o período dos cartões e da lista (Mês atual, Mês anterior, Trimestre, Ano, Últimos 12 meses ou Personalizado). **Compartilhar** abre a Central de Compartilhamento. Os gráficos e comparações usam até 24 meses para trás, para enxergar tendência.' },
    { h2: 'Cartões principais (clicáveis)' },
    { tabela: { colunas: ['Cartão', 'O que mostra', 'Ao clicar'], larguras: [2400, 3800, 2826], linhas: [
      ['Total do Mês', 'Soma dos custos **do período escolhido**.', 'Abre a DRE.'],
      ['Lançamentos', 'Quantos custos há no período.', 'Desce até a lista.'],
      ['Maior Custo', 'O item mais caro do período.', 'Desce até a lista.'],
    ] } },
    { h2: 'Visão CFO' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['📉 Custo Variável do Mês', 'Total do mês, com ▲/▼ em relação ao anterior (subir é ruim, por isso fica vermelho).'],
      ['📊 Margem de Contribuição', 'Quanto sobra da receita depois dos custos variáveis para pagar os fixos e dar lucro.'],
      ['⚖️ Ponto de Equilíbrio', 'Receita mínima para empatar, usando só os custos fixos **vigentes hoje**. Se os variáveis comem toda a receita: "Sem equilíbrio possível".'],
      ['🛟 Margem de Segurança', 'Quanto a receita pode cair antes do prejuízo. Abaixo de 15% fica vermelho; de 15% a 30%, amarelo.'],
      ['🌊 Volatilidade', 'Quanto os custos oscilam de um mês para outro. Acima de 25%, vermelho.'],
      ['⚡ Peso na Receita', 'Quanto da receita vai para custos variáveis.'],
    ] } },
    { h2: 'O que mudou, Análise de Margem e Anomalias' },
    { p: 'Uma frase automática explica a variação do mês e de onde ela veio (ex.: "subiram 12%, puxado por Frete"). A **Análise de Margem** mostra Receita × Custo Variável × Ponto de Equilíbrio no tempo. As **Anomalias Detectadas** apontam itens que **sobem de forma consistente** (vale renegociar) ou que **vieram bem acima do normal** (vale conferir) — o aumento silencioso de preço. As **Sugestões Axioma** trazem ações com a economia possível de cada uma.' },
    { h2: 'Busca e lista' },
    { p: 'Campo **Buscar custo...** e tabela do período com descrição, categoria, data, valor e **% do Total**.' },
    { tabela: { colunas: ['Na linha', 'O que faz', 'O que acontece depois'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Lápis', 'Abre o custo para editar.', 'O lançamento anterior é desfeito na Contabilidade e no Fluxo e o novo entra no lugar — sem duplicar.'],
      ['🗑️ Lixeira', 'Pede para excluir.', 'Aviso de exclusão: motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador). Sai também da Contabilidade e do Fluxo.'],
      ['Selo **Origem: …**', 'Aparece em custos criados por outro módulo (conta paga, nota importada).', 'Clique para ir à origem e editar lá.'],
    ] } },

    { h1: 'Passo a passo: lançar um custo variável' },
    { numerada: [
      'Clique em **+ Novo Custo Variável**.',
      'Preencha **Descrição**, **Valor** e **Data** (vazia = hoje).',
      'Escolha a **Categoria**: Marketing, Logística, Matéria-prima, Comissões, Embalagens ou Outros.',
      'Opcional: **Centro de Custo**.',
      'Clique em **Salvar Custo**.',
    ] },
    { tabela: { colunas: ['Situação', 'O que o Axioma faz'], larguras: [3000, 6026], linhas: [
      ['Faltou descrição ou valor', 'Avisa e não salva.'],
      ['Mesmo valor, perto da mesma data, texto parecido com uma conta paga ou nota', 'Bloqueia como **duplicata** e mostra onde o dinheiro já saiu; dá para lançar mesmo assim.'],
      ['Mesmo valor e data, texto diferente', 'Pergunta se é o mesmo dinheiro antes de salvar.'],
    ] } },
    { nota: 'Compras por nota fiscal podem entrar por **Importar Documentos**: o Axioma pergunta se é custo variável, custo fixo, estoque ou investimento e lança no lugar certo.' },

    { h1: 'Datas e dados confiáveis' },
    { p: 'As datas desta tela seguem o dia da sua empresa (fuso do estado cadastrado): depois das 21h o Axioma não pula mais para o dia seguinte. Se algum dado não puder ser lido, o Axioma tenta de novo sozinho; só se ainda assim falhar aparece no topo o aviso **Alguns dados não puderam ser carregados** — o valor faltante nunca é mostrado como zero.' },
    { nota: '**Se a lista de Centros de Custo vier vazia com o aviso "Alguns dados não puderam ser carregados"**, o Axioma já tentou de novo sozinho e a leitura falhou: atualize a página antes de escolher o centro. Lista vazia com o aviso não quer dizer que a Empresa não tem centros.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '12 - Variable Costs.docx',
  titulo: 'Manual 12 — Variable Costs',
  subtitulo: 'Expenses that rise and fall with sales — contribution margin, break-even and silent price-increase alerts',
  info: ['Menu: Financial → Variable Costs  •  Axioma AI.Tech user manual  •  Version 2.2 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Variable costs follow sales: merchandise, raw materials, commissions, freight, packaging, marketing. The screen shows **how much is left from each sale** (contribution margin), **how much you must sell to break even** and warns when a cost is rising unnoticed. Every cost entered here goes automatically to **Accounting** and **Cash Flow** (as paid).' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Financial ▼** → **Variable Costs**.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates the PDF with the period list and totals.', 'The file is downloaded.'],
      ['**+ New Variable Cost**', 'Opens the entry window.', 'See the step by step below.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: 'Period and Share' },
    { p: 'The selector sets the period for the cards and list (Current month, Previous month, Quarter, Year, Last 12 months or Custom). **Share** opens the Sharing Center. Charts and comparisons use up to 24 months back to show trends.' },
    { h2: 'Main cards (clickable)' },
    { tabela: { colunas: ['Card', 'What it shows', 'On click'], larguras: [2400, 3800, 2826], linhas: [
      ['Month Total', 'Sum of costs **in the chosen period**.', 'Opens the P&L.'],
      ['Entries', 'How many costs are in the period.', 'Scrolls to the list.'],
      ['Largest Cost', 'The most expensive item in the period.', 'Scrolls to the list.'],
    ] } },
    { h2: 'CFO view' },
    { tabela: { colunas: ['Indicator', 'What it means'], larguras: [2800, 6226], linhas: [
      ['📉 Variable Cost this Month', 'Month total, with ▲/▼ versus the previous one (rising is bad, so it shows red).'],
      ['📊 Contribution Margin', 'What is left from revenue after variable costs to pay fixed costs and make a profit.'],
      ['⚖️ Break-Even Point', 'Minimum revenue to break even, using only fixed costs **valid today**. If variable costs eat all revenue: "No break-even possible".'],
      ['🛟 Margin of Safety', 'How much revenue can drop before a loss. Below 15% is red; 15% to 30%, yellow.'],
      ['🌊 Volatility', 'How much costs swing from month to month. Above 25%, red.'],
      ['⚡ Weight on Revenue', 'How much of revenue goes to variable costs.'],
    ] } },
    { h2: 'What changed, Margin Analysis and Anomalies' },
    { p: 'An automatic sentence explains the month\'s change and where it came from (e.g., "rose 12%, driven by Freight"). **Margin Analysis** shows Revenue × Variable Cost × Break-Even over time. **Detected Anomalies** flag items that **rise consistently** (worth renegotiating) or that **came in well above normal** (worth checking) — silent price increases. **Axioma Suggestions** bring actions with the possible savings of each.' },
    { h2: 'Search and list' },
    { p: '**Search cost...** field and the period table with description, category, date, amount and **% of Total**.' },
    { tabela: { colunas: ['On the row', 'What it does', 'What happens next'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Pencil', 'Opens the cost to edit.', 'The previous entry is undone in Accounting and Cash Flow and the new one replaces it — no duplicates.'],
      ['🗑️ Trash', 'Asks to delete.', 'Deletion notice: reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator). It also leaves Accounting and Cash Flow.'],
      ['**Origin: …** tag', 'Shows on costs created by another module (paid bill, imported invoice).', 'Click to go to the source and edit there.'],
    ] } },

    { h1: 'Step by step: entering a variable cost' },
    { numerada: [
      'Click **+ New Variable Cost**.',
      'Fill in **Description**, **Amount** and **Date** (empty = today).',
      'Pick the **Category**: Marketing, Logistics, Raw materials, Commissions, Packaging or Other.',
      'Optional: **Cost Center**.',
      'Click **Save Cost**.',
    ] },
    { tabela: { colunas: ['Situation', 'What Axioma does'], larguras: [3000, 6026], linhas: [
      ['Missing description or amount', 'Warns and does not save.'],
      ['Same amount, near the same date, text similar to a paid bill or invoice', 'Blocks it as a **duplicate** and shows where the money already left; you can enter it anyway.'],
      ['Same amount and date, different text', 'Asks whether it is the same money before saving.'],
    ] } },
    { nota: 'Purchases by invoice can come in through **Import Documents**: Axioma asks whether it is a variable cost, fixed cost, inventory or investment and posts it in the right place.' },

    { h1: 'Reliable dates and data' },
    { p: 'Dates on this screen follow your company’s day (time zone of the registered state): after 9 p.m. Axioma no longer jumps to the next day. If some data cannot be read, Axioma retries on its own; only if it still fails does the notice **Some data could not be loaded** appear at the top — the missing value is never shown as zero.' },
    { nota: '**If the Cost Center list comes empty with the notice "Some data could not be loaded"**, Axioma has already retried on its own and the read failed: refresh the page before choosing the center. An empty list with the notice does not mean the Company has no centers.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '12 - Costos Variables.docx',
  titulo: 'Manual 12 — Costos Variables',
  subtitulo: 'Los gastos que suben y bajan con las ventas — margen de contribución, punto de equilibrio y alerta de aumento silencioso',
  info: ['Menú: Financiero → Costos Variables  •  Manual de uso de Axioma AI.Tech  •  Versión 2.2 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Los costos variables acompañan las ventas: mercadería, materia prima, comisiones, fletes, embalajes, marketing. La pantalla muestra **cuánto queda de cada venta** (margen de contribución), **cuánto hay que vender para empatar** y avisa cuando un costo sube sin que nadie lo note. Todo costo registrado aquí va solo a **Contabilidad** y al **Flujo de Caja** (como pagado).' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Financiero ▼** → **Costos Variables**.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera el PDF con la lista del período y los totales.', 'El archivo se descarga.'],
      ['**+ Nuevo Costo Variable**', 'Abre la ventana de registro.', 'Vea el paso a paso abajo.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Período y Compartir' },
    { p: 'El selector elige el período de las tarjetas y de la lista (Mes actual, Mes anterior, Trimestre, Año, Últimos 12 meses o Personalizado). **Compartir** abre el Centro de Compartir. Los gráficos y comparaciones usan hasta 24 meses atrás para ver la tendencia.' },
    { h2: 'Tarjetas principales (con clic)' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra', 'Al hacer clic'], larguras: [2400, 3800, 2826], linhas: [
      ['Total del Mes', 'Suma de los costos **del período elegido**.', 'Abre el Estado de Resultados.'],
      ['Registros', 'Cuántos costos hay en el período.', 'Baja hasta la lista.'],
      ['Mayor Costo', 'El ítem más caro del período.', 'Baja hasta la lista.'],
    ] } },
    { h2: 'Visión CFO' },
    { tabela: { colunas: ['Indicador', 'Qué significa'], larguras: [2800, 6226], linhas: [
      ['📉 Costo Variable del Mes', 'Total del mes, con ▲/▼ frente al anterior (subir es malo, por eso queda en rojo).'],
      ['📊 Margen de Contribución', 'Lo que queda de los ingresos tras los costos variables para pagar los fijos y dar ganancia.'],
      ['⚖️ Punto de Equilibrio', 'Ingreso mínimo para empatar, usando solo los costos fijos **vigentes hoy**. Si los variables se comen todos los ingresos: "Sin equilibrio posible".'],
      ['🛟 Margen de Seguridad', 'Cuánto pueden caer los ingresos antes de la pérdida. Debajo de 15% queda rojo; de 15% a 30%, amarillo.'],
      ['🌊 Volatilidad', 'Cuánto oscilan los costos de un mes a otro. Por encima de 25%, rojo.'],
      ['⚡ Peso en Ingresos', 'Cuánto de los ingresos va a costos variables.'],
    ] } },
    { h2: 'Qué cambió, Análisis de Margen y Anomalías' },
    { p: 'Una frase automática explica la variación del mes y de dónde vino (ej.: "subieron 12%, impulsado por Flete"). El **Análisis de Margen** muestra Ingresos × Costo Variable × Punto de Equilibrio en el tiempo. Las **Anomalías Detectadas** señalan ítems que **suben de forma constante** (conviene renegociar) o que **vinieron muy por encima de lo normal** (conviene revisar) — el aumento silencioso de precio. Las **Sugerencias Axioma** traen acciones con el ahorro posible de cada una.' },
    { h2: 'Búsqueda y lista' },
    { p: 'Campo **Buscar costo...** y tabla del período con descripción, categoría, fecha, valor y **% del Total**.' },
    { tabela: { colunas: ['En la fila', 'Qué hace', 'Qué pasa después'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Lápiz', 'Abre el costo para editar.', 'El registro anterior se deshace en Contabilidad y Flujo y el nuevo entra en su lugar — sin duplicar.'],
      ['🗑️ Papelera', 'Pide eliminar.', 'Aviso de eliminación: motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador). Sale también de Contabilidad y del Flujo.'],
      ['Etiqueta **Origen: …**', 'Aparece en costos creados por otro módulo (cuenta pagada, factura importada).', 'Clic para ir al origen y editar allí.'],
    ] } },

    { h1: 'Paso a paso: registrar un costo variable' },
    { numerada: [
      'Haga clic en **+ Nuevo Costo Variable**.',
      'Complete **Descripción**, **Valor** y **Fecha** (vacía = hoy).',
      'Elija la **Categoría**: Marketing, Logística, Materia prima, Comisiones, Embalajes u Otros.',
      'Opcional: **Centro de Costo**.',
      'Haga clic en **Guardar Costo**.',
    ] },
    { tabela: { colunas: ['Situación', 'Qué hace Axioma'], larguras: [3000, 6026], linhas: [
      ['Falta descripción o valor', 'Avisa y no guarda.'],
      ['Mismo valor, cerca de la misma fecha, texto parecido a una cuenta pagada o factura', 'Lo bloquea como **duplicado** y muestra dónde ya salió el dinero; se puede registrar igual.'],
      ['Mismo valor y fecha, texto distinto', 'Pregunta si es el mismo dinero antes de guardar.'],
    ] } },
    { nota: 'Las compras con factura pueden entrar por **Importar Documentos**: Axioma pregunta si es costo variable, costo fijo, inventario o inversión y lo registra en el lugar correcto.' },

    { h1: 'Fechas y datos confiables' },
    { p: 'Las fechas de esta pantalla siguen el día de su empresa (huso del estado registrado): después de las 21 h Axioma ya no salta al día siguiente. Si algún dato no se puede leer, Axioma reintenta por su cuenta; solo si aun así falla aparece arriba el aviso **Algunos datos no se pudieron cargar** — el valor faltante nunca se muestra como cero.' },
    { nota: '**Si la lista de Centros de Costo viene vacía con el aviso "Algunos datos no se pudieron cargar"**, Axioma ya intentó de nuevo solo y la lectura falló: actualice la página antes de elegir el centro. Una lista vacía con el aviso no significa que la Empresa no tenga centros.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
