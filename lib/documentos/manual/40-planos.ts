// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '40 - Configurações - Planos.docx',
  titulo: 'Manual 40 — Planos e Assinatura',
  subtitulo: 'Escolha, assine e gerencie o plano da empresa',
  info: ['Menu: Config → Planos  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra os planos do Axioma e permite assinar. O plano define os recursos disponíveis e quantas pessoas podem usar a empresa.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **⚙️ Config ▼** → **Planos**.'] },

    { h1: 'Os planos' },
    { tabela: { colunas: ['Plano', 'Para quem e o que inclui'], larguras: [2400, 6626], linhas: [
      ['Starter (1 pessoa)', 'Para MEI e autônomos: mais de 40 módulos financeiros e contábeis, módulo MEI completo (DAS, DASN, abrir empresa), Dashboard, DRE e Fluxo de Caixa, português/inglês/espanhol, exportar PDF, Excel e CSV.'],
      ['Pro (2 pessoas)', 'Tudo do Starter + IA Financeira, relatórios avançados, Painel de Risco e Métricas do CFO, Conferência diária entre módulos.'],
      ['Business (5 pessoas) ⭐ Mais Popular', 'Tudo do Pro + IA Tributária, IA MEI Advisor, Centros de Custo e suporte prioritário.'],
      ['Enterprise (10 pessoas)', 'Tudo do Business + Nexus e o José (inteligência de mercado), várias empresas na mesma conta e suporte prioritário.'],
    ] } },
    { nota: 'Os recursos e preços de cada plano podem ser atualizados. Os valores válidos são sempre os mostrados na tela no momento da assinatura.' },

    { h1: 'Como assinar' },
    { numerada: [
      'Abra **Planos** e compare os cards.',
      'Clique em **Começar agora** no plano desejado.',
      'Você vai para a página de pagamento segura do **Stripe**, parceiro de pagamentos usado por empresas do mundo todo. O Axioma não vê nem guarda os dados do seu cartão.',
      'Ao concluir, o acesso é liberado automaticamente.',
    ] },
    { p: 'Todo plano começa com **14 dias grátis** — o cartão é pedido no início, e a primeira cobrança só acontece depois do período grátis. **Cancele quando quiser, sem fidelidade.**' },

    { h1: 'Assinatura da empresa' },
    { p: 'A assinatura pertence à **empresa**: se a propriedade for transferida, o plano vai junto. Na **transferência da empresa** (venda, doação, herança), o que o antigo dono já pagou vale até o fim do período e a renovação no cartão dele é cancelada sozinha; o novo dono assina o próprio plano aqui (manual 38). Detalhes de quem conta como vaga estão no manual 39 (Equipe).' },
    { nota: 'Se o pagamento não abrir, a tela mostra uma mensagem de erro — tente de novo. Se você não estiver conectado, ela pede o login antes.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '40 - Settings - Plans.docx',
  titulo: 'Manual 40 — Plans and Subscription',
  subtitulo: 'Choose, subscribe and manage the company plan',
  info: ['Menu: Settings → Plans  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Shows Axioma’s plans and lets you subscribe. The plan defines the available features and how many people can use the company.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **⚙️ Settings ▼** → **Plans**.'] },

    { h1: 'The plans' },
    { tabela: { colunas: ['Plan', 'Who it is for and what it includes'], larguras: [2400, 6626], linhas: [
      ['Starter (1 person)', 'For MEI and freelancers: 40+ financial and accounting modules, full MEI module (DAS, DASN, open a company), Dashboard, P&L and Cash Flow, Portuguese/English/Spanish, export PDF, Excel and CSV.'],
      ['Pro (2 people)', 'Everything in Starter + Financial AI, advanced reports, Risk Panel and CFO Metrics, daily cross-module check.'],
      ['Business (5 people) ⭐ Most Popular', 'Everything in Pro + Tax AI, MEI AI Advisor, Cost Centers and priority support.'],
      ['Enterprise (10 people)', 'Everything in Business + Nexus and José (market intelligence), several companies in one account and priority support.'],
    ] } },
    { nota: 'Each plan’s features and prices may be updated. The valid values are always the ones shown on screen at the time of subscribing.' },

    { h1: 'How to subscribe' },
    { numerada: [
      'Open **Plans** and compare the cards.',
      'Click **Start now** on the plan you want.',
      'You go to **Stripe**’s secure payment page, a payment partner used by companies worldwide. Axioma neither sees nor stores your card data.',
      'When you finish, access is released automatically.',
    ] },
    { p: 'Every plan starts with a **14-day free trial** — the card is requested at the start, and the first charge only happens after the free period. **Cancel anytime, no lock-in.**' },

    { h1: 'Company subscription' },
    { p: 'The subscription belongs to the **company**: if ownership is transferred, the plan goes with it. In a **company transfer** (sale, donation, inheritance), what the former owner already paid is valid until the end of the period and renewal on their card is canceled automatically; the new owner subscribes to their own plan here (manual 38). Details on who takes a seat are in manual 39 (Team).' },
    { nota: 'If the payment page does not open, the screen shows an error message — try again. If you are not signed in, it asks you to log in first.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '40 - Configuración - Planes.docx',
  titulo: 'Manual 40 — Planes y Suscripción',
  subtitulo: 'Elija, suscriba y gestione el plan de la empresa',
  info: ['Menú: Config → Planes  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Muestra los planes de Axioma y permite suscribirse. El plan define los recursos disponibles y cuántas personas pueden usar la empresa.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **⚙️ Config ▼** → **Planes**.'] },

    { h1: 'Los planes' },
    { tabela: { colunas: ['Plan', 'Para quién y qué incluye'], larguras: [2400, 6626], linhas: [
      ['Starter (1 persona)', 'Para MEI y autónomos: más de 40 módulos financieros y contables, módulo MEI completo (DAS, DASN, abrir empresa), Panel, Estado de Resultados y Flujo de Caja, portugués/inglés/español, exportar PDF, Excel y CSV.'],
      ['Pro (2 personas)', 'Todo de Starter + IA Financiera, informes avanzados, Panel de Riesgo y Métricas del CFO, conciliación diaria entre módulos.'],
      ['Business (5 personas) ⭐ Más Popular', 'Todo de Pro + IA Tributaria, IA MEI Advisor, Centros de Costo y soporte prioritario.'],
      ['Enterprise (10 personas)', 'Todo de Business + Nexus y José (inteligencia de mercado), varias empresas en la misma cuenta y soporte prioritario.'],
    ] } },
    { nota: 'Los recursos y precios de cada plan pueden actualizarse. Los valores válidos son siempre los mostrados en pantalla al momento de suscribirse.' },

    { h1: 'Cómo suscribirse' },
    { numerada: [
      'Abra **Planes** y compare las tarjetas.',
      'Haga clic en **Empezar ahora** en el plan deseado.',
      'Irá a la página de pago segura de **Stripe**, socio de pagos usado por empresas de todo el mundo. Axioma no ve ni guarda los datos de su tarjeta.',
      'Al concluir, el acceso se libera automáticamente.',
    ] },
    { p: 'Todo plan empieza con **14 días gratis** — la tarjeta se pide al inicio y el primer cobro solo ocurre después del período gratis. **Cancele cuando quiera, sin permanencia.**' },

    { h1: 'Suscripción de la empresa' },
    { p: 'La suscripción pertenece a la **empresa**: si la propiedad se transfiere, el plan va con ella. En la **transferencia de la empresa** (venta, donación, herencia), lo que el antiguo dueño ya pagó vale hasta el fin del período y la renovación en su tarjeta se cancela sola; el nuevo dueño suscribe su propio plan aquí (manual 38). Los detalles de quién ocupa cupo están en el manual 39 (Equipo).' },
    { nota: 'Si la página de pago no abre, la pantalla muestra un mensaje de error — intente de nuevo. Si no ha iniciado sesión, pide el inicio de sesión antes.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
