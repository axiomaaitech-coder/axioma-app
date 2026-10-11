// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '16 - Tesouraria.docx',
  titulo: 'Manual 16 — Tesouraria',
  subtitulo: 'Como está o caixa, o que vai acontecer e qual o risco — tudo numa visão só',
  info: ['Menu: Financeiro → Tesouraria  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A Tesouraria é o **centro de comando do caixa**: mostra quanto há em cada conta (banco, caixa, aplicação), quanto está realmente livre, a projeção para 30, 60 e 90 dias e os riscos de ruptura. Tem ainda o **Simulador de Estresse** e o **Gêmeo Financeiro** para testar decisões antes de tomá-las.' },
    { nota: 'Os saldos vêm das **contas de tesouraria da Contabilidade** (bancos, caixa, aplicações), que recebem sozinhas cada pagamento e recebimento pelo motor de rastreabilidade.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Financeiro ▼** → **Tesouraria**.', 'Painel de Risco → cartão **Liquidez** → **Ver detalhes**.'] },

    { h1: 'Botões do topo' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Compartilhar**', 'Abre a Central de Compartilhamento com o resumo do caixa.', 'WhatsApp, e-mail, copiar ou PDF.'],
      ['**Simulador de Estresse**', 'Abre o simulador.', 'Veja a seção própria abaixo.'],
      ['**Gêmeo Financeiro**', 'Abre o gêmeo da empresa.', 'Veja a seção própria abaixo.'],
      ['**Configurar**', 'Abre a configuração (só Proprietário ou Administrador).', 'Reserva mínima, alerta de ruptura e nomes das contas.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Posição de Caixa' },
    { tabela: { colunas: ['Cartão', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Total Geral', 'Soma de todas as contas de tesouraria.'],
      ['Disponível', 'O que pode ser usado hoje (sem aplicações presas).'],
      ['Livre de Fato', 'Disponível menos a reserva mínima e as saídas já previstas.'],
      ['Aplicado', 'Dinheiro em aplicações.'],
    ] } },
    { p: 'Abaixo, a tabela por conta (Conta, Tipo, Saldo). **Clique numa conta** para abrir o Livro Razão dela.' },
    { h2: 'Liquidity Score' },
    { p: 'Nota do caixa considerando o disponível, as saídas dos próximos 30 dias, a reserva mínima e o saldo projetado em 90 dias, com a explicação ao lado (**Cobertura**, **Folga**, **abaixo da reserva**).' },
    { h2: 'Fluxo Projetado' },
    { p: 'Saldo projetado em 30, 60 e 90 dias em três cenários: **Otimista**, **Base** e **Estressado**. Sem histórico suficiente, Base e Estressado ficam iguais ao Otimista até haver mais dado — a tela avisa.' },
    { h2: 'Caixa Potencialmente Ocioso' },
    { p: 'Quanto está parado além da reserva e das saídas do mês — dinheiro que poderia render.' },
    { h2: 'Treasury Radar (Riscos ativos)' },
    { p: 'Lista os riscos detectados (ex.: ruptura em X dias, dívida pendente). Botão **Resolver** marca o risco como tratado. Sem riscos: "Nenhum risco detectado no momento".' },
    { h2: 'Pergunte à Tesouraria' },
    { p: 'Escreva uma pergunta (ex.: "como está meu caixa?") ou clique numa sugestão. A inteligência do Axioma responde só com os números desta tela; se não puder, responde por regras. Enquanto pensa aparece **Pensando...**.' },

    { h1: 'Simulador de Estresse' },
    { p: 'Ajuste as variáveis e veja o impacto no caixa ao vivo, sempre sobre o fluxo projetado real: **Receita** (%), **Despesas** (%), **Atraso dos recebimentos** (dias), **Nova Contratação** (custo mensal), **Nova Dívida** (valor que entra hoje e parcela mensal) e o **Horizonte**. Mostra **Antes × Simulado** (Caixa, Liquidity Score, Impacto no Saldo Projetado) e se há ruptura.' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['**Zerar**', 'Volta todas as variáveis a zero.'],
      ['**Salvar Cenário**', 'Pede um **Nome do cenário** e guarda para comparar depois.'],
      ['**Editar** / **Excluir** (cenário salvo)', 'Editar reabre o cenário; Excluir pede motivo e e-mail e senha de um supervisor.'],
      ['**Voltar ao Command Center**', 'Volta para a Tesouraria.'],
    ] } },

    { h1: 'Gêmeo Financeiro' },
    { p: 'Mostra a empresa **hoje** e em 30/60/90 dias, **com ou sem uma mudança grande**. Em **Aplicar uma mudança grande** escolha: Nenhuma (como está), **Nova Filial** (investimento inicial + custo mensal), **Novo Empréstimo** (valor + parcela) ou **Receita +30%**. A tabela **Antes × Depois** compara Caixa disponível, Capital de Giro, Dívida pendente, Liquidity Score e Saldo projetado em 90 dias.' },

    { h1: 'Configurar (Proprietário ou Administrador)' },
    { lista: ['**Reserva mínima (R$)**: o caixa que deve ficar sempre intocado — usado no Liquidity Score e no Radar.', '**Dias de alerta de ruptura**: com quantos dias de antecedência avisar.', '**Contas de Tesouraria**: dê um **Nome amigável** a cada conta (ex.: Itaú CC).', 'Clique em **Salvar**. Outras pessoas veem em modo leitura.'] },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '16 - Treasury.docx',
  titulo: 'Manual 16 — Treasury',
  subtitulo: 'How cash stands, what will happen and the risk — all in one view',
  info: ['Menu: Financial → Treasury  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Treasury is the **cash command center**: it shows how much is in each account (bank, cash, investment), how much is truly free, the 30/60/90-day projection and shortfall risks. It also has the **Stress Simulator** and the **Financial Twin** to test decisions before making them.' },
    { nota: 'Balances come from the **treasury accounts in Accounting** (banks, cash, investments), which receive every payment and receipt automatically through the traceability engine.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Financial ▼** → **Treasury**.', 'Risk Panel → **Liquidity** card → **See details**.'] },

    { h1: 'Top buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Share**', 'Opens the Sharing Center with the cash summary.', 'WhatsApp, email, copy or PDF.'],
      ['**Stress Simulator**', 'Opens the simulator.', 'See its section below.'],
      ['**Financial Twin**', 'Opens the company twin.', 'See its section below.'],
      ['**Configure**', 'Opens the settings (Owner or Administrator only).', 'Minimum reserve, shortfall alert and account names.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: 'Cash Position' },
    { tabela: { colunas: ['Card', 'What it shows'], larguras: [2600, 6426], linhas: [
      ['Total', 'Sum of all treasury accounts.'],
      ['Available', 'What can be used today (no locked investments).'],
      ['Truly Free', 'Available minus the minimum reserve and expected outflows.'],
      ['Invested', 'Money in investments.'],
    ] } },
    { p: 'Below, the table per account (Account, Type, Balance). **Click an account** to open its General Ledger.' },
    { h2: 'Liquidity Score' },
    { p: 'Cash score considering available cash, outflows in the next 30 days, the minimum reserve and the 90-day projected balance, with the explanation beside it (**Coverage**, **Slack**, **below reserve**).' },
    { h2: 'Projected Flow' },
    { p: 'Projected balance in 30, 60 and 90 days in three scenarios: **Optimistic**, **Base** and **Stressed**. Without enough history, Base and Stressed equal Optimistic until there is more data — the screen says so.' },
    { h2: 'Potentially Idle Cash' },
    { p: 'How much is sitting beyond the reserve and the month\'s outflows — money that could earn returns.' },
    { h2: 'Treasury Radar (Active risks)' },
    { p: 'Lists detected risks (e.g., shortfall in X days, pending debt). The **Resolve** button marks the risk as handled. With no risks: "No risk detected at the moment".' },
    { h2: 'Ask Treasury' },
    { p: 'Type a question (e.g., "how is my cash?") or click a suggestion. Axioma\'s intelligence answers using only this screen\'s numbers; if it cannot, it answers by rules. While it works you see **Thinking...**.' },

    { h1: 'Stress Simulator' },
    { p: 'Adjust the variables and see the cash impact live, always on top of the real projected flow: **Revenue** (%), **Expenses** (%), **Receivables delay** (days), **New Hire** (monthly cost), **New Debt** (amount coming in today and monthly installment) and the **Horizon**. It shows **Before × Simulated** (Cash, Liquidity Score, Impact on Projected Balance) and whether there is a shortfall.' },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2600, 6426], linhas: [
      ['**Reset**', 'Sets all variables back to zero.'],
      ['**Save Scenario**', 'Asks for a **Scenario name** and stores it to compare later.'],
      ['**Edit** / **Delete** (saved scenario)', 'Edit reopens the scenario; Delete asks for a reason and a supervisor\'s email and password.'],
      ['**Back to Command Center**', 'Returns to Treasury.'],
    ] } },

    { h1: 'Financial Twin' },
    { p: 'Shows the company **today** and in 30/60/90 days, **with or without a big change**. In **Apply a big change** choose: None (as is), **New Branch** (initial investment + monthly cost), **New Loan** (amount + installment) or **Revenue +30%**. The **Before × After** table compares Available cash, Working Capital, Pending debt, Liquidity Score and 90-day projected balance.' },

    { h1: 'Configure (Owner or Administrator)' },
    { lista: ['**Minimum reserve (R$)**: cash that must always stay untouched — used in the Liquidity Score and the Radar.', '**Shortfall alert days**: how many days in advance to warn.', '**Treasury Accounts**: give each account a **Friendly name** (e.g., Itaú CC).', 'Click **Save**. Other people see it in read-only mode.'] },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '16 - Tesorería.docx',
  titulo: 'Manual 16 — Tesorería',
  subtitulo: 'Cómo está la caja, qué va a pasar y cuál es el riesgo — todo en una sola vista',
  info: ['Menú: Financiero → Tesorería  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'La Tesorería es el **centro de comando de la caja**: muestra cuánto hay en cada cuenta (banco, caja, inversión), cuánto está realmente libre, la proyección a 30, 60 y 90 días y los riesgos de ruptura. Además tiene el **Simulador de Estrés** y el **Gemelo Financiero** para probar decisiones antes de tomarlas.' },
    { nota: 'Los saldos vienen de las **cuentas de tesorería de la Contabilidad** (bancos, caja, inversiones), que reciben solas cada pago y cobro por el motor de trazabilidad.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Financiero ▼** → **Tesorería**.', 'Panel de Riesgo → tarjeta **Liquidez** → **Ver detalles**.'] },

    { h1: 'Botones de arriba' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Compartir**', 'Abre el Centro de Compartir con el resumen de la caja.', 'WhatsApp, correo, copiar o PDF.'],
      ['**Simulador de Estrés**', 'Abre el simulador.', 'Vea su sección abajo.'],
      ['**Gemelo Financiero**', 'Abre el gemelo de la empresa.', 'Vea su sección abajo.'],
      ['**Configurar**', 'Abre la configuración (solo Propietario o Administrador).', 'Reserva mínima, alerta de ruptura y nombres de las cuentas.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Posición de Caja' },
    { tabela: { colunas: ['Tarjeta', 'Qué muestra'], larguras: [2600, 6426], linhas: [
      ['Total General', 'Suma de todas las cuentas de tesorería.'],
      ['Disponible', 'Lo que se puede usar hoy (sin inversiones inmovilizadas).'],
      ['Realmente Libre', 'Disponible menos la reserva mínima y las salidas ya previstas.'],
      ['Aplicado', 'Dinero en inversiones.'],
    ] } },
    { p: 'Abajo, la tabla por cuenta (Cuenta, Tipo, Saldo). **Haga clic en una cuenta** para abrir su Libro Mayor.' },
    { h2: 'Liquidity Score' },
    { p: 'Nota de la caja considerando el disponible, las salidas de los próximos 30 días, la reserva mínima y el saldo proyectado a 90 días, con la explicación al lado (**Cobertura**, **Holgura**, **debajo de la reserva**).' },
    { h2: 'Flujo Proyectado' },
    { p: 'Saldo proyectado a 30, 60 y 90 días en tres escenarios: **Optimista**, **Base** y **Estresado**. Sin historial suficiente, Base y Estresado quedan iguales al Optimista hasta haber más datos — la pantalla lo avisa.' },
    { h2: 'Caja Potencialmente Ociosa' },
    { p: 'Cuánto está parado más allá de la reserva y de las salidas del mes — dinero que podría rendir.' },
    { h2: 'Treasury Radar (Riesgos activos)' },
    { p: 'Lista los riesgos detectados (ej.: ruptura en X días, deuda pendiente). El botón **Resolver** marca el riesgo como tratado. Sin riesgos: "Ningún riesgo detectado en este momento".' },
    { h2: 'Pregúntele a la Tesorería' },
    { p: 'Escriba una pregunta (ej.: "¿cómo está mi caja?") o haga clic en una sugerencia. La inteligencia de Axioma responde solo con los números de esta pantalla; si no puede, responde por reglas. Mientras piensa aparece **Pensando...**.' },

    { h1: 'Simulador de Estrés' },
    { p: 'Ajuste las variables y vea el impacto en la caja en vivo, siempre sobre el flujo proyectado real: **Ingresos** (%), **Gastos** (%), **Atraso de los cobros** (días), **Nueva Contratación** (costo mensual), **Nueva Deuda** (valor que entra hoy y cuota mensual) y el **Horizonte**. Muestra **Antes × Simulado** (Caja, Liquidity Score, Impacto en el Saldo Proyectado) y si hay ruptura.' },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2600, 6426], linhas: [
      ['**Poner en cero**', 'Vuelve todas las variables a cero.'],
      ['**Guardar Escenario**', 'Pide un **Nombre del escenario** y lo guarda para comparar después.'],
      ['**Editar** / **Eliminar** (escenario guardado)', 'Editar reabre el escenario; Eliminar pide motivo y correo y contraseña de un supervisor.'],
      ['**Volver al Command Center**', 'Vuelve a la Tesorería.'],
    ] } },

    { h1: 'Gemelo Financiero' },
    { p: 'Muestra la empresa **hoy** y a 30/60/90 días, **con o sin un cambio grande**. En **Aplicar un cambio grande** elija: Ninguno (como está), **Nueva Sucursal** (inversión inicial + costo mensual), **Nuevo Préstamo** (valor + cuota) o **Ingresos +30%**. La tabla **Antes × Después** compara Caja disponible, Capital de Trabajo, Deuda pendiente, Liquidity Score y Saldo proyectado a 90 días.' },

    { h1: 'Configurar (Propietario o Administrador)' },
    { lista: ['**Reserva mínima (R$)**: la caja que debe quedar siempre intocada — usada en el Liquidity Score y en el Radar.', '**Días de alerta de ruptura**: con cuántos días de anticipación avisar.', '**Cuentas de Tesorería**: dé un **Nombre amigable** a cada cuenta (ej.: Itaú CC).', 'Haga clic en **Guardar**. Otras personas lo ven en modo lectura.'] },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
