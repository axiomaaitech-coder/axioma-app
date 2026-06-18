'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================
// TRADUÇÕES COMPLETAS PT / EN / ES
// ============================================================
const idiomas = {
  pt: {
    login: 'Login', comecar: '🚀 Começar Agora', comecarGratis: '🚀 Começar Gratuitamente',
    semCartao: 'Sem cartão de crédito. Cancele quando quiser.',
    nav: { modulos: 'Módulos', planos: 'Planos', sobre: 'Sobre' },
    hero: {
      badge: '🧠 INTELIGÊNCIA FINANCEIRA COM IA',
      titulo: 'O sistema que substituiu contadores.',
      sub: 'A IA que gerencia sua empresa com perfeição divina. Enquanto você dorme, o Axioma trabalha.',
      copy: '"Não viemos competir. Viemos redefinir o que é possível."',
      stats: [{ n: '22+', l: 'Módulos' }, { n: '3', l: 'Idiomas' }, { n: '99.9%', l: 'Uptime' }, { n: 'IA', l: 'Real' }],
    },
    global: {
      badge: '🌍 DOMÍNIO SEM FRONTEIRAS',
      titulo: 'O Axioma não tem limites de território.',
      sub: 'Criado para conquistar o mundo. Em português, inglês e espanhol. Sua empresa pode atender de São Paulo a Tóquio com a mesma precisão.',
      paises: ['🇧🇷 Brasil', '🇺🇸 USA', '🇪🇸 España', '🇦🇷 Argentina', '🇲🇽 México', '🇵🇹 Portugal', '🇨🇴 Colombia', '🇨🇱 Chile'],
      copy: 'O mercado de gestão financeira movimenta R$15 bilhões/ano no Brasil. O Axioma chegou para liderar.',
    },
    olho: {
      badge: '👁️ VISÃO CIRÚRGICA',
      titulo: 'Precisão absoluta. Zero erros.',
      sub: 'Nossa IA enxerga o que nenhum contador humano consegue. Ela lê seus dados como um cirurgião lê um raio-X — com precisão de milésimos.',
      items: ['✦ Leitura em tempo real de todos os seus dados', '✦ Detecção automática de anomalias financeiras', '✦ Alertas antes que o problema aconteça', '✦ 100% dos números verificados pela IA'],
    },
    mente: {
      badge: '🧠 MENTE ONISCIENTE',
      titulo: 'Sua empresa processando trilhões de dados.',
      sub: 'Conectada a tudo simultaneamente. A IA do Axioma processa seus dados financeiros, tributários e operacionais em milésimos de segundo.',
      palavras: ['RECEITAS', 'DRE', 'MEI', 'IRPF', 'FLUXO', 'CUSTOS', 'CLIENTES', 'METAS', 'IA', 'ROI', 'AXIOMA', 'BRASIL', 'USA', 'R$', '%', '∑'],
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
      sub: '22 módulos integrados. Uma plataforma. Resultado extraordinário.',
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
      sub: 'Cancele quando quiser. Sem fidelidade.',
      popular: '⭐ MAIS POPULAR',
      lista: [
        { nome: 'Starter', preco: 97, cor: '#6ab0ff', desc: 'Ideal para MEI e autônomos', usuarios: '1 usuário', features: ['22 módulos completos', 'MEI módulo exclusivo', 'Dashboard com KPIs', 'Exportar PDF', 'Suporte por email'], ia: false },
        { nome: 'Pró', preco: 197, cor: '#f59e0b', desc: 'Para empresas em crescimento', usuarios: 'até 4 usuários', features: ['Tudo do Starter', 'IA Financeira Premium', 'IA MEI Advisor', 'Multi-idioma PT/EN/ES', 'Relatórios avançados'], ia: true, destaque: true },
        { nome: 'Business', preco: 297, cor: '#34d399', desc: 'Solução completa sem limites', usuarios: 'até 10 usuários', features: ['Tudo do Pró', 'IA Tributária Premium', 'ClowdBot autônomo', 'Multi-empresas', 'Suporte prioritário'], ia: true },
      ],
    },
    cta: {
      titulo: 'Sua concorrência já usa IA. E você?',
      sub: 'Cada dia sem controle financeiro é dinheiro saindo do seu bolso. As empresas que sobrevivem são as que têm dados reais na mão.',
      btn: '🚀 Quero Começar Agora',
      sub2: 'Junte-se a empresas que já descobriram o poder do Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Inteligência Financeira para PMEs',
  },
  en: {
    login: 'Login', comecar: '🚀 Start Now', comecarGratis: '🚀 Start for Free',
    semCartao: 'No credit card. Cancel anytime.',
    nav: { modulos: 'Modules', planos: 'Plans', sobre: 'About' },
    hero: {
      badge: '🧠 FINANCIAL INTELLIGENCE WITH AI',
      titulo: 'The system that replaced accountants.',
      sub: 'The AI that manages your company with divine perfection. While you sleep, Axioma works.',
      copy: '"We didn\'t come to compete. We came to redefine what\'s possible."',
      stats: [{ n: '22+', l: 'Modules' }, { n: '3', l: 'Languages' }, { n: '99.9%', l: 'Uptime' }, { n: 'AI', l: 'Real' }],
    },
    global: {
      badge: '🌍 BORDERLESS DOMINANCE',
      titulo: 'Axioma has no territorial limits.',
      sub: 'Built to conquer the world. In Portuguese, English and Spanish. Your company can serve from São Paulo to Tokyo with the same precision.',
      paises: ['🇧🇷 Brazil', '🇺🇸 USA', '🇪🇸 Spain', '🇦🇷 Argentina', '🇲🇽 Mexico', '🇵🇹 Portugal', '🇨🇴 Colombia', '🇨🇱 Chile'],
      copy: 'The financial management market moves R$15 billion/year in Brazil. Axioma is here to lead.',
    },
    olho: {
      badge: '👁️ SURGICAL VISION',
      titulo: 'Absolute precision. Zero errors.',
      sub: 'Our AI sees what no human accountant can. It reads your data like a surgeon reads an X-ray — with millisecond precision.',
      items: ['✦ Real-time reading of all your data', '✦ Automatic detection of financial anomalies', '✦ Alerts before the problem occurs', '✦ 100% of numbers verified by AI'],
    },
    mente: {
      badge: '🧠 OMNISCIENT MIND',
      titulo: 'Your company processing trillions of data.',
      sub: 'Connected to everything simultaneously. Axioma\'s AI processes your financial, tax and operational data in milliseconds.',
      palavras: ['REVENUE', 'P&L', 'MEI', 'TAX', 'FLOW', 'COSTS', 'CLIENTS', 'GOALS', 'AI', 'ROI', 'AXIOMA', 'BRAZIL', 'USA', 'R$', '%', '∑'],
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
      sub: '22 integrated modules. One platform. Extraordinary results.',
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
      sub: 'Cancel anytime. No commitment.',
      popular: '⭐ MOST POPULAR',
      lista: [
        { nome: 'Starter', preco: 97, cor: '#6ab0ff', desc: 'Ideal for freelancers', usuarios: '1 user', features: ['22 complete modules', 'MEI exclusive module', 'Dashboard with KPIs', 'Export PDF', 'Email support'], ia: false },
        { nome: 'Pro', preco: 197, cor: '#f59e0b', desc: 'For growing companies', usuarios: 'up to 4 users', features: ['Everything in Starter', 'Premium Financial AI', 'AI MEI Advisor', 'Multi-language PT/EN/ES', 'Advanced reports'], ia: true, destaque: true },
        { nome: 'Business', preco: 297, cor: '#34d399', desc: 'Complete unlimited solution', usuarios: 'up to 10 users', features: ['Everything in Pro', 'Premium Tax AI', 'Autonomous ClowdBot', 'Multi-company', 'Priority support'], ia: true },
      ],
    },
    cta: {
      titulo: 'Your competition already uses AI. Do you?',
      sub: 'Every day without financial control is money leaving your pocket. Companies that survive have real data at hand.',
      btn: '🚀 I Want to Start Now',
      sub2: 'Join companies that have discovered the power of Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Financial Intelligence for SMEs',
  },
  es: {
    login: 'Iniciar Sesión', comecar: '🚀 Empezar Ahora', comecarGratis: '🚀 Empezar Gratis',
    semCartao: 'Sin tarjeta. Cancela cuando quieras.',
    nav: { modulos: 'Módulos', planos: 'Planes', sobre: 'Sobre' },
    hero: {
      badge: '🧠 INTELIGENCIA FINANCIERA CON IA',
      titulo: 'El sistema que reemplazó a los contadores.',
      sub: 'La IA que gestiona tu empresa con perfección divina. Mientras duermes, Axioma trabaja.',
      copy: '"No vinimos a competir. Vinimos a redefinir lo que es posible."',
      stats: [{ n: '22+', l: 'Módulos' }, { n: '3', l: 'Idiomas' }, { n: '99.9%', l: 'Uptime' }, { n: 'IA', l: 'Real' }],
    },
    global: {
      badge: '🌍 DOMINIO SIN FRONTERAS',
      titulo: 'Axioma no tiene límites territoriales.',
      sub: 'Creado para conquistar el mundo. En portugués, inglés y español. Tu empresa puede atender desde São Paulo hasta Tokio con la misma precisión.',
      paises: ['🇧🇷 Brasil', '🇺🇸 USA', '🇪🇸 España', '🇦🇷 Argentina', '🇲🇽 México', '🇵🇹 Portugal', '🇨🇴 Colombia', '🇨🇱 Chile'],
      copy: 'El mercado de gestión financiera mueve R$15 mil millones/año. Axioma llegó para liderar.',
    },
    olho: {
      badge: '👁️ VISIÓN QUIRÚRGICA',
      titulo: 'Precisión absoluta. Cero errores.',
      sub: 'Nuestra IA ve lo que ningún contador humano puede. Lee tus datos como un cirujano lee una radiografía — con precisión de milésimas.',
      items: ['✦ Lectura en tiempo real de todos tus datos', '✦ Detección automática de anomalías financieras', '✦ Alertas antes de que ocurra el problema', '✦ 100% de los números verificados por IA'],
    },
    mente: {
      badge: '🧠 MENTE OMNISCIENTE',
      titulo: 'Tu empresa procesando billones de datos.',
      sub: 'Conectada a todo simultáneamente. La IA de Axioma procesa tus datos financieros, tributarios y operativos en milisegundos.',
      palavras: ['INGRESOS', 'P&G', 'MEI', 'IMPUESTO', 'FLUJO', 'COSTOS', 'CLIENTES', 'METAS', 'IA', 'ROI', 'AXIOMA', 'BRASIL', 'USA', 'R$', '%', '∑'],
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
      sub: '22 módulos integrados. Una plataforma. Resultado extraordinario.',
      lista: [
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
        { icon: '🟠', nome: 'Módulo MEI', desc: '7 submódulos exclusivos' },
        { icon: '🗂️', nome: 'Centros de Costo', desc: 'Gestión por centro' },
        { icon: '📂', nome: 'Importar Docs', desc: 'Carga de documentos' },
        { icon: '📋', nome: 'Reportes', desc: 'PDF con identidad Axioma' },
        { icon: '🏢', nome: 'Empresa', desc: 'Configuraciones completas' },
        { icon: '💳', nome: 'Planes', desc: 'Gestión de suscripción' },
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
      sub: 'Cancela cuando quieras. Sin fidelidad.',
      popular: '⭐ MÁS POPULAR',
      lista: [
        { nome: 'Starter', preco: 97, cor: '#6ab0ff', desc: 'Ideal para autónomos', usuarios: '1 usuario', features: ['22 módulos completos', 'Módulo MEI exclusivo', 'Dashboard con KPIs', 'Exportar PDF', 'Soporte por email'], ia: false },
        { nome: 'Pro', preco: 197, cor: '#f59e0b', desc: 'Para empresas en crecimiento', usuarios: 'hasta 4 usuarios', features: ['Todo de Starter', 'IA Financiera Premium', 'AI MEI Advisor', 'Multi-idioma PT/EN/ES', 'Reportes avanzados'], ia: true, destaque: true },
        { nome: 'Business', preco: 297, cor: '#34d399', desc: 'Solución completa sin límites', usuarios: 'hasta 10 usuarios', features: ['Todo de Pro', 'IA Tributaria Premium', 'ClowdBot autónomo', 'Multi-empresa', 'Soporte prioritario'], ia: true },
      ],
    },
    cta: {
      titulo: '¿Tu competencia ya usa IA. Y tú?',
      sub: 'Cada día sin control financiero es dinero saliendo de tu bolsillo. Las empresas que sobreviven tienen datos reales en la mano.',
      btn: '🚀 Quiero Empezar Ahora',
      sub2: 'Únete a empresas que descubrieron el poder de Axioma',
    },
    footer: '© 2026 Axioma AI.Tech — Inteligencia Financiera para PYMEs',
  },
}

// ============================================================
// VULCÃO DE DADOS — Canvas épico
// ============================================================
function VolcanoCanvas({ palavras }: { palavras: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)

    interface P { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string; text: string; isText: boolean }
    const particles: P[] = []
    const colors = ['#f97316','#fbbf24','#f87171','#fb923c','#fcd34d','#6ab0ff','#34d399','#a78bfa']

    const spawn = () => {
      const cx = canvas.width / 2
      const isText = Math.random() > 0.35
      particles.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: canvas.height * 0.72,
        vx: (Math.random() - 0.5) * 4,
        vy: -(3 + Math.random() * 7),
        life: 1, maxLife: 80 + Math.random() * 100,
        size: 2 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        text: palavras[Math.floor(Math.random() * palavras.length)],
        isText,
      })
    }

    let frame = 0
    const draw = () => {
      frame++
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2

      // Magma de fundo — lava escorrendo
      for (let i = 0; i < 8; i++) {
        const lx = cx + (Math.random() - 0.5) * 80
        const grad = ctx.createLinearGradient(lx, h * 0.72, lx + (Math.random() - 0.5) * 40, h)
        grad.addColorStop(0, 'rgba(249,115,22,0.4)')
        grad.addColorStop(0.5, 'rgba(251,191,36,0.2)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.moveTo(lx, h * 0.72)
        ctx.bezierCurveTo(lx + 20, h * 0.82, lx - 20, h * 0.9, lx + 10, h)
        ctx.strokeStyle = grad; ctx.lineWidth = 3 + Math.random() * 4; ctx.stroke()
      }

      // Corpo do vulcão
      const vGrad = ctx.createLinearGradient(cx - 120, h * 0.62, cx + 120, h)
      vGrad.addColorStop(0, 'rgba(30,10,5,0.95)')
      vGrad.addColorStop(0.4, 'rgba(15,5,2,0.98)')
      vGrad.addColorStop(1, 'rgba(4,10,22,0)')
      ctx.beginPath()
      ctx.moveTo(cx - 140, h)
      ctx.lineTo(cx - 45, h * 0.66)
      ctx.lineTo(cx, h * 0.62)
      ctx.lineTo(cx + 45, h * 0.66)
      ctx.lineTo(cx + 140, h)
      ctx.closePath()
      ctx.fillStyle = vGrad; ctx.fill()

      // Bordas do vulcão com brilho
      ctx.beginPath()
      ctx.moveTo(cx - 140, h)
      ctx.lineTo(cx - 45, h * 0.66)
      ctx.lineTo(cx, h * 0.62)
      ctx.lineTo(cx + 45, h * 0.66)
      ctx.lineTo(cx + 140, h)
      ctx.strokeStyle = 'rgba(249,115,22,0.5)'; ctx.lineWidth = 1.5
      ctx.shadowColor = '#f97316'; ctx.shadowBlur = 15; ctx.stroke(); ctx.shadowBlur = 0

      // Cratera — magma pulsante
      const pulse = Math.sin(frame * 0.08) * 8
      const mGrad = ctx.createRadialGradient(cx, h * 0.64, 0, cx, h * 0.64, 50 + pulse)
      mGrad.addColorStop(0, 'rgba(255,220,50,1)')
      mGrad.addColorStop(0.3, 'rgba(249,115,22,0.9)')
      mGrad.addColorStop(0.7, 'rgba(220,38,38,0.5)')
      mGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx, h * 0.64, 48 + pulse, 0, Math.PI * 2)
      ctx.fillStyle = mGrad; ctx.fill()

      // Círculos de energia na cratera
      for (let r = 0; r < 3; r++) {
        ctx.beginPath()
        ctx.arc(cx, h * 0.64, 20 + r * 12 + pulse * 0.3, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(251,191,36,${0.6 - r * 0.15})`
        ctx.lineWidth = 1; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0
      }

      // Spawn e render partículas
      if (frame % 2 === 0) { spawn(); if (Math.random() > 0.5) spawn() }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.99; p.life--
        const alpha = Math.min(1, p.life / p.maxLife * 2)

        if (p.isText) {
          ctx.save(); ctx.font = `bold ${9 + p.size * 1.5}px monospace`
          ctx.fillStyle = p.color; ctx.globalAlpha = alpha
          ctx.shadowColor = p.color; ctx.shadowBlur = 10
          ctx.fillText(p.text, p.x - 20, p.y); ctx.restore()
        } else {
          ctx.save(); ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color; ctx.globalAlpha = alpha
          ctx.shadowColor = p.color; ctx.shadowBlur = 12; ctx.fill(); ctx.restore()
        }
        if (p.life <= 0 || p.y < -50) particles.splice(i, 1)
      }

      // Fumaça no topo
      for (let s = 0; s < 5; s++) {
        const sx = cx + (Math.random() - 0.5) * 60
        const sy = h * 0.55 - s * 20
        const sr = 20 + s * 15
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(15,15,25,${0.4 - s * 0.06})`; ctx.fill()
      }

      // Texto AXIOMA na fumaça
      ctx.save(); ctx.font = 'bold 22px Arial'
      ctx.fillStyle = 'rgba(249,115,22,0.8)'
      ctx.shadowColor = '#f97316'; ctx.shadowBlur = 20
      ctx.textAlign = 'center'
      ctx.globalAlpha = 0.6 + Math.sin(frame * 0.05) * 0.3
      ctx.fillText('AXIOMA', cx, h * 0.42); ctx.restore()

      // Efeitos de circuito azul ao redor
      ctx.save(); ctx.strokeStyle = 'rgba(106,176,255,0.15)'; ctx.lineWidth = 1
      for (let c = 0; c < 6; c++) {
        const cx2 = Math.random() * w, cy2 = Math.random() * h
        const len = 20 + Math.random() * 60
        ctx.beginPath()
        ctx.moveTo(cx2, cy2)
        ctx.lineTo(cx2 + len, cy2)
        ctx.lineTo(cx2 + len, cy2 + len * 0.5)
        ctx.stroke()
      }
      ctx.restore()

      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [palavras])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
}

// ============================================================
// GLOBO 3D — Canvas com países girando
// ============================================================
function GloboCanvas({ paises }: { paises: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)

    let angle = 0
    const pontos: { lat: number; lon: number; label: string; size: number }[] = []
    paises.forEach((p, i) => {
      pontos.push({ lat: (Math.random() - 0.5) * 140, lon: (i / paises.length) * 360, label: p, size: 3 + Math.random() * 3 })
    })
    for (let i = 0; i < 60; i++) {
      pontos.push({ lat: (Math.random() - 0.5) * 180, lon: Math.random() * 360, label: '', size: 1 + Math.random() * 2 })
    }

    const draw = () => {
      const w = canvas.width, h = canvas.height
      const cx = w / 2, cy = h / 2
      const R = Math.min(w, h) * 0.38
      ctx.clearRect(0, 0, w, h)

      // Glow do globo
      const gGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2)
      gGrad.addColorStop(0, 'rgba(106,176,255,0.05)')
      gGrad.addColorStop(0.8, 'rgba(59,111,212,0.08)')
      gGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2)
      ctx.fillStyle = gGrad; ctx.fill()

      // Globo base
      const bGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R)
      bGrad.addColorStop(0, 'rgba(20,40,80,0.9)')
      bGrad.addColorStop(0.5, 'rgba(10,22,40,0.95)')
      bGrad.addColorStop(1, 'rgba(4,10,22,0.98)')
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = bGrad; ctx.fill()
      ctx.strokeStyle = 'rgba(106,176,255,0.3)'; ctx.lineWidth = 1.5
      ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 20; ctx.stroke(); ctx.shadowBlur = 0

      // Linhas de latitude
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = cy + R * Math.sin(lat * Math.PI / 180)
        const r = R * Math.cos(lat * Math.PI / 180)
        if (r > 0) {
          ctx.beginPath(); ctx.ellipse(cx, y, r, r * 0.1, 0, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(59,111,212,0.15)'; ctx.lineWidth = 0.5; ctx.stroke()
        }
      }

      // Linhas de longitude girando
      for (let lon = 0; lon < 360; lon += 30) {
        const a = (lon + angle) * Math.PI / 180
        ctx.beginPath()
        ctx.ellipse(cx, cy, R * Math.abs(Math.cos(a)), R, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(59,111,212,${Math.abs(Math.cos(a)) * 0.12})`
        ctx.lineWidth = 0.5; ctx.stroke()
      }

      // Pontos e países
      pontos.forEach(p => {
        const lon = (p.lon + angle) * Math.PI / 180
        const lat = p.lat * Math.PI / 180
        const x3d = Math.cos(lat) * Math.sin(lon)
        const z3d = Math.cos(lat) * Math.cos(lon)
        if (z3d < 0) return // oculto

        const px = cx + R * x3d
        const py = cy - R * Math.sin(lat)
        const alpha = z3d * 0.8

        ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(106,176,255,${alpha})`
        ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = p.label ? 10 : 4; ctx.fill(); ctx.shadowBlur = 0

        if (p.label && alpha > 0.3) {
          // Linha conectando ao label
          ctx.beginPath(); ctx.moveTo(px, py)
          ctx.lineTo(px + 15, py - 10)
          ctx.strokeStyle = `rgba(106,176,255,${alpha * 0.5})`
          ctx.lineWidth = 0.5; ctx.stroke()

          ctx.save(); ctx.font = 'bold 11px Arial'
          ctx.fillStyle = `rgba(200,216,240,${alpha})`
          ctx.fillText(p.label, px + 17, py - 8); ctx.restore()
        }
      })

      // AXIOMA surgindo do globo
      ctx.save(); ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'
      ctx.fillStyle = `rgba(106,176,255,${0.7 + Math.sin(angle * 0.05) * 0.3})`
      ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 20
      ctx.fillText('AXIOMA', cx, cy + 6); ctx.restore()

      // Anel externo girando
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle * 0.02 * Math.PI / 180)
      ctx.beginPath()
      ctx.ellipse(0, 0, R * 1.15, R * 0.25, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(52,211,153,0.3)'; ctx.lineWidth = 1.5
      ctx.setLineDash([8, 12]); ctx.stroke(); ctx.setLineDash([])
      ctx.restore()

      angle += 0.4
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [paises])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
}

// ============================================================
// OLHO CIBERNÉTICO — Canvas épico
// ============================================================
function OlhoCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)

    let angle = 0, scan = 0
    const dados = ['DRE', 'R$', 'IRPF', 'MEI', 'ROI', '%', '∑', 'Δ', 'π', 'IA', 'CNPJ', 'LUCRO']

    const draw = () => {
      const w = canvas.width, h = canvas.height
      const cx = w / 2, cy = h / 2
      const R = Math.min(w, h) * 0.4
      ctx.clearRect(0, 0, w, h)

      // Fundo escuro do olho
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      bgGrad.addColorStop(0, 'rgba(8,18,36,0.98)')
      bgGrad.addColorStop(1, 'rgba(2,8,16,0.5)')
      ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.6, 0, 0, Math.PI * 2)
      ctx.fillStyle = bgGrad; ctx.fill()

      // Íris — anéis coloridos
      const irisColors = ['rgba(106,176,255,0.12)', 'rgba(52,211,153,0.08)', 'rgba(167,139,250,0.06)']
      irisColors.forEach((c, i) => {
        ctx.beginPath(); ctx.ellipse(cx, cy, R * (0.9 - i * 0.15), R * (0.54 - i * 0.09), 0, 0, Math.PI * 2)
        ctx.fillStyle = c; ctx.fill()
      })

      // Linhas radiais da íris
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2
        const r1 = R * 0.28, r2 = R * 0.82
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.6)
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.6)
        ctx.strokeStyle = `rgba(106,176,255,${0.06 + (i % 4 === 0 ? 0.08 : 0)})`
        ctx.lineWidth = 0.5; ctx.stroke()
      }

      // Anéis de circuito mecânico girando
      for (let ring = 0; ring < 4; ring++) {
        const r = R * (0.45 + ring * 0.12)
        const segments = 16 + ring * 6
        const dir = ring % 2 === 0 ? 1 : -1
        for (let i = 0; i < segments; i++) {
          if (i % 4 === 0) continue
          const a1 = (i / segments) * Math.PI * 2 + angle * dir * 0.015
          const a2 = ((i + 0.65) / segments) * Math.PI * 2 + angle * dir * 0.015
          ctx.beginPath()
          ctx.ellipse(cx, cy, r, r * 0.6, 0, a1, a2)
          const ringC = ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24'][ring]
          ctx.strokeStyle = ringC; ctx.lineWidth = 1.5
          ctx.shadowColor = ringC; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0
        }
      }

      // Pupila
      const pupilGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.22)
      pupilGrad.addColorStop(0, 'rgba(106,176,255,0.4)')
      pupilGrad.addColorStop(0.4, 'rgba(4,10,22,0.97)')
      pupilGrad.addColorStop(1, 'rgba(4,10,22,0.99)')
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.22, R * 0.132, 0, 0, Math.PI * 2)
      ctx.fillStyle = pupilGrad; ctx.fill()

      // Raio laser da pupila
      const laserAngle = angle * 0.02
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(laserAngle) * R * 0.9, cy + Math.sin(laserAngle) * R * 0.9 * 0.6)
      const laserGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(laserAngle) * R, cy + Math.sin(laserAngle) * R * 0.6)
      laserGrad.addColorStop(0, 'rgba(52,211,153,0.8)')
      laserGrad.addColorStop(1, 'rgba(52,211,153,0)')
      ctx.strokeStyle = laserGrad; ctx.lineWidth = 1.5
      ctx.shadowColor = '#34d399'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0

      // Linha de scan horizontal
      const scanY = cy - R * 0.5 + (scan % (R * 1.0))
      if (scanY > cy - R * 0.5 && scanY < cy + R * 0.5) {
        const sGrad = ctx.createLinearGradient(cx - R, scanY, cx + R, scanY)
        sGrad.addColorStop(0, 'rgba(52,211,153,0)')
        sGrad.addColorStop(0.3, 'rgba(52,211,153,0.5)')
        sGrad.addColorStop(0.5, 'rgba(106,176,255,0.9)')
        sGrad.addColorStop(0.7, 'rgba(52,211,153,0.5)')
        sGrad.addColorStop(1, 'rgba(52,211,153,0)')
        ctx.beginPath(); ctx.rect(cx - R * 0.85, scanY - 1, R * 1.7, 2)
        ctx.fillStyle = sGrad; ctx.fill()
        ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 6
        ctx.fillRect(cx - R * 0.85, scanY - 1, R * 1.7, 2); ctx.shadowBlur = 0
      }

      // Dados emergindo ao redor do olho
      dados.forEach((d, i) => {
        const a = (i / dados.length) * Math.PI * 2 + angle * 0.008
        const dist = R * (1.1 + 0.15 * Math.sin(angle * 0.04 + i))
        const px = cx + Math.cos(a) * dist
        const py = cy + Math.sin(a) * dist * 0.6
        const dColors = ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6']
        ctx.save(); ctx.font = `bold ${9 + R * 0.04}px monospace`
        ctx.fillStyle = dColors[i % dColors.length]; ctx.globalAlpha = 0.75
        ctx.shadowColor = dColors[i % dColors.length]; ctx.shadowBlur = 8
        ctx.textAlign = 'center'; ctx.fillText(d, px, py + 4); ctx.restore()
      })

      // Borda do olho (amêndoa)
      ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.6, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(106,176,255,0.5)'; ctx.lineWidth = 2
      ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 20; ctx.stroke(); ctx.shadowBlur = 0

      // Cílios superiores e inferiores
      for (let i = -4; i <= 4; i++) {
        const a = (i / 4) * 0.8
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * R, cy - Math.sin(Math.abs(a)) * R * 0.5)
        ctx.lineTo(cx + Math.cos(a) * R * 1.15, cy - Math.sin(Math.abs(a)) * R * 0.7)
        ctx.strokeStyle = 'rgba(106,176,255,0.3)'; ctx.lineWidth = 1; ctx.stroke()
      }

      angle += 1
      scan = (scan + 1.8) % (R * 1.0)
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
}

// ============================================================
// MENTE NEURAL — Canvas pessoa + conexões
// ============================================================
function MenteCanvas({ palavras }: { palavras: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animId: number
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)

    interface Node { x: number; y: number; vx: number; vy: number; r: number; color: string; pulse: number; label: string }
    const colors = ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#f87171', '#fb923c']
    const nodes: Node[] = palavras.map((w, i) => {
      const angle = (i / palavras.length) * Math.PI * 2
      const dist = 80 + Math.random() * 120
      return {
        x: 0, y: 0, // será calculado no draw baseado em canvas
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: 4 + Math.random() * 5,
        color: colors[i % colors.length],
        pulse: Math.random() * Math.PI * 2,
        label: w,
      }
    })

    // Inicializa posições
    let initialized = false
    let frame = 0

    const draw = () => {
      frame++
      const w = canvas.width, h = canvas.height
      const cx = w / 2, cy = h / 2
      ctx.clearRect(0, 0, w, h)

      if (!initialized) {
        palavras.forEach((_, i) => {
          const angle = (i / palavras.length) * Math.PI * 2
          const dist = 80 + Math.random() * Math.min(w, h) * 0.25
          nodes[i].x = cx + Math.cos(angle) * dist
          nodes[i].y = cy * 0.7 + Math.sin(angle) * dist * 0.6
        })
        initialized = true
      }

      // Atualiza nós
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.03
        // Mantém ao redor do centro
        const dx = n.x - cx, dy = n.y - cy * 0.7
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = Math.min(w, h) * 0.38
        if (dist > maxDist) { n.vx -= dx * 0.001; n.vy -= dy * 0.001 }
        if (dist < 60) { n.vx += dx * 0.005; n.vy += dy * 0.005 }
      })

      // Conexões entre nós
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.45
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(106,176,255,${alpha})`
            ctx.lineWidth = 0.7; ctx.stroke()
          }
        }
      }

      // Conexões do centro para nós
      nodes.forEach((n, i) => {
        const dx = n.x - cx, dy = n.y - cy * 0.7
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200) {
          const alpha = (1 - dist / 200) * 0.6
          ctx.beginPath(); ctx.moveTo(cx, cy * 0.7); ctx.lineTo(n.x, n.y)
          const grad = ctx.createLinearGradient(cx, cy * 0.7, n.x, n.y)
          grad.addColorStop(0, `rgba(106,176,255,${alpha})`)
          grad.addColorStop(1, `${n.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`)
          ctx.strokeStyle = grad; ctx.lineWidth = 0.8; ctx.stroke()
        }
      })

      // Partículas viajando pelas conexões
      if (frame % 20 === 0) {
        const n = nodes[Math.floor(Math.random() * nodes.length)]
        ctx.beginPath(); ctx.arc(
          cx + (n.x - cx) * (frame % 20) / 20,
          cy * 0.7 + (n.y - cy * 0.7) * (frame % 20) / 20,
          2, 0, Math.PI * 2
        )
        ctx.fillStyle = n.color; ctx.shadowColor = n.color; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0
      }

      // Renderiza nós
      nodes.forEach(n => {
        const pulse = Math.sin(n.pulse) * 2
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + pulse, 0, Math.PI * 2)
        ctx.fillStyle = n.color; ctx.shadowColor = n.color; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0

        ctx.save(); ctx.font = `bold ${9 + n.r}px monospace`
        ctx.fillStyle = n.color; ctx.globalAlpha = 0.9
        ctx.textAlign = 'center'; ctx.fillText(n.label, n.x, n.y - n.r - 4); ctx.restore()
      })

      // Centro — crânio/cérebro pulsante
      const cPulse = Math.sin(frame * 0.05) * 8
      const cGrad = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy * 0.7, 50 + cPulse)
      cGrad.addColorStop(0, 'rgba(106,176,255,0.4)')
      cGrad.addColorStop(0.5, 'rgba(59,111,212,0.2)')
      cGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx, cy * 0.7, 50 + cPulse, 0, Math.PI * 2)
      ctx.fillStyle = cGrad; ctx.fill()

      // Ícone do cérebro no centro
      ctx.save(); ctx.font = `${36 + cPulse * 0.3}px Arial`
      ctx.textAlign = 'center'; ctx.fillText('🧠', cx, cy * 0.7 + 12)
      ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 30; ctx.restore()

      // Silhueta do monitor/computador embaixo
      ctx.save()
      ctx.fillStyle = 'rgba(10,22,40,0.6)'
      ctx.beginPath()
      ctx.roundRect(cx - 70, cy * 1.15, 140, 80, 8)
      ctx.fill()
      ctx.strokeStyle = 'rgba(106,176,255,0.3)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.font = '10px monospace'; ctx.fillStyle = '#34d399'
      ctx.fillText('> AXIOMA AI.TECH', cx, cy * 1.15 + 20)
      ctx.fillStyle = '#6ab0ff'
      ctx.fillText('> Analisando dados...', cx, cy * 1.15 + 35)
      ctx.fillStyle = '#a78bfa'
      ctx.fillText('> 100% Precisão', cx, cy * 1.15 + 50)
      ctx.restore()

      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [palavras])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
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
// CLOWDBOT — Holograma pulsante
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

      // Holograma externo
      for (let ring = 0; ring < 5; ring++) {
        const r = R * (0.6 + ring * 0.1)
        const pulse = Math.sin(frame * 0.04 + ring * 0.8) * 5
        ctx.beginPath(); ctx.arc(cx, cy, r + pulse, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(106,176,255,${0.15 - ring * 0.02})`
        ctx.lineWidth = 1; ctx.stroke()
      }

      // Hexágono central
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + frame * 0.01
        ctx.lineTo(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(106,176,255,0.4)'; ctx.lineWidth = 2
      ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 15; ctx.stroke(); ctx.shadowBlur = 0

      // Olho cibernético central
      const eyePulse = Math.sin(frame * 0.06) * 3
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.35 + eyePulse, R * 0.2 + eyePulse * 0.5, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(52,211,153,0.8)'; ctx.lineWidth = 2
      ctx.shadowColor = '#34d399'; ctx.shadowBlur = 20; ctx.stroke(); ctx.shadowBlur = 0

      // Pupila
      const blinkPhase = frame % 120
      const blinkScale = blinkPhase < 5 ? blinkPhase / 5 : blinkPhase < 10 ? (10 - blinkPhase) / 5 : 1
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.12 * blinkScale, 0, Math.PI * 2)
      const pupilGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.12)
      pupilGrad.addColorStop(0, 'rgba(106,176,255,0.9)')
      pupilGrad.addColorStop(0.5, 'rgba(52,211,153,0.7)')
      pupilGrad.addColorStop(1, 'rgba(0,0,0,0.8)')
      ctx.fillStyle = pupilGrad; ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0

      // Raio laser do olho
      const laserLen = R * 0.8
      ctx.beginPath(); ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(frame * 0.03) * laserLen, cy + Math.sin(frame * 0.03) * laserLen)
      const lGrad = ctx.createLinearGradient(cx, cy, cx + laserLen, cy)
      lGrad.addColorStop(0, 'rgba(52,211,153,0.6)')
      lGrad.addColorStop(1, 'rgba(52,211,153,0)')
      ctx.strokeStyle = lGrad; ctx.lineWidth = 1.5
      ctx.shadowColor = '#34d399'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0

      // Antenas
      for (let a = 0; a < 3; a++) {
        const aAngle = (a / 3) * Math.PI - Math.PI / 2
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(aAngle) * R * 0.55, cy + Math.sin(aAngle) * R * 0.55)
        ctx.lineTo(cx + Math.cos(aAngle) * R * 0.85, cy + Math.sin(aAngle) * R * 0.85)
        ctx.strokeStyle = 'rgba(106,176,255,0.5)'; ctx.lineWidth = 1.5
        ctx.shadowColor = '#6ab0ff'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0
        // Ponto no topo da antena
        ctx.beginPath(); ctx.arc(cx + Math.cos(aAngle) * R * 0.88, cy + Math.sin(aAngle) * R * 0.88, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#34d399'; ctx.shadowColor = '#34d399'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0
      }

      // Partículas de dados ao redor
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
// CANVAS BOX — bordas neon
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
// LANDING PAGE PRINCIPAL
// ============================================================
export default function LandingPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>('pt')
  const [pensandoIdx, setPensandoIdx] = useState(0)
  const t = idiomas[lang]

  useEffect(() => {
    const timer = setInterval(() => setPensandoIdx(i => (i + 1) % t.clowdbot.pensando.length), 2500)
    return () => clearInterval(timer)
  }, [lang, t.clowdbot.pensando.length])

  const btn = (label: string, onClick: () => void, primary = true, full = false) => (
    <button onClick={onClick}
      className={`${full ? 'w-full' : ''} px-6 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95`}
      style={primary
        ? { background: 'linear-gradient(135deg,#1a3a8f,#2a5fd4)', color: '#fff', boxShadow: '0 4px 30px rgba(42,95,212,0.4)' }
        : { background: 'transparent', color: '#6ab0ff', border: '1px solid rgba(106,176,255,0.3)' }}>
      {label}
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

      {/* ============ SEÇÃO 1 — HERO + VULCÃO ============ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Vulcão de fundo */}
        <div className="absolute inset-0">
          <VolcanoCanvas palavras={[...t.modulos.lista.map(m => m.nome), 'AXIOMA', 'R$', '%', 'IA', 'DRE', 'MEI', 'ROI', '∑']} />
        </div>

        {/* Overlay escuro para legibilidade */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,8,16,0.7) 0%, rgba(2,8,16,0.3) 40%, rgba(2,8,16,0.6) 70%, rgba(2,8,16,0.95) 100%)' }} />

        {/* Efeitos de circuito azul */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(59,111,212,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(167,139,250,0.06) 0%, transparent 50%)' }} />

        {/* Conteúdo */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(59,111,212,0.15)', border: '1px solid rgba(106,176,255,0.3)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399' }} />
            <span className="text-xs font-black tracking-widest" style={{ color: '#6ab0ff' }}>{t.hero.badge}</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black mb-4 leading-tight"
            style={{ background: 'linear-gradient(135deg,#ffffff 0%,#c8d8f0 30%,#6ab0ff 60%,#a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: 'none' }}>
            {t.hero.titulo}
          </h1>

          <p className="text-base md:text-xl mb-4 max-w-2xl mx-auto" style={{ color: '#8aaad4', lineHeight: 1.8 }}>
            {t.hero.sub}
          </p>

          <p className="text-sm mb-8 italic" style={{ color: '#f97316' }}>{t.hero.copy}</p>

          {/* Stats */}
          <div className="flex justify-center gap-4 md:gap-8 mb-8 flex-wrap">
            {t.hero.stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl md:text-4xl font-black" style={{ color: ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24'][i], textShadow: `0 0 20px ${['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24'][i]}` }}>{s.n}</p>
                <p className="text-xs" style={{ color: '#3a5a8a' }}>{s.l}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            {btn(t.comecarGratis, () => router.push('/cadastro'))}
            {btn(t.nav.planos, () => router.push('/planos'), false)}
          </div>
          <p className="text-xs mt-4" style={{ color: '#1a3a5a' }}>{t.semCartao}</p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-1 animate-bounce">
            <div className="w-[1px] h-8" style={{ background: 'linear-gradient(to bottom, transparent, #6ab0ff)' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6ab0ff' }} />
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 2 — DOMÍNIO GLOBAL ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Globo */}
            <div className="relative order-2 md:order-1" style={{ height: 400 }}>
              <GloboCanvas paises={t.global.paises} />
            </div>
            {/* Texto */}
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
                  <div key={i} className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', color: '#34d399' }}>{p}</div>
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

      {/* ============ SEÇÃO 3 — OLHO ONISCIENTE ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.8),rgba(2,8,16,1))' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Texto */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
                <span className="text-xs font-black tracking-widest" style={{ color: '#a78bfa' }}>{t.olho.badge}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight"
                style={{ background: 'linear-gradient(135deg,#fff,#a78bfa,#6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.olho.titulo}
              </h2>
              <p className="text-sm md:text-base mb-6" style={{ color: '#5a8ab4', lineHeight: 1.8 }}>{t.olho.sub}</p>
              <div className="space-y-3 mb-6">
                {t.olho.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                    <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>{item}</span>
                  </div>
                ))}
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>
            {/* Olho */}
            <div className="relative" style={{ height: 400 }}>
              <OlhoCanvas />
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 4 — MENTE ONISCIENTE ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Mente Neural */}
            <div className="relative order-2 md:order-1" style={{ height: 460 }}>
              <MenteCanvas palavras={t.mente.palavras} />
            </div>
            {/* Texto */}
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
              {/* Tags de palavras */}
              <div className="flex flex-wrap gap-2 mb-6">
                {t.mente.palavras.map((p, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg text-xs font-bold"
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

      {/* ============ SEÇÃO 5 — SEGURANÇA ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.9),rgba(2,8,16,1))' }}>
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

          {/* Servidor central com escudo */}
          <div className="relative mx-auto mb-12" style={{ height: 200, maxWidth: 400 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Servidor */}
              <div className="relative">
                <div className="text-8xl" style={{ filter: 'drop-shadow(0 0 30px rgba(106,176,255,0.6))' }}>🖥️</div>
                {/* Escudo pulsante */}
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
                {/* Ícone de escudo */}
                <div className="absolute -top-4 -right-4 text-3xl animate-bounce">🔒</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.seguranca.items.map((item, i) => (
              <NeonBox key={i} cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
                <div className="p-5 text-center">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-black text-sm mb-2" style={{ color: '#34d399' }}>{item.titulo}</h3>
                  <p className="text-xs" style={{ color: '#3a6090', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </NeonBox>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 6 — ROBÔS / EXÉRCITO DE IA ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Texto */}
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
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                    <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>{item}</span>
                  </div>
                ))}
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </div>

            {/* Robôs animados */}
            <div className="relative flex items-center justify-center" style={{ height: 350 }}>
              {/* Robôs em fila */}
              <div className="flex gap-2 items-end">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1"
                    style={{ animation: `float-robot ${1.5 + i * 0.3}s ease-in-out infinite alternate`, animationDelay: `${i * 0.2}s` }}>
                    <div className="text-5xl md:text-6xl"
                      style={{ filter: `drop-shadow(0 0 ${15 + i * 5}px rgba(106,176,255,${0.6 + i * 0.1}))` }}>🤖</div>
                    <div className="text-xs font-mono" style={{ color: '#6ab0ff', opacity: 0.7 }}>IA.{i + 1}</div>
                    {/* Tela do laptop */}
                    <div className="w-10 h-7 rounded flex items-center justify-center"
                      style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(106,176,255,0.3)' }}>
                      <div className="w-6 h-4 rounded" style={{ background: 'rgba(52,211,153,0.3)' }}>
                        <div className="w-full h-0.5 rounded mt-0.5" style={{ background: '#34d399', animation: 'scan-line 1s linear infinite' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráficos ao fundo */}
              <div className="absolute top-0 right-0 left-0 h-20 flex items-end gap-1 px-4 opacity-40">
                {[40, 65, 35, 80, 55, 90, 70, 45, 85, 60].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t"
                    style={{ height: `${h}%`, background: `rgba(106,176,255,${0.3 + i * 0.05})`, transition: 'height 0.5s' }} />
                ))}
              </div>

              {/* Conexões entre robôs */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" style={{ opacity: 0.3 }}>
                  {[0, 1, 2].map(i => (
                    <line key={i}
                      x1={`${20 + i * 25}%`} y1="60%" x2={`${45 + i * 25}%`} y2="60%"
                      stroke="#6ab0ff" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 7 — MÓDULOS ============ */}
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
                <div className="p-3 text-center hover:scale-105 transition-transform cursor-pointer">
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

      {/* ============ SEÇÃO 8 — CLOWDBOT ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* ClowdBot */}
            <div className="relative order-2 md:order-1" style={{ height: 400 }}>
              <ClowdbotCanvas />
              {/* Status badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(4,10,22,0.9)', border: '1px solid rgba(52,211,153,0.4)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                <span className="text-xs font-bold" style={{ color: '#34d399' }}>{t.clowdbot.status}</span>
              </div>
            </div>
            {/* Texto */}
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

              {/* Terminal de pensamento */}
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

      {/* ============ SEÇÃO 9 — PLANOS ============ */}
      <section className="relative py-20 md:py-32"
        style={{ background: 'linear-gradient(135deg,rgba(10,22,40,0.95),rgba(2,8,16,1))' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-3"
              style={{ background: 'linear-gradient(135deg,#fff,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.planos.titulo}
            </h2>
            <p className="text-sm" style={{ color: '#3a6090' }}>{t.planos.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.planos.lista.map((p: any, i) => (
              <NeonBox key={i} cor={p.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6"
                className={p.destaque ? 'scale-105' : ''}>
                <div className="p-6 flex flex-col relative">
                  {p.destaque && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black"
                      style={{ background: 'linear-gradient(135deg,#ca8a04,#ea580c)', color: '#fff', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }}>
                      {t.planos.popular}
                    </div>
                  )}
                  <h3 className="text-2xl font-black mb-1 text-center" style={{ color: p.cor }}>{p.nome}</h3>
                  <p className="text-xs text-center mb-4" style={{ color: '#3a6090' }}>{p.desc}</p>
                  <div className="flex items-end justify-center gap-1 mb-2">
                    <span className="text-4xl font-black" style={{ color: '#c8d8f0' }}>R$ {p.preco}</span>
                    <span className="text-sm mb-1" style={{ color: '#3a6090' }}>{lang === 'pt' ? '/mês' : lang === 'en' ? '/mo' : '/mes'}</span>
                  </div>
                  <p className="text-xs text-center mb-4" style={{ color: '#3a5a8a' }}>{p.usuarios}</p>
                  {p.ia && (
                    <div className="flex justify-center mb-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>⭐ IA Premium</span>
                    </div>
                  )}
                  <div className="space-y-2 mb-6 flex-1">
                    {p.features.map((f: string, j: number) => (
                      <div key={j} className="flex items-center gap-2 text-xs" style={{ color: '#8aaad4' }}>
                        <span style={{ color: p.cor }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  {btn(t.comecar, () => router.push('/cadastro'), true, true)}
                </div>
              </NeonBox>
            ))}
          </div>
          <p className="text-center text-xs mt-6" style={{ color: '#1a3a5a' }}>{t.semCartao}</p>
        </div>
      </section>

      {/* ============ SEÇÃO 10 — CTA FINAL + MINI VULCÃO ============ */}
      <section className="relative py-24 md:py-40 overflow-hidden text-center">
        {/* Mini vulcão de fundo */}
        <div className="absolute inset-0 opacity-50">
          <VolcanoCanvas palavras={['AXIOMA', 'IA', 'R$', '∑', 'MEI', 'DRE', 'ROI', '%']} />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(2,8,16,0.8),rgba(2,8,16,0.5),rgba(2,8,16,0.9))' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-3xl md:text-6xl font-black mb-4"
            style={{ background: 'linear-gradient(135deg,#fff,#6ab0ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t.cta.titulo}
          </h2>
          <p className="text-sm md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: '#5a8ab4', lineHeight: 1.8 }}>{t.cta.sub}</p>
          <button onClick={() => router.push('/cadastro')}
            className="px-8 md:px-16 py-4 md:py-6 rounded-2xl font-black text-sm md:text-xl tracking-widest uppercase hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg,#1a3a8f,#2a5fd4,#a78bfa)', color: '#fff', boxShadow: '0 8px 60px rgba(42,95,212,0.6)' }}>
            {t.cta.btn}
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

      <style jsx>{`
        @keyframes float-robot {
          from { transform: translateY(0px); }
          to { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          from { opacity: 0.3; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes scan-line {
          from { transform: translateY(0); }
          to { transform: translateY(16px); }
        }
      `}</style>
    </div>
  )
}