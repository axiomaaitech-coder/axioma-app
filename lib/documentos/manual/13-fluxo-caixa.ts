// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '13 - Fluxo de Caixa.docx',
  titulo: 'Manual 13 — Fluxo de Caixa',
  subtitulo: 'O dinheiro de verdade: o que entrou, o que saiu, quanto há hoje e quanto haverá',
  info: ['Menu: Financeiro → Fluxo de Caixa  •  Manual de uso do Axioma AI.Tech  •  Versão 2.1 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra o **dinheiro de verdade**: entradas e saídas realizadas, o **saldo de caixa hoje** e a **previsão** das próximas semanas, juntando sozinho o que vem de Contas a Receber, Contas a Pagar, Custos Fixos, Dívidas e vendas do PDV. O ponto mais importante é o **Alerta de Ruptura de Caixa**: avisa com antecedência se o dinheiro vai faltar.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Financeiro ▼** → **Fluxo de Caixa**.', 'Cartão **Recebido** em Receitas.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera o PDF com os lançamentos do período e o resumo.', 'O arquivo é baixado.'],
      ['**+ Novo Lançamento**', 'Abre a janela de lançamento manual.', 'Veja o passo a passo abaixo.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Período e Compartilhar' },
    { p: 'O seletor escolhe o período das entradas, saídas e da lista. **Compartilhar** abre a Central de Compartilhamento.' },
    { h2: 'Cartões do topo (clicáveis)' },
    { tabela: { colunas: ['Cartão', 'O que mostra', 'Ao clicar'], larguras: [2400, 3800, 2826], linhas: [
      ['Total Entradas', 'Entradas do período.', 'Abre Receitas.'],
      ['Total Saídas', 'Saídas do período.', 'Abre Custos Variáveis.'],
      ['Saldo Atual', 'O dinheiro realizado em caixa **hoje**: tudo o que entrou e saiu desde o começo + vendas do PDV já recebidas. É o mesmo número que o Painel de Risco e a IA usam.', '—'],
    ] } },
    { h2: 'Indicadores CFO' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['💰 Saldo Atual', 'Dinheiro realizado em caixa hoje.'],
      ['📈 Total Entradas / 📉 Total Saídas', 'Do período, com ▲/▼ em relação ao período anterior.'],
      ['Saldo do Período', 'Entradas − saídas no período escolhido.'],
      ['🚨 Alerta de Ruptura de Caixa', 'Em quantos dias o caixa ficaria negativo; "—" quando não há risco.'],
      ['🎯 Precisão da Previsão', 'Quanto as previsões passadas acertaram o que aconteceu. Abaixo de 60%, vermelho.'],
    ] } },
    { h2: 'Previstos Automáticos' },
    { p: 'Sem lançar de novo, o Axioma soma na previsão: **Contas a Receber** e **Contas a Pagar** em aberto, **Custos Fixos** vigentes do mês (encerrado não entra; sem duplicar quando a conta do mês já foi gerada) e **parcelas de Dívidas** — mostrando quanto vem de cada origem. A chave **Incluir previstos automáticos na projeção** liga e desliga; desligue só se você já lança esses itens à mão aqui.' },
    { h2: 'Previsão (próximos 3 meses)' },
    { p: 'Saldo projetado em três cenários: **Otimista**, **Previsto** e **Pessimista**. **Visão Semanal (13 semanas)** e **Visão Mensal** mudam o detalhe.' },
    { h2: 'Lançamentos do Período' },
    { p: 'Tabela com descrição, tipo (Entrada/Saída), data, status (Realizado/Previsto) e valor, 25 por página. Vendas do PDV aparecem agrupadas por dia ("Vendas PDV 05/10"); no crédito, como **previsão de repasse** 30 dias depois.' },
    { tabela: { colunas: ['Na linha', 'O que faz', 'O que acontece depois'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Lápis', 'Edita um lançamento feito aqui.', 'Contabilidade e DRE são refeitas sem duplicar.'],
      ['🗑️ Lixeira', 'Pede para excluir.', 'Motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador).'],
      ['Selo **Origem: …**', 'Aparece em lançamentos que vieram de outro módulo (conta paga/recebida, receita, custo, dívida, PDV).', 'Clique para ir à origem e corrigir lá — assim todas as telas continuam iguais.'],
    ] } },

    { h1: 'Passo a passo: lançar uma movimentação' },
    { numerada: [
      'Clique em **+ Novo Lançamento**.',
      'Escolha **Entrada** ou **Saída**, a **Natureza** — Receita, Custo/Despesa, Aporte de sócio, Empréstimo recebido, Pagamento de empréstimo, Retirada de sócio, Transferência entre contas ou Aplicação/resgate — e preencha descrição, valor e data.',
      'Status: **Realizado** se o dinheiro já se moveu; **Previsto** se ainda vai.',
      'Clique em **Salvar**.',
    ] },
    { tabela: { colunas: ['Natureza', 'Onde mais aparece'], larguras: [3000, 6026], linhas: [
      ['Receita / Custo', 'Contabilidade e DRE (é resultado).'],
      ['Aporte, Empréstimo, Pagamento de empréstimo, Retirada', 'Só Contabilidade (mexe no caixa, não é lucro nem prejuízo).'],
      ['Transferência / Aplicação', 'Só o caixa: o dinheiro mudou de lugar dentro da empresa.'],
    ] } },
    { alerta: 'Viu o **Alerta de Ruptura de Caixa**? Aja logo: antecipe recebimentos, renegocie pagamentos ou reforce o caixa. Quanto antes, mais opções.' },
    { nota: 'Quando a conexão bancária (Open Finance) estiver ativa, o extrato do banco entra sozinho e o caixa fica ainda mais fiel.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '13 - Cash Flow.docx',
  titulo: 'Manual 13 — Cash Flow',
  subtitulo: 'Real money: what came in, what went out, how much there is today and how much there will be',
  info: ['Menu: Financial → Cash Flow  •  Axioma AI.Tech user manual  •  Version 2.1 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Shows **real money**: actual inflows and outflows, **today\'s cash balance** and the **forecast** for the coming weeks, automatically combining Receivables, Payables, Fixed Costs, Debts and POS sales. The key feature is the **Cash Shortfall Alert**: it warns in advance if money will run out.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Financial ▼** → **Cash Flow**.', '**Received** card in Revenue.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates the PDF with the period entries and summary.', 'The file is downloaded.'],
      ['**+ New Entry**', 'Opens the manual entry window.', 'See the step by step below.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: 'Period and Share' },
    { p: 'The selector sets the period for inflows, outflows and the list. **Share** opens the Sharing Center.' },
    { h2: 'Top cards (clickable)' },
    { tabela: { colunas: ['Card', 'What it shows', 'On click'], larguras: [2400, 3800, 2826], linhas: [
      ['Total Inflows', 'Inflows in the period.', 'Opens Revenue.'],
      ['Total Outflows', 'Outflows in the period.', 'Opens Variable Costs.'],
      ['Current Balance', 'Actual cash **today**: everything that came in and went out since the start + POS sales already received. It is the same number the Risk Panel and the AI use.', '—'],
    ] } },
    { h2: 'CFO indicators' },
    { tabela: { colunas: ['Indicator', 'What it means'], larguras: [2800, 6226], linhas: [
      ['💰 Current Balance', 'Actual cash today.'],
      ['📈 Total Inflows / 📉 Total Outflows', 'For the period, with ▲/▼ versus the previous period.'],
      ['Period Balance', 'Inflows − outflows in the chosen period.'],
      ['🚨 Cash Shortfall Alert', 'In how many days cash would go negative; "—" when there is no risk.'],
      ['🎯 Forecast Accuracy', 'How well past forecasts matched what happened. Below 60%, red.'],
    ] } },
    { h2: 'Automatic Forecasts' },
    { p: 'Without re-entering anything, Axioma adds to the forecast: open **Receivables** and **Payables**, the month\'s valid **Fixed Costs** (ended ones are left out; no duplicates once the month\'s bill exists) and **Debt installments** — showing how much comes from each source. The **Include automatic forecasts in the projection** switch turns it on and off; turn it off only if you already enter these items here by hand.' },
    { h2: 'Forecast (next 3 months)' },
    { p: 'Projected balance in three scenarios: **Optimistic**, **Expected** and **Pessimistic**. **Weekly View (13 weeks)** and **Monthly View** change the detail.' },
    { h2: 'Period Entries' },
    { p: 'Table with description, type (Inflow/Outflow), date, status (Actual/Forecast) and amount, 25 per page. POS sales appear grouped by day ("POS sales 10/05"); credit card sales show as a **payout forecast** 30 days later.' },
    { tabela: { colunas: ['On the row', 'What it does', 'What happens next'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Pencil', 'Edits an entry made here.', 'Accounting and the P&L are redone without duplicates.'],
      ['🗑️ Trash', 'Asks to delete.', 'Reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator).'],
      ['**Origin: …** tag', 'Shows on entries that came from another module (paid/received bill, revenue, cost, debt, POS).', 'Click to go to the source and fix it there — so every screen stays the same.'],
    ] } },

    { h1: 'Step by step: entering a movement' },
    { numerada: [
      'Click **+ New Entry**.',
      'Choose **Inflow** or **Outflow**, the **Nature** — Revenue, Cost/Expense, Partner contribution, Loan received, Loan payment, Partner withdrawal, Transfer between accounts or Investment/redemption — and fill in description, amount and date.',
      'Status: **Actual** if the money already moved; **Forecast** if it is still to come.',
      'Click **Save**.',
    ] },
    { tabela: { colunas: ['Nature', 'Where else it shows'], larguras: [3000, 6026], linhas: [
      ['Revenue / Cost', 'Accounting and the P&L (it is a result).'],
      ['Contribution, Loan, Loan payment, Withdrawal', 'Accounting only (moves cash, not profit or loss).'],
      ['Transfer / Investment', 'Cash only: money moved within the company.'],
    ] } },
    { alerta: 'Seeing the **Cash Shortfall Alert**? Act quickly: bring receipts forward, renegotiate payments or reinforce cash. The sooner, the more options.' },
    { nota: 'Once the bank connection (Open Finance) is active, the bank statement comes in automatically and cash becomes even more accurate.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '13 - Flujo de Caja.docx',
  titulo: 'Manual 13 — Flujo de Caja',
  subtitulo: 'El dinero real: lo que entró, lo que salió, cuánto hay hoy y cuánto habrá',
  info: ['Menú: Financiero → Flujo de Caja  •  Manual de uso de Axioma AI.Tech  •  Versión 2.1 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Muestra el **dinero real**: entradas y salidas realizadas, el **saldo de caja hoy** y la **previsión** de las próximas semanas, juntando solo lo que viene de Cuentas por Cobrar, Cuentas por Pagar, Costos Fijos, Deudas y ventas del PDV. Lo más importante es la **Alerta de Ruptura de Caja**: avisa con anticipación si va a faltar dinero.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Financiero ▼** → **Flujo de Caja**.', 'Tarjeta **Cobrado** en Ingresos.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera el PDF con los registros del período y el resumen.', 'El archivo se descarga.'],
      ['**+ Nuevo Registro**', 'Abre la ventana de registro manual.', 'Vea el paso a paso abajo.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Período y Compartir' },
    { p: 'El selector elige el período de las entradas, salidas y de la lista. **Compartir** abre el Centro de Compartir.' },
    { h2: 'Tarjetas superiores (con clic)' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra', 'Al hacer clic'], larguras: [2400, 3800, 2826], linhas: [
      ['Total Entradas', 'Entradas del período.', 'Abre Ingresos.'],
      ['Total Salidas', 'Salidas del período.', 'Abre Costos Variables.'],
      ['Saldo Actual', 'El dinero realizado en caja **hoy**: todo lo que entró y salió desde el inicio + ventas del PDV ya cobradas. Es el mismo número que usan el Panel de Riesgo y la IA.', '—'],
    ] } },
    { h2: 'Indicadores CFO' },
    { tabela: { colunas: ['Indicador', 'Qué significa'], larguras: [2800, 6226], linhas: [
      ['💰 Saldo Actual', 'Dinero realizado en caja hoy.'],
      ['📈 Total Entradas / 📉 Total Salidas', 'Del período, con ▲/▼ frente al período anterior.'],
      ['Saldo del Período', 'Entradas − salidas en el período elegido.'],
      ['🚨 Alerta de Ruptura de Caja', 'En cuántos días la caja quedaría negativa; "—" cuando no hay riesgo.'],
      ['🎯 Precisión de la Previsión', 'Cuánto acertaron las previsiones pasadas. Debajo de 60%, rojo.'],
    ] } },
    { h2: 'Previstos Automáticos' },
    { p: 'Sin registrar de nuevo, Axioma suma a la previsión: **Cuentas por Cobrar** y **por Pagar** abiertas, los **Costos Fijos** vigentes del mes (los terminados no entran; sin duplicar cuando la cuenta del mes ya existe) y las **cuotas de Deudas** — mostrando cuánto viene de cada origen. El interruptor **Incluir previstos automáticos en la proyección** lo enciende y apaga; apáguelo solo si ya registra esos ítems aquí a mano.' },
    { h2: 'Previsión (próximos 3 meses)' },
    { p: 'Saldo proyectado en tres escenarios: **Optimista**, **Previsto** y **Pesimista**. **Vista Semanal (13 semanas)** y **Vista Mensual** cambian el detalle.' },
    { h2: 'Registros del Período' },
    { p: 'Tabla con descripción, tipo (Entrada/Salida), fecha, estado (Realizado/Previsto) y valor, 25 por página. Las ventas del PDV aparecen agrupadas por día ("Ventas PDV 05/10"); con tarjeta de crédito, como **previsión de repaso** 30 días después.' },
    { tabela: { colunas: ['En la fila', 'Qué hace', 'Qué pasa después'], larguras: [2400, 3400, 3226], linhas: [
      ['✏️ Lápiz', 'Edita un registro hecho aquí.', 'Contabilidad y Estado de Resultados se rehacen sin duplicar.'],
      ['🗑️ Papelera', 'Pide eliminar.', 'Motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador).'],
      ['Etiqueta **Origen: …**', 'Aparece en registros que vinieron de otro módulo (cuenta pagada/cobrada, ingreso, costo, deuda, PDV).', 'Clic para ir al origen y corregir allí — así todas las pantallas siguen iguales.'],
    ] } },

    { h1: 'Paso a paso: registrar un movimiento' },
    { numerada: [
      'Haga clic en **+ Nuevo Registro**.',
      'Elija **Entrada** o **Salida**, la **Naturaleza** — Ingreso, Costo/Gasto, Aporte de socio, Préstamo recibido, Pago de préstamo, Retiro de socio, Transferencia entre cuentas o Inversión/rescate — y complete descripción, valor y fecha.',
      'Estado: **Realizado** si el dinero ya se movió; **Previsto** si aún va a moverse.',
      'Haga clic en **Guardar**.',
    ] },
    { tabela: { colunas: ['Naturaleza', 'Dónde más aparece'], larguras: [3000, 6026], linhas: [
      ['Ingreso / Costo', 'Contabilidad y Estado de Resultados (es resultado).'],
      ['Aporte, Préstamo, Pago de préstamo, Retiro', 'Solo Contabilidad (mueve la caja, no es ganancia ni pérdida).'],
      ['Transferencia / Inversión', 'Solo la caja: el dinero cambió de lugar dentro de la empresa.'],
    ] } },
    { alerta: '¿Vio la **Alerta de Ruptura de Caja**? Actúe rápido: adelante cobros, renegocie pagos o refuerce la caja. Cuanto antes, más opciones.' },
    { nota: 'Cuando la conexión bancaria (Open Finance) esté activa, el extracto del banco entra solo y la caja queda aún más fiel.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
