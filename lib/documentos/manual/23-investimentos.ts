// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '23 - Investimentos.docx',
  titulo: 'Manual 23 — Investimentos',
  subtitulo: 'Onde está o capital da empresa, quanto rende, quanto está parado e onde vale colocar o próximo real',
  info: ['Menu: Crescimento → Investimentos  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Junta as aplicações da empresa (renda fixa, renda variável, cripto, imóvel), compara com o **caixa** e com as **dívidas**, mostra a liquidez ao longo do tempo e os riscos, e ajuda a decidir **onde alocar o próximo real** — aplicar, quitar dívida ou investir no negócio.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Crescimento ▼** → **Investimentos**.'] },

    { h1: 'As partes da tela' },
    { h2: 'Painel Executivo' },
    { tabela: { colunas: ['Cartão', 'O que mostra'], larguras: [2800, 6226], linhas: [
      ['Patrimônio Total', 'Caixa disponível + capital investido.'],
      ['Caixa Disponível', 'O saldo de caixa de hoje — o mesmo número do Fluxo de Caixa, do Painel de Risco e da IA.'],
      ['Capital Investido / Capital Ocioso', 'Quanto está aplicado e quanto está parado sem render.'],
      ['Liquidez Imediata / Liquidez Projetada (12m)', 'O que dá para resgatar já e ao longo de 12 meses.'],
      ['Rentabilidade Líquida Média / Anualizada', 'O rendimento da carteira, já líquido.'],
      ['Exposição a Risco / Diversificação', 'Peso de renda variável e cripto e o quanto a carteira está espalhada.'],
      ['Score de Investimento', 'Nota da carteira: Crítico, Atenção, Bom ou Excelente.'],
    ] } },
    { h2: 'Indicadores de Mercado (Banco Central)' },
    { p: '**Selic**, **CDI**, **IPCA 12m** e **Dólar (PTAX)** do Banco Central (SGS) e IBGE, pela base do Axioma Nexus — os mesmos números em todo o Axioma. Se as fontes estiverem fora do ar, a tela avisa que está usando uma referência aproximada.' },
    { h2: 'Custo de Oportunidade vs Dívida' },
    { p: 'Aponta aplicação que rende **menos** que a dívida mais cara — sinal de que quitar a dívida dá mais retorno. Sem caso: "Nenhuma aplicação líquida rende menos que sua dívida mais cara".' },
    { h2: 'Escada de Liquidez, Radar de Riscos e Conselho CFO' },
    { p: 'A **Escada** mostra quando cada aplicação vira dinheiro. O **Radar** mede Concentração por Tipo, por Instituição, Liquidez, Dívida vs Capacidade e Volatilidade. O **Conselho CFO** traz recomendações quando há algo crítico.' },
    { h2: 'Capital Allocation Engine (Radar de Oportunidades)' },
    { p: 'Compare onde colocar o próximo real: em cada opção informe **Categoria**, **Valor a Alocar**, **Retorno % a.m.** e o **Ganho/Economia Mensal Estimado**. O Axioma calcula **Payback**, **Risco** e **Prioridade** e ordena. Botão **Adicionar à Comparação**; **Simular** testa choques (receita, custos, juros, aporte) em cenários Otimista, Base, Conservador e Adverso.' },

    { h1: 'Passo a passo: cadastrar um investimento' },
    { numerada: [
      'Clique em **+ Novo Investimento**.',
      'Preencha nome, **Valor**, **Tipo** (Renda Fixa, Renda Variável, Criptomoeda, Imóvel, Outro), data e rentabilidade esperada.',
      'Opcional: **Instituição**, **Indexador**, **Liquidez** (Diária, Curto Prazo, Longo Prazo, No Vencimento), **Vencimento (resgate)** e **Status** (Ativo ou Resgatado).',
      'Clique em **Salvar**.',
    ] },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápis', 'Edita o investimento (ex.: marcar como Resgatado).'],
      ['🗑️ Lixeira', 'Pede motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador).'],
    ] } },
    { nota: 'Se a leitura dos investimentos falhar, a tela avisa — nunca mostra "nenhum investimento" por engano. O mesmo vale para receitas, custos, dívidas e caixa usados nos indicadores.' },
    { nota: 'Enquanto os dados carregam, a tela mostra o sinal de carregando — o aviso de "sem dados" só aparece quando realmente não há lançamentos.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '23 - Investments.docx',
  titulo: 'Manual 23 — Investments',
  subtitulo: 'Where the company’s capital is, what it earns, what is idle and where the next real is worth putting',
  info: ['Menu: Growth → Investments  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Gathers the company’s investments (fixed income, equities, crypto, real estate), compares them with **cash** and **debts**, shows liquidity over time and the risks, and helps decide **where to allocate the next real** — invest, pay off debt or put it into the business.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Growth ▼** → **Investments**.'] },

    { h1: 'Parts of the screen' },
    { h2: 'Executive Panel' },
    { tabela: { colunas: ['Card', 'What it shows'], larguras: [2800, 6226], linhas: [
      ['Total Equity', 'Available cash + invested capital.'],
      ['Available Cash', 'Today’s cash balance — the same number as Cash Flow, the Risk Panel and the AI.'],
      ['Invested Capital / Idle Capital', 'How much is invested and how much sits without earning.'],
      ['Immediate Liquidity / Projected Liquidity (12m)', 'What can be redeemed now and over 12 months.'],
      ['Average Net Return / Annualized Return', 'The portfolio’s return, already net.'],
      ['Risk Exposure / Diversification', 'Weight of equities and crypto and how spread out the portfolio is.'],
      ['Investment Score', 'Portfolio score: Critical, Attention, Good or Excellent.'],
    ] } },
    { h2: 'Market Indicators (Central Bank)' },
    { p: '**Selic**, **CDI**, **12m IPCA** and **Dollar (PTAX)** from the Central Bank (SGS) and IBGE, through the Axioma Nexus base — the same numbers across Axioma. If the sources are down, the screen says it is using an approximate reference.' },
    { h2: 'Opportunity Cost vs Debt' },
    { p: 'Flags an investment that earns **less** than your most expensive debt — a sign that paying off the debt returns more. With no case: "No liquid investment earns less than your most expensive debt".' },
    { h2: 'Liquidity Ladder, Risk Radar and CFO Advice' },
    { p: 'The **Ladder** shows when each investment turns into cash. The **Radar** measures Concentration by Type, by Institution, Liquidity, Debt vs Capacity and Volatility. **CFO Advice** brings recommendations when something is critical.' },
    { h2: 'Capital Allocation Engine (Opportunities Radar)' },
    { p: 'Compare where to put the next real: for each option enter **Category**, **Amount to Allocate**, **Return % per month** and the **Estimated Monthly Gain/Savings**. Axioma calculates **Payback**, **Risk** and **Priority** and ranks them. **Add to Comparison** button; **Simulate** tests shocks (revenue, costs, interest, contribution) in Optimistic, Base, Conservative and Adverse scenarios.' },

    { h1: 'Step by step: registering an investment' },
    { numerada: [
      'Click **+ New Investment**.',
      'Fill in name, **Amount**, **Type** (Fixed Income, Equities, Cryptocurrency, Real Estate, Other), date and expected return.',
      'Optional: **Institution**, **Index**, **Liquidity** (Daily, Short Term, Long Term, At Maturity), **Maturity (redemption)** and **Status** (Active or Redeemed).',
      'Click **Save**.',
    ] },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['✏️ Pencil', 'Edits the investment (e.g., mark as Redeemed).'],
      ['🗑️ Trash', 'Asks for a reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator).'],
    ] } },
    { nota: 'If loading the investments fails, the screen warns you — it never shows "no investments" by mistake. The same goes for revenue, costs, debts and cash used in the indicators.' },
    { nota: 'While data loads, the screen shows the loading sign — the "no data" notice only appears when there really are no entries.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '23 - Inversiones.docx',
  titulo: 'Manual 23 — Inversiones',
  subtitulo: 'Dónde está el capital de la empresa, cuánto rinde, cuánto está parado y dónde conviene poner el próximo real',
  info: ['Menú: Crecimiento → Inversiones  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Junta las inversiones de la empresa (renta fija, renta variable, cripto, inmueble), las compara con la **caja** y las **deudas**, muestra la liquidez en el tiempo y los riesgos, y ayuda a decidir **dónde asignar el próximo real** — invertir, pagar deuda o ponerlo en el negocio.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Crecimiento ▼** → **Inversiones**.'] },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Panel Ejecutivo' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra'], larguras: [2800, 6226], linhas: [
      ['Patrimonio Total', 'Caja disponible + capital invertido.'],
      ['Caja Disponible', 'El saldo de caja de hoy — el mismo número del Flujo de Caja, el Panel de Riesgo y la IA.'],
      ['Capital Invertido / Capital Ocioso', 'Cuánto está invertido y cuánto está parado sin rendir.'],
      ['Liquidez Inmediata / Liquidez Proyectada (12m)', 'Lo que se puede rescatar ya y a lo largo de 12 meses.'],
      ['Rentabilidad Neta Promedio / Anualizada', 'El rendimiento de la cartera, ya neto.'],
      ['Exposición al Riesgo / Diversificación', 'Peso de renta variable y cripto y cuánto está distribuida la cartera.'],
      ['Score de Inversión', 'Nota de la cartera: Crítico, Atención, Bueno o Excelente.'],
    ] } },
    { h2: 'Indicadores de Mercado (Banco Central)' },
    { p: '**Selic**, **CDI**, **IPCA 12m** y **Dólar (PTAX)** del Banco Central (SGS) e IBGE, por la base de Axioma Nexus — los mismos números en todo Axioma. Si las fuentes están caídas, la pantalla avisa que usa una referencia aproximada.' },
    { h2: 'Costo de Oportunidad vs Deuda' },
    { p: 'Señala una inversión que rinde **menos** que la deuda más cara — señal de que pagar la deuda rinde más. Sin casos: "Ninguna inversión líquida rinde menos que su deuda más cara".' },
    { h2: 'Escalera de Liquidez, Radar de Riesgos y Consejo CFO' },
    { p: 'La **Escalera** muestra cuándo cada inversión se vuelve dinero. El **Radar** mide Concentración por Tipo, por Institución, Liquidez, Deuda vs Capacidad y Volatilidad. El **Consejo CFO** trae recomendaciones cuando hay algo crítico.' },
    { h2: 'Capital Allocation Engine (Radar de Oportunidades)' },
    { p: 'Compare dónde poner el próximo real: en cada opción informe **Categoría**, **Valor a Asignar**, **Retorno % mensual** y la **Ganancia/Ahorro Mensual Estimado**. Axioma calcula **Payback**, **Riesgo** y **Prioridad** y las ordena. Botón **Agregar a la Comparación**; **Simular** prueba choques (ingresos, costos, intereses, aporte) en escenarios Optimista, Base, Conservador y Adverso.' },

    { h1: 'Paso a paso: registrar una inversión' },
    { numerada: [
      'Haga clic en **+ Nueva Inversión**.',
      'Complete nombre, **Valor**, **Tipo** (Renta Fija, Renta Variable, Criptomoneda, Inmueble, Otro), fecha y rentabilidad esperada.',
      'Opcional: **Institución**, **Indexador**, **Liquidez** (Diaria, Corto Plazo, Largo Plazo, Al Vencimiento), **Vencimiento (rescate)** y **Estado** (Activo o Rescatado).',
      'Haga clic en **Guardar**.',
    ] },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápiz', 'Edita la inversión (ej.: marcar como Rescatada).'],
      ['🗑️ Papelera', 'Pide motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador).'],
    ] } },
    { nota: 'Si la lectura de las inversiones falla, la pantalla avisa — nunca muestra "ninguna inversión" por error. Lo mismo vale para ingresos, costos, deudas y caja usados en los indicadores.' },
    { nota: 'Mientras los datos cargan, la pantalla muestra la señal de carga — el aviso de "sin datos" solo aparece cuando realmente no hay registros.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
