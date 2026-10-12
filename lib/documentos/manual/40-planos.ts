// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '40 - Configurações - Planos.docx',
  titulo: 'Manual 40 — Planos e Assinatura',
  subtitulo: 'Escolha, assine e gerencie o plano da empresa',
  info: ['Menu: Config → Planos  •  Manual de uso do Axioma AI.Tech  •  Versão 3.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra os planos do Axioma e permite assinar. O plano define os recursos, quantas pessoas podem usar a empresa e quanto de IA a empresa tem por mês.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **⚙️ Config ▼** → **Planos**.'] },

    { h1: 'Os planos (do mais simples ao mais completo)' },
    { tabela: { colunas: ['Plano', 'Mensal', 'Pessoas', 'O que inclui'], larguras: [1500, 1300, 1000, 5226], linhas: [
      ['MEI', 'R$ 59,90', '1', 'Para MEI e autônomos. Módulo MEI completo (DAS, DASN, limite de faturamento, abrir empresa, documentos para o contador), receitas, custos fixos e variáveis, Fluxo de Caixa, DRE, Precificação, IR do MEI, IA MEI Advisor com regras oficiais, 3 idiomas, PDF/Excel/CSV.'],
      ['Essencial', 'R$ 149,90', '2', 'Tudo do MEI + contabilidade completa (Livro Razão, Balancete, DRE contábil, Fiscal, área do contador), contas a pagar e a receber, clientes, fornecedores, inadimplência, estoque, tesouraria, endividamento, metas, investimentos, simulações, importação de documentos com IA, IA Financeira, conferência diária, rastreabilidade e equipe com hierarquia.'],
      ['Empresa (mais escolhido)', 'R$ 297,90', '5', 'Tudo do Essencial + IA Tributária e Reforma Tributária, PDV ligado ao estoque e ao financeiro, Centros de Custo, relatórios gerenciais, Painel de Risco e Métricas do CFO.'],
      ['Premium', 'R$ 597,90', '10', 'Tudo do Empresa + Nexus e o José (inteligência de mercado), várias empresas na mesma conta e suporte prioritário.'],
    ] } },
    { p: 'No topo da tela, a chave **Mensal / Anual** troca os preços. O **anual** dá **2 meses grátis**: MEI R$ 49,90/mês, Essencial R$ 124,90/mês, Empresa R$ 247,90/mês e Premium R$ 497,90/mês, cobrados uma vez por ano.' },
    { p: '**Inauguração:** **30% de desconto nos 3 primeiros meses**, só para as **100 primeiras empresas**. O desconto entra sozinho no pagamento; quando as 100 vagas acabam, o preço volta ao normal. Recarga de IA não tem desconto.' },

    { h1: 'IA incluída por mês' },
    { tabela: { colunas: ['Plano', 'IA comum (OpenAI)', 'IA avançada (Anthropic)', 'Notas lidas pela IA'], larguras: [2000, 2300, 2400, 2326], linhas: [
      ['Teste grátis (só 3 primeiros dias)', '20', '5', '5'],
      ['MEI', '150', '20', '20'],
      ['Essencial', '500', '60', '60'],
      ['Empresa', '1.000', '120', '120'],
      ['Premium', '2.000', '300', '250'],
    ] } },
    { lista: [
      '**IA avançada** = IA Financeira, IA Tributária, José (Nexus) e relatórios complexos. **IA comum** = as demais perguntas à IA. **Notas** = nota fiscal ou guia do DAS lida pela IA a partir de PDF ou foto.',
      'O saldo é da **empresa** (a equipe toda usa o mesmo) e **volta cheio todo mês**, no dia da cobrança.',
      'Acabou antes do fim do mês? Compre uma **recarga** com o cartão em **Config → Uso da IA** (manual 41): +100 IA comum por R$ 29,90, +20 IA avançada por R$ 19,90 ou +20 notas por R$ 14,90. A recarga não vence enquanto a assinatura estiver ativa.',
      'Se a IA não responder ou não conseguir ler o documento, a pergunta **não é descontada**.',
    ] },

    { h1: 'Como assinar' },
    { numerada: [
      'Abra **Planos**, escolha **Mensal** ou **Anual** e compare os cards.',
      'Clique em **Começar agora** no plano desejado.',
      'Você vai para a página de pagamento segura do **Stripe**, parceiro de pagamentos usado por empresas do mundo todo. O Axioma não vê nem guarda os dados do seu cartão.',
      'Ao concluir, o acesso é liberado automaticamente.',
    ] },
    { p: 'A primeira assinatura começa com **7 dias grátis** — o cartão é pedido no início e a primeira cobrança só acontece no 8º dia. A **IA funciona só nos 3 primeiros dias** do teste, com o saldo do teste; depois o Axioma segue liberado até o fim do teste, sem IA (ou com recarga). Cancele antes do fim do teste e não paga nada. **Sem fidelidade.** Quem já assinou antes não ganha um novo teste.' },

    { h1: 'Assinatura da empresa' },
    { p: 'A assinatura pertence à **empresa**: se a propriedade for transferida, o plano vai junto. Na **transferência da empresa** (venda, doação, herança), o que o antigo dono já pagou vale até o fim do período e a renovação no cartão dele é cancelada sozinha; o novo dono assina o próprio plano aqui (manual 38). Detalhes de quem conta como vaga estão no manual 39 (Equipe).' },
    { nota: 'Se o pagamento não abrir, a tela mostra uma mensagem de erro — tente de novo. Se você não estiver conectado, ela pede o login antes. Os valores válidos são sempre os mostrados na tela no momento da assinatura.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '40 - Settings - Plans.docx',
  titulo: 'Manual 40 — Plans and Subscription',
  subtitulo: 'Choose, subscribe and manage the company plan',
  info: ['Menu: Settings → Plans  •  Axioma AI.Tech user manual  •  Version 3.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Shows Axioma’s plans and lets you subscribe. The plan defines the features, how many people can use the company and how much AI the company has per month.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **⚙️ Settings ▼** → **Plans**.'] },

    { h1: 'The plans (from simplest to most complete)' },
    { tabela: { colunas: ['Plan', 'Monthly', 'People', 'What it includes'], larguras: [1500, 1300, 1000, 5226], linhas: [
      ['MEI', 'R$ 59.90', '1', 'For MEI and freelancers. Full MEI module (DAS, DASN, revenue limit, open a company, documents for the accountant), revenue, fixed and variable costs, Cash Flow, P&L, Pricing, MEI Income Tax, MEI AI Advisor with official rules, 3 languages, PDF/Excel/CSV.'],
      ['Essential', 'R$ 149.90', '2', 'Everything in MEI + full accounting (General Ledger, Trial Balance, accounting P&L, Tax, accountant area), payables and receivables, customers, suppliers, defaults, inventory, treasury, debt, goals, investments, simulations, AI document import, Financial AI, daily check, traceability and team with hierarchy.'],
      ['Business (most chosen)', 'R$ 297.90', '5', 'Everything in Essential + Tax AI and Tax Reform, POS linked to inventory and finance, Cost Centers, management reports, Risk Panel and CFO Metrics.'],
      ['Premium', 'R$ 597.90', '10', 'Everything in Business + Nexus and José (market intelligence), several companies in one account and priority support.'],
    ] } },
    { p: 'At the top of the screen, the **Monthly / Yearly** switch changes the prices. **Yearly** gives **2 months free**: MEI R$ 49.90/mo, Essential R$ 124.90/mo, Business R$ 247.90/mo and Premium R$ 497.90/mo, billed once a year.' },
    { p: '**Launch offer:** **30% off for the first 3 months**, only for the **first 100 companies**. The discount is applied automatically at payment; when the 100 spots run out, the price goes back to normal. AI top-ups have no discount.' },

    { h1: 'AI included per month' },
    { tabela: { colunas: ['Plan', 'Standard AI (OpenAI)', 'Advanced AI (Anthropic)', 'Invoices read by AI'], larguras: [2000, 2300, 2400, 2326], linhas: [
      ['Free trial (first 3 days only)', '20', '5', '5'],
      ['MEI', '150', '20', '20'],
      ['Essential', '500', '60', '60'],
      ['Business', '1,000', '120', '120'],
      ['Premium', '2,000', '300', '250'],
    ] } },
    { lista: [
      '**Advanced AI** = Financial AI, Tax AI, José (Nexus) and complex reports. **Standard AI** = all other AI questions. **Invoices** = an invoice or DAS slip read by AI from a PDF or photo.',
      'The balance belongs to the **company** (the whole team shares it) and **refills every month** on the billing day.',
      'Ran out before the end of the month? Buy a **top-up** with your card in **Settings → AI usage** (manual 41): +100 standard AI for R$ 29.90, +20 advanced AI for R$ 19.90 or +20 invoices for R$ 14.90. Top-ups do not expire while the subscription is active.',
      'If the AI does not answer or cannot read the document, the question is **not deducted**.',
    ] },

    { h1: 'How to subscribe' },
    { numerada: [
      'Open **Plans**, choose **Monthly** or **Yearly** and compare the cards.',
      'Click **Start now** on the plan you want.',
      'You go to the secure **Stripe** payment page, the payments partner used by companies worldwide. Axioma never sees or stores your card details.',
      'When done, access is unlocked automatically.',
    ] },
    { p: 'The first subscription starts with **7 days free** — the card is requested at the start and the first charge only happens on day 8. **AI works only in the first 3 days** of the trial, with the trial balance; after that Axioma stays open until the trial ends, without AI (or with a top-up). Cancel before the trial ends and pay nothing. **No commitment.** Anyone who has subscribed before does not get a new trial.' },

    { h1: 'Company subscription' },
    { p: 'The subscription belongs to the **company**: if ownership is transferred, the plan goes with it. In a **company transfer** (sale, donation, inheritance), what the former owner already paid is valid until the end of the period and the renewal on their card is cancelled automatically; the new owner subscribes to their own plan here (manual 38). Who counts as a seat is explained in manual 39 (Team).' },
    { nota: 'If the payment does not open, the screen shows an error message — try again. If you are not signed in, it asks you to log in first. The valid prices are always the ones shown on screen at the time of subscribing.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '40 - Configuración - Planes.docx',
  titulo: 'Manual 40 — Planes y Suscripción',
  subtitulo: 'Elija, suscríbase y gestione el plan de la empresa',
  info: ['Menú: Config → Planes  •  Manual de uso de Axioma AI.Tech  •  Versión 3.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Muestra los planes de Axioma y permite suscribirse. El plan define los recursos, cuántas personas pueden usar la empresa y cuánta IA tiene la empresa por mes.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **⚙️ Config ▼** → **Planes**.'] },

    { h1: 'Los planes (del más simple al más completo)' },
    { tabela: { colunas: ['Plan', 'Mensual', 'Personas', 'Qué incluye'], larguras: [1500, 1300, 1000, 5226], linhas: [
      ['MEI', 'R$ 59,90', '1', 'Para MEI y autónomos. Módulo MEI completo (DAS, DASN, límite de facturación, abrir empresa, documentos para el contador), ingresos, costos fijos y variables, Flujo de Caja, Estado de Resultados, Precios, IR del MEI, IA MEI Advisor con reglas oficiales, 3 idiomas, PDF/Excel/CSV.'],
      ['Esencial', 'R$ 149,90', '2', 'Todo de MEI + contabilidad completa (Libro Mayor, Balance de Comprobación, Estado de Resultados contable, Fiscal, área del contador), cuentas por pagar y cobrar, clientes, proveedores, morosidad, inventario, tesorería, endeudamiento, metas, inversiones, simulaciones, importación de documentos con IA, IA Financiera, conciliación diaria, trazabilidad y equipo con jerarquía.'],
      ['Empresa (más elegido)', 'R$ 297,90', '5', 'Todo de Esencial + IA Tributaria y Reforma Tributaria, PDV conectado al inventario y a las finanzas, Centros de Costo, informes de gestión, Panel de Riesgo y Métricas del CFO.'],
      ['Premium', 'R$ 597,90', '10', 'Todo de Empresa + Nexus y José (inteligencia de mercado), varias empresas en la misma cuenta y soporte prioritario.'],
    ] } },
    { p: 'Arriba de la pantalla, el selector **Mensual / Anual** cambia los precios. El **anual** da **2 meses gratis**: MEI R$ 49,90/mes, Esencial R$ 124,90/mes, Empresa R$ 247,90/mes y Premium R$ 497,90/mes, cobrados una vez al año.' },
    { p: '**Inauguración:** **30% de descuento los primeros 3 meses**, solo para las **100 primeras empresas**. El descuento se aplica solo en el pago; cuando se acaban los 100 cupos, el precio vuelve a lo normal. La recarga de IA no tiene descuento.' },

    { h1: 'IA incluida por mes' },
    { tabela: { colunas: ['Plan', 'IA común (OpenAI)', 'IA avanzada (Anthropic)', 'Facturas leídas por IA'], larguras: [2000, 2300, 2400, 2326], linhas: [
      ['Prueba gratis (solo 3 primeros días)', '20', '5', '5'],
      ['MEI', '150', '20', '20'],
      ['Esencial', '500', '60', '60'],
      ['Empresa', '1.000', '120', '120'],
      ['Premium', '2.000', '300', '250'],
    ] } },
    { lista: [
      '**IA avanzada** = IA Financiera, IA Tributaria, José (Nexus) e informes complejos. **IA común** = las demás preguntas a la IA. **Facturas** = factura o guía del DAS leída por IA desde PDF o foto.',
      'El saldo es de la **empresa** (todo el equipo usa el mismo) y **vuelve completo cada mes**, el día del cobro.',
      '¿Se acabó antes de fin de mes? Compre una **recarga** con tarjeta en **Config → Uso de la IA** (manual 41): +100 IA común por R$ 29,90, +20 IA avanzada por R$ 19,90 o +20 facturas por R$ 14,90. La recarga no vence mientras la suscripción esté activa.',
      'Si la IA no responde o no logra leer el documento, la pregunta **no se descuenta**.',
    ] },

    { h1: 'Cómo suscribirse' },
    { numerada: [
      'Abra **Planes**, elija **Mensual** o **Anual** y compare las tarjetas.',
      'Haga clic en **Empezar ahora** en el plan deseado.',
      'Irá a la página de pago segura de **Stripe**, socio de pagos usado por empresas de todo el mundo. Axioma no ve ni guarda los datos de su tarjeta.',
      'Al concluir, el acceso se libera automáticamente.',
    ] },
    { p: 'La primera suscripción empieza con **7 días gratis** — la tarjeta se pide al inicio y el primer cobro solo ocurre el día 8. La **IA funciona solo los 3 primeros días** de la prueba, con el saldo de la prueba; después Axioma sigue abierto hasta el fin de la prueba, sin IA (o con recarga). Cancele antes del fin de la prueba y no paga nada. **Sin permanencia.** Quien ya se suscribió antes no recibe una nueva prueba.' },

    { h1: 'Suscripción de la empresa' },
    { p: 'La suscripción pertenece a la **empresa**: si se transfiere la propiedad, el plan va junto. En la **transferencia de la empresa** (venta, donación, herencia), lo que el antiguo dueño ya pagó vale hasta el fin del período y la renovación en su tarjeta se cancela sola; el nuevo dueño suscribe su propio plan aquí (manual 38). Quién cuenta como cupo está en el manual 39 (Equipo).' },
    { nota: 'Si el pago no se abre, la pantalla muestra un mensaje de error — intente de nuevo. Si no ha iniciado sesión, primero pide el login. Los valores válidos son siempre los mostrados en pantalla al momento de suscribirse.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
