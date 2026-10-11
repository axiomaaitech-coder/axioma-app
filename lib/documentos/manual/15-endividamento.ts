// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '15 - Endividamento.docx',
  titulo: 'Manual 15 — Endividamento',
  subtitulo: 'A empresa aguenta essa dívida? Qual pagar primeiro? Vale refinanciar?',
  info: ['Menu: Financeiro → Endividamento  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Organiza as dívidas da empresa (empréstimos, financiamentos, cartão, cheque especial) e responde: **a empresa aguenta? qual pagar primeiro? vale refinanciar?** Cada empréstimo que entra e cada pagamento vão sozinhos para o **Fluxo de Caixa** e a **Contabilidade** (conta 3.05 Empréstimos).' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Financeiro ▼** → **Endividamento**.', 'Painel de Risco → cartão **Dívida pesando** → **Ver detalhes**.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera o PDF com dívidas e indicadores.', 'O arquivo é baixado.'],
      ['**+ Nova Dívida**', 'Abre a janela de cadastro.', 'Veja o passo a passo abaixo.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Período, Compartilhar e cartões' },
    { p: 'O seletor de período define a receita e o caixa usados nos indicadores. Cartões: **Total em Dívidas**, **Total Pago** e **Saldo Restante** (clique para ir à lista ou à Escada de Vencimentos). Se a leitura falhar, a tela avisa — nunca mostra "sem dívidas" por engano.' },
    { h2: 'Indicadores de Solvência' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [3000, 6026], linhas: [
      ['Cobertura de Juros', 'Quantas vezes o resultado operacional paga os juros. Abaixo de 1, o lucro não paga nem os juros.'],
      ['Dívida / EBITDA', 'Em quantos anos de resultado a dívida seria paga.'],
      ['Dívida / Receita', 'Peso da dívida sobre o faturamento. Acima de 50%, vermelho.'],
      ['Comprometimento Mensal', 'Quanto da receita do mês vai para parcelas. Acima de 20%, vermelho.'],
      ['Fluxo de Caixa / Dívida', 'Capacidade de pagar com o caixa gerado. Abaixo de 10%, vermelho.'],
      ['Runway da Dívida', 'Em quantos meses a dívida termina no ritmo atual; ∞ (vermelho) se não termina no horizonte.'],
    ] } },
    { nota: 'Os indicadores usam só os custos fixos **vigentes hoje** — custo encerrado não pesa mais. As receitas, custos e caixa são lidos sem limite de linhas; se parte deles não carregar, a tela avisa que os indicadores podem estar incompletos.' },
    { h2: 'Escada de Vencimentos, Método Avalanche e Simulador' },
    { p: 'A **Escada** mostra quanto vence em cada período e destaca o **Muro de vencimentos**. O **Avalanche** ordena da dívida mais cara para a mais barata e marca **Quitar primeiro** (etiqueta **Cara** nas de juro alto). A **Projeção de Quitação** compara Ritmo Atual × Avalanche. No **Simulador de Refinanciamento**, escolha a dívida, a **Nova taxa (% a.m.)** e o **Novo prazo (parcelas)** para ver a nova parcela e a economia.' },
    { h2: 'Conselho CFO e Radar de Prevenção de Quebra' },
    { p: 'Recomendações quando há risco. Sem riscos, aparece "endividamento sob controle".' },
    { nota: '**Regra de ouro:** negocie antes de atrasar. Depois do atraso, você perde poder de barganha.' },
    { h2: 'Lista de dívidas' },
    { p: 'Cada dívida mostra **Valor Total**, **Já Pago**, **Restante**, **Taxa de juros**, próximo vencimento, parcelas restantes e a barra de **Progresso de pagamento**.' },
    { tabela: { colunas: ['Na dívida', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Lápis', 'Edita a dívida — é aqui que se **registra um pagamento** (aumente o "Já pago").', 'A diferença vira o pagamento de hoje no Fluxo e na Contabilidade; a previsão de parcelas diminui. Se o mesmo valor já saiu por outro caminho, o Axioma avisa antes. Diminuir o "Já pago" desfaz o pagamento lançado.'],
      ['🗑️ Lixeira', 'Pede para excluir.', 'Motivo (pelo menos 5 letras) e e-mail e senha de um supervisor. Desfaz no Fluxo e na Contabilidade tudo o que a dívida lançou (empréstimo e pagamentos).'],
    ] } },

    { h1: 'Passo a passo: cadastrar uma dívida' },
    { numerada: [
      'Clique em **+ Nova Dívida**.',
      'Preencha **Descrição** e escolha a **Categoria** (Empréstimo bancário, Cartão de crédito, Cheque especial, Financiamento, Carta de crédito, Outros).',
      'Informe **Valor Total**, **Já Pago** (o que foi pago antes de hoje — não mexe no caixa), **Parcelas restantes**, **Taxa de juros** (% ao mês) e **Próxima parcela vence em**.',
      'Empréstimo novo? Marque **"O dinheiro deste empréstimo entrou no caixa da empresa agora"**: a entrada vai para o Fluxo de Caixa (realizado) e para a Contabilidade. Dívida antiga ou financiamento pago direto ao vendedor: deixe desmarcado.',
      'Clique em **Salvar Dívida**.',
    ] },
    { p: 'As parcelas entram na previsão do Fluxo de Caixa e os juros estimados entram na DRE como despesa financeira. Pagamento de dívida não é despesa: a DRE só mostra os juros.' },
    { nota: 'Enquanto os dados carregam, a tela mostra o sinal de carregando — o aviso de "sem dados" só aparece quando realmente não há lançamentos.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '15 - Debt.docx',
  titulo: 'Manual 15 — Debt',
  subtitulo: 'Can the company handle this debt? Which to pay first? Is refinancing worth it?',
  info: ['Menu: Financial → Debt  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Organizes the company\'s debts (loans, financing, credit card, overdraft) and answers: **can the company handle it? which to pay first? is refinancing worth it?** Every incoming loan and every payment go automatically to **Cash Flow** and **Accounting** (account 3.05 Loans).' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Financial ▼** → **Debt**.', 'Risk Panel → **Debt load** card → **See details**.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates the PDF with debts and indicators.', 'The file is downloaded.'],
      ['**+ New Debt**', 'Opens the entry window.', 'See the step by step below.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: 'Period, Share and cards' },
    { p: 'The period selector sets the revenue and cash used in the indicators. Cards: **Total Debt**, **Total Paid** and **Remaining Balance** (click to go to the list or the Maturity Ladder). If loading fails, the screen warns you — it never shows "no debt" by mistake.' },
    { h2: 'Solvency Indicators' },
    { tabela: { colunas: ['Indicator', 'What it means'], larguras: [3000, 6026], linhas: [
      ['Interest Coverage', 'How many times operating profit pays the interest. Below 1, profit does not even pay the interest.'],
      ['Debt / EBITDA', 'In how many years of results the debt would be paid.'],
      ['Debt / Revenue', 'Debt weight on revenue. Above 50%, red.'],
      ['Monthly Commitment', 'How much of the month\'s revenue goes to installments. Above 20%, red.'],
      ['Cash Flow / Debt', 'Ability to pay with the cash generated. Below 10%, red.'],
      ['Debt Runway', 'In how many months the debt ends at the current pace; ∞ (red) if it does not end within the horizon.'],
    ] } },
    { nota: 'The indicators use only fixed costs **valid today** — an ended cost no longer weighs. Revenue, costs and cash are read with no row limit; if part of them does not load, the screen warns that the indicators may be incomplete.' },
    { h2: 'Maturity Ladder, Avalanche Method and Simulator' },
    { p: 'The **Ladder** shows how much is due in each period and highlights the **Maturity wall**. **Avalanche** orders debts from most to least expensive and marks **Pay off first** (tag **Expensive** on high-interest ones). The **Payoff Projection** compares Current Pace × Avalanche. In the **Refinancing Simulator**, pick the debt, the **New rate (% per month)** and the **New term (installments)** to see the new installment and the savings.' },
    { h2: 'CFO Advice and Breakdown Prevention Radar' },
    { p: 'Recommendations when there is risk. With no risks, it shows "debt under control".' },
    { nota: '**Golden rule:** negotiate before you fall behind. After a delay, you lose bargaining power.' },
    { h2: 'Debt list' },
    { p: 'Each debt shows **Total Amount**, **Already Paid**, **Remaining**, **Interest rate**, next due date, remaining installments and the **Payment progress** bar.' },
    { tabela: { colunas: ['On the debt', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Pencil', 'Edits the debt — this is where you **record a payment** (raise "Already paid").', 'The difference becomes today\'s payment in Cash Flow and Accounting; the installment forecast shrinks. If the same amount already left another way, Axioma warns first. Lowering "Already paid" undoes the recorded payment.'],
      ['🗑️ Trash', 'Asks to delete.', 'Reason (at least 5 letters) and a supervisor\'s email and password. Undoes in Cash Flow and Accounting everything the debt posted (loan and payments).'],
    ] } },

    { h1: 'Step by step: registering a debt' },
    { numerada: [
      'Click **+ New Debt**.',
      'Fill in **Description** and pick the **Category** (Bank loan, Credit card, Overdraft, Financing, Consortium letter, Other).',
      'Enter **Total Amount**, **Already Paid** (what was paid before today — does not touch cash), **Remaining installments**, **Interest rate** (% per month) and **Next installment due on**.',
      'New loan? Tick **"The money from this loan came into the company\'s cash now"**: the inflow goes to Cash Flow (actual) and Accounting. Old debt or financing paid directly to the seller: leave unticked.',
      'Click **Save Debt**.',
    ] },
    { p: 'Installments enter the Cash Flow forecast and estimated interest enters the P&L as a financial expense. Paying debt is not an expense: the P&L only shows the interest.' },
    { nota: 'While data loads, the screen shows the loading sign — the "no data" notice only appears when there really are no entries.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '15 - Endeudamiento.docx',
  titulo: 'Manual 15 — Endeudamiento',
  subtitulo: '¿La empresa aguanta esta deuda? ¿Cuál pagar primero? ¿Conviene refinanciar?',
  info: ['Menú: Financiero → Endeudamiento  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Organiza las deudas de la empresa (préstamos, financiamientos, tarjeta, sobregiro) y responde: **¿la empresa aguanta? ¿cuál pagar primero? ¿conviene refinanciar?** Cada préstamo que entra y cada pago van solos al **Flujo de Caja** y a la **Contabilidad** (cuenta 3.05 Préstamos).' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Financiero ▼** → **Endeudamiento**.', 'Panel de Riesgo → tarjeta **Peso de la deuda** → **Ver detalles**.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera el PDF con deudas e indicadores.', 'El archivo se descarga.'],
      ['**+ Nueva Deuda**', 'Abre la ventana de registro.', 'Vea el paso a paso abajo.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Período, Compartir y tarjetas' },
    { p: 'El selector de período define los ingresos y la caja usados en los indicadores. Tarjetas: **Total en Deudas**, **Total Pagado** y **Saldo Restante** (clic para ir a la lista o a la Escalera de Vencimientos). Si la lectura falla, la pantalla avisa — nunca muestra "sin deudas" por error.' },
    { h2: 'Indicadores de Solvencia' },
    { tabela: { colunas: ['Indicador', 'Qué significa'], larguras: [3000, 6026], linhas: [
      ['Cobertura de Intereses', 'Cuántas veces el resultado operativo paga los intereses. Debajo de 1, la ganancia no paga ni los intereses.'],
      ['Deuda / EBITDA', 'En cuántos años de resultado se pagaría la deuda.'],
      ['Deuda / Ingresos', 'Peso de la deuda sobre la facturación. Por encima de 50%, rojo.'],
      ['Compromiso Mensual', 'Cuánto de los ingresos del mes va a cuotas. Por encima de 20%, rojo.'],
      ['Flujo de Caja / Deuda', 'Capacidad de pagar con la caja generada. Debajo de 10%, rojo.'],
      ['Runway de la Deuda', 'En cuántos meses termina la deuda al ritmo actual; ∞ (rojo) si no termina en el horizonte.'],
    ] } },
    { nota: 'Los indicadores usan solo los costos fijos **vigentes hoy** — un costo terminado ya no pesa. Los ingresos, costos y caja se leen sin límite de filas; si parte de ellos no carga, la pantalla avisa que los indicadores pueden estar incompletos.' },
    { h2: 'Escalera de Vencimientos, Método Avalancha y Simulador' },
    { p: 'La **Escalera** muestra cuánto vence en cada período y destaca el **Muro de vencimientos**. La **Avalancha** ordena de la deuda más cara a la más barata y marca **Pagar primero** (etiqueta **Cara** en las de interés alto). La **Proyección de Cancelación** compara Ritmo Actual × Avalancha. En el **Simulador de Refinanciamiento**, elija la deuda, la **Nueva tasa (% mensual)** y el **Nuevo plazo (cuotas)** para ver la nueva cuota y el ahorro.' },
    { h2: 'Consejo CFO y Radar de Prevención de Quiebra' },
    { p: 'Recomendaciones cuando hay riesgo. Sin riesgos, aparece "endeudamiento bajo control".' },
    { nota: '**Regla de oro:** negocie antes de atrasarse. Después del atraso, pierde poder de negociación.' },
    { h2: 'Lista de deudas' },
    { p: 'Cada deuda muestra **Valor Total**, **Ya Pagado**, **Restante**, **Tasa de interés**, próximo vencimiento, cuotas restantes y la barra de **Progreso de pago**.' },
    { tabela: { colunas: ['En la deuda', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Lápiz', 'Edita la deuda — aquí se **registra un pago** (aumente el "Ya pagado").', 'La diferencia pasa a ser el pago de hoy en el Flujo y la Contabilidad; la previsión de cuotas disminuye. Si el mismo valor ya salió por otro camino, Axioma avisa antes. Bajar el "Ya pagado" deshace el pago registrado.'],
      ['🗑️ Papelera', 'Pide eliminar.', 'Motivo (al menos 5 letras) y correo y contraseña de un supervisor. Deshace en el Flujo y la Contabilidad todo lo que la deuda registró (préstamo y pagos).'],
    ] } },

    { h1: 'Paso a paso: registrar una deuda' },
    { numerada: [
      'Haga clic en **+ Nueva Deuda**.',
      'Complete **Descripción** y elija la **Categoría** (Préstamo bancario, Tarjeta de crédito, Sobregiro, Financiamiento, Carta de crédito, Otros).',
      'Informe **Valor Total**, **Ya Pagado** (lo pagado antes de hoy — no mueve la caja), **Cuotas restantes**, **Tasa de interés** (% mensual) y **Próxima cuota vence el**.',
      '¿Préstamo nuevo? Marque **"El dinero de este préstamo entró en la caja de la empresa ahora"**: la entrada va al Flujo de Caja (realizado) y a la Contabilidad. Deuda antigua o financiamiento pagado directo al vendedor: déjelo sin marcar.',
      'Haga clic en **Guardar Deuda**.',
    ] },
    { p: 'Las cuotas entran en la previsión del Flujo de Caja y los intereses estimados entran en el Estado de Resultados como gasto financiero. Pagar deuda no es gasto: el Estado de Resultados solo muestra los intereses.' },
    { nota: 'Mientras los datos cargan, la pantalla muestra la señal de carga — el aviso de "sin datos" solo aparece cuando realmente no hay registros.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
