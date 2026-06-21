'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================
// TRADUÇÕES COMPLETAS PT / EN / ES
// ============================================================
const idiomas = {
  pt: {
    login: 'Login', comecar: '🚀 Começar Agora', comecarGratis: '🚀 Começar Trial 14 Dias',
    semCartao: '14 dias grátis. Cancele quando quiser.',
    nav: { modulos: 'Módulos', planos: 'Planos', sobre: 'Sobre' },
    hero: {
      legenda1: 'Enquanto o mercado ainda usa planilhas...',
      legenda2: 'A Axioma comanda seu financeiro em tempo real.',
      legenda3: 'A verdade que move empresas.',
      titulo: 'O sistema que substituiu contadores.',
      sub: 'Inteligência artificial que comanda todo o seu financeiro. Receitas, custos, impostos e fluxo de caixa — tudo conectado. Tudo automático.',
      modulos: ['DRE', 'Receitas', 'Fluxo de Caixa', 'MEI', 'IA Tributária', 'Open Finance', 'Custos', 'Investimentos'],
    },
    einstein: {
      badge: '⚡ E = mc² → DADOS = VALOR',
      titulo: 'Einstein nos ensinou: massa é energia.',
      subTitulo: 'A Axioma vai além: dados são lucro.',
      copy: '"A imaginação é mais importante que o conhecimento. Pois o conhecimento é limitado, enquanto a imaginação envolve o mundo inteiro." — Albert Einstein',
      texto: 'Em 1905, Einstein revelou que tudo no universo se transforma. Energia em matéria. Tempo em espaço. Mais de um século depois, a Axioma traduz a mesma verdade para o mundo dos negócios: cada número da sua empresa carrega uma energia oculta de lucro. Nossa IA é a equação que liberta esse valor.',
      formulas: ['E = mc²', 'R$ = D × IA', '∫ Lucro dt', 'Σ Receitas', 'Δ Crescimento', 'π × Decisões'],
    },
    platao: {
      badge: '◆ O FUNDAMENTO PLATÔNICO',
      titulo: 'Platão dizia: a verdade é uma forma perfeita.',
      copy: '"Axioma" — do grego antigo ἀξίωμα — significa "verdade que não precisa ser provada".',
      texto: 'Há 2.400 anos, Platão descreveu cinco sólidos perfeitos como o fundamento do universo. O primeiro deles é o tetraedro — exatamente a forma do nosso logo. Não é coincidência. A Axioma foi construída sobre a verdade matemática mais antiga que existe: aquela que não pode ser refutada. Quando seu negócio se apoia em axiomas, ele se torna inquebrável.',
    },
    global: {
      badge: '🌍 DOMÍNIO SEM FRONTEIRAS',
      titulo: 'Sem limites de território.',
      sub: 'Criado para conquistar o mundo. Em português, inglês e espanhol. Sua empresa pode atender de São Paulo a Tóquio com a mesma precisão.',
      paises: [
        { f: '🇧🇷', n: 'Brasil', cor: '#34d399' },
        { f: '🇺🇸', n: 'USA', cor: '#6ab0ff' },
        { f: '🇪🇸', n: 'España', cor: '#fbbf24' },
        { f: '🇦🇷', n: 'Argentina', cor: '#6ab0ff' },
        { f: '🇲🇽', n: 'México', cor: '#34d399' },
        { f: '🇵🇹', n: 'Portugal', cor: '#a78bfa' },
        { f: '🇨🇴', n: 'Colombia', cor: '#fbbf24' },
        { f: '🇨🇱', n: 'Chile', cor: '#f472b6' },
      ],
      copy: 'O mercado de gestão financeira movimenta R$15 bilhões/ano no Brasil. A Axioma chegou para liderar.',
    },
    visao: {
      badge: '👁️ VISÃO CIRÚRGICA',
      titulo: 'Precisão absoluta. Zero erros.',
      sub: 'Nossa IA enxerga o que nenhum contador humano consegue. Lê seus dados como um cirurgião lê um raio-X — com precisão de milésimos.',
      items: ['✦ Leitura em tempo real de todos os seus dados', '✦ Detecção automática de anomalias financeiras', '✦ Alertas antes que o problema aconteça', '✦ 100% dos números verificados pela IA'],
    },
    mente: {
      badge: '🧠 MENTE ONISCIENTE',
      titulo: 'Trilhões de dados em milissegundos.',
      sub: 'Conectada a tudo simultaneamente. A IA da Axioma processa seus dados financeiros, tributários e operacionais na velocidade da luz.',
      palavras: ['RECEITAS', 'DRE', 'MEI', 'IRPF', 'FLUXO', 'CUSTOS', 'CLIENTES', 'METAS', 'IA', 'ROI', 'AXIOMA', 'R$', '%', '∑'],
    },
    seguranca: {
      badge: '🔐 FORTALEZA DIGITAL',
      titulo: 'Segurança de nível bancário.',
      sub: 'Seus dados protegidos por tecnologia de primeiro mundo. Ninguém acessa o que é seu.',
      items: [
        { icon: '🛡️', titulo: 'RLS Avançado', desc: 'Cada usuário acessa APENAS seus dados. Isolamento total.' },
        { icon: '🔒', titulo: 'SSL/TLS', desc: 'Criptografia em todas as conexões. Dados blindados.' },
        { icon: '🔑', titulo: 'Auth Avançado', desc: 'Google OAuth + JWT + refresh token automático.' },
        { icon: '👁️', titulo: 'Monitoramento 24/7', desc: 'Sentry rastreando cada erro em tempo real.' },
      ],
    },
    robots: {
      badge: '🤖 O EXÉRCITO DE IA',
      titulo: 'Enquanto você dorme, nossa IA trabalha.',
      sub: '24 horas. 7 dias. 365 dias. Sem erros. Sem férias. Sem reclamações. Sem pedido de aumento. Nossa IA é o funcionário perfeito que nenhuma empresa conseguiu ter — até agora.',
      items: ['✦ Analisa seus dados automaticamente toda noite', '✦ Detecta padrões que humanos não conseguem ver', '✦ Gera relatórios sem você precisar pedir', '✦ Aprende com seu negócio continuamente'],
    },
    modulos: {
      titulo: 'Tudo que sua empresa precisa em um só lugar',
      sub: '23 módulos integrados. Uma plataforma. Resultado extraordinário.',
      lista: [
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
        { icon: '🟠', nome: 'MEI Completo', desc: '7 submódulos exclusivos' },
        { icon: '🗂️', nome: 'Centros de Custo', desc: 'Gestão por centro' },
        { icon: '📂', nome: 'Importar Docs', desc: 'Upload de documentos' },
        { icon: '📋', nome: 'Relatórios', desc: 'PDF com identidade Axioma' },
        { icon: '🏢', nome: 'Empresa', desc: 'Configurações completas' },
        { icon: '💳', nome: 'Planos', desc: 'Gestão de assinatura' },
        { icon: '🏦', nome: 'Open Finance', desc: 'Conexão bancária automática' },
      ],
    },
    clowdbot: {
      badge: '🤖 CLOWDBOT — IA AUTÔNOMA',
      titulo: 'Seu gerente financeiro nunca dorme.',
      sub: 'O ClowdBot é um agente de IA que opera de forma autônoma — analisando, alertando e decidindo com você. Como ter um CFO de nível mundial disponível 24/7.',
      status: 'Sistema Neural Ativo',
      pensando: ['Analisando fluxo de caixa...', 'Detectando oportunidade de economia...', 'Gerando relatório DRE...', 'Calculando ponto de equilíbrio...', 'Otimizando tributação...'],
    },
    planos: {
      titulo: 'Escolha seu plano',
      sub: 'Comece com 14 dias grátis em qualquer plano. Cancele quando quiser.',
      popular: '⭐ MAIS POPULAR',
      trial: '14 dias grátis',
      mes: '/mês',
      lista: [
        { nome: 'Starter', preco: 47, cor: '#6ab0ff', desc: 'Para MEI e autônomos', usuarios: '1 usuário', features: ['23 módulos completos', 'MEI módulo exclusivo', 'Dashboard com KPIs', 'Exportar PDF', 'Suporte por email'], ia: false },
        { nome: 'Pro', preco: 97, cor: '#34d399', desc: 'Para profissionais', usuarios: 'até 2 usuários', features: ['Tudo do Starter', 'IA Financeira Premium', 'Multi-idioma PT/EN/ES', 'Relatórios avançados', 'Open Finance'], ia: true },
        { nome: 'Business', preco: 197, cor: '#f59e0b', desc: 'Para empresas em crescimento', usuarios: 'até 5 usuários', features: ['Tudo do Pro', 'IA Tributária Premium', 'IA MEI Advisor', 'Centros de Custo', 'Suporte prioritário'], ia: true, destaque: true },
        { nome: 'Enterprise', preco: 297, cor: '#a78bfa', desc: 'Solução sem limites', usuarios: 'até 10 usuários', features: ['Tudo do Business', 'ClowdBot autônomo', 'Multi-empresas', 'API dedicada', 'Suporte VIP 24/7'], ia: true },
      ],
    },
    cta: {
      titulo: 'Sua concorrência já usa IA. E você?',
      sub: 'Cada dia sem controle financeiro é dinheiro saindo do seu bolso. As empresas que sobrevivem são as que têm dados reais na mão.',
      btn: '🚀 Começar 14 Dias Grátis',
      sub2: 'Junte-se a empresas que já descobriram o poder da Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Inteligência Financeira para PMEs',
  },
  en: {
    login: 'Login', comecar: '🚀 Start Now', comecarGratis: '🚀 Start 14-Day Trial',
    semCartao: '14 days free. Cancel anytime.',
    nav: { modulos: 'Modules', planos: 'Plans', sobre: 'About' },
    hero: {
      legenda1: 'While the market still uses spreadsheets...',
      legenda2: 'Axioma commands your finances in real time.',
      legenda3: 'The truth that moves companies.',
      titulo: 'The system that replaced accountants.',
      sub: 'Artificial intelligence that commands your entire financial operation. Revenue, costs, taxes and cash flow — all connected. All automatic.',
      modulos: ['P&L', 'Revenue', 'Cash Flow', 'MEI', 'Tax AI', 'Open Finance', 'Costs', 'Investments'],
    },
    einstein: {
      badge: '⚡ E = mc² → DATA = VALUE',
      titulo: 'Einstein taught us: mass is energy.',
      subTitulo: 'Axioma goes further: data is profit.',
      copy: '"Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world." — Albert Einstein',
      texto: 'In 1905, Einstein revealed that everything in the universe transforms. Energy into matter. Time into space. More than a century later, Axioma translates the same truth into business: every number in your company carries a hidden energy of profit. Our AI is the equation that unlocks that value.',
      formulas: ['E = mc²', '$ = D × AI', '∫ Profit dt', 'Σ Revenue', 'Δ Growth', 'π × Decisions'],
    },
    platao: {
      badge: '◆ THE PLATONIC FOUNDATION',
      titulo: 'Plato said: truth is a perfect form.',
      copy: '"Axiom" — from ancient Greek ἀξίωμα — means "truth that needs no proof".',
      texto: '2,400 years ago, Plato described five perfect solids as the foundation of the universe. The first is the tetrahedron — exactly the shape of our logo. It\'s no coincidence. Axioma was built on the oldest mathematical truth that exists: the one that cannot be refuted. When your business rests on axioms, it becomes unbreakable.',
    },
    global: {
      badge: '🌍 BORDERLESS DOMINANCE',
      titulo: 'No territorial limits.',
      sub: 'Built to conquer the world. In Portuguese, English and Spanish. Your company can serve from São Paulo to Tokyo with the same precision.',
      paises: [
        { f: '🇧🇷', n: 'Brazil', cor: '#34d399' },
        { f: '🇺🇸', n: 'USA', cor: '#6ab0ff' },
        { f: '🇪🇸', n: 'Spain', cor: '#fbbf24' },
        { f: '🇦🇷', n: 'Argentina', cor: '#6ab0ff' },
        { f: '🇲🇽', n: 'Mexico', cor: '#34d399' },
        { f: '🇵🇹', n: 'Portugal', cor: '#a78bfa' },
        { f: '🇨🇴', n: 'Colombia', cor: '#fbbf24' },
        { f: '🇨🇱', n: 'Chile', cor: '#f472b6' },
      ],
      copy: 'The financial management market moves R$15 billion/year in Brazil. Axioma is here to lead.',
    },
    visao: {
      badge: '👁️ SURGICAL VISION',
      titulo: 'Absolute precision. Zero errors.',
      sub: 'Our AI sees what no human accountant can. It reads your data like a surgeon reads an X-ray — with millisecond precision.',
      items: ['✦ Real-time reading of all your data', '✦ Automatic detection of financial anomalies', '✦ Alerts before the problem occurs', '✦ 100% of numbers verified by AI'],
    },
    mente: {
      badge: '🧠 OMNISCIENT MIND',
      titulo: 'Trillions of data in milliseconds.',
      sub: 'Connected to everything simultaneously. Axioma\'s AI processes your financial, tax and operational data at the speed of light.',
      palavras: ['REVENUE', 'P&L', 'MEI', 'TAX', 'FLOW', 'COSTS', 'CLIENTS', 'GOALS', 'AI', 'ROI', 'AXIOMA', '$', '%', '∑'],
    },
    seguranca: {
      badge: '🔐 DIGITAL FORTRESS',
      titulo: 'Bank-level security.',
      sub: 'Your data protected by world-class technology. Nobody accesses what is yours.',
      items: [
        { icon: '🛡️', titulo: 'Advanced RLS', desc: 'Each user accesses ONLY their data. Total isolation.' },
        { icon: '🔒', titulo: 'SSL/TLS', desc: 'Encryption on all connections. Shielded data.' },
        { icon: '🔑', titulo: 'Advanced Auth', desc: 'Google OAuth + JWT + automatic refresh token.' },
        { icon: '👁️', titulo: '24/7 Monitoring', desc: 'Sentry tracking every error in real time.' },
      ],
    },
    robots: {
      badge: '🤖 THE AI ARMY',
      titulo: 'While you sleep, our AI works.',
      sub: '24 hours. 7 days. 365 days. No errors. No vacations. No complaints. Our AI is the perfect employee no company has ever had — until now.',
      items: ['✦ Automatically analyzes your data every night', '✦ Detects patterns humans cannot see', '✦ Generates reports without you asking', '✦ Continuously learns from your business'],
    },
    modulos: {
      titulo: 'Everything your company needs in one place',
      sub: '23 integrated modules. One platform. Extraordinary results.',
      lista: [
        { icon: '💵', nome: 'Revenue', desc: 'Total income control' },
        { icon: '📌', nome: 'Fixed Costs', desc: 'Manage monthly costs' },
        { icon: '📊', nome: 'Variable Costs', desc: 'Monitor variable expenses' },
        { icon: '💧', nome: 'Cash Flow', desc: 'View financial future' },
        { icon: '📈', nome: 'P&L', desc: 'Real-time results' },
        { icon: '⚖️', nome: 'Debt', desc: 'Manage your debts' },
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
        { icon: '🟠', nome: 'MEI Module', desc: '7 exclusive submodules' },
        { icon: '🗂️', nome: 'Cost Centers', desc: 'Center management' },
        { icon: '📂', nome: 'Import Docs', desc: 'Document upload' },
        { icon: '📋', nome: 'Reports', desc: 'PDF with Axioma identity' },
        { icon: '🏢', nome: 'Company', desc: 'Complete settings' },
        { icon: '💳', nome: 'Plans', desc: 'Subscription management' },
        { icon: '🏦', nome: 'Open Finance', desc: 'Automatic bank connection' },
      ],
    },
    clowdbot: {
      badge: '🤖 CLOWDBOT — AUTONOMOUS AI',
      titulo: 'Your financial manager never sleeps.',
      sub: 'ClowdBot is an AI agent that operates autonomously — analyzing, alerting and deciding with you. Like having a world-class CFO available 24/7.',
      status: 'Neural System Active',
      pensando: ['Analyzing cash flow...', 'Detecting saving opportunity...', 'Generating P&L report...', 'Calculating break-even...', 'Optimizing taxation...'],
    },
    planos: {
      titulo: 'Choose your plan',
      sub: 'Start with 14 days free on any plan. Cancel anytime.',
      popular: '⭐ MOST POPULAR',
      trial: '14 days free',
      mes: '/mo',
      lista: [
        { nome: 'Starter', preco: 47, cor: '#6ab0ff', desc: 'For freelancers', usuarios: '1 user', features: ['23 complete modules', 'MEI exclusive module', 'Dashboard with KPIs', 'Export PDF', 'Email support'], ia: false },
        { nome: 'Pro', preco: 97, cor: '#34d399', desc: 'For professionals', usuarios: 'up to 2 users', features: ['Everything in Starter', 'Premium Financial AI', 'Multi-language PT/EN/ES', 'Advanced reports', 'Open Finance'], ia: true },
        { nome: 'Business', preco: 197, cor: '#f59e0b', desc: 'For growing companies', usuarios: 'up to 5 users', features: ['Everything in Pro', 'Premium Tax AI', 'AI MEI Advisor', 'Cost Centers', 'Priority support'], ia: true, destaque: true },
        { nome: 'Enterprise', preco: 297, cor: '#a78bfa', desc: 'Unlimited solution', usuarios: 'up to 10 users', features: ['Everything in Business', 'Autonomous ClowdBot', 'Multi-company', 'Dedicated API', 'VIP 24/7 support'], ia: true },
      ],
    },
    cta: {
      titulo: 'Your competition already uses AI. Do you?',
      sub: 'Every day without financial control is money leaving your pocket. Companies that survive have real data at hand.',
      btn: '🚀 Start 14 Days Free',
      sub2: 'Join companies that have discovered the power of Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Financial Intelligence for SMEs',
  },
  es: {
    login: 'Iniciar Sesión', comecar: '🚀 Empezar Ahora', comecarGratis: '🚀 Empezar Prueba 14 Días',
    semCartao: '14 días gratis. Cancela cuando quieras.',
    nav: { modulos: 'Módulos', planos: 'Planes', sobre: 'Sobre' },
    hero: {
      legenda1: 'Mientras el mercado sigue usando planillas...',
      legenda2: 'Axioma controla tus finanzas en tiempo real.',
      legenda3: 'La verdad que mueve empresas.',
      titulo: 'El sistema que reemplazó a los contadores.',
      sub: 'Inteligencia artificial que controla todo tu financiero. Ingresos, costos, impuestos y flujo de caja — todo conectado. Todo automático.',
      modulos: ['P&G', 'Ingresos', 'Flujo de Caja', 'MEI', 'IA Tributaria', 'Open Finance', 'Costos', 'Inversiones'],
    },
    einstein: {
      badge: '⚡ E = mc² → DATOS = VALOR',
      titulo: 'Einstein nos enseñó: la masa es energía.',
      subTitulo: 'Axioma va más allá: los datos son ganancia.',
      copy: '"La imaginación es más importante que el conocimiento. Pues el conocimiento es limitado, mientras que la imaginación abarca el mundo entero." — Albert Einstein',
      texto: 'En 1905, Einstein reveló que todo en el universo se transforma. Energía en materia. Tiempo en espacio. Más de un siglo después, Axioma traduce la misma verdad al mundo de los negocios: cada número de tu empresa lleva una energía oculta de ganancia. Nuestra IA es la ecuación que libera ese valor.',
      formulas: ['E = mc²', '$ = D × IA', '∫ Lucro dt', 'Σ Ingresos', 'Δ Crecimiento', 'π × Decisiones'],
    },
    platao: {
      badge: '◆ EL FUNDAMENTO PLATÓNICO',
      titulo: 'Platón decía: la verdad es una forma perfecta.',
      copy: '"Axioma" — del griego antiguo ἀξίωμα — significa "verdad que no necesita ser probada".',
      texto: 'Hace 2.400 años, Platón describió cinco sólidos perfectos como el fundamento del universo. El primero es el tetraedro — exactamente la forma de nuestro logo. No es coincidencia. Axioma fue construida sobre la verdad matemática más antigua que existe: la que no puede ser refutada. Cuando tu negocio se apoya en axiomas, se vuelve irrompible.',
    },
    global: {
      badge: '🌍 DOMINIO SIN FRONTERAS',
      titulo: 'Sin límites territoriales.',
      sub: 'Creado para conquistar el mundo. En portugués, inglés y español. Tu empresa puede atender desde São Paulo hasta Tokio con la misma precisión.',
      paises: [
        { f: '🇧🇷', n: 'Brasil', cor: '#34d399' },
        { f: '🇺🇸', n: 'USA', cor: '#6ab0ff' },
        { f: '🇪🇸', n: 'España', cor: '#fbbf24' },
        { f: '🇦🇷', n: 'Argentina', cor: '#6ab0ff' },
        { f: '🇲🇽', n: 'México', cor: '#34d399' },
        { f: '🇵🇹', n: 'Portugal', cor: '#a78bfa' },
        { f: '🇨🇴', n: 'Colombia', cor: '#fbbf24' },
        { f: '🇨🇱', n: 'Chile', cor: '#f472b6' },
      ],
      copy: 'El mercado de gestión financiera mueve R$15 mil millones/año. Axioma llegó para liderar.',
    },
    visao: {
      badge: '👁️ VISIÓN QUIRÚRGICA',
      titulo: 'Precisión absoluta. Cero errores.',
      sub: 'Nuestra IA ve lo que ningún contador humano puede. Lee tus datos como un cirujano lee una radiografía — con precisión de milésimas.',
      items: ['✦ Lectura en tiempo real de todos tus datos', '✦ Detección automática de anomalías financieras', '✦ Alertas antes de que ocurra el problema', '✦ 100% de los números verificados por IA'],
    },
    mente: {
      badge: '🧠 MENTE OMNISCIENTE',
      titulo: 'Billones de datos en milisegundos.',
      sub: 'Conectada a todo simultáneamente. La IA de Axioma procesa tus datos financieros, tributarios y operativos a la velocidad de la luz.',
      palavras: ['INGRESOS', 'P&G', 'MEI', 'IMPUESTO', 'FLUJO', 'COSTOS', 'CLIENTES', 'METAS', 'IA', 'ROI', 'AXIOMA', '$', '%', '∑'],
    },
    seguranca: {
      badge: '🔐 FORTALEZA DIGITAL',
      titulo: 'Seguridad de nivel bancario.',
      sub: 'Tus datos protegidos por tecnología de primer mundo. Nadie accede a lo que es tuyo.',
      items: [
        { icon: '🛡️', titulo: 'RLS Avanzado', desc: 'Cada usuario accede SOLO a sus datos. Aislamiento total.' },
        { icon: '🔒', titulo: 'SSL/TLS', desc: 'Cifrado en todas las conexiones. Datos blindados.' },
        { icon: '🔑', titulo: 'Auth Avanzado', desc: 'Google OAuth + JWT + refresh token automático.' },
        { icon: '👁️', titulo: 'Monitoreo 24/7', desc: 'Sentry rastreando cada error en tiempo real.' },
      ],
    },
    robots: {
      badge: '🤖 EL EJÉRCITO DE IA',
      titulo: 'Mientras duermes, nuestra IA trabaja.',
      sub: '24 horas. 7 días. 365 días. Sin errores. Sin vacaciones. Sin quejas. Nuestra IA es el empleado perfecto que ninguna empresa tuvo — hasta ahora.',
      items: ['✦ Analiza tus datos automáticamente cada noche', '✦ Detecta patrones que humanos no pueden ver', '✦ Genera reportes sin que lo pidas', '✦ Aprende continuamente de tu negocio'],
    },
    modulos: {
      titulo: 'Todo lo que tu empresa necesita en un solo lugar',
      sub: '23 módulos integrados. Una plataforma. Resultado extraordinario.',
      lista: [
        { icon: '💵', nome: 'Ingresos', desc: 'Control total de entradas' },
        { icon: '📌', nome: 'Costos Fijos', desc: 'Gestiona costos mensuales' },
        { icon: '📊', nome: 'Costos Variables', desc: 'Monitorea gastos variables' },
        { icon: '💧', nome: 'Flujo de Caja', desc: 'Visión del futuro financiero' },
        { icon: '📈', nome: 'P&G', desc: 'Resultados en tiempo real' },
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
        { icon: '🟠', nome: 'Módulo MEI', desc: '7 submódulos exclusivos' },
        { icon: '🗂️', nome: 'Centros de Costo', desc: 'Gestión por centro' },
        { icon: '📂', nome: 'Importar Docs', desc: 'Carga de documentos' },
        { icon: '📋', nome: 'Reportes', desc: 'PDF con identidad Axioma' },
        { icon: '🏢', nome: 'Empresa', desc: 'Configuraciones completas' },
        { icon: '💳', nome: 'Planes', desc: 'Gestión de suscripción' },
        { icon: '🏦', nome: 'Open Finance', desc: 'Conexión bancaria automática' },
      ],
    },
    clowdbot: {
      badge: '🤖 CLOWDBOT — IA AUTÓNOMA',
      titulo: 'Tu gerente financiero nunca duerme.',
      sub: 'ClowdBot es un agente de IA que opera de forma autónoma — analizando, alertando y decidiendo contigo. Como tener un CFO de nivel mundial disponible 24/7.',
      status: 'Sistema Neural Activo',
      pensando: ['Analizando flujo de caja...', 'Detectando oportunidad de ahorro...', 'Generando reporte P&G...', 'Calculando punto de equilibrio...', 'Optimizando tributación...'],
    },
    planos: {
      titulo: 'Elige tu plan',
      sub: 'Empieza con 14 días gratis en cualquier plan. Cancela cuando quieras.',
      popular: '⭐ MÁS POPULAR',
      trial: '14 días gratis',
      mes: '/mes',
      lista: [
        { nome: 'Starter', preco: 47, cor: '#6ab0ff', desc: 'Para autónomos', usuarios: '1 usuario', features: ['23 módulos completos', 'Módulo MEI exclusivo', 'Dashboard con KPIs', 'Exportar PDF', 'Soporte por email'], ia: false },
        { nome: 'Pro', preco: 97, cor: '#34d399', desc: 'Para profesionales', usuarios: 'hasta 2 usuarios', features: ['Todo de Starter', 'IA Financiera Premium', 'Multi-idioma PT/EN/ES', 'Reportes avanzados', 'Open Finance'], ia: true },
        { nome: 'Business', preco: 197, cor: '#f59e0b', desc: 'Para empresas en crecimiento', usuarios: 'hasta 5 usuarios', features: ['Todo de Pro', 'IA Tributaria Premium', 'AI MEI Advisor', 'Centros de Costo', 'Soporte prioritario'], ia: true, destaque: true },
        { nome: 'Enterprise', preco: 297, cor: '#a78bfa', desc: 'Solución sin límites', usuarios: 'hasta 10 usuarios', features: ['Todo de Business', 'ClowdBot autónomo', 'Multi-empresa', 'API dedicada', 'Soporte VIP 24/7'], ia: true },
      ],
    },
    cta: {
      titulo: '¿Tu competencia ya usa IA. Y tú?',
      sub: 'Cada día sin control financiero es dinero saliendo de tu bolsillo. Las empresas que sobreviven tienen datos reales en la mano.',
      btn: '🚀 Empezar 14 Días Gratis',
      sub2: 'Únete a empresas que descubrieron el poder de Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Inteligencia Financiera para PYMEs',
  },
}

// ============================================================
// MATRIX BACKGROUND — fundo de caracteres caindo
// ============================================================
function MatrixBg() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const chars = 'AXIOMA∑∫∂∇√π∞≈≡±∗∈⊂E=mc²DREFLUXOMEIROIR$%01アイ'
    const fontSize = 13
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)
    const colors = ['#3b6fd4', '#6ab0ff', '#34d399', '#a78bfa', '#ffffff', '#f59e0b']
    const draw = () => {
      ctx.fillStyle = 'rgba(2,8,16,0.04)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drops.forEach((y, i) => {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
        ctx.font = `${fontSize}px monospace`
        ctx.globalAlpha = Math.random() * 0.4 + 0.05
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y * fontSize)
        ctx.globalAlpha = 1
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.18 }} />
}

// ============================================================
// TETRAEDRO DE PLATÃO 3D — SVG animado
// ============================================================
function TetraedroPlatao() {
  const [rot, setRot] = useState(0)
  useEffect(() => {
    let raf: number
    const tick = () => { setRot(r => r + 0.4); raf = requestAnimationFrame(tick) }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="-200 -200 400 400" className="w-full h-full max-w-md">
        <defs>
          <radialGradient id="tetraGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#6ab0ff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#3b6fd4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#020810" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ab0ff" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#3b6fd4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="0" cy="0" r="160" fill="url(#tetraGrad)" opacity="0.6" />
        {[0, 60, 120, 180, 240, 300].map(a => (
          <g key={a} transform={`rotate(${a + rot * 0.3})`} opacity="0.4">
            <text x="0" y="-130" textAnchor="middle" fill="#6ab0ff" fontSize="11" fontFamily="monospace" filter="url(#glow)">
              {['E=mc²', '∫dx', 'Σ', 'π', 'Δ', '√'][a / 60]}
            </text>
          </g>
        ))}
        <g transform={`rotate(${rot})`} filter="url(#glow)">
          {/* Tetraedro - 4 triângulos */}
          <polygon points="0,-100 -87,50 87,50" fill="rgba(106,176,255,0.15)" stroke="url(#edgeGrad)" strokeWidth="2" />
          <polygon points="0,-100 -87,50 0,30" fill="rgba(59,111,212,0.2)" stroke="#6ab0ff" strokeWidth="1.5" />
          <polygon points="0,-100 87,50 0,30" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.5" />
          <polygon points="-87,50 87,50 0,30" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
          {/* Pontos brilhantes nos vértices */}
          {[[0, -100], [-87, 50], [87, 50], [0, 30]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="#fff">
              <animate attributeName="r" values="3;6;3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
        <text x="0" y="180" textAnchor="middle" fill="#6ab0ff" fontSize="14" fontWeight="bold" fontFamily="Arial" filter="url(#glow)" opacity="0.9">
          AXIOMA
        </text>
      </svg>
    </div>
  )
}

// ============================================================
// EINSTEIN — Avatar estilizado com fórmulas
// ============================================================
function EinsteinAvatar({ formulas }: { formulas: string[] }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf: number
    const tick = () => { setT(v => v + 1); raf = requestAnimationFrame(tick) }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Aura externa */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full"
          style={{
            width: 280, height: 280,
            background: 'radial-gradient(circle, rgba(106,176,255,0.25) 0%, rgba(167,139,250,0.15) 40%, transparent 70%)',
            filter: 'blur(20px)',
            animation: 'pulse-aura 4s ease-in-out infinite alternate',
          }} />
      </div>
      {/* Fórmulas orbitando */}
      {formulas.map((f, i) => {
        const angle = (i / formulas.length) * Math.PI * 2 + t * 0.005
        const r = 170
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r * 0.7
        const cores = ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#ffffff']
        return (
          <div key={i} className="absolute font-mono font-bold"
            style={{
              left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              color: cores[i % cores.length],
              fontSize: 14,
              textShadow: `0 0 12px ${cores[i % cores.length]}`,
              opacity: 0.85,
              whiteSpace: 'nowrap',
            }}>
            {f}
          </div>
        )
      })}
      {/* Círculo orbital decorativo */}
      <svg className="absolute inset-0 w-full h-full" viewBox="-200 -200 400 400">
        <ellipse cx="0" cy="0" rx="170" ry="119" fill="none" stroke="rgba(106,176,255,0.2)" strokeWidth="1" strokeDasharray="4 8" />
        <ellipse cx="0" cy="0" rx="140" ry="98" fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="1" strokeDasharray="2 6" transform={`rotate(${t * 0.3})`} />
      </svg>
      {/* Avatar central — silhueta de Einstein estilizada */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="text-9xl mb-2" style={{ filter: 'drop-shadow(0 0 30px rgba(106,176,255,0.8))' }}>
          🧑‍🔬
        </div>
        <div className="text-xs font-bold tracking-widest" style={{ color: '#6ab0ff', textShadow: '0 0 10px #6ab0ff' }}>
          E = mc²
        </div>
      </div>
      {/* Raios de luz convergindo */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <div key={i} className="absolute"
          style={{
            width: 2, height: 100,
            left: '50%', top: '50%',
            transformOrigin: 'top center',
            transform: `translate(-50%, 0) rotate(${a + t * 0.2}deg)`,
            background: `linear-gradient(to bottom, transparent, rgba(106,176,255,${0.3 + Math.sin(t * 0.05 + i) * 0.2}), transparent)`,
            filter: 'blur(1px)',
          }} />
      ))}
    </div>
  )
}

// ============================================================
// CLOWDBOT — Holograma pulsante (mantido do original)
// ============================================================
function ClowdbotCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    let frame = 0
    const draw = () => {
      frame++
      const w = canvas.width, h = canvas.height
      const cx = w / 2, cy = h / 2
      const R = Math.min(w, h) * 0.35
      ctx.clearRect(0, 0, w, h)
      for (let ring = 0; ring < 5; ring++) {
        const r = R * (0.6 + ring * 0.1)
        const pulse = Math.sin(frame * 0.04 + ring * 0.8) * 5
        ctx.beginPath(); ctx.arc(cx, cy, r + pulse, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(106,176,255,${0.15 - ring * 0.02})`
        ctx.lineWidth = 1; ctx.stroke()
      }
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + frame * 0.01
        ctx.lineTo(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(106,176,255,0.4)'; ctx.lineWidth = 2
      ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 15; ctx.stroke(); ctx.shadowBlur = 0
      const eyePulse = Math.sin(frame * 0.06) * 3
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.35 + eyePulse, R * 0.2 + eyePulse * 0.5, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(52,211,153,0.8)'; ctx.lineWidth = 2
      ctx.shadowColor = '#34d399'; ctx.shadowBlur = 20; ctx.stroke(); ctx.shadowBlur = 0
      const blinkPhase = frame % 120
      const blinkScale = blinkPhase < 5 ? blinkPhase / 5 : blinkPhase < 10 ? (10 - blinkPhase) / 5 : 1
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.12 * blinkScale, 0, Math.PI * 2)
      const pupilGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.12)
      pupilGrad.addColorStop(0, 'rgba(106,176,255,0.9)')
      pupilGrad.addColorStop(0.5, 'rgba(52,211,153,0.7)')
      pupilGrad.addColorStop(1, 'rgba(0,0,0,0.8)')
      ctx.fillStyle = pupilGrad; ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0
      for (let p = 0; p < 8; p++) {
        const pAngle = (p / 8) * Math.PI * 2 + frame * 0.02
        const pDist = R * (0.9 + Math.sin(frame * 0.05 + p) * 0.1)
        ctx.beginPath(); ctx.arc(cx + Math.cos(pAngle) * pDist, cy + Math.sin(pAngle) * pDist, 2, 0, Math.PI * 2)
        ctx.fillStyle = ['#6ab0ff', '#34d399', '#a78bfa'][p % 3]
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
}

// ============================================================
// CANVAS BOX — bordas neon (mantido)
// ============================================================
function NeonBox({ children, cor = '#6ab0ff', corB = '#34d399', corC = '#a78bfa', corD = '#f472b6', className = '' }: { children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string; className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'rgba(4,10,22,0.97)', border: `1px solid ${cor}25`, boxShadow: `0 0 40px ${cor}06` }}>
      {[
        { pos: 'top-0 left-0', w: 'w-16 h-[2px]', bg: `linear-gradient(90deg,${cor},transparent)`, g: cor },
        { pos: 'top-0 left-0', w: 'w-[2px] h-16', bg: `linear-gradient(180deg,${cor},transparent)`, g: cor },
        { pos: 'top-0 right-0', w: 'w-16 h-[2px]', bg: `linear-gradient(270deg,${corB},transparent)`, g: corB },
        { pos: 'top-0 right-0', w: 'w-[2px] h-16', bg: `linear-gradient(180deg,${corB},transparent)`, g: corB },
        { pos: 'bottom-0 left-0', w: 'w-16 h-[2px]', bg: `linear-gradient(90deg,${corC},transparent)`, g: corC },
        { pos: 'bottom-0 left-0', w: 'w-[2px] h-16', bg: `linear-gradient(0deg,${corC},transparent)`, g: corC },
        { pos: 'bottom-0 right-0', w: 'w-16 h-[2px]', bg: `linear-gradient(270deg,${corD},transparent)`, g: corD },
        { pos: 'bottom-0 right-0', w: 'w-[2px] h-16', bg: `linear-gradient(0deg,${corD},transparent)`, g: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`}
          style={{ background: b.bg, boxShadow: `0 0 10px ${b.g}`, borderRadius: '999px' }} />
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// ============================================================
// HERO VIDEO SEQUENCE — 3 vídeos em sequência + módulos
// ============================================================
function HeroVideos({ modulos, legendas }: { modulos: string[]; legendas: string[] }) {
  const [current, setCurrent] = useState(0)
  const [audioOn, setAudioOn] = useState(false)
  const [showLogo, setShowLogo] = useState(false)
  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)]
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Toca o vídeo atual
    videoRefs.forEach((ref, i) => {
      if (ref.current) {
        if (i === current) ref.current.play().catch(() => {})
        else { ref.current.pause(); ref.current.currentTime = 0 }
      }
    })
    // Logo aparece no último vídeo
    setShowLogo(current === 2)
  }, [current])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioOn
      if (audioOn) audioRef.current.play().catch(() => {})
    }
  }, [audioOn])

  const handleVideoEnd = (idx: number) => {
    if (idx < 2) setCurrent(idx + 1)
    else { setCurrent(0); /* loop */ }
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* 3 vídeos sobrepostos */}
      {[0, 1, 2].map(i => (
        <video key={i} ref={videoRefs[i]} muted playsInline preload="auto"
          onEnded={() => handleVideoEnd(i)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: current === i ? 1 : 0, filter: 'brightness(1.1) contrast(1.05) saturate(1.15)' }}>
          <source src={`/videos/hero-${i + 1}.mp4`} type="video/mp4" />
        </video>
      ))}

      {/* Áudio narração */}
      <audio ref={audioRef} loop>
        <source src="/audio/narracao.mp3" type="audio/mpeg" />
      </audio>

      {/* OVERLAY 1 — Vinheta cinematográfica */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(2,8,16,0.6) 80%, rgba(2,8,16,0.95) 100%)' }} />

      {/* OVERLAY 2 — Camada azul de cor */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{ background: 'linear-gradient(135deg, rgba(59,111,212,0.15) 0%, transparent 50%, rgba(167,139,250,0.1) 100%)' }} />

      {/* OVERLAY 3 — Partículas flutuando */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              left: `${(i * 7.3) % 100}%`,
              top: `${(i * 11.7) % 100}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              background: ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24'][i % 4],
              boxShadow: `0 0 ${8 + i % 4}px ${['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24'][i % 4]}`,
              animation: `particle-float ${4 + i % 4}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.2}s`,
              opacity: 0.6,
            }} />
        ))}
      </div>

      {/* OVERLAY 4 — Módulos surgindo nas telas (durante vídeo 2) */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{ opacity: current === 1 ? 1 : 0 }}>
        {modulos.map((mod, i) => (
          <div key={i} className="absolute px-3 py-1.5 rounded-lg font-mono font-bold text-xs"
            style={{
              left: `${10 + (i % 4) * 22}%`,
              top: `${15 + Math.floor(i / 4) * 35}%`,
              background: 'rgba(4,10,22,0.85)',
              border: `1px solid ${['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24'][i % 4]}`,
              color: ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24'][i % 4],
              boxShadow: `0 0 20px ${['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24'][i % 4]}80`,
              animation: `module-appear 0.6s ease-out ${i * 0.1}s both`,
            }}>
            {mod}
          </div>
        ))}
      </div>

      {/* OVERLAY 5 — Logo Axioma se montando (durante vídeo 3) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000"
        style={{ opacity: showLogo ? 1 : 0 }}>
        <div className="relative">
          <div className="absolute inset-0 rounded-full"
            style={{
              width: 400, height: 400,
              transform: 'translate(-50%, -50%)',
              left: '50%', top: '50%',
              background: 'radial-gradient(circle, rgba(106,176,255,0.4) 0%, transparent 70%)',
              filter: 'blur(40px)',
              animation: 'logo-pulse 3s ease-in-out infinite',
            }} />
          <img src="/logo-aitech.png" alt="Axioma"
            style={{
              width: 220, height: 220, objectFit: 'contain',
              filter: 'drop-shadow(0 0 40px rgba(106,176,255,1)) drop-shadow(0 0 80px rgba(106,176,255,0.6))',
              animation: 'logo-assemble 2s ease-out, logo-rotate 20s linear infinite 2s',
            }} />
          <div className="absolute left-1/2 -translate-x-1/2 mt-4 text-center" style={{ top: 240 }}>
            <p className="font-black tracking-[0.4em] text-2xl"
              style={{
                background: 'linear-gradient(135deg, #ffffff, #6ab0ff, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(106,176,255,0.8)',
                animation: 'fade-in-up 1.5s ease-out 1s both',
              }}>AXIOMA</p>
            <p className="text-xs tracking-[0.5em] mt-1" style={{ color: '#6ab0ff', animation: 'fade-in-up 1.5s ease-out 1.5s both' }}>AI.TECH</p>
          </div>
        </div>
      </div>

      {/* OVERLAY 6 — Legenda sincronizada com narração */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-3xl w-full px-6 pointer-events-none">
        <p className="text-center text-sm md:text-lg font-light tracking-wide"
          style={{
            color: '#c8d8f0',
            textShadow: '0 2px 20px rgba(2,8,16,0.95), 0 0 30px rgba(106,176,255,0.4)',
            animation: 'fade-in-up 0.8s ease-out',
          }}
          key={current}>
          "{legendas[current]}"
        </p>
      </div>

      {/* Botão mute/unmute */}
      <button onClick={() => setAudioOn(!audioOn)}
        className="absolute top-24 right-6 z-20 w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all"
        style={{
          background: 'rgba(4,10,22,0.85)',
          border: '1px solid rgba(106,176,255,0.4)',
          boxShadow: '0 0 20px rgba(106,176,255,0.4)',
          backdropFilter: 'blur(10px)',
        }}>
        <span className="text-xl">{audioOn ? '🔊' : '🔇'}</span>
      </button>

      {/* Indicador de progresso dos vídeos */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1 rounded-full transition-all duration-500"
            style={{
              width: current === i ? 40 : 20,
              background: current === i ? '#6ab0ff' : 'rgba(106,176,255,0.3)',
              boxShadow: current === i ? '0 0 10px #6ab0ff' : 'none',
            }} />
        ))}
      </div>

      {/* Linhas de luz cinematográficas nas bordas */}
      <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #6ab0ff, transparent)', boxShadow: '0 0 20px #6ab0ff' }} />
      <div className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)', boxShadow: '0 0 20px #a78bfa' }} />
    </div>
  )
}

// ============================================================
// LANDING PAGE PRINCIPAL
// ============================================================
export default function LandingPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>('pt')
  const [pensandoIdx, setPensandoIdx] = useState(0)
  const [hoveredPais, setHoveredPais] = useState<number | null>(null)
  const t = idiomas[lang]

  useEffect(() => {
    const timer = setInterval(() => setPensandoIdx(i => (i + 1) % t.clowdbot.pensando.length), 2500)
    return () => clearInterval(timer)
  }, [lang, t.clowdbot.pensando.length])

  const btn = (label: string, onClick: () => void, primary = true, full = false) => (
    <button onClick={onClick}
      className={`${full ? 'w-full' : ''} relative px-6 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95 overflow-hidden group`}
      style={primary
        ? { background: 'linear-gradient(135deg,#1a3a8f,#2a5fd4,#6366f1)', color: '#fff', boxShadow: '0 4px 30px rgba(42,95,212,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' }
        : { background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}>
      <span className="relative z-10">{label}</span>
      {primary && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
      )}
    </button>
  )

  return (
    <div style={{ background: '#020810', minHeight: '100vh', overflowX: 'hidden' }}>
      <MatrixBg />

      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-10 py-3"
        style={{ background: 'rgba(2,8,16,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(106,176,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo-aitech.png" alt="Axioma" style={{ width: 36, height: 36, filter: 'drop-shadow(0 0 15px rgba(106,176,255,0.8))' }} />
          <div>
            <p className="font-black tracking-[0.3em] text-sm" style={{ background: 'linear-gradient(135deg,#c8d8f0,#6ab0ff,#fff,#3b6fd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AXIOMA</p>
            <p className="text-xs tracking-[0.3em]" style={{ color: '#3a5a8a' }}>AI.TECH</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['pt', 'en', 'es'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className="text-xs px-2 py-1 rounded-full font-bold transition-all"
              style={{ background: lang === l ? 'rgba(59,111,212,0.3)' : 'transparent', color: lang === l ? '#6ab0ff' : '#3a5a8a', border: '1px solid rgba(59,111,212,0.2)' }}>
              {l === 'pt' ? '🇧🇷' : l === 'en' ? '🇺🇸' : '🇪🇸'}
            </button>
          ))}
          <button onClick={() => router.push('/login')}
            className="hidden md:block px-4 py-2 rounded-xl font-bold text-xs tracking-widest uppercase hover:scale-105"
            style={{ background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}>{t.login}</button>
          <button onClick={() => router.push('/cadastro')}
            className="px-4 py-2 rounded-xl font-bold text-xs tracking-widest uppercase hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#1a3a8f,#2a5fd4)', color: '#fff' }}>{t.comecar}</button>
        </div>
      </nav>

      {/* ============ SEÇÃO 1 — HERO COM VÍDEOS ÉPICOS ============ */}
      <section className="relative h-screen min-h-[700px] flex flex-col items-center justify-end overflow-hidden">
        <HeroVideos
          modulos={t.hero.modulos}
          legendas={[t.hero.legenda1, t.hero.legenda2, t.hero.legenda3]} />

        {/* Conteúdo flutuante na parte inferior */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pb-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: 'rgba(2,8,16,0.7)', border: '1px solid rgba(106,176,255,0.3)', backdropFilter: 'blur(10px)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399' }} />
            <span className="text-xs font-black tracking-widest" style={{ color: '#6ab0ff' }}>🧠 INTELIGÊNCIA FINANCEIRA COM IA</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-black mb-3 leading-tight"
            style={{
              background: 'linear-gradient(135deg,#ffffff 0%,#c8d8f0 30%,#6ab0ff 60%,#a78bfa 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(106,176,255,0.5)',
            }}>
            {t.hero.titulo}
          </h1>
          <p className="text-sm md:text-base mb-6 max-w-2xl mx-auto" style={{ color: '#c8d8f0', textShadow: '0 2px 10px rgba(2,8,16,0.9)' }}>
            {t.hero.sub}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {btn(t.comecarGratis, () => router.push('/cadastro'))}
            {btn(t.nav.planos, () => router.push('/planos'), false)}
          </div>
          <p className="text-xs mt-3" style={{ color: '#8aaad4', textShadow: '0 2px 6px rgba(2,8,16,0.8)' }}>{t.semCartao}</p>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, transparent, #6ab0ff)' }} />
        </div>
      </section>

      {/* ============ SEÇÃO 2 — EINSTEIN ÉPICO ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at center, rgba(10,22,40,0.95), rgba(2,8,16,1))' }}>
        {/* Raios de fundo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 30% 50%, rgba(106,176,255,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(167,139,250,0.08) 0%, transparent 50%)'
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: 'rgba(106,176,255,0.1)', border: '1px solid rgba(106,176,255,0.4)', boxShadow: '0 0 30px rgba(106,176,255,0.2)' }}>
                <span className="text-xs font-black tracking-widest" style={{ color: '#6ab0ff' }}>{t.einstein.badge}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-2 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.einstein.titulo}
              </h2>
              <h3 className="text-xl md:text-3xl font-bold mb-6 leading-tight"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.einstein.subTitulo}
              </h3>
              <div className="px-5 py-4 rounded-xl mb-6"
                style={{ background: 'rgba(106,176,255,0.06)', borderLeft: '3px solid #6ab0ff' }}>
                <p className="text-sm italic" style={{ color: '#c8d8f0', lineHeight: 1.7 }}>{t.einstein.copy}</p>
              </div>
              <p className="text-sm md:text-base mb-6" style={{ color: '#8aaad4', lineHeight: 1.9 }}>{t.einstein.texto}</p>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>
            <div className="relative" style={{ height: 500 }}>
              <EinsteinAvatar formulas={t.einstein.formulas} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 3 — PLATÃO + TETRAEDRO ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1" style={{ height: 500 }}>
              <TetraedroPlatao />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.4)', boxShadow: '0 0 30px rgba(167,139,250,0.2)' }}>
                <span className="text-xs font-black tracking-widest" style={{ color: '#a78bfa' }}>{t.platao.badge}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#a78bfa,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.platao.titulo}
              </h2>
              <div className="px-5 py-4 rounded-xl mb-6"
                style={{ background: 'rgba(167,139,250,0.06)', borderLeft: '3px solid #a78bfa' }}>
                <p className="text-sm italic" style={{ color: '#c8d8f0', lineHeight: 1.7 }}>{t.platao.copy}</p>
              </div>
              <p className="text-sm md:text-base mb-6" style={{ color: '#8aaad4', lineHeight: 1.9 }}>{t.platao.texto}</p>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 4 — DOMÍNIO GLOBAL COM VÍDEO ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.8),rgba(2,8,16,1))' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1" style={{ height: 450 }}>
              {/* Vídeo do globo com overlay */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 0 60px rgba(52,211,153,0.3), inset 0 0 0 1px rgba(52,211,153,0.2)' }}>
                <video autoPlay loop muted playsInline
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(1.1) saturate(1.2)' }}>
                  <source src="/videos/globo.mp4" type="video/mp4" />
                </video>
                {/* Overlay azul */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, transparent 40%, rgba(2,8,16,0.6) 100%)' }} />

                {/* Bandeiras orbitando */}
                {t.global.paises.map((p, i) => {
                  const angle = (i / t.global.paises.length) * 360
                  const isHovered = hoveredPais === i
                  return (
                    <div key={i}
                      onMouseEnter={() => setHoveredPais(i)}
                      onMouseLeave={() => setHoveredPais(null)}
                      className="absolute left-1/2 top-1/2 cursor-pointer transition-all duration-500"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-160px) rotate(-${angle}deg) scale(${isHovered ? 1.4 : 1})`,
                        animation: 'orbit-rotate 30s linear infinite',
                      }}>
                      <div className="relative flex flex-col items-center">
                        <div className="text-3xl"
                          style={{
                            filter: `drop-shadow(0 0 ${isHovered ? 20 : 10}px ${p.cor})`,
                            transition: 'all 0.3s',
                          }}>
                          {p.f}
                        </div>
                        {isHovered && (
                          <div className="absolute -bottom-8 px-2 py-1 rounded-md whitespace-nowrap"
                            style={{
                              background: 'rgba(4,10,22,0.95)',
                              border: `1px solid ${p.cor}`,
                              boxShadow: `0 0 15px ${p.cor}`,
                              animation: 'fade-in-up 0.3s ease-out',
                            }}>
                            <span className="text-xs font-bold" style={{ color: p.cor }}>{p.n}</span>
                          </div>
                        )}
                        {/* Linha de conexão para o centro */}
                        <div className="absolute top-1/2 left-1/2 origin-left pointer-events-none"
                          style={{
                            width: 160,
                            height: 1,
                            background: `linear-gradient(90deg, transparent, ${p.cor}40, ${p.cor}60)`,
                            transform: `translateX(0) rotate(${180 - angle}deg)`,
                            transformOrigin: '0 50%',
                            opacity: isHovered ? 1 : 0.3,
                          }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                <span className="text-xs font-black tracking-widest" style={{ color: '#34d399' }}>{t.global.badge}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#34d399,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.global.titulo}
              </h2>
              <p className="text-sm md:text-base mb-6" style={{ color: '#5a8ab4', lineHeight: 1.8 }}>{t.global.sub}</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {t.global.paises.map((p, i) => (
                  <div key={i}
                    onMouseEnter={() => setHoveredPais(i)}
                    onMouseLeave={() => setHoveredPais(null)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:scale-105"
                    style={{
                      background: hoveredPais === i ? `${p.cor}20` : 'rgba(52,211,153,0.06)',
                      border: `1px solid ${hoveredPais === i ? p.cor : `${p.cor}30`}`,
                      color: p.cor,
                      boxShadow: hoveredPais === i ? `0 0 20px ${p.cor}60` : 'none',
                    }}>
                    {p.f} {p.n}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 rounded-xl mb-6" style={{ background: 'rgba(106,176,255,0.06)', border: '1px solid rgba(106,176,255,0.2)' }}>
                <p className="text-xs italic" style={{ color: '#6ab0ff' }}>💡 {t.global.copy}</p>
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 5 — VISÃO CIRÚRGICA ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
                <span className="text-xs font-black tracking-widest" style={{ color: '#a78bfa' }}>{t.visao.badge}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#a78bfa,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.visao.titulo}
              </h2>
              <p className="text-sm md:text-base mb-6" style={{ color: '#5a8ab4', lineHeight: 1.8 }}>{t.visao.sub}</p>
              <div className="space-y-3 mb-6">
                {t.visao.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:scale-[1.02] transition-transform"
                    style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                    <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>{item}</span>
                  </div>
                ))}
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>
            {/* Olho minimalista CSS */}
            <div className="relative flex items-center justify-center" style={{ height: 400 }}>
              <div className="relative w-80 h-80 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(167,139,250,0.2), transparent 70%)',
                  animation: 'eye-glow 3s ease-in-out infinite alternate',
                }}>
                {[200, 240, 280].map((s, i) => (
                  <div key={i} className="absolute rounded-full border"
                    style={{
                      width: s, height: s * 0.6,
                      borderColor: ['#a78bfa', '#6ab0ff', '#34d399'][i],
                      borderWidth: 1,
                      boxShadow: `0 0 20px ${['#a78bfa', '#6ab0ff', '#34d399'][i]}40`,
                      animation: `eye-ring ${2 + i * 0.5}s ease-in-out infinite`,
                    }} />
                ))}
                <div className="absolute w-24 h-24 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #6ab0ff 0%, #020810 70%)',
                    boxShadow: '0 0 40px #6ab0ff, inset 0 0 20px rgba(106,176,255,0.8)',
                  }} />
                <div className="absolute w-8 h-8 rounded-full bg-white"
                  style={{ boxShadow: '0 0 20px rgba(255,255,255,0.8)', animation: 'pupil-blink 4s ease-in-out infinite' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 6 — MENTE ONISCIENTE ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.9),rgba(2,8,16,1))' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Palavras flutuando */}
            <div className="relative order-2 md:order-1" style={{ height: 450 }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-8xl" style={{ filter: 'drop-shadow(0 0 40px rgba(106,176,255,0.8))', animation: 'brain-pulse 3s ease-in-out infinite' }}>🧠</div>
              </div>
              {t.mente.palavras.map((p, i) => {
                const angle = (i / t.mente.palavras.length) * 360
                const r = 160
                const x = Math.cos((angle * Math.PI) / 180) * r
                const y = Math.sin((angle * Math.PI) / 180) * r * 0.7
                const cor = ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'][i % 5]
                return (
                  <div key={i} className="absolute font-mono font-bold text-xs"
                    style={{
                      left: '50%', top: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      color: cor,
                      textShadow: `0 0 15px ${cor}`,
                      animation: `word-float ${3 + (i % 3)}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.15}s`,
                    }}>
                    {p}
                  </div>
                )
              })}
              {/* Linhas conectando */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="-200 -200 400 400">
                {t.mente.palavras.map((_, i) => {
                  const angle = (i / t.mente.palavras.length) * 360
                  const r = 160
                  const x = Math.cos((angle * Math.PI) / 180) * r
                  const y = Math.sin((angle * Math.PI) / 180) * r * 0.7
                  return (
                    <line key={i} x1="0" y1="0" x2={x} y2={y}
                      stroke={['#6ab0ff', '#34d399', '#a78bfa'][i % 3]}
                      strokeWidth="0.5" opacity="0.3" strokeDasharray="2 4" />
                  )
                })}
              </svg>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(106,176,255,0.1)', border: '1px solid rgba(106,176,255,0.3)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6ab0ff' }} />
                <span className="text-xs font-black tracking-widest" style={{ color: '#6ab0ff' }}>{t.mente.badge}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.mente.titulo}
              </h2>
              <p className="text-sm md:text-base mb-6" style={{ color: '#5a8ab4', lineHeight: 1.8 }}>{t.mente.sub}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {t.mente.palavras.map((p, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg text-xs font-bold hover:scale-110 transition-transform cursor-default"
                    style={{ background: `${['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'][i % 5]}15`, color: ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'][i % 5], border: `1px solid ${['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'][i % 5]}30` }}>
                    {p}
                  </span>
                ))}
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 7 — SEGURANÇA ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <span className="text-xs font-black tracking-widest" style={{ color: '#34d399' }}>{t.seguranca.badge}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4"
              style={{ background: 'linear-gradient(135deg,#fff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.seguranca.titulo}
            </h2>
            <p className="text-sm md:text-lg max-w-2xl mx-auto" style={{ color: '#5a8ab4' }}>{t.seguranca.sub}</p>
          </div>
          <div className="relative mx-auto mb-12" style={{ height: 200, maxWidth: 400 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="text-8xl" style={{ filter: 'drop-shadow(0 0 30px rgba(106,176,255,0.6))' }}>🖥️</div>
                {[80, 100, 120].map((size, i) => (
                  <div key={i} className="absolute top-1/2 left-1/2 rounded-full border"
                    style={{
                      width: size, height: size,
                      transform: 'translate(-50%, -50%)',
                      borderColor: `rgba(52,211,153,${0.4 - i * 0.1})`,
                      animation: `pulse-ring ${1 + i * 0.3}s ease-in-out infinite alternate`,
                      boxShadow: `0 0 ${10 + i * 5}px rgba(52,211,153,0.3)`,
                    }} />
                ))}
                <div className="absolute -top-4 -right-4 text-3xl animate-bounce">🔒</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.seguranca.items.map((item, i) => (
              <NeonBox key={i} cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
                <div className="p-5 text-center hover:scale-105 transition-transform">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-black text-sm mb-2" style={{ color: '#34d399' }}>{item.titulo}</h3>
                  <p className="text-xs" style={{ color: '#3a6090', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </NeonBox>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 8 — EXÉRCITO DE IA ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <span className="text-xs font-black tracking-widest" style={{ color: '#fbbf24' }}>{t.robots.badge}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#fbbf24,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.robots.titulo}
              </h2>
              <p className="text-sm md:text-base mb-6" style={{ color: '#5a8ab4', lineHeight: 1.8 }}>{t.robots.sub}</p>
              <div className="space-y-3 mb-6">
                {t.robots.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:scale-[1.02] transition-transform"
                    style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                    <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>{item}</span>
                  </div>
                ))}
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>
            <div className="relative flex items-center justify-center" style={{ height: 350 }}>
              <div className="flex gap-2 items-end">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1"
                    style={{ animation: `float-robot ${1.5 + i * 0.3}s ease-in-out infinite alternate`, animationDelay: `${i * 0.2}s` }}>
                    <div className="text-5xl md:text-6xl"
                      style={{ filter: `drop-shadow(0 0 ${15 + i * 5}px rgba(106,176,255,${0.6 + i * 0.1}))` }}>🤖</div>
                    <div className="text-xs font-mono" style={{ color: '#6ab0ff', opacity: 0.7 }}>IA.{i + 1}</div>
                    <div className="w-10 h-7 rounded flex items-center justify-center"
                      style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(106,176,255,0.3)' }}>
                      <div className="w-6 h-4 rounded" style={{ background: 'rgba(52,211,153,0.3)' }}>
                        <div className="w-full h-0.5 rounded mt-0.5" style={{ background: '#34d399', animation: 'scan-line 1s linear infinite' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 9 — MÓDULOS ============ */}
      <section className="relative py-20 md:py-32"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.9),rgba(2,8,16,1))' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ color: '#c8d8f0' }}>{t.modulos.titulo}</h2>
            <p className="text-sm md:text-lg" style={{ color: '#3a6090' }}>{t.modulos.sub}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {t.modulos.lista.map((m, i) => (
              <NeonBox key={i} cor={['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#f97316'][i % 6]}
                corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
                <div className="p-3 text-center hover:scale-110 transition-all cursor-pointer">
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <p className="font-bold text-xs mb-0.5" style={{ color: '#c8d8f0' }}>{m.nome}</p>
                  <p className="text-xs" style={{ color: '#3a6090', fontSize: 10 }}>{m.desc}</p>
                </div>
              </NeonBox>
            ))}
          </div>
          <div className="text-center mt-8">
            {btn(t.comecarGratis, () => router.push('/cadastro'))}
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 10 — CLOWDBOT ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative order-2 md:order-1" style={{ height: 400 }}>
              <ClowdbotCanvas />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(4,10,22,0.9)', border: '1px solid rgba(52,211,153,0.4)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                <span className="text-xs font-bold" style={{ color: '#34d399' }}>{t.clowdbot.status}</span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(106,176,255,0.1)', border: '1px solid rgba(106,176,255,0.3)' }}>
                <span className="text-xs font-black tracking-widest" style={{ color: '#6ab0ff' }}>{t.clowdbot.badge}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.clowdbot.titulo}
              </h2>
              <p className="text-sm md:text-base mb-6" style={{ color: '#5a8ab4', lineHeight: 1.8 }}>{t.clowdbot.sub}</p>
              <div className="px-4 py-4 rounded-xl mb-6"
                style={{ background: 'rgba(4,10,22,0.9)', border: '1px solid rgba(106,176,255,0.2)', fontFamily: 'monospace' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f87171' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fbbf24' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#34d399' }} />
                  <span className="text-xs ml-2" style={{ color: '#3a5a8a' }}>ClowdBot Terminal</span>
                </div>
                <p className="text-xs" style={{ color: '#3a5a8a' }}>{'>'} AXIOMA AI.TECH v2.0</p>
                <p className="text-xs mt-1" style={{ color: '#34d399' }}>
                  {'>'} {t.clowdbot.pensando[pensandoIdx]}
                  <span className="animate-pulse">█</span>
                </p>
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 11 — PLANOS 4 NÍVEIS ============ */}
      <section className="relative py-20 md:py-32"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.95),rgba(2,8,16,1))' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-3"
              style={{ background: 'linear-gradient(135deg,#fff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.planos.titulo}
            </h2>
            <p className="text-sm" style={{ color: '#3a6090' }}>{t.planos.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.planos.lista.map((p: any, i) => (
              <NeonBox key={i} cor={p.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6"
                className={p.destaque ? 'md:scale-105' : ''}>
                <div className="p-5 flex flex-col relative h-full">
                  {p.destaque && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#ca8a04,#ea580c)', color: '#fff', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }}>
                      {t.planos.popular}
                    </div>
                  )}
                  <h3 className="text-2xl font-black mb-1 text-center" style={{ color: p.cor }}>{p.nome}</h3>
                  <p className="text-xs text-center mb-3" style={{ color: '#3a6090' }}>{p.desc}</p>
                  <div className="flex items-end justify-center gap-1 mb-1">
                    <span className="text-4xl font-black" style={{ color: '#c8d8f0' }}>R$ {p.preco}</span>
                    <span className="text-sm mb-1" style={{ color: '#3a6090' }}>{t.planos.mes}</span>
                  </div>
                  <p className="text-xs text-center mb-3" style={{ color: '#3a5a8a' }}>{p.usuarios}</p>
                  <div className="flex justify-center mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                      ✨ {t.planos.trial}
                    </span>
                  </div>
                  {p.ia && (
                    <div className="flex justify-center mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>⭐ IA Premium</span>
                    </div>
                  )}
                  <div className="space-y-2 mb-5 flex-1">
                    {p.features.map((f: string, j: number) => (
                      <div key={j} className="flex items-start gap-2 text-xs" style={{ color: '#8aaad4' }}>
                        <span style={{ color: p.cor }}>✓</span> <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {btn(t.comecar, () => router.push('/cadastro'), true, true)}
                </div>
              </NeonBox>
            ))}
          </div>
          <p className="text-center text-xs mt-8" style={{ color: '#1a3a5a' }}>{t.semCartao}</p>
        </div>
      </section>

      {/* ============ SEÇÃO 12 — CTA FINAL ÉPICO ============ */}
      <section className="relative py-24 md:py-40 overflow-hidden text-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, rgba(59,111,212,0.2) 0%, transparent 60%)',
            animation: 'pulse-aura 4s ease-in-out infinite alternate',
          }} />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(2,8,16,0.7),rgba(2,8,16,0.5),rgba(2,8,16,0.95))' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="text-7xl mb-6" style={{ filter: 'drop-shadow(0 0 30px rgba(106,176,255,0.8))', animation: 'rocket-pulse 3s ease-in-out infinite alternate' }}>🚀</div>
          <h2 className="text-3xl md:text-6xl font-black mb-4"
            style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 40px rgba(106,176,255,0.4)' }}>
            {t.cta.titulo}
          </h2>
          <p className="text-sm md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: '#8aaad4', lineHeight: 1.8 }}>{t.cta.sub}</p>
          <button onClick={() => router.push('/cadastro')}
            className="relative px-10 md:px-20 py-5 md:py-7 rounded-2xl font-black text-sm md:text-xl tracking-widest uppercase hover:scale-105 transition-all overflow-hidden group"
            style={{ background: 'linear-gradient(135deg,#1a3a8f,#2a5fd4,#a78bfa)', color: '#fff', boxShadow: '0 8px 60px rgba(42,95,212,0.6), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <span className="relative z-10">{t.cta.btn}</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
          </button>
          <p className="text-sm mt-4" style={{ color: '#3a5a8a' }}>{t.cta.sub2}</p>
          <p className="text-xs mt-2" style={{ color: '#1a3a5a' }}>{t.semCartao}</p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="text-center py-8 px-4"
        style={{ borderTop: '1px solid rgba(59,111,212,0.1)', background: '#020810' }}>
        <div className="flex justify-center gap-4 mb-4 text-xs" style={{ color: '#3a5a8a' }}>
          <button onClick={() => router.push('/privacidade')} className="hover:text-blue-400 transition-colors">
            {lang === 'pt' ? 'Privacidade' : lang === 'en' ? 'Privacy' : 'Privacidad'}
          </button>
          <span>·</span>
          <button onClick={() => router.push('/termos')} className="hover:text-blue-400 transition-colors">
            {lang === 'pt' ? 'Termos' : lang === 'en' ? 'Terms' : 'Términos'}
          </button>
          <span>·</span>
          <button onClick={() => router.push('/login')} className="hover:text-blue-400 transition-colors">{t.login}</button>
        </div>
        <p className="text-xs" style={{ color: '#1a3a5a' }}>{t.footer}</p>
      </footer>

      <style jsx global>{`
        @keyframes float-robot { from { transform: translateY(0px); } to { transform: translateY(-12px); } }
        @keyframes pulse-ring { from { opacity: 0.3; transform: translate(-50%, -50%) scale(0.95); } to { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); } }
        @keyframes scan-line { from { transform: translateY(0); } to { transform: translateY(16px); } }
        @keyframes particle-float { from { transform: translateY(0) translateX(0); opacity: 0.3; } to { transform: translateY(-30px) translateX(15px); opacity: 0.8; } }
        @keyframes module-appear { from { opacity: 0; transform: scale(0.5) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes logo-assemble { from { opacity: 0; transform: scale(0.3) rotate(-180deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes logo-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes logo-pulse { 0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-aura { from { opacity: 0.5; transform: scale(1); } to { opacity: 0.9; transform: scale(1.08); } }
        @keyframes orbit-rotate { from { transform: translate(-50%, -50%) rotate(0deg) translateY(-160px) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg) translateY(-160px) rotate(-360deg); } }
        @keyframes eye-glow { from { opacity: 0.6; transform: scale(0.95); } to { opacity: 1; transform: scale(1.05); } }
        @keyframes eye-ring { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes pupil-blink { 0%, 95%, 100% { transform: scaleY(1); } 97% { transform: scaleY(0.1); } }
        @keyframes brain-pulse { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 40px rgba(106,176,255,0.8)); } 50% { transform: scale(1.1); filter: drop-shadow(0 0 60px rgba(106,176,255,1)); } }
        @keyframes word-float { from { transform: translate(calc(-50% + 0px), calc(-50% + 0px)) scale(1); } to { transform: translate(calc(-50% + 10px), calc(-50% - 10px)) scale(1.1); } }
        @keyframes rocket-pulse { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.05) translateY(-5px); } }
      `}</style>
    </div>
  )
}