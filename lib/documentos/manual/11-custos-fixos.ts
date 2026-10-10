// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '11 - Custos Fixos.docx',
  titulo: 'Manual 11 — Custos Fixos',
  subtitulo: 'Os gastos que existem todo mês, vendendo ou não — com vigência, radar de renovações e economia',
  info: ['Menu: Financeiro → Custos Fixos  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Custos fixos são os gastos de todo mês: aluguel, salários, contador, internet, sistemas, seguros. Aqui você cadastra cada um **uma vez**, com o período em que vale, e o Axioma usa isso na **DRE** (mês a mês), na **previsão do Fluxo de Caixa** e para **gerar a conta do mês em Contas a Pagar** sozinho.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Financeiro ▼** → **Custos Fixos**.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera o PDF com a lista e os totais.', 'O arquivo é baixado.'],
      ['**+ Novo Custo Fixo**', 'Abre a janela de cadastro.', 'Veja o passo a passo abaixo.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Cartões e indicadores' },
    { tabela: { colunas: ['Cartão', 'O que mostra'], larguras: [2800, 6226], linhas: [
      ['Total Mensal', 'Soma dos custos **que estão valendo hoje** (a mesma regra da DRE). Custo encerrado ou que ainda vai começar não entra. Clique para ir à lista.'],
      ['Total Anual', 'O total mensal × 12. Clique para abrir a DRE.'],
      ['Itens', 'Quantos custos estão cadastrados (inclusive encerrados).'],
      ['💸 Economia Potencial', 'Quanto daria para economizar com custos que parecem repetidos (nomes muito parecidos).'],
      ['🔔 Radar de Renovações', 'Quantos contratos têm data de renovação chegando.'],
    ] } },
    { h2: 'Radar de Renovações' },
    { p: 'Lista os contratos com **data de renovação** preenchida, do mais urgente para o mais distante, com o selo **Vencido**, **Crítico**, **Próximo** ou **Futuro** e quantos dias faltam. Serve para renegociar antes de renovar sozinho.' },
    { h2: 'Análise Anual e Insights' },
    { p: 'Gráficos da **composição por categoria** e dos maiores custos. Os insights avisam, por regra, custos com nomes muito parecidos (possível duplicidade), a economia possível e quando a estrutura está enxuta.' },
    { h2: 'Busca e lista' },
    { p: 'Campo **Buscar custo...** e tabela com descrição, valor mensal, valor anual, dia do vencimento e categoria. Custos fora da vigência aparecem com o selo cinza **encerrado em DD/MM/AAAA** ou **começa em DD/MM/AAAA**.' },
    { tabela: { colunas: ['Na linha', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Lápis', 'Abre o custo para editar.', 'Mudanças valem para a DRE dos meses dentro da vigência.'],
      ['🗑️ Lixeira', 'Pede para excluir.', 'O aviso explica que o custo some **também dos meses passados da DRE**. Exige motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador).'],
    ] } },
    { alerta: 'Custo que existiu e acabou (ex.: mudou de sala, cancelou o sistema): **não exclua**. Clique no lápis e preencha **Até** com a data do fim. Assim os meses em que ele existiu continuam certos na DRE.' },

    { h1: 'Passo a passo: cadastrar um custo fixo' },
    { numerada: [
      'Clique em **+ Novo Custo Fixo**.',
      'Preencha **Descrição**, **Valor Mensal** e **Dia Vencimento** (de 1 a 31 — outro número não salva).',
      'Escolha a **Categoria**: Aluguel/Imóvel, Folha de pagamento, Serviços essenciais, Sistemas e assinaturas, Seguros, Contabilidade ou Outros.',
      'Opcional: **Centro de Custo** (dá para criar um novo ali mesmo).',
      '**Vale desde**: o primeiro mês do custo (vazio = data do cadastro). **Até**: o último (vazio = continua). "Até" antes de "Vale desde" não salva.',
      'Contrato com renovação (aluguel, software, seguro)? Preencha a **data de renovação** para entrar no Radar.',
      'Clique em **Salvar Custo Fixo**.',
    ] },
    { nota: 'Todo dia o Axioma cria sozinho, em Contas a Pagar, a conta do mês de cada custo fixo vigente, e avisa 7 dias antes do vencimento. A DRE soma o custo só nos meses entre "Vale desde" e "Até", sem contar duas vezes a conta gerada.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '11 - Fixed Costs.docx',
  titulo: 'Manual 11 — Fixed Costs',
  subtitulo: 'Expenses that exist every month, selling or not — with validity dates, renewal radar and savings',
  info: ['Menu: Financial → Fixed Costs  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Fixed costs are the monthly expenses: rent, payroll, accountant, internet, software, insurance. Here you register each one **once**, with the period it is valid, and Axioma uses it in the **P&L** (month by month), the **Cash Flow forecast** and to **create the month\'s bill in Payables** automatically.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Financial ▼** → **Fixed Costs**.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates the PDF with the list and totals.', 'The file is downloaded.'],
      ['**+ New Fixed Cost**', 'Opens the entry window.', 'See the step by step below.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: 'Cards and indicators' },
    { tabela: { colunas: ['Card', 'What it shows'], larguras: [2800, 6226], linhas: [
      ['Monthly Total', 'Sum of the costs **valid today** (the same rule as the P&L). Ended or future costs are not included. Click to go to the list.'],
      ['Annual Total', 'Monthly total × 12. Click to open the P&L.'],
      ['Items', 'How many costs are registered (including ended ones).'],
      ['💸 Potential Savings', 'How much you could save on costs that look duplicated (very similar names).'],
      ['🔔 Renewal Radar', 'How many contracts have a renewal date coming up.'],
    ] } },
    { h2: 'Renewal Radar' },
    { p: 'Lists contracts with a **renewal date**, most urgent first, tagged **Overdue**, **Critical**, **Soon** or **Future** with the days left. Use it to renegotiate before they renew on their own.' },
    { h2: 'Annual Analysis and Insights' },
    { p: 'Charts of the **composition by category** and the largest costs. Insights warn, by rule, about costs with very similar names (possible duplicates), possible savings and when the structure is lean.' },
    { h2: 'Search and list' },
    { p: '**Search cost...** field and table with description, monthly amount, annual amount, due day and category. Costs outside their validity show a gray tag **ended …** or **starts …**.' },
    { tabela: { colunas: ['On the row', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Pencil', 'Opens the cost to edit.', 'Changes apply to the P&L months within the validity.'],
      ['🗑️ Trash', 'Asks to delete.', 'The notice explains the cost also disappears **from past P&L months**. It requires a reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator).'],
    ] } },
    { alerta: 'A cost that existed and ended (e.g., you moved, cancelled the software): **do not delete it**. Click the pencil and fill in **Until** with the end date. That way the months it existed stay correct in the P&L.' },

    { h1: 'Step by step: registering a fixed cost' },
    { numerada: [
      'Click **+ New Fixed Cost**.',
      'Fill in **Description**, **Monthly Amount** and **Due Day** (1 to 31 — any other number does not save).',
      'Pick the **Category**: Rent/Property, Payroll, Essential services, Software and subscriptions, Insurance, Accounting or Other.',
      'Optional: **Cost Center** (you can create a new one right there).',
      '**Valid from**: the first month of the cost (empty = registration date). **Until**: the last one (empty = ongoing). "Until" before "Valid from" does not save.',
      'Contract with renewal (rent, software, insurance)? Fill in the **renewal date** to add it to the Radar.',
      'Click **Save Fixed Cost**.',
    ] },
    { nota: 'Every day Axioma creates in Payables the month\'s bill for each valid fixed cost, and warns 7 days before the due date. The P&L counts the cost only in the months between "Valid from" and "Until", without counting the generated bill twice.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '11 - Costos Fijos.docx',
  titulo: 'Manual 11 — Costos Fijos',
  subtitulo: 'Los gastos de todos los meses, venda o no — con vigencia, radar de renovaciones y ahorro',
  info: ['Menú: Financiero → Costos Fijos  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Los costos fijos son los gastos de todos los meses: alquiler, sueldos, contador, internet, sistemas, seguros. Aquí registra cada uno **una sola vez**, con el período en que vale, y Axioma lo usa en el **Estado de Resultados** (mes a mes), en la **previsión del Flujo de Caja** y para **generar la cuenta del mes en Cuentas por Pagar** solo.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Financiero ▼** → **Costos Fijos**.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera el PDF con la lista y los totales.', 'El archivo se descarga.'],
      ['**+ Nuevo Costo Fijo**', 'Abre la ventana de registro.', 'Vea el paso a paso abajo.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Tarjetas e indicadores' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra'], larguras: [2800, 6226], linhas: [
      ['Total Mensual', 'Suma de los costos **vigentes hoy** (la misma regla del Estado de Resultados). Los terminados o que aún no empiezan no entran. Clic para ir a la lista.'],
      ['Total Anual', 'El total mensual × 12. Clic para abrir el Estado de Resultados.'],
      ['Ítems', 'Cuántos costos están registrados (incluso los terminados).'],
      ['💸 Ahorro Potencial', 'Cuánto se podría ahorrar en costos que parecen repetidos (nombres muy parecidos).'],
      ['🔔 Radar de Renovaciones', 'Cuántos contratos tienen fecha de renovación cerca.'],
    ] } },
    { h2: 'Radar de Renovaciones' },
    { p: 'Lista los contratos con **fecha de renovación**, del más urgente al más lejano, con la etiqueta **Vencido**, **Crítico**, **Próximo** o **Futuro** y los días que faltan. Sirve para renegociar antes de que se renueven solos.' },
    { h2: 'Análisis Anual e Insights' },
    { p: 'Gráficos de la **composición por categoría** y de los mayores costos. Los insights avisan, por regla, costos con nombres muy parecidos (posible duplicado), el ahorro posible y cuando la estructura es eficiente.' },
    { h2: 'Búsqueda y lista' },
    { p: 'Campo **Buscar costo...** y tabla con descripción, valor mensual, valor anual, día de vencimiento y categoría. Los costos fuera de vigencia muestran la etiqueta gris **terminó …** o **empieza …**.' },
    { tabela: { colunas: ['En la fila', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Lápiz', 'Abre el costo para editar.', 'Los cambios valen para los meses del Estado de Resultados dentro de la vigencia.'],
      ['🗑️ Papelera', 'Pide eliminar.', 'El aviso explica que el costo desaparece **también de los meses pasados** del Estado de Resultados. Exige motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador).'],
    ] } },
    { alerta: 'Costo que existió y terminó (ej.: se mudó, canceló el sistema): **no lo elimine**. Haga clic en el lápiz y complete **Hasta** con la fecha final. Así los meses en que existió siguen correctos en el Estado de Resultados.' },

    { h1: 'Paso a paso: registrar un costo fijo' },
    { numerada: [
      'Haga clic en **+ Nuevo Costo Fijo**.',
      'Complete **Descripción**, **Valor Mensual** y **Día de Vencimiento** (de 1 a 31 — otro número no guarda).',
      'Elija la **Categoría**: Alquiler/Inmueble, Nómina, Servicios esenciales, Sistemas y suscripciones, Seguros, Contabilidad u Otros.',
      'Opcional: **Centro de Costo** (se puede crear uno nuevo ahí mismo).',
      '**Vigente desde**: el primer mes del costo (vacío = fecha del registro). **Hasta**: el último (vacío = sigue). "Hasta" antes de "Vigente desde" no guarda.',
      '¿Contrato con renovación (alquiler, software, seguro)? Complete la **fecha de renovación** para entrar en el Radar.',
      'Haga clic en **Guardar Costo Fijo**.',
    ] },
    { nota: 'Todos los días Axioma crea en Cuentas por Pagar la cuenta del mes de cada costo fijo vigente y avisa 7 días antes del vencimiento. El Estado de Resultados suma el costo solo en los meses entre "Vigente desde" y "Hasta", sin contar dos veces la cuenta generada.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
