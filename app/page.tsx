'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================
// TRADUÇÕES COMPLETAS PT / EN / ES
// ============================================================
const idiomas = {
  pt: {
    login: 'Login', comecar: 'Começar Agora', comecarGratis: 'Começar Trial 14 Dias',
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
      sub: 'Do caos das planilhas à clareza dos dashboards. Nossa IA lê seus dados como um cirurgião lê um raio-X — com precisão de milésimos.',
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
      btn: 'Começar 14 Dias Grátis',
      sub2: 'Junte-se a empresas que já descobriram o poder da Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Inteligência Financeira para PMEs',
  },
  en: {
    login: 'Login', comecar: 'Start Now', comecarGratis: 'Start 14-Day Trial',
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
      sub: 'From spreadsheet chaos to dashboard clarity. Our AI reads your data like a surgeon reads an X-ray — with millisecond precision.',
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
      btn: 'Start 14 Days Free',
      sub2: 'Join companies that have discovered the power of Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Financial Intelligence for SMEs',
  },
  es: {
    login: 'Iniciar Sesión', comecar: 'Empezar Ahora', comecarGratis: 'Empezar Prueba 14 Días',
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
      sub: 'Del caos de las planillas a la claridad de los dashboards. Nuestra IA lee tus datos como un cirujano lee una radiografía — con precisión de milésimas.',
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
      btn: 'Empezar 14 Días Gratis',
      sub2: 'Únete a empresas que descubrieron el poder de Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Inteligencia Financiera para PYMEs',
  },
}

// ============================================================
// HOOK — Reveal ao rolar (IntersectionObserver, leve)
// ============================================================
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(34px)',
        transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
        willChange: 'opacity, transform',
      }}>
      {children}
    </div>
  )
}

// ============================================================
// BG WORDS — efeito suave de fundo (Axioma + módulos bem leves)
// ============================================================
const BG_PALAVRAS = ['AXIOMA', 'RECEITAS', 'DRE', 'FLUXO DE CAIXA', 'IA TRIBUTÁRIA', 'MEI', 'LUCRO', 'CUSTOS', 'METAS', 'OPEN FINANCE', 'INVESTIMENTOS', 'AXIOMA']
function BgWords() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden="true">
      {BG_PALAVRAS.map((w, i) => (
        <span key={i} className="ax-display absolute font-black whitespace-nowrap"
          style={{
            left: `${(i * 26) % 88}%`,
            top: `${(i * 41) % 82}%`,
            fontSize: i % 3 === 0 ? 72 : 44,
            color: '#9fd0ff',
            opacity: 0.06,
            letterSpacing: '0.05em',
            transform: `rotate(${(i % 2 ? -1 : 1) * 5}deg)`,
            animation: `bgword-drift ${20 + (i % 5) * 4}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.8}s`,
          }}>{w}</span>
      ))}
    </div>
  )
}

// ============================================================
// MATRIX BACKGROUND — fundo de caracteres caindo (sutil)
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
      ctx.fillStyle = 'rgba(2,8,16,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drops.forEach((y, i) => {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
        ctx.font = `${fontSize}px monospace`
        ctx.globalAlpha = Math.random() * 0.35 + 0.04
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
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.1 }} />
}

// ============================================================
// VIDEO FRAME — painel de vídeo premium (16:9, lazy-load)
// ============================================================
function VideoFrame({ src, cor = '#6ab0ff', className = '', children }: { src: string; cor?: string; className?: string; children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setMounted(true)
        videoRef.current?.play().catch(() => {})
      } else {
        videoRef.current?.pause()
      }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={containerRef} className={`ax-video-frame relative w-full rounded-[20px] overflow-hidden ${className}`}
      style={{
        aspectRatio: '16 / 9',
        border: `1px solid ${cor}40`,
        background: 'radial-gradient(ellipse at center, #06121f, #020810)',
        boxShadow: `0 30px 80px -30px ${cor}66, 0 0 0 1px rgba(255,255,255,0.04) inset`,
      }}>
      {mounted && (
        <video ref={videoRef} autoPlay loop muted playsInline preload="auto"
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          className="absolute inset-0 w-full h-full object-contain ax-fade-video"
          style={{ filter: 'brightness(1.05) contrast(1.06) saturate(1.14)' }}>
          <source src={src} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(2,8,16,0.4) 100%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cor}, transparent)`, boxShadow: `0 0 16px ${cor}` }} />
      {children}
    </div>
  )
}

// ============================================================
// BADGE — eyebrow premium reutilizável
// ============================================================
function Badge({ children, cor }: { children: React.ReactNode; cor: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
      style={{ background: `${cor}14`, border: `1px solid ${cor}66`, boxShadow: `0 0 30px ${cor}22` }}>
      <span className="ax-eyebrow text-xs font-black tracking-[0.25em]" style={{ color: cor }}>{children}</span>
    </div>
  )
}

// ============================================================
// CANVAS BOX — bordas neon
// ============================================================
function NeonBox({ children, cor = '#6ab0ff', corB = '#34d399', corC = '#a78bfa', corD = '#f472b6', className = '' }: { children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string; className?: string }) {
  return (
    <div className={`ax-tilt relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'rgba(4,10,22,0.97)', border: `1px solid ${cor}30`, boxShadow: `0 0 40px ${cor}08` }}>
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
// HERO VIDEO SEQUENCE — 5 vídeos (sem áudio, vídeo inteiro)
// ============================================================
function HeroVideos() {
  const TOTAL = 5
  const [current, setCurrent] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    videoRefs.current.forEach((ref, i) => {
      if (!ref) return
      if (i === current) ref.play().catch(() => {})
      else { ref.pause(); ref.currentTime = 0 }
    })
  }, [current])

  const handleVideoEnd = (idx: number) => setCurrent(idx < TOTAL - 1 ? idx + 1 : 0)

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ background: '#020810' }}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <video key={i} ref={(el) => { videoRefs.current[i] = el }} muted playsInline
          preload={i === current || i === (current + 1) % TOTAL ? 'auto' : 'none'}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          onEnded={() => handleVideoEnd(i)}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-1000"
          style={{ opacity: current === i ? 1 : 0, filter: 'brightness(1.05) contrast(1.04) saturate(1.12)' }}>
          <source src={`/videos/hero-${i + 1}.mp4`} type="video/mp4" />
        </video>
      ))}

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(2,8,16,0.35) 85%, rgba(2,8,16,0.7) 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(2,8,16,0.85), transparent)' }} />

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className="h-1 rounded-full transition-all duration-500"
            style={{ width: current === i ? 44 : 18, background: current === i ? '#00E5FF' : 'rgba(0,229,255,0.3)', boxShadow: current === i ? '0 0 12px #00E5FF' : 'none' }} />
        ))}
      </div>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)', boxShadow: '0 0 20px #00E5FF' }} />
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
        ? { background: 'linear-gradient(135deg,#1a3a8f,#2a5fd4,#6366f1)', color: '#fff', boxShadow: '0 4px 30px rgba(42,95,212,0.55), inset 0 1px 0 rgba(255,255,255,0.15)' }
        : { background: 'transparent', color: '#9fc4ff', border: '1px solid rgba(106,176,255,0.4)' }}>
      <span className="relative z-10">{label}</span>
      {primary && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
      )}
    </button>
  )

  // Paleta de texto — mais forte e legível
  const cBody = '#cfe0fa'
  const cMuted = '#9ab6e2'
  const cGold = '#F5D27A'

  return (
    <div className="ax-root" style={{ background: '#020810', minHeight: '100vh', overflowX: 'hidden' }}>
      <MatrixBg />

      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-10 py-3"
        style={{ background: 'rgba(2,8,16,0.82)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(106,176,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo-aitech.png" alt="Axioma" style={{ width: 36, height: 36, filter: 'drop-shadow(0 0 15px rgba(106,176,255,0.8))' }} />
          <div>
            <p className="ax-display font-black tracking-[0.3em] text-sm" style={{ background: 'linear-gradient(135deg,#e8f1ff,#6ab0ff,#fff,#3b6fd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AXIOMA</p>
            <p className="text-[10px] tracking-[0.3em]" style={{ color: '#6a8bbd' }}>AI.TECH</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['pt', 'en', 'es'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className="text-xs px-2 py-1 rounded-full font-bold transition-all"
              style={{ background: lang === l ? 'rgba(59,111,212,0.3)' : 'transparent', color: lang === l ? '#6ab0ff' : '#6a8bbd', border: '1px solid rgba(59,111,212,0.2)' }}>
              {l === 'pt' ? '🇧🇷' : l === 'en' ? '🇺🇸' : '🇪🇸'}
            </button>
          ))}
          <button onClick={() => router.push('/login')}
            className="hidden md:block px-4 py-2 rounded-xl font-bold text-xs tracking-widest uppercase hover:scale-105"
            style={{ background: 'transparent', color: '#9fc4ff', border: '1px solid rgba(106,176,255,0.3)' }}>{t.login}</button>
          <button onClick={() => router.push('/cadastro')}
            className="px-4 py-2 rounded-xl font-bold text-xs tracking-widest uppercase hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#1a3a8f,#2a5fd4)', color: '#fff' }}>{t.comecar}</button>
        </div>
      </nav>

      {/* ============ SEÇÃO 1 — HERO (5 vídeos, inteiros) ============ */}
      <section className="relative h-screen min-h-[680px] flex flex-col items-center justify-end overflow-hidden">
        <HeroVideos />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-24 md:pb-20">
          <div className="max-w-md text-left">
            <p className="ax-display ax-neon text-xl md:text-3xl font-black mb-5 leading-[1.18]">
              O Futuro Financeiro do Brasil Pensa Sozinho.
            </p>
            <div className="flex">
              {btn(t.comecarGratis, () => router.push('/cadastro'))}
            </div>
            <p className="text-[10px] md:text-xs mt-3 font-medium" style={{ color: '#bcd6f8', textShadow: '0 2px 8px rgba(2,8,16,0.9)' }}>{t.semCartao}</p>
          </div>
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, transparent, #00E5FF)' }} />
        </div>
      </section>

      {/* ============ SEÇÃO 2 — EINSTEIN (vídeo 70 / texto 30) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at center, rgba(10,22,40,0.95), rgba(2,8,16,1))' }}>
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-10 items-center">
            <Reveal>
              <Badge cor="#6ab0ff">{t.einstein.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-2 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.einstein.titulo}
              </h2>
              <h3 className="ax-display text-lg md:text-2xl font-bold mb-5 leading-tight"
                style={{ background: `linear-gradient(135deg,${cGold},#fbbf24)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.einstein.subTitulo}
              </h3>
              <div className="px-4 py-3 rounded-xl mb-5" style={{ background: 'rgba(106,176,255,0.07)', borderLeft: '3px solid #6ab0ff' }}>
                <p className="text-xs md:text-sm italic font-medium" style={{ color: '#dceafc', lineHeight: 1.6 }}>{t.einstein.copy}</p>
              </div>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.8 }}>{t.einstein.texto}</p>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
            <Reveal delay={0.12}>
              <VideoFrame src="/videos/einstein.mp4" cor="#6ab0ff" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 3 — PLATÃO / NÚCLEO (vídeo 70 / texto 30) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10 items-center">
            <Reveal>
              <VideoFrame src="/videos/nucleo.mp4" cor="#a78bfa" />
            </Reveal>
            <Reveal delay={0.12}>
              <Badge cor="#a78bfa">{t.platao.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-5 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#a78bfa,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.platao.titulo}
              </h2>
              <div className="px-4 py-3 rounded-xl mb-5" style={{ background: 'rgba(167,139,250,0.07)', borderLeft: '3px solid #a78bfa' }}>
                <p className="text-xs md:text-sm italic font-medium" style={{ color: '#e6dcfc', lineHeight: 1.6 }}>{t.platao.copy}</p>
              </div>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.8 }}>{t.platao.texto}</p>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 4 — DOMÍNIO GLOBAL (vídeo 70 / texto 30) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.8),rgba(2,8,16,1))' }}>
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10 items-center">
            <Reveal>
              <VideoFrame src="/videos/globo.mp4" cor="#34d399" />
            </Reveal>
            <Reveal delay={0.12}>
              <Badge cor="#34d399">{t.global.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#34d399,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.global.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.global.sub}</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {t.global.paises.map((p, i) => (
                  <div key={i}
                    onMouseEnter={() => setHoveredPais(i)}
                    onMouseLeave={() => setHoveredPais(null)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:scale-105"
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
              <div className="px-4 py-3 rounded-xl mb-5" style={{ background: 'rgba(106,176,255,0.07)', border: '1px solid rgba(106,176,255,0.2)' }}>
                <p className="text-xs italic font-medium" style={{ color: '#9fc4ff' }}>{t.global.copy}</p>
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 5 — VISÃO CIRÚRGICA (texto 30 / vídeo 70) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-10 items-center">
            <Reveal>
              <Badge cor="#a78bfa">{t.visao.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#a78bfa,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.visao.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.visao.sub}</p>
              <div className="space-y-2.5 mb-5">
                {t.visao.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)' }}>
                    <span className="text-xs font-semibold" style={{ color: '#cbb8fd' }}>{item}</span>
                  </div>
                ))}
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
            <Reveal delay={0.12}>
              <VideoFrame src="/videos/calculadora.mp4" cor="#a78bfa" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 6 — MENTE ONISCIENTE (vídeo 70 / texto 30) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.9),rgba(2,8,16,1))' }}>
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10 items-center">
            <Reveal>
              <VideoFrame src="/videos/cerebro.mp4" cor="#6ab0ff" />
            </Reveal>
            <Reveal delay={0.12}>
              <Badge cor="#6ab0ff">{t.mente.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.mente.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.mente.sub}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {t.mente.palavras.map((p, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg text-[11px] font-bold"
                    style={{ background: `${['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'][i % 5]}18`, color: ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'][i % 5], border: `1px solid ${['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'][i % 5]}40` }}>
                    {p}
                  </span>
                ))}
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 7 — SEGURANÇA (BANNER largura total) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-10">
            <Badge cor="#34d399">{t.seguranca.badge}</Badge>
            <h2 className="ax-display text-3xl md:text-5xl font-black mb-4"
              style={{ background: 'linear-gradient(135deg,#fff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.seguranca.titulo}
            </h2>
            <p className="text-sm md:text-lg max-w-2xl mx-auto font-medium" style={{ color: cBody }}>{t.seguranca.sub}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mb-12">
              <VideoFrame src="/videos/seguranca.mp4" cor="#34d399" />
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.seguranca.items.map((item, i) => (
              <Reveal key={i} delay={0.06 * i}>
                <NeonBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
                  <div className="p-5 text-center">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-black text-sm mb-2" style={{ color: '#5ff0b5' }}>{item.titulo}</h3>
                    <p className="text-xs font-medium" style={{ color: cMuted, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </NeonBox>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 8 — EXÉRCITO DE IA (texto 30 / vídeo 70) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-10 items-center">
            <Reveal>
              <Badge cor="#fbbf24">{t.robots.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ background: `linear-gradient(135deg,#fff,${cGold},#f97316)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.robots.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.robots.sub}</p>
              <div className="space-y-2.5 mb-5">
                {t.robots.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}>
                    <span className="text-xs font-semibold" style={{ color: '#fcd97a' }}>{item}</span>
                  </div>
                ))}
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
            <Reveal delay={0.12}>
              <VideoFrame src="/videos/robos.mp4" cor="#fbbf24" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 9 — MÓDULOS (banner dna + grid) ============ */}
      <section className="relative py-20 md:py-32"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.9),rgba(2,8,16,1))' }}>
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-10">
            <h2 className="ax-display text-3xl md:text-5xl font-black mb-3" style={{ color: '#eaf2ff' }}>{t.modulos.titulo}</h2>
            <p className="text-sm md:text-lg font-medium" style={{ color: cMuted }}>{t.modulos.sub}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mb-12">
              <VideoFrame src="/videos/dna.mp4" cor="#6ab0ff" />
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {t.modulos.lista.map((m, i) => (
              <NeonBox key={i} cor={['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#f97316'][i % 6]}
                corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
                <div className="p-3 text-center cursor-pointer">
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <p className="font-bold text-xs mb-0.5" style={{ color: '#eaf2ff' }}>{m.nome}</p>
                  <p className="text-[10px] font-medium" style={{ color: cMuted }}>{m.desc}</p>
                </div>
              </NeonBox>
            ))}
          </div>
          <div className="text-center mt-10">
            {btn(t.comecarGratis, () => router.push('/cadastro'))}
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 10 — CLOWDBOT (vídeo 70 / texto 30) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <BgWords />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10 items-center">
            <Reveal>
              <VideoFrame src="/videos/gerente.mp4" cor="#6ab0ff">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full z-10"
                  style={{ background: 'rgba(4,10,22,0.92)', border: '1px solid rgba(52,211,153,0.4)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                  <span className="text-xs font-bold" style={{ color: '#34d399' }}>{t.clowdbot.status}</span>
                </div>
              </VideoFrame>
            </Reveal>
            <Reveal delay={0.12}>
              <Badge cor="#6ab0ff">{t.clowdbot.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.clowdbot.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.clowdbot.sub}</p>
              <div className="px-3 py-3 rounded-xl mb-5"
                style={{ background: 'rgba(4,10,22,0.9)', border: '1px solid rgba(106,176,255,0.2)', fontFamily: 'monospace' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f87171' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fbbf24' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#34d399' }} />
                  <span className="text-[10px] ml-2" style={{ color: '#6a8bbd' }}>ClowdBot Terminal</span>
                </div>
                <p className="text-[11px]" style={{ color: '#6a8bbd' }}>{'>'} AXIOMA AI.TECH v2.0</p>
                <p className="text-[11px] mt-1" style={{ color: '#34d399' }}>
                  {'>'} {t.clowdbot.pensando[pensandoIdx]}
                  <span className="animate-pulse">█</span>
                </p>
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 11 — DESTAQUE ROBÔ IA (banner antes dos planos) ============ */}
      <section className="relative py-16 md:py-24 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at center, rgba(10,22,40,0.9), rgba(2,8,16,1))' }}>
        <BgWords />
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <Reveal>
            <Badge cor="#00E5FF">PAINEL INTELIGENTE</Badge>
            <h2 className="ax-display text-2xl md:text-4xl font-black mb-6"
              style={{ background: 'linear-gradient(135deg,#fff,#00E5FF,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Sua empresa inteira, em um só painel.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative rounded-[20px] overflow-hidden mx-auto"
              style={{ border: '1px solid rgba(0,229,255,0.35)', boxShadow: '0 40px 100px -30px rgba(0,229,255,0.4)' }}>
              <img src="/robo-ia.png" alt="Painel IA Axioma" className="w-full h-auto block" />
              <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)', boxShadow: '0 0 18px #00E5FF' }} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ SEÇÃO 12 — PLANOS 4 NÍVEIS ============ */}
      <section className="relative py-20 md:py-32"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.95),rgba(2,8,16,1))' }}>
        <BgWords />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-14">
            <h2 className="ax-display text-3xl md:text-5xl font-black mb-3"
              style={{ background: 'linear-gradient(135deg,#fff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.planos.titulo}
            </h2>
            <p className="text-sm font-medium" style={{ color: cMuted }}>{t.planos.sub}</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-4">
            {t.planos.lista.map((p: any, i) => (
              <Reveal key={i} delay={0.07 * i} className="h-full">
                <div className="relative h-full rounded-2xl"
                  style={{
                    background: 'rgba(4,10,22,0.97)',
                    border: `1px solid ${p.destaque ? p.cor : `${p.cor}30`}`,
                    boxShadow: p.destaque ? `0 0 50px ${p.cor}40` : `0 0 30px ${p.cor}10`,
                  }}>
                  {p.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap z-10"
                      style={{ background: `linear-gradient(135deg,${cGold},#ea580c)`, color: '#1a1206', boxShadow: '0 4px 20px rgba(245,158,11,0.5)' }}>
                      {t.planos.popular}
                    </div>
                  )}
                  <div className="p-5 pt-7 flex flex-col h-full">
                    <h3 className="ax-display text-2xl font-black mb-1 text-center" style={{ color: p.cor }}>{p.nome}</h3>
                    <p className="text-xs text-center mb-3 font-medium" style={{ color: cMuted }}>{p.desc}</p>
                    <div className="flex items-end justify-center gap-1 mb-1">
                      <span className="ax-display text-4xl font-black" style={{ color: '#ffffff' }}>R$ {p.preco}</span>
                      <span className="text-sm mb-1" style={{ color: cMuted }}>{t.planos.mes}</span>
                    </div>
                    <p className="text-xs text-center mb-3 font-medium" style={{ color: '#7d9bc9' }}>{p.usuarios}</p>
                    <div className="flex justify-center mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                        ✨ {t.planos.trial}
                      </span>
                    </div>
                    {p.ia && (
                      <div className="flex justify-center mb-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(251,191,36,0.12)', color: cGold, border: '1px solid rgba(251,191,36,0.3)' }}>⭐ IA Premium</span>
                      </div>
                    )}
                    <div className="space-y-2 mb-5 flex-1">
                      {p.features.map((f: string, j: number) => (
                        <div key={j} className="flex items-start gap-2 text-xs font-medium" style={{ color: cBody }}>
                          <span style={{ color: p.cor }}>✓</span> <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    {btn(t.comecar, () => router.push('/cadastro'), true, true)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-center text-xs mt-8 font-medium" style={{ color: '#5a7aaa' }}>{t.semCartao}</p>
        </div>
      </section>

      {/* ============ SEÇÃO 13 — CTA FINAL (logo no lugar do foguete) ============ */}
      <section className="relative py-24 md:py-40 overflow-hidden text-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(59,111,212,0.2) 0%, transparent 60%)', animation: 'pulse-aura 4s ease-in-out infinite alternate' }} />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(2,8,16,0.7),rgba(2,8,16,0.5),rgba(2,8,16,0.95))' }} />
        <Reveal className="relative z-10 max-w-4xl mx-auto px-4">
          <img src="/logo-aitech.png" alt="Axioma" className="mx-auto mb-6"
            style={{ width: 96, height: 96, objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(106,176,255,0.9))', animation: 'logo-float 4s ease-in-out infinite alternate' }} />
          <h2 className="ax-display text-3xl md:text-6xl font-black mb-4"
            style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 40px rgba(106,176,255,0.4)' }}>
            {t.cta.titulo}
          </h2>
          <p className="text-sm md:text-xl mb-8 max-w-2xl mx-auto font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.cta.sub}</p>
          <button onClick={() => router.push('/cadastro')}
            className="relative px-10 md:px-20 py-5 md:py-7 rounded-2xl font-black text-sm md:text-xl tracking-widest uppercase hover:scale-105 transition-all overflow-hidden group"
            style={{ background: 'linear-gradient(135deg,#1a3a8f,#2a5fd4,#a78bfa)', color: '#fff', boxShadow: '0 8px 60px rgba(42,95,212,0.6), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <span className="relative z-10">{t.cta.btn}</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
          </button>
          <p className="text-sm mt-4 font-medium" style={{ color: cMuted }}>{t.cta.sub2}</p>
          <p className="text-xs mt-2" style={{ color: '#5a7aaa' }}>{t.semCartao}</p>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="text-center py-8 px-4" style={{ borderTop: '1px solid rgba(59,111,212,0.1)', background: '#020810' }}>
        <div className="flex justify-center gap-4 mb-4 text-xs" style={{ color: '#6a8bbd' }}>
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
        <p className="text-xs" style={{ color: '#5a7aaa' }}>{t.footer}</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .ax-root { font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
        .ax-display { font-family: 'Sora', 'Inter', sans-serif; letter-spacing: -0.01em; }
        .ax-root h1, .ax-root h2, .ax-root h3 { font-family: 'Sora', 'Inter', sans-serif; line-height: 1.18; padding-bottom: 0.12em; }
        .ax-eyebrow { font-family: 'Sora', sans-serif; }

        .ax-tilt { transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s ease; transform-style: preserve-3d; }
        .ax-tilt:hover { transform: perspective(900px) translateY(-8px) rotateX(4deg) rotateY(-4deg) scale(1.02); }

        .ax-video-frame { transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease; }
        .ax-video-frame:hover { transform: translateY(-6px) scale(1.01); }

        .ax-neon {
          color: #00E5FF;
          background: linear-gradient(100deg, #00E5FF 20%, #ffffff 50%, #00E5FF 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 18px rgba(0,229,255,0.55)) drop-shadow(0 2px 10px rgba(2,8,16,0.9));
          animation: neon-sheen 5s linear infinite;
        }
        @keyframes neon-sheen { from { background-position: 200% center; } to { background-position: -200% center; } }

        .ax-fade-video { animation: ax-video-in 1.1s ease-out both; }
        @keyframes ax-video-in { from { opacity: 0; } to { opacity: 1; } }

        @keyframes bgword-drift { from { transform: translateY(0) rotate(-5deg); } to { transform: translateY(-18px) rotate(-5deg); } }
        @keyframes pulse-aura { from { opacity: 0.5; transform: scale(1); } to { opacity: 0.9; transform: scale(1.08); } }
        @keyframes logo-float { from { transform: translateY(0); } to { transform: translateY(-10px); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
        }
      `}</style>
    </div>
  )
}