'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const idiomas = {
  pt: {
    login: 'Login',
    comecar: '🚀 Começar Agora',
    comecarGratis: '🚀 Começar Gratuitamente',
    semCartao: 'Sem cartão de crédito. Cancele quando quiser.',
    badge: 'INTELIGÊNCIA FINANCEIRA COM IA',
    titulo1: 'A verdade financeira do seu negócio.',
    sub1: 'Um axioma é uma verdade absoluta, a base de tudo. O Axioma AI.Tech transforma dados financeiros em verdades que impulsionam seu crescimento.',
    verPlanos: 'Ver Planos',
    modulos: 'Módulos',
    idiomas: 'Idiomas',
    ias: 'IAs Integradas',
    badgeEinstein: '⚡ EINSTEIN FINANCEIRO',
    tituloEinstein: 'Se Einstein gerenciasse suas finanças...',
    subEinstein: '...ele usaria o Axioma AI.Tech. Porque assim como E=mc², suas finanças têm uma equação perfeita — e nós a revelamos com inteligência artificial.',
    ctaEinstein: '"A definição de insanidade é fazer a mesma coisa repetidamente e esperar resultados diferentes." — Pare de gerenciar no Excel. Use IA.',
    eq1: 'Receita - Custos = Lucro',
    eq2: 'Dados + IA = Decisões Certas',
    eq3: 'Axioma × Tempo = Crescimento∞',
    badge2: '∑ A MATEMÁTICA DO SEU SUCESSO',
    titulo2: 'Axioma: verdades que não precisam de prova.',
    sub2: 'Na matemática, um axioma é a base irrefutável de toda teoria. No seu negócio, são os dados financeiros reais que guiam cada decisão.',
    badgeEspaco: '🌌 O UNIVERSO FINANCEIRO',
    tituloEspaco: 'Seu negócio é um universo em expansão.',
    subEspaco: 'Assim como Stephen Hawking desvendou os mistérios do cosmos, o Axioma AI.Tech desvenda os mistérios das suas finanças — com IA que enxerga além do que os olhos podem ver.',
    espaco1: 'Buracos negros nos dados? A IA encontra.',
    espaco2: 'Expansão do universo = crescimento do seu negócio.',
    espaco3: 'Singularidade financeira: tudo começa aqui.',
    badgePlanos: '🚀 ESCOLHA SEU PLANO',
    tituloPlanos: 'Comece hoje mesmo',
    cancelar: 'Cancele quando quiser. Sem fidelidade.',
    maisPopular: '⭐ MAIS POPULAR',
    iaPremium: '⭐ IA Premium inclusa',
    features: ['Gestão financeira completa com 13+ módulos', 'IA Financeira e IA Tributária integradas', 'Multi-idioma: Português, Inglês e Espanhol', 'Segurança com RLS e autenticação avançada'],
    footer: '© 2026 Axioma AI.Tech — Inteligência Financeira para PMEs',
    // Seções da landing
    criseTitulo: '⚠️ A crise chegou. Sua empresa está preparada?',
    criseSubtitulo: 'Com a guerra, alta do petróleo e reforma tributária em 2026, nunca foi tão urgente ter controle financeiro total.',
    criseStats: [
      { numero: '60%', texto: 'das empresas fecham antes de 5 anos por falta de gestão financeira' },
      { numero: '48%', texto: 'fecham por descontrole de caixa e falta de planejamento' },
      { numero: 'R$500bi', texto: 'perdidos anualmente em impostos que poderiam ser reduzidos legalmente' },
      { numero: '1 em 4', texto: 'empresas fecha no primeiro ano — a sua não precisa ser mais uma' },
    ],
    criseCTA: '🚨 Não deixe sua empresa virar estatística. Comece agora.',
    problemaTitulo: 'Você ainda gerencia suas finanças assim?',
    problemas: [
      '❌ Planilhas de Excel desatualizadas',
      '❌ Não sabe quanto paga de imposto realmente',
      '❌ Fluxo de caixa no papel ou na memória',
      '❌ Decisões baseadas em "achismo"',
      '❌ Não conhece seu ponto de equilíbrio',
      '❌ Paga mais imposto do que deveria por lei',
    ],
    solucaoTitulo: 'Com o Axioma AI.Tech, tudo muda:',
    solucoes: [
      '✅ Gestão financeira completa em tempo real',
      '✅ IA que encontra brechas legais para reduzir impostos',
      '✅ Fluxo de caixa automatizado e visual',
      '✅ Decisões baseadas em dados reais',
      '✅ Ponto de equilíbrio calculado automaticamente',
      '✅ Economia tributária dentro da lei',
    ],
    impostoCTA: '💡 Sabia que você pode pagar até 30% menos de imposto legalmente?',
    impostoSub: 'O governo brasileiro criou leis e legislações que permitem às empresas reduzir consideravelmente sua carga tributária. A maioria dos empresários não sabe disso. Nossa IA Tributária encontra essas brechas legais para você.',
    impostoBtn: '🔍 Quero reduzir meus impostos agora',
    modulosTitulo: 'Tudo que sua empresa precisa em um só lugar',
    modulosSub: 'Mais de 13 módulos integrados para gestão financeira completa',
    modulosList: [
      { icon: '💵', nome: 'Receitas', desc: 'Controle total das entradas' },
      { icon: '📌', nome: 'Custos Fixos', desc: 'Gerencie custos mensais' },
      { icon: '📊', nome: 'Custos Variáveis', desc: 'Monitore gastos variáveis' },
      { icon: '💧', nome: 'Fluxo de Caixa', desc: 'Visão do futuro financeiro' },
      { icon: '📈', nome: 'DRE', desc: 'Resultado em tempo real' },
      { icon: '⚖️', nome: 'Endividamento', desc: 'Controle suas dívidas' },
      { icon: '🤝', nome: 'Clientes', desc: 'Gestão de relacionamento' },
      { icon: '🏭', nome: 'Fornecedores', desc: 'Controle de parceiros' },
      { icon: '📥', nome: 'Contas a Receber', desc: 'Nunca perca um pagamento' },
      { icon: '⚠️', nome: 'Inadimplência', desc: 'Controle de inadimplentes' },
      { icon: '🎯', nome: 'Metas', desc: 'Defina e acompanhe metas' },
      { icon: '💎', nome: 'Investimentos', desc: 'Gerencie sua carteira' },
      { icon: '🔮', nome: 'Simulações', desc: 'Simule cenários financeiros' },
      { icon: '🏷️', nome: 'Precificação', desc: 'Preço ideal para lucrar' },
      { icon: '🧠', nome: 'IA Financeira', desc: 'Análise inteligente com IA' },
      { icon: '⭐', nome: 'IA Tributária', desc: 'Reduza impostos com IA' },
    ],
    diferencialTitulo: 'Por que o Axioma é diferente?',
    diferenciais: [
      { icon: '🤖', titulo: 'IA Real Integrada', desc: 'Não é só um chatbot. É uma IA que analisa seus dados financeiros reais e gera insights acionáveis.' },
      { icon: '🌍', titulo: 'Multi-idioma', desc: 'Português, Inglês e Espanhol. Perfeito para empresas que operam internacionalmente.' },
      { icon: '⚡', titulo: 'Tempo Real', desc: 'Dados atualizados em tempo real. Tome decisões baseadas no que está acontecendo agora.' },
      { icon: '🔒', titulo: 'Segurança Total', desc: 'RLS ativo, autenticação avançada e criptografia. Seus dados financeiros estão protegidos.' },
      { icon: '📱', titulo: 'Funciona em Tudo', desc: 'Desktop, tablet e celular. Acesse onde estiver, quando precisar.' },
      { icon: '💰', titulo: 'Preço Justo', desc: 'A partir de R$49/mês. Menos que um almoço por semana para salvar sua empresa.' },
    ],
    comofuncionaTitulo: 'Como funciona?',
    passos: [
      { num: '01', titulo: 'Cadastre-se', desc: 'Crie sua conta em menos de 2 minutos. Sem burocracia, sem cartão de crédito.' },
      { num: '02', titulo: 'Configure sua empresa', desc: 'Importe seus dados ou comece do zero. A IA guia cada passo.' },
      { num: '03', titulo: 'Tome decisões inteligentes', desc: 'Visualize tudo em tempo real e deixe a IA trabalhar por você.' },
    ],
    depoimentosTitulo: 'O que dizem nossos clientes',
    depoimentos: [
      { nome: 'Carlos Mendes', cargo: 'CEO — Distribuidora CM', texto: 'Reduzi 28% dos meus impostos no primeiro mês usando a IA Tributária. Nunca imaginei que existiam tantas opções legais.', estrelas: 5 },
      { nome: 'Ana Paula Silva', cargo: 'Fundadora — Studio AP', texto: 'Antes eu não sabia se estava tendo lucro ou prejuízo. Com o Axioma, tenho clareza total em tempo real.', estrelas: 5 },
      { nome: 'Roberto Farias', cargo: 'Diretor Financeiro — TechBR', texto: 'Substituímos 4 planilhas e 2 sistemas diferentes pelo Axioma. Economizamos R$800/mês em ferramentas.', estrelas: 5 },
    ],
    ctaFinalTitulo: 'Sua concorrência já está usando IA. E você?',
    ctaFinalSub: 'Cada dia sem controle financeiro é dinheiro saindo do seu bolso. Com a crise batendo na porta, as empresas que sobrevivem são as que têm dados reais na mão.',
    ctaFinalBtn: '🚀 Quero Salvar Minha Empresa Agora',
    ctaFinalSub2: 'Junte-se a empresas que já descobriram a verdade financeira',
  },
  en: {
    login: 'Login',
    comecar: '🚀 Start Now',
    comecarGratis: '🚀 Start for Free',
    semCartao: 'No credit card. Cancel anytime.',
    badge: 'FINANCIAL INTELLIGENCE WITH AI',
    titulo1: 'The financial truth of your business.',
    sub1: 'An axiom is an absolute truth, the foundation of everything. Axioma AI.Tech transforms financial data into truths that drive your growth.',
    verPlanos: 'View Plans',
    modulos: 'Modules',
    idiomas: 'Languages',
    ias: 'Integrated AIs',
    badgeEinstein: '⚡ FINANCIAL EINSTEIN',
    tituloEinstein: 'If Einstein managed your finances...',
    subEinstein: '...he would use Axioma AI.Tech. Because just like E=mc², your finances have a perfect equation — and we reveal it with artificial intelligence.',
    ctaEinstein: '"The definition of insanity is doing the same thing over and over and expecting different results." — Stop managing in Excel. Use AI.',
    eq1: 'Revenue - Costs = Profit',
    eq2: 'Data + AI = Right Decisions',
    eq3: 'Axioma × Time = Growth∞',
    badge2: '∑ THE MATHEMATICS OF YOUR SUCCESS',
    titulo2: 'Axiom: truths that need no proof.',
    sub2: 'In mathematics, an axiom is the irrefutable foundation of every theory. In your business, it\'s real financial data that guides every decision.',
    badgeEspaco: '🌌 THE FINANCIAL UNIVERSE',
    tituloEspaco: 'Your business is an expanding universe.',
    subEspaco: 'Just as Stephen Hawking unveiled the mysteries of the cosmos, Axioma AI.Tech unveils the mysteries of your finances — with AI that sees beyond what eyes can see.',
    espaco1: 'Black holes in your data? AI finds them.',
    espaco2: 'Universe expansion = your business growth.',
    espaco3: 'Financial singularity: everything starts here.',
    badgePlanos: '🚀 CHOOSE YOUR PLAN',
    tituloPlanos: 'Start today',
    cancelar: 'Cancel anytime. No commitment.',
    maisPopular: '⭐ MOST POPULAR',
    iaPremium: '⭐ Premium AI included',
    features: ['Complete financial management with 13+ modules', 'Financial AI and Tax AI integrated', 'Multi-language: Portuguese, English and Spanish', 'Security with RLS and advanced authentication'],
    footer: '© 2026 Axioma AI.Tech — Financial Intelligence for SMEs',
    criseTitulo: '⚠️ The crisis is here. Is your business ready?',
    criseSubtitulo: 'With war, high oil prices and tax reforms in 2026, having total financial control has never been more urgent.',
    criseStats: [
      { numero: '60%', texto: 'of businesses close before 5 years due to lack of financial management' },
      { numero: '48%', texto: 'close due to cash flow problems and lack of planning' },
      { numero: '$100bi', texto: 'lost annually in taxes that could be legally reduced' },
      { numero: '1 in 4', texto: 'businesses close in the first year — yours doesn\'t have to be one of them' },
    ],
    criseCTA: '🚨 Don\'t let your business become a statistic. Start now.',
    problemaTitulo: 'Are you still managing your finances like this?',
    problemas: [
      '❌ Outdated Excel spreadsheets',
      '❌ Don\'t know how much tax you really pay',
      '❌ Cash flow on paper or from memory',
      '❌ Decisions based on guesswork',
      '❌ Don\'t know your break-even point',
      '❌ Paying more tax than the law requires',
    ],
    solucaoTitulo: 'With Axioma AI.Tech, everything changes:',
    solucoes: [
      '✅ Complete real-time financial management',
      '✅ AI that finds legal ways to reduce taxes',
      '✅ Automated and visual cash flow',
      '✅ Decisions based on real data',
      '✅ Break-even point calculated automatically',
      '✅ Tax savings within the law',
    ],
    impostoCTA: '💡 Did you know you can legally pay up to 30% less in taxes?',
    impostoSub: 'Governments have created laws and legislation that allow businesses to significantly reduce their tax burden. Most business owners don\'t know this. Our Tax AI finds these legal loopholes for you.',
    impostoBtn: '🔍 I want to reduce my taxes now',
    modulosTitulo: 'Everything your business needs in one place',
    modulosSub: 'Over 13 integrated modules for complete financial management',
    modulosList: [
      { icon: '💵', nome: 'Revenue', desc: 'Total income control' },
      { icon: '📌', nome: 'Fixed Costs', desc: 'Manage monthly costs' },
      { icon: '📊', nome: 'Variable Costs', desc: 'Monitor variable expenses' },
      { icon: '💧', nome: 'Cash Flow', desc: 'View financial future' },
      { icon: '📈', nome: 'Income Statement', desc: 'Real-time results' },
      { icon: '⚖️', nome: 'Debt Control', desc: 'Manage your debts' },
      { icon: '🤝', nome: 'Clients', desc: 'Relationship management' },
      { icon: '🏭', nome: 'Suppliers', desc: 'Partner control' },
      { icon: '📥', nome: 'Receivables', desc: 'Never miss a payment' },
      { icon: '⚠️', nome: 'Delinquency', desc: 'Overdue payment control' },
      { icon: '🎯', nome: 'Goals', desc: 'Set and track goals' },
      { icon: '💎', nome: 'Investments', desc: 'Manage your portfolio' },
      { icon: '🔮', nome: 'Simulations', desc: 'Simulate financial scenarios' },
      { icon: '🏷️', nome: 'Pricing', desc: 'Ideal price to profit' },
      { icon: '🧠', nome: 'Financial AI', desc: 'Intelligent analysis with AI' },
      { icon: '⭐', nome: 'Tax AI', desc: 'Reduce taxes with AI' },
    ],
    diferencialTitulo: 'Why is Axioma different?',
    diferenciais: [
      { icon: '🤖', titulo: 'Real Integrated AI', desc: 'Not just a chatbot. It\'s an AI that analyzes your real financial data and generates actionable insights.' },
      { icon: '🌍', titulo: 'Multi-language', desc: 'Portuguese, English and Spanish. Perfect for internationally operating companies.' },
      { icon: '⚡', titulo: 'Real Time', desc: 'Data updated in real time. Make decisions based on what\'s happening now.' },
      { icon: '🔒', titulo: 'Total Security', desc: 'Active RLS, advanced authentication and encryption. Your financial data is protected.' },
      { icon: '📱', titulo: 'Works Everywhere', desc: 'Desktop, tablet and mobile. Access wherever you are, whenever you need.' },
      { icon: '💰', titulo: 'Fair Price', desc: 'Starting at $10/month. Less than a coffee a day to save your business.' },
    ],
    comofuncionaTitulo: 'How does it work?',
    passos: [
      { num: '01', titulo: 'Sign up', desc: 'Create your account in less than 2 minutes. No bureaucracy, no credit card.' },
      { num: '02', titulo: 'Configure your company', desc: 'Import your data or start from scratch. The AI guides every step.' },
      { num: '03', titulo: 'Make smart decisions', desc: 'Visualize everything in real time and let the AI work for you.' },
    ],
    depoimentosTitulo: 'What our clients say',
    depoimentos: [
      { nome: 'Carlos Mendes', cargo: 'CEO — CM Distribution', texto: 'I reduced 28% of my taxes in the first month using Tax AI. I never imagined there were so many legal options.', estrelas: 5 },
      { nome: 'Ana Paula Silva', cargo: 'Founder — Studio AP', texto: 'Before I didn\'t know if I was making profit or loss. With Axioma, I have total clarity in real time.', estrelas: 5 },
      { nome: 'Roberto Farias', cargo: 'Financial Director — TechBR', texto: 'We replaced 4 spreadsheets and 2 different systems with Axioma. We saved $160/month in tools.', estrelas: 5 },
    ],
    ctaFinalTitulo: 'Your competition is already using AI. Are you?',
    ctaFinalSub: 'Every day without financial control is money leaving your pocket. With the crisis knocking on the door, the companies that survive are those with real data in hand.',
    ctaFinalBtn: '🚀 I Want to Save My Business Now',
    ctaFinalSub2: 'Join companies that have already discovered the financial truth',
  },
  es: {
    login: 'Iniciar Sesión',
    comecar: '🚀 Empezar Ahora',
    comecarGratis: '🚀 Empezar Gratis',
    semCartao: 'Sin tarjeta de crédito. Cancela cuando quieras.',
    badge: 'INTELIGENCIA FINANCIERA CON IA',
    titulo1: 'La verdad financiera de tu negocio.',
    sub1: 'Un axioma es una verdad absoluta, la base de todo. Axioma AI.Tech transforma datos financieros en verdades que impulsan tu crecimiento.',
    verPlanos: 'Ver Planes',
    modulos: 'Módulos',
    idiomas: 'Idiomas',
    ias: 'IAs Integradas',
    badgeEinstein: '⚡ EINSTEIN FINANCIERO',
    tituloEinstein: 'Si Einstein gestionara tus finanzas...',
    subEinstein: '...usaría Axioma AI.Tech. Porque igual que E=mc², tus finanzas tienen una ecuación perfecta — y nosotros la revelamos con inteligencia artificial.',
    ctaEinstein: '"La definición de locura es hacer lo mismo una y otra vez esperando resultados diferentes." — Deja de gestionar en Excel. Usa IA.',
    eq1: 'Ingresos - Costos = Ganancia',
    eq2: 'Datos + IA = Decisiones Correctas',
    eq3: 'Axioma × Tiempo = Crecimiento∞',
    badge2: '∑ LAS MATEMÁTICAS DE TU ÉXITO',
    titulo2: 'Axioma: verdades que no necesitan prueba.',
    sub2: 'En matemáticas, un axioma es la base irrefutable de toda teoría. En tu negocio, son los datos financieros reales los que guían cada decisión.',
    badgeEspaco: '🌌 EL UNIVERSO FINANCIERO',
    tituloEspaco: 'Tu negocio es un universo en expansión.',
    subEspaco: 'Así como Stephen Hawking desveló los misterios del cosmos, Axioma AI.Tech desvela los misterios de tus finanzas — con IA que ve más allá de lo que los ojos pueden ver.',
    espaco1: '¿Agujeros negros en tus datos? La IA los encuentra.',
    espaco2: 'Expansión del universo = crecimiento de tu negocio.',
    espaco3: 'Singularidad financiera: todo empieza aquí.',
    badgePlanos: '🚀 ELIGE TU PLAN',
    tituloPlanos: 'Empieza hoy mismo',
    cancelar: 'Cancela cuando quieras. Sin fidelidad.',
    maisPopular: '⭐ MÁS POPULAR',
    iaPremium: '⭐ IA Premium incluida',
    features: ['Gestión financiera completa con 13+ módulos', 'IA Financiera e IA Tributaria integradas', 'Multi-idioma: Portugués, Inglés y Español', 'Seguridad con RLS y autenticación avanzada'],
    footer: '© 2026 Axioma AI.Tech — Inteligencia Financiera para PYMEs',
    criseTitulo: '⚠️ La crisis llegó. ¿Tu empresa está preparada?',
    criseSubtitulo: 'Con la guerra, el alto precio del petróleo y la reforma tributaria, nunca fue tan urgente tener control financiero total.',
    criseStats: [
      { numero: '60%', texto: 'de las empresas cierran antes de 5 años por falta de gestión financiera' },
      { numero: '48%', texto: 'cierran por descontrol de caja y falta de planificación' },
      { numero: '$100bi', texto: 'perdidos anualmente en impuestos que podrían reducirse legalmente' },
      { numero: '1 de 4', texto: 'empresas cierra en el primer año — la tuya no tiene que serlo' },
    ],
    criseCTA: '🚨 No dejes que tu empresa se convierta en estadística. Empieza ahora.',
    problemaTitulo: '¿Todavía gestionas tus finanzas así?',
    problemas: [
      '❌ Hojas de Excel desactualizadas',
      '❌ No sabes cuánto impuesto pagas realmente',
      '❌ Flujo de caja en papel o de memoria',
      '❌ Decisiones basadas en suposiciones',
      '❌ No conoces tu punto de equilibrio',
      '❌ Pagas más impuestos de lo que exige la ley',
    ],
    solucaoTitulo: 'Con Axioma AI.Tech, todo cambia:',
    solucoes: [
      '✅ Gestión financiera completa en tiempo real',
      '✅ IA que encuentra formas legales de reducir impuestos',
      '✅ Flujo de caja automatizado y visual',
      '✅ Decisiones basadas en datos reales',
      '✅ Punto de equilibrio calculado automáticamente',
      '✅ Ahorro tributario dentro de la ley',
    ],
    impostoCTA: '💡 ¿Sabías que puedes pagar hasta 30% menos de impuestos legalmente?',
    impostoSub: 'Los gobiernos han creado leyes y legislaciones que permiten a las empresas reducir considerablemente su carga tributaria. La mayoría de los empresarios no lo sabe. Nuestra IA Tributaria encuentra estos vacíos legales para ti.',
    impostoBtn: '🔍 Quiero reducir mis impuestos ahora',
    modulosTitulo: 'Todo lo que tu empresa necesita en un solo lugar',
    modulosSub: 'Más de 13 módulos integrados para gestión financiera completa',
    modulosList: [
      { icon: '💵', nome: 'Ingresos', desc: 'Control total de entradas' },
      { icon: '📌', nome: 'Costos Fijos', desc: 'Gestiona costos mensuales' },
      { icon: '📊', nome: 'Costos Variables', desc: 'Monitorea gastos variables' },
      { icon: '💧', nome: 'Flujo de Caja', desc: 'Visión del futuro financiero' },
      { icon: '📈', nome: 'Estado de Resultados', desc: 'Resultados en tiempo real' },
      { icon: '⚖️', nome: 'Endeudamiento', desc: 'Controla tus deudas' },
      { icon: '🤝', nome: 'Clientes', desc: 'Gestión de relaciones' },
      { icon: '🏭', nome: 'Proveedores', desc: 'Control de socios' },
      { icon: '📥', nome: 'Cuentas por Cobrar', desc: 'Nunca pierdas un pago' },
      { icon: '⚠️', nome: 'Morosidad', desc: 'Control de morosos' },
      { icon: '🎯', nome: 'Metas', desc: 'Define y sigue metas' },
      { icon: '💎', nome: 'Inversiones', desc: 'Gestiona tu cartera' },
      { icon: '🔮', nome: 'Simulaciones', desc: 'Simula escenarios financieros' },
      { icon: '🏷️', nome: 'Precios', desc: 'Precio ideal para ganar' },
      { icon: '🧠', nome: 'IA Financiera', desc: 'Análisis inteligente con IA' },
      { icon: '⭐', nome: 'IA Tributaria', desc: 'Reduce impuestos con IA' },
    ],
    diferencialTitulo: '¿Por qué Axioma es diferente?',
    diferenciais: [
      { icon: '🤖', titulo: 'IA Real Integrada', desc: 'No es solo un chatbot. Es una IA que analiza tus datos financieros reales y genera insights accionables.' },
      { icon: '🌍', titulo: 'Multi-idioma', desc: 'Portugués, Inglés y Español. Perfecto para empresas que operan internacionalmente.' },
      { icon: '⚡', titulo: 'Tiempo Real', desc: 'Datos actualizados en tiempo real. Toma decisiones basadas en lo que está pasando ahora.' },
      { icon: '🔒', titulo: 'Seguridad Total', desc: 'RLS activo, autenticación avanzada y cifrado. Tus datos financieros están protegidos.' },
      { icon: '📱', titulo: 'Funciona en Todo', desc: 'Desktop, tablet y celular. Accede donde estés, cuando lo necesites.' },
      { icon: '💰', titulo: 'Precio Justo', desc: 'Desde R$49/mes. Menos que un café al día para salvar tu empresa.' },
    ],
    comofuncionaTitulo: '¿Cómo funciona?',
    passos: [
      { num: '01', titulo: 'Regístrate', desc: 'Crea tu cuenta en menos de 2 minutos. Sin burocracia, sin tarjeta de crédito.' },
      { num: '02', titulo: 'Configura tu empresa', desc: 'Importa tus datos o empieza desde cero. La IA guía cada paso.' },
      { num: '03', titulo: 'Toma decisiones inteligentes', desc: 'Visualiza todo en tiempo real y deja que la IA trabaje por ti.' },
    ],
    depoimentosTitulo: 'Lo que dicen nuestros clientes',
    depoimentos: [
      { nome: 'Carlos Mendes', cargo: 'CEO — Distribuidora CM', texto: 'Reduje el 28% de mis impuestos en el primer mes usando la IA Tributaria. Nunca imaginé que había tantas opciones legales.', estrelas: 5 },
      { nome: 'Ana Paula Silva', cargo: 'Fundadora — Studio AP', texto: 'Antes no sabía si tenía ganancias o pérdidas. Con Axioma, tengo claridad total en tiempo real.', estrelas: 5 },
      { nome: 'Roberto Farias', cargo: 'Director Financiero — TechBR', texto: 'Reemplazamos 4 hojas de cálculo y 2 sistemas diferentes con Axioma. Ahorramos $160/mes en herramientas.', estrelas: 5 },
    ],
    ctaFinalTitulo: 'Tu competencia ya usa IA. ¿Y tú?',
    ctaFinalSub: 'Cada día sin control financiero es dinero saliendo de tu bolsillo. Con la crisis tocando la puerta, las empresas que sobreviven son las que tienen datos reales en mano.',
    ctaFinalBtn: '🚀 Quiero Salvar Mi Empresa Ahora',
    ctaFinalSub2: 'Únete a empresas que ya descubrieron la verdad financiera',
  }
}

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<HTMLCanvasElement>(null)
  const [slide, setSlide] = useState(0)
  const [fade, setFade] = useState(true)
  const [lang, setLang] = useState<'pt'|'en'|'es'>('pt')
  const t = idiomas[lang]
  const totalSlides = 5

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const chars = 'AXIOMA∑∫∂∇√π∞≈≡±∗∈⊂⊃E=mc²F=maΔΨΩΦΛΘΞΠΣ数学真理01アイウエオ'
    const fontSize = 13
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)
    const colors = ['#3b6fd4', '#6ab0ff', '#34d399', '#a78bfa', '#ffffff', '#f59e0b']
    function draw() {
      ctx!.fillStyle = 'rgba(2,8,16,0.04)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx!.fillStyle = colors[Math.floor(Math.random() * colors.length)]
        ctx!.font = `${fontSize}px monospace`
        ctx!.globalAlpha = Math.random() * 0.5 + 0.1
        ctx!.fillText(char, i * fontSize, y * fontSize)
        ctx!.globalAlpha = 1
        if (y * fontSize > canvas!.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const interval = setInterval(draw, 40)
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { clearInterval(interval); window.removeEventListener('resize', resize) }
  }, [])

  useEffect(() => {
    const canvas = starsRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const stars = Array.from({ length: 200 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5, alpha: Math.random(), speed: Math.random() * 0.5 + 0.1 }))
    const shootingStars: any[] = []
    function addShootingStar() { shootingStars.push({ x: Math.random() * canvas!.width, y: Math.random() * canvas!.height * 0.5, len: Math.random() * 150 + 80, speed: Math.random() * 8 + 6, alpha: 1, angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3 }) }
    setInterval(addShootingStar, 2000)
    function drawStars() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      stars.forEach(s => {
        s.alpha += (Math.random() - 0.5) * 0.05
        s.alpha = Math.max(0.1, Math.min(1, s.alpha))
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255,255,255,${s.alpha * 0.6})`; ctx!.fill()
      })
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i]
        const gradient = ctx!.createLinearGradient(s.x, s.y, s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len)
        gradient.addColorStop(0, `rgba(255,255,255,${s.alpha})`); gradient.addColorStop(0.3, `rgba(106,176,255,${s.alpha * 0.6})`); gradient.addColorStop(1, 'rgba(0,0,0,0)')
        ctx!.beginPath(); ctx!.strokeStyle = gradient; ctx!.lineWidth = 2
        ctx!.moveTo(s.x, s.y); ctx!.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len); ctx!.stroke()
        s.x += Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed; s.alpha -= 0.015
        if (s.alpha <= 0) shootingStars.splice(i, 1)
      }
    }
    const interval = setInterval(drawStars, 30)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => { setSlide(prev => (prev + 1) % totalSlides); setFade(true) }, 800)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const goTo = (i: number) => { setFade(false); setTimeout(() => { setSlide(i); setFade(true) }, 300) }

  return (
    <div style={{ background: '#020810', minHeight: '100vh' }}>
      {/* Canvas fixos no topo — apenas na hero section */}
      <div className="relative" style={{ height: '100vh', overflow: 'hidden' }}>
        <canvas ref={starsRef} className="absolute inset-0 z-0" style={{ opacity: 0.8 }} />
        <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ opacity: 0.25 }} />
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '5%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,111,212,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '40%', right: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        </div>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(59,111,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,111,212,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', transform: 'perspective(1000px) rotateX(25deg)', transformOrigin: 'center top' }} />

        <div className="relative z-10 flex flex-col" style={{ height: '100vh' }}>
          {/* Header */}
          <header className="flex justify-between items-center px-12 py-6">
            <div className="flex items-center gap-4">
              <div style={{ filter: 'drop-shadow(0 0 24px rgba(106,176,255,0.9))' }}>
                <img src="/logo-aitech.png" alt="Axioma" style={{ width: 48, height: 48, objectFit: 'contain' }} />
              </div>
              <div>
                <h1 className="font-black tracking-[0.3em] text-xl" style={{ background: 'linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 40%, #fff 60%, #3b6fd4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AXIOMA</h1>
                <p className="text-xs tracking-[0.4em]" style={{ color: '#3a5a8a' }}>AI.TECH</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(['pt','en','es'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} className="text-xs px-3 py-1 rounded-full font-bold transition-all" style={{ background: lang === l ? 'rgba(59,111,212,0.3)' : 'transparent', color: lang === l ? '#6ab0ff' : '#3a5a8a', border: '1px solid rgba(59,111,212,0.2)' }}>
                  {l === 'pt' ? '🇧🇷 PT' : l === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
                </button>
              ))}
              <button onClick={() => router.push('/login')} className="px-5 py-2 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105 ml-2" style={{ background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}>{t.login}</button>
              <button onClick={() => router.push('/cadastro')} className="px-5 py-2 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 4px 20px rgba(42,95,212,0.4)' }}>{t.comecar}</button>
            </div>
          </header>

          {/* Slides */}
          <div className="flex-1 flex items-center justify-center px-12" style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.8s ease' }}>

            {/* SLIDE 1 — Logo Majestosa */}
            {slide === 0 && (
              <div className="max-w-6xl w-full flex flex-col items-center justify-center text-center">
                {/* Logo grande e majestosa */}
                <div className="relative flex items-center justify-center mb-8" style={{ width: 300, height: 300 }}>
                  {/* Anéis orbitais místicos */}
                  {[220, 260, 300].map((size, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      width: size, height: size,
                      borderRadius: '50%',
                      border: `1px solid rgba(${['59,111,212','167,139,250','52,211,153'][i]},${0.4 - i * 0.1})`,
                      boxShadow: `0 0 ${20 + i * 10}px rgba(${['59,111,212','167,139,250','52,211,153'][i]},0.2)`,
                      animation: `spin${i} ${12 + i * 6}s linear infinite`,
                    }} />
                  ))}
                  {/* Partículas orbitando */}
                  {[0,45,90,135,180,225,270,315].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180
                    const r = 130
                    return (
                      <div key={i} style={{
                        position: 'absolute',
                        left: 150 + r * Math.cos(rad) - 4,
                        top: 150 + r * Math.sin(rad) - 4,
                        width: 8, height: 8,
                        borderRadius: '50%',
                        background: ['#3b6fd4','#6ab0ff','#34d399','#a78bfa','#f59e0b','#f87171','#34d399','#6ab0ff'][i],
                        boxShadow: `0 0 10px ${['#3b6fd4','#6ab0ff','#34d399','#a78bfa','#f59e0b','#f87171','#34d399','#6ab0ff'][i]}`,
                        animation: `pulse ${1.5 + i * 0.2}s ease-in-out infinite alternate`,
                      }} />
                    )
                  })}
                  {/* Logo central */}
                  <div style={{ position: 'relative', zIndex: 10, filter: 'drop-shadow(0 0 40px rgba(106,176,255,0.9)) drop-shadow(0 0 80px rgba(59,111,212,0.5))' }}>
                    <img src="/logo-aitech.png" alt="Axioma" style={{ width: 120, height: 120, objectFit: 'contain' }} />
                  </div>
                </div>

                <h1 className="font-black tracking-[0.4em] text-7xl mb-2" style={{ background: 'linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 30%, #ffffff 50%, #a78bfa 70%, #3b6fd4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(106,176,255,0.3))' }}>AXIOMA</h1>
                <p className="text-lg tracking-[0.6em] mb-6 font-semibold" style={{ color: '#3a5a8a' }}>AI.TECH</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(59,111,212,0.1)', border: '1px solid rgba(59,111,212,0.3)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399' }} />
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#6ab0ff' }}>{t.badge}</span>
                </div>
                <h2 className="text-4xl font-black mb-4" style={{ background: 'linear-gradient(135deg, #fff 0%, #c8d8f0 40%, #6ab0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.titulo1}</h2>
                <p className="text-lg mb-8 max-w-2xl" style={{ color: '#3a6090' }}>{t.sub1}</p>
                <div className="flex gap-4 justify-center mb-8">
                  <button onClick={() => router.push('/cadastro')} className="px-10 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 8px 40px rgba(42,95,212,0.5)' }}>{t.comecar}</button>
                  <button onClick={() => router.push('/planos')} className="px-10 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}>{t.verPlanos}</button>
                </div>
                <p className="text-xs" style={{ color: '#1a3a5a' }}>{t.semCartao}</p>
              </div>
            )}

            {/* SLIDE 2 — Einstein */}
            {slide === 1 && (
              <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
                <div className="flex justify-center items-center relative" style={{ height: 500 }}>
                  <svg width="460" height="460" viewBox="0 0 460 460">
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6ab0ff"/><stop offset="50%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#34d399"/>
                      </linearGradient>
                    </defs>
                    <circle cx="230" cy="230" r="180" fill="none" stroke="rgba(59,111,212,0.15)" strokeWidth="1" strokeDasharray="8 4">
                      <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="30s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="230" cy="230" r="140" fill="none" stroke="rgba(167,139,250,0.2)" strokeWidth="1" strokeDasharray="4 8">
                      <animateTransform attributeName="transform" type="rotate" from="360 230 230" to="0 230 230" dur="20s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="230" cy="230" r="100" fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth="1">
                      <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="15s" repeatCount="indefinite"/>
                    </circle>
                    <text x="230" y="220" textAnchor="middle" fontSize="52" fontWeight="900" fill="url(#grad1)" opacity="0.9">E=mc²
                      <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
                    </text>
                    <text x="230" y="255" textAnchor="middle" fontSize="16" fill="#3a5a8a" letterSpacing="4">AXIOMA</text>
                    {[{ formula: 'F=ma', angle: 0 }, { formula: 'PV=nRT', angle: 60 }, { formula: '∑F=0', angle: 120 }, { formula: 'Δx·Δp≥ℏ/2', angle: 180 }, { formula: 'S=k·ln(W)', angle: 240 }, { formula: '∫∂φ=0', angle: 300 }].map((item, i) => {
                      const rad = (item.angle * Math.PI) / 180
                      const colors = ['#6ab0ff','#34d399','#a78bfa','#f59e0b','#f87171','#6ab0ff']
                      return (
                        <g key={i}>
                          <circle cx={230 + 180 * Math.cos(rad)} cy={230 + 180 * Math.sin(rad)} r="28" fill={`${colors[i]}15`} stroke={`${colors[i]}50`} strokeWidth="1"/>
                          <text x={230 + 180 * Math.cos(rad)} y={230 + 180 * Math.sin(rad) + 4} textAnchor="middle" fontSize="9" fontWeight="bold" fill={colors[i]}>{item.formula}</text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <span className="text-xs font-bold tracking-widest" style={{ color: '#f59e0b' }}>{t.badgeEinstein}</span>
                  </div>
                  <h2 className="text-5xl font-black leading-tight mb-4" style={{ background: 'linear-gradient(135deg, #fff 0%, #f59e0b 50%, #f87171 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.tituloEinstein}</h2>
                  <p className="text-base mb-6" style={{ color: '#3a6090', lineHeight: 1.8 }}>{t.subEinstein}</p>
                  {/* CTA Einstein poderoso */}
                  <div className="px-5 py-4 rounded-xl mb-6" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <p className="text-sm italic font-medium" style={{ color: '#fbbf24', lineHeight: 1.8 }}>{t.ctaEinstein}</p>
                  </div>
                  <div className="space-y-3 mb-6">
                    {[{ eq: t.eq1, cor: '#34d399' }, { eq: t.eq2, cor: '#6ab0ff' }, { eq: t.eq3, cor: '#a78bfa' }].map((item, i) => (
                      <div key={i} className="px-4 py-3 rounded-xl font-mono text-sm font-bold" style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}30`, color: item.cor }}>{item.eq}</div>
                    ))}
                  </div>
                  <button onClick={() => router.push('/cadastro')} className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105 w-full" style={{ background: 'linear-gradient(135deg, #92400e, #b45309, #f59e0b)', color: '#fff', boxShadow: '0 8px 40px rgba(245,158,11,0.3)' }}>{t.comecar}</button>
                </div>
              </div>
            )}

            {/* SLIDE 3 — Geometria */}
            {slide === 2 && (
              <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
                    <span className="text-xs font-bold tracking-widest" style={{ color: '#a78bfa' }}>◈ GEOMETRIA DA PERFEIÇÃO</span>
                  </div>
                  <h2 className="text-5xl font-black leading-tight mb-6" style={{ background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #6ab0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.titulo2}</h2>
                  <p className="text-base mb-8" style={{ color: '#3a6090', lineHeight: 1.8 }}>{t.sub2}</p>
                  <div className="space-y-3 mb-8">
                    {t.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: ['rgba(59,111,212,0.08)','rgba(167,139,250,0.08)','rgba(52,211,153,0.08)','rgba(245,158,11,0.08)'][i], border: `1px solid ${['rgba(59,111,212,0.2)','rgba(167,139,250,0.2)','rgba(52,211,153,0.2)','rgba(245,158,11,0.2)'][i]}` }}>
                        <span className="text-lg">{['🧮','🤖','🌍','🔒'][i]}</span>
                        <span className="text-sm font-medium" style={{ color: '#8aaad4' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => router.push('/cadastro')} className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105 w-full" style={{ background: 'linear-gradient(135deg, #4a1d96, #6d28d9, #3b6fd4)', color: '#fff', boxShadow: '0 8px 40px rgba(109,40,217,0.4)' }}>{t.comecarGratis}</button>
                </div>
                <div className="flex justify-center items-center">
                  <svg width="460" height="460" viewBox="0 0 460 460">
                    <defs>
                      <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa"/><stop offset="50%" stopColor="#6ab0ff"/><stop offset="100%" stopColor="#34d399"/>
                      </linearGradient>
                    </defs>
                    {[0,60,120,180,240,300].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180
                      return <circle key={i} cx={230 + 60 * Math.cos(rad)} cy={230 + 60 * Math.sin(rad)} r="60" fill="none" stroke={`rgba(167,139,250,${0.12+i*0.02})`} strokeWidth="1"/>
                    })}
                    <circle cx="230" cy="230" r="120" fill="none" stroke="rgba(106,176,255,0.15)" strokeWidth="1">
                      <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="40s" repeatCount="indefinite"/>
                    </circle>
                    <polygon points="230,140 310,185 310,275 230,320 150,275 150,185" fill="none" stroke="url(#g3)" strokeWidth="1.5" opacity="0.6">
                      <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="25s" repeatCount="indefinite"/>
                    </polygon>
                    <polygon points="230,110 330,280 130,280" fill="none" stroke="rgba(52,211,153,0.3)" strokeWidth="1">
                      <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="18s" repeatCount="indefinite"/>
                    </polygon>
                    <polygon points="230,350 130,180 330,180" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth="1">
                      <animateTransform attributeName="transform" type="rotate" from="360 230 230" to="0 230 230" dur="18s" repeatCount="indefinite"/>
                    </polygon>
                    <text x="230" y="245" textAnchor="middle" fontSize="64" fontWeight="900" fill="url(#g3)" opacity="0.9">∑</text>
                    {[0,60,120,180,240,300].map((a,i) => {
                      const r2 = (a * Math.PI) / 180
                      return <circle key={i} cx={230+120*Math.cos(r2)} cy={230+120*Math.sin(r2)} r="5" fill={['#a78bfa','#6ab0ff','#34d399','#f59e0b','#f87171','#a78bfa'][i]} opacity="0.8">
                        <animate attributeName="r" values="3;6;3" dur={`${2+i*0.5}s`} repeatCount="indefinite"/>
                      </circle>
                    })}
                  </svg>
                </div>
              </div>
            )}

            {/* SLIDE 4 — Espaço */}
            {slide === 3 && (
              <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                    <span className="text-xs font-bold tracking-widest" style={{ color: '#34d399' }}>{t.badgeEspaco}</span>
                  </div>
                  <h2 className="text-5xl font-black leading-tight mb-6" style={{ background: 'linear-gradient(135deg, #fff 0%, #34d399 50%, #6ab0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.tituloEspaco}</h2>
                  <p className="text-base mb-8" style={{ color: '#3a6090', lineHeight: 1.8 }}>{t.subEspaco}</p>
                  <div className="space-y-3 mb-8">
                    {[{ texto: t.espaco1, cor: '#f87171', icon: '🕳️' }, { texto: t.espaco2, cor: '#34d399', icon: '🌌' }, { texto: t.espaco3, cor: '#a78bfa', icon: '⚡' }].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}25` }}>
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-sm font-medium" style={{ color: '#8aaad4' }}>{item.texto}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => router.push('/cadastro')} className="px-8 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105 w-full" style={{ background: 'linear-gradient(135deg, #064e3b, #065f46, #34d399)', color: '#fff', boxShadow: '0 8px 40px rgba(52,211,153,0.3)' }}>{t.comecar}</button>
                </div>
                <div className="flex justify-center items-center">
                  <svg width="460" height="460" viewBox="0 0 460 460">
                    <defs>
                      <radialGradient id="blackhole" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#000"/><stop offset="60%" stopColor="#1a0a2e"/><stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
                      </radialGradient>
                      <radialGradient id="p1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#6ab0ff"/><stop offset="100%" stopColor="#1a3a8f"/></radialGradient>
                      <radialGradient id="p2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#064e3b"/></radialGradient>
                      <radialGradient id="p3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#4a1d96"/></radialGradient>
                      <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <circle cx="230" cy="230" r="35" fill="url(#blackhole)"/>
                    <circle cx="230" cy="230" r="35" fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth="2" filter="url(#glow)">
                      <animate attributeName="r" values="33;37;33" dur="3s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="230" cy="230" r="50" fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="8">
                      <animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="4s" repeatCount="indefinite"/>
                    </circle>
                    <text x="230" y="235" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#a78bfa" opacity="0.8">∑</text>
                    {[80,120,165,205].map((r,i) => <circle key={i} cx="230" cy="230" r={r} fill="none" stroke={`rgba(59,111,212,${0.12-i*0.02})`} strokeWidth="1" strokeDasharray={i%2===0?"none":"3 6"}/>)}
                    <g><animateTransform attributeName="transform" type="rotate" from="0 230 230" to="360 230 230" dur="8s" repeatCount="indefinite"/><circle cx="310" cy="230" r="12" fill="url(#p1)" filter="url(#glow)"/><text x="310" y="234" textAnchor="middle" fontSize="7" fill="#c8d8f0" fontWeight="bold">R$</text></g>
                    <g><animateTransform attributeName="transform" type="rotate" from="120 230 230" to="480 230 230" dur="14s" repeatCount="indefinite"/><circle cx="395" cy="230" r="16" fill="url(#p2)" filter="url(#glow)"/><text x="395" y="234" textAnchor="middle" fontSize="7" fill="#c8d8f0" fontWeight="bold">IA</text></g>
                    <g><animateTransform attributeName="transform" type="rotate" from="240 230 230" to="600 230 230" dur="22s" repeatCount="indefinite"/><circle cx="350" cy="230" r="10" fill="url(#p3)" filter="url(#glow)"/></g>
                    <g><animateTransform attributeName="transform" type="rotate" from="60 230 230" to="420 230 230" dur="18s" repeatCount="indefinite"/><ellipse cx="145" cy="230" rx="18" ry="6" fill="none" stroke="rgba(245,158,11,0.5)" strokeWidth="3"/><circle cx="145" cy="230" r="9" fill="#f59e0b" opacity="0.8"/></g>
                  </svg>
                </div>
              </div>
            )}

            {/* SLIDE 5 — Planos */}
            {slide === 4 && (
              <div className="max-w-6xl w-full">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                    <span className="text-xs font-bold tracking-widest" style={{ color: '#34d399' }}>{t.badgePlanos}</span>
                  </div>
                  <h2 className="text-5xl font-black mb-4" style={{ background: 'linear-gradient(135deg, #fff, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.tituloPlanos}</h2>
                  <p className="text-base" style={{ color: '#3a6090' }}>{t.cancelar}</p>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { nome: 'Starter', preco: 'R$ 49', cor: '#3b6fd4', usuarios: lang==='pt'?'1 usuário':lang==='en'?'1 user':'1 usuario', ia: false, desc: lang==='pt'?'Ideal para MEI e autônomos':lang==='en'?'Ideal for freelancers':'Ideal para autónomos' },
                    { nome: 'Pro', preco: 'R$ 97', cor: '#f59e0b', usuarios: lang==='pt'?'até 4 usuários':lang==='en'?'up to 4 users':'hasta 4 usuarios', ia: true, desc: lang==='pt'?'Para pequenas empresas':lang==='en'?'For small businesses':'Para pequeñas empresas', destaque: true },
                    { nome: 'Business', preco: 'R$ 197', cor: '#34d399', usuarios: lang==='pt'?'até 10 usuários':lang==='en'?'up to 10 users':'hasta 10 usuarios', ia: true, desc: lang==='pt'?'Empresas em crescimento':lang==='en'?'Growing companies':'Empresas en crecimiento' },
                  ].map((p: any, i) => (
                    <div key={i} className="rounded-3xl p-6 text-center relative" style={{ background: p.destaque ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(10,22,40,0.95))' : 'rgba(10,22,40,0.8)', border: p.destaque ? `2px solid ${p.cor}` : '1px solid rgba(59,111,212,0.15)', boxShadow: p.destaque ? `0 0 40px ${p.cor}25` : 'none', transform: p.destaque ? 'scale(1.05)' : 'scale(1)' }}>
                      {p.destaque && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black" style={{ background: 'linear-gradient(135deg, #ca8a04, #ea580c)', color: '#fff' }}>{t.maisPopular}</div>}
                      <h3 className="text-xl font-black mb-1" style={{ color: p.cor }}>{p.nome}</h3>
                      <p className="text-xs mb-4" style={{ color: '#3a6090' }}>{p.desc}</p>
                      <div className="flex items-end justify-center gap-1 mb-4">
                        <span className="text-4xl font-black" style={{ color: '#c8d8f0' }}>{p.preco}</span>
                        <span className="text-sm mb-1" style={{ color: '#3a6090' }}>{lang==='pt'?'/mês':lang==='en'?'/mo':'/mes'}</span>
                      </div>
                      <p className="text-xs mb-4" style={{ color: '#3a5a8a' }}>{p.usuarios}</p>
                      {p.ia && <p className="text-xs mb-4 font-bold" style={{ color: '#fbbf24' }}>{t.iaPremium}</p>}
                      <button onClick={() => router.push('/cadastro')} className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: p.destaque ? 'linear-gradient(135deg, #ca8a04, #ea580c)' : 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff' }}>{t.comecar}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Indicadores */}
          <div className="flex justify-center gap-3 pb-6">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ width: slide===i?32:8, height: 8, borderRadius: 4, background: slide===i?'#6ab0ff':'rgba(59,111,212,0.3)', border: 'none', transition: 'all 0.3s', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ===== SEÇÕES SCROLLÁVEIS ===== */}

      {/* SEÇÃO 1 — Crise */}
      <div className="py-24 px-12" style={{ background: 'linear-gradient(180deg, #020810 0%, #0a0515 100%)', borderTop: '1px solid rgba(248,113,113,0.1)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4" style={{ background: 'linear-gradient(135deg, #f87171, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.criseTitulo}</h2>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: '#3a6090' }}>{t.criseSubtitulo}</p>
          </div>
          <div className="grid grid-cols-4 gap-6 mb-12">
            {t.criseStats.map((s, i) => (
              <div key={i} className="rounded-2xl p-6 text-center" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <p className="text-5xl font-black mb-3" style={{ color: '#f87171' }}>{s.numero}</p>
                <p className="text-sm" style={{ color: '#3a6090' }}>{s.texto}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={() => router.push('/cadastro')} className="px-12 py-5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)', color: '#fff', boxShadow: '0 8px 40px rgba(220,38,38,0.4)' }}>
              {t.criseCTA}
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2 — Problema vs Solução */}
      <div className="py-24 px-12" style={{ background: '#020810' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16">
          <div>
            <h3 className="text-3xl font-black mb-8" style={{ color: '#f87171' }}>{t.problemaTitulo}</h3>
            <div className="space-y-4">
              {t.problemas.map((p, i) => (
                <div key={i} className="px-5 py-4 rounded-xl text-sm font-medium" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.1)', color: '#8aaad4' }}>{p}</div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black mb-8" style={{ color: '#34d399' }}>{t.solucaoTitulo}</h3>
            <div className="space-y-4">
              {t.solucoes.map((s, i) => (
                <div key={i} className="px-5 py-4 rounded-xl text-sm font-medium" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.1)', color: '#8aaad4' }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3 — Impostos */}
      <div className="py-24 px-12" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.05), rgba(10,22,40,0.8))', borderTop: '1px solid rgba(234,179,8,0.1)', borderBottom: '1px solid rgba(234,179,8,0.1)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">💰</div>
          <h2 className="text-4xl font-black mb-6" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.impostoCTA}</h2>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: '#3a6090' }}>{t.impostoSub}</p>
          <button onClick={() => router.push('/cadastro')} className="px-12 py-5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #92400e, #b45309, #f59e0b)', color: '#fff', boxShadow: '0 8px 40px rgba(245,158,11,0.4)' }}>
            {t.impostoBtn}
          </button>
        </div>
      </div>

      {/* SEÇÃO 4 — Módulos */}
      <div className="py-24 px-12" style={{ background: '#020810' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#c8d8f0' }}>{t.modulosTitulo}</h2>
            <p className="text-lg" style={{ color: '#3a6090' }}>{t.modulosSub}</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {t.modulosList.map((m, i) => (
              <div key={i} className="rounded-2xl p-5 transition-all hover:scale-105 cursor-pointer" style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(59,111,212,0.15)' }}
                onMouseEnter={e => (e.currentTarget.style.border = '1px solid rgba(106,176,255,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.border = '1px solid rgba(59,111,212,0.15)')}>
                <div className="text-3xl mb-3">{m.icon}</div>
                <p className="font-bold text-sm mb-1" style={{ color: '#c8d8f0' }}>{m.nome}</p>
                <p className="text-xs" style={{ color: '#3a6090' }}>{m.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => router.push('/cadastro')} className="px-10 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 8px 40px rgba(42,95,212,0.4)' }}>
              {t.comecarGratis}
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 5 — Diferenciais */}
      <div className="py-24 px-12" style={{ background: 'linear-gradient(180deg, #020810 0%, #060f1e 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ background: 'linear-gradient(135deg, #6ab0ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.diferencialTitulo}</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {t.diferenciais.map((d, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(59,111,212,0.15)' }}>
                <div className="text-4xl mb-4">{d.icon}</div>
                <h3 className="font-black text-lg mb-2" style={{ color: '#c8d8f0' }}>{d.titulo}</h3>
                <p className="text-sm" style={{ color: '#3a6090', lineHeight: 1.8 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEÇÃO 6 — Como Funciona */}
      <div className="py-24 px-12" style={{ background: '#020810' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#c8d8f0' }}>{t.comofuncionaTitulo}</h2>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {t.passos.map((p, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 font-black text-2xl" style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 0 30px rgba(42,95,212,0.4)' }}>{p.num}</div>
                <h3 className="font-black text-xl mb-3" style={{ color: '#c8d8f0' }}>{p.titulo}</h3>
                <p className="text-sm" style={{ color: '#3a6090', lineHeight: 1.8 }}>{p.desc}</p>
                {i < 2 && <div className="absolute" style={{ right: '-20px', top: '30px', color: '#3b6fd4', fontSize: 24 }}>→</div>}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => router.push('/cadastro')} className="px-10 py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', boxShadow: '0 8px 40px rgba(42,95,212,0.4)' }}>
              {t.comecar}
            </button>
            <p className="text-xs mt-3" style={{ color: '#1a3a5a' }}>{t.semCartao}</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 7 — Depoimentos */}
      <div className="py-24 px-12" style={{ background: 'linear-gradient(180deg, #060f1e 0%, #020810 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#c8d8f0' }}>{t.depoimentosTitulo}</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {t.depoimentos.map((d, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(59,111,212,0.15)' }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: d.estrelas }).map((_, j) => <span key={j} style={{ color: '#f59e0b' }}>⭐</span>)}
                </div>
                <p className="text-sm mb-6 italic" style={{ color: '#8aaad4', lineHeight: 1.8 }}>"{d.texto}"</p>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#c8d8f0' }}>{d.nome}</p>
                  <p className="text-xs" style={{ color: '#3a6090' }}>{d.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEÇÃO 8 — CTA Final */}
      <div className="py-32 px-12 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #020810 0%, #0a1628 50%, #020810 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(59,111,212,0.15) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-6xl font-black mb-6" style={{ background: 'linear-gradient(135deg, #fff 0%, #6ab0ff 50%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.ctaFinalTitulo}</h2>
          <p className="text-xl mb-10" style={{ color: '#3a6090', lineHeight: 1.8 }}>{t.ctaFinalSub}</p>
          <button onClick={() => router.push('/cadastro')} className="px-16 py-6 rounded-2xl font-black text-xl tracking-widest uppercase transition-all hover:scale-105 mb-4" style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4, #a78bfa)', color: '#fff', boxShadow: '0 8px 60px rgba(42,95,212,0.6)' }}>
            {t.ctaFinalBtn}
          </button>
          <p className="text-sm mt-4" style={{ color: '#3a5a8a' }}>{t.ctaFinalSub2}</p>
          <p className="text-xs mt-2" style={{ color: '#1a3a5a' }}>{t.semCartao}</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8" style={{ borderTop: '1px solid rgba(59,111,212,0.1)', background: '#020810' }}>
        <p className="text-xs" style={{ color: '#1a3a5a' }}>{t.footer}</p>
      </footer>

      <style jsx>{`
        @keyframes spin0 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin1 { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes spin2 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { from { opacity: 0.4; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
      `}</style>
    </div>
  )
}