'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cinzel } from './(interno)/nexus/fonteJose'
import { fonteTitulo, fonteTexto } from './fontesLanding'
import { JosephAvatar } from '../components/JosephAvatar'
import { PLANOS, PLANO_RECURSOS, PLANO_DESCRICAO, ORDEM_PLANOS, reais } from '../lib/planos'

// ============================================================
// TRADUÇÕES COMPLETAS PT / EN / ES
// ============================================================
const idiomas = {
  pt: {
    login: 'Login', comecar: 'Começar Agora', comecarGratis: 'Testar 7 dias grátis',
    semCartao: '7 dias grátis com cartão (IA nos 3 primeiros dias). Cancele antes e não paga nada.',
    nav: { modulos: 'Módulos', planos: 'Planos', sobre: 'Sobre' },
    hero: {
      slogan: 'O Futuro Financeiro do Brasil Pensa Sozinho.',
      sloganSub: 'Um diretor financeiro com inteligência artificial que confere cada número da sua empresa, avisa antes do problema chegar e mostra o caminho — em português, inglês e espanhol.',
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
      badge: 'TRÊS IDIOMAS',
      titulo: 'Português, inglês e espanhol.',
      sub: 'Toda tela, relatório, manual e resposta da IA nos três idiomas. Impostos e obrigações seguem as regras do Brasil.',
      idiomas: ['Português', 'English', 'Español'],
      copy: 'Troque o idioma a qualquer momento, sem perder nenhum dado.',
    },
    visao: {
      badge: 'CONFERÊNCIA AUTOMÁTICA',
      titulo: 'Cada número conferido entre os módulos.',
      sub: 'Todo dia o Axioma confere se receitas, contas, caixa e contabilidade batem entre si — e mostra a diferença em reais quando algo não fecha.',
      items: ['Conferência diária entre módulos', 'Rastreabilidade de cada valor, da origem ao destino', 'Avisos de vencimentos e riscos antes de virarem problema', 'A IA confere os números que cita com os seus dados'],
    },
    mente: {
      badge: 'INTELIGÊNCIA ARTIFICIAL',
      titulo: 'Um diretor financeiro com IA, sempre disponível.',
      sub: 'Pergunte sobre caixa, impostos, custos ou preços: a IA responde com os números da sua empresa e as regras oficiais vigentes. Quem decide é sempre você.',
    },
    seguranca: {
      badge: 'SEGURANÇA',
      titulo: 'Seus dados protegidos.',
      sub: 'Cada empresa enxerga só os próprios dados. Pagamentos pelo Stripe, sem o Axioma guardar o seu cartão.',
      items: [
        { titulo: 'Dados separados', desc: 'Cada empresa e cada pessoa acessam só o que é delas.' },
        { titulo: 'Conexão protegida', desc: 'Tudo trafega criptografado, do navegador ao banco de dados.' },
        { titulo: 'Acesso seguro', desc: 'Login com Google ou e-mail, proteção anti-robô e equipe com hierarquia.' },
        { titulo: 'LGPD', desc: 'Tratamento de dados conforme a Lei Geral de Proteção de Dados.' },
      ],
    },
    robots: {
      badge: 'TRABALHA POR VOCÊ',
      titulo: 'Enquanto você cuida do negócio, o Axioma acompanha os números.',
      sub: 'Avisos de contas a vencer, conferência diária e alertas de risco chegam sem você precisar pedir.',
      items: ['Conferência diária entre módulos', 'Aviso de contas que vencem nos próximos dias', 'Painel de Risco com nota e explicação', 'Aprende com as suas correções de categoria e fornecedor'],
    },
    modulos: {
      titulo: 'Tudo que sua empresa precisa em um só lugar',
      sub: 'Mais de 40 módulos integrados, do MEI à empresa com vários sócios.',
      lista: [
        { nome: 'Nexus e o José', desc: 'Economia, mercado e notícias cruzados com a sua empresa', link: '/nexus-jose' },
        { nome: 'MEI completo', desc: 'Abrir MEI/ME, pagar o DAS, DASN e limite de faturamento' },
        { nome: 'Contas a Pagar', desc: 'Pague contas por dentro do Axioma' },
        { nome: 'Contas a Receber', desc: 'Cobrança e baixa de recebimentos' },
        { nome: 'Fluxo de Caixa', desc: 'Saldo real e previsão do caixa' },
        { nome: 'DRE', desc: 'Resultado por competência, mês a mês' },
        { nome: 'Receitas e Custos', desc: 'Fixos, variáveis e por categoria' },
        { nome: 'Contabilidade', desc: 'Livro Razão, Balancete e DRE contábil' },
        { nome: 'Fiscal e Reforma Tributária', desc: 'Regras oficiais vigentes, com fonte' },
        { nome: 'PDV', desc: 'Ponto de venda ligado ao estoque' },
        { nome: 'Estoque', desc: 'Entradas, giro e curva ABC' },
        { nome: 'Clientes e Fornecedores', desc: 'Cadastro, histórico e contratos' },
        { nome: 'Inadimplência', desc: 'Régua de cobrança e acordos' },
        { nome: 'Tesouraria', desc: 'Previsão de 7 a 90 dias' },
        { nome: 'Endividamento', desc: 'Dívidas, juros e parcelas' },
        { nome: 'Metas e Investimentos', desc: 'Acompanhe objetivos e carteira' },
        { nome: 'Simulações', desc: 'Cenários sem mexer nos dados reais' },
        { nome: 'Precificação', desc: 'Preço com custo e imposto reais' },
        { nome: 'Centros de Custo', desc: 'Gastos por área ou projeto' },
        { nome: 'Importar documentos', desc: 'NF-e, extrato, PDF e foto lidos pela IA' },
        { nome: 'Open Finance', desc: 'Conexão bancária via Pluggy' },
        { nome: 'IA Financeira', desc: 'Respostas com os números da empresa' },
        { nome: 'IA Tributária', desc: 'Impostos e regimes com regras oficiais' },
        { nome: 'Painel de Risco', desc: 'Nota de risco e métricas do CFO' },
        { nome: 'Conferência e Rastreabilidade', desc: 'Cada valor conferido, da origem ao destino' },
        { nome: 'Relatórios', desc: 'PDF, Excel e CSV prontos para compartilhar' },
        { nome: 'Equipe', desc: 'Pessoas com hierarquia e permissões' },
        { nome: 'Manual completo', desc: 'Cada tela explicada em 3 idiomas' },
      ] as { nome: string; desc: string; link?: string }[],
    },
    jose: {
      titulo: 'Nexus e o José',
      sub: 'O José é a inteligência econômica do Axioma. Todo dia ele lê a economia do Brasil e do mundo e explica o que isso muda para a sua empresa, com os seus números.',
      brasilTitulo: 'No Brasil',
      brasil: ['Câmbio, juros e inflação do Banco Central', 'Emprego e atividade do IBGE', 'Combustíveis nos postos (ANP)', 'Reforma Tributária pela página oficial do Senado'],
      mundoTitulo: 'No mundo',
      mundo: ['Petróleo Brent', 'Crescimento e inflação mundial', 'Matérias-primas que o Brasil exporta (FMI)', 'Comércio exterior'],
      tecTitulo: 'A tecnologia por trás',
      tec: [
        { titulo: 'Radar automático', desc: 'Percebe mudanças relevantes e marca o que mexe com o seu ramo.' },
        { titulo: 'E se...?', desc: 'Mude dólar, Selic, inflação ou vendas e veja o efeito no lucro e no caixa.' },
        { titulo: 'Placar de acertos', desc: 'Cada previsão é conferida depois, no prazo. Acertos e erros ficam à mostra.' },
        { titulo: 'Sem ficar parado', desc: 'Três motores de inteligência e fontes de reserva: se um falha, outro assume.' },
      ],
      nota: 'Só dados oficiais e os números da sua empresa. Leituras são interpretações, não recomendação de investimento. Incluído no plano Premium.',
      btn: 'Conheça o Nexus e o José',
    },
    clowdbot: {
      badge: '🤖 INTELIGÊNCIA DO AXIOMA',
      titulo: 'Seu gerente financeiro nunca dorme.',
      sub: 'A inteligência do Axioma lê os seus números, cruza com o mercado (Nexus e o José) e avisa o que fazer — quem decide é sempre você. Como ter um CFO de nível mundial disponível 24/7.',
      status: 'Sistema Neural Ativo',
      pensando: ['Analisando fluxo de caixa...', 'Detectando oportunidade de economia...', 'Gerando relatório DRE...', 'Calculando ponto de equilíbrio...', 'Otimizando tributação...'],
    },
    planos: {
      titulo: 'Escolha seu plano',
      sub: '7 dias grátis em qualquer plano. Inauguração: 30% off nos 3 primeiros meses para as 100 primeiras empresas.',
      popular: 'Mais escolhido',
      trial: '7 dias grátis',
      mes: '/mês',
    },
    cta: {
      titulo: 'Pronto para ter um CFO na sua empresa?',
      sub: 'Números reais, conferidos e explicados, para decidir com segurança.',
      btn: 'Testar 7 dias grátis',
      sub2: 'Cancele antes do fim do teste e não paga nada.',
    },
    footer: '© 2026 axiomaai.com.br — Axioma AI.Tech. Todos os direitos reservados.',
  },
  en: {
    login: 'Login', comecar: 'Start Now', comecarGratis: 'Start 7-Day Trial',
    semCartao: '7 days free. Cancel anytime.',
    nav: { modulos: 'Modules', planos: 'Plans', sobre: 'About' },
    hero: {
      slogan: 'Brazil’s Financial Future Thinks for Itself.',
      sloganSub: 'An AI-powered financial director that checks every number in your company, warns you before problems arrive and shows the way — in Portuguese, English and Spanish.',
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
      badge: 'THREE LANGUAGES',
      titulo: 'Portuguese, English and Spanish.',
      sub: 'Every screen, report, manual and AI answer in all three languages. Taxes and obligations follow Brazilian rules.',
      idiomas: ['Português', 'English', 'Español'],
      copy: 'Switch language at any time without losing any data.',
    },
    visao: {
      badge: 'AUTOMATIC CHECKS',
      titulo: 'Every number checked across modules.',
      sub: 'Every day Axioma checks whether revenue, bills, cash and accounting match — and shows the difference in reais when something does not add up.',
      items: ['Daily cross-module check', 'Traceability of every amount, from origin to destination', 'Due-date and risk alerts before they become problems', 'The AI checks the numbers it quotes against your data'],
    },
    mente: {
      badge: 'ARTIFICIAL INTELLIGENCE',
      titulo: 'A financial director with AI, always available.',
      sub: 'Ask about cash, taxes, costs or prices: the AI answers with your company’s numbers and the current official rules. You always make the decision.',
    },
    seguranca: {
      badge: 'SECURITY',
      titulo: 'Your data protected.',
      sub: 'Each company sees only its own data. Payments through Stripe — Axioma never stores your card.',
      items: [
        { titulo: 'Separated data', desc: 'Each company and each person access only what is theirs.' },
        { titulo: 'Protected connection', desc: 'Everything travels encrypted, from the browser to the database.' },
        { titulo: 'Secure access', desc: 'Google or e-mail login, anti-bot protection and a team with hierarchy.' },
        { titulo: 'LGPD', desc: 'Data handled under Brazil’s General Data Protection Law.' },
      ],
    },
    robots: {
      badge: 'WORKS FOR YOU',
      titulo: 'While you run the business, Axioma watches the numbers.',
      sub: 'Due-bill notices, daily checks and risk alerts arrive without you having to ask.',
      items: ['Daily cross-module check', 'Notice of bills due in the coming days', 'Risk Panel with a score and an explanation', 'Learns from your category and supplier corrections'],
    },
    modulos: {
      titulo: 'Everything your company needs in one place',
      sub: '40+ integrated modules, from MEI to companies with many partners.',
      lista: [
        { nome: 'Nexus and José', desc: 'Economy, markets and news matched to your company', link: '/nexus-jose' },
        { nome: 'Full MEI', desc: 'Open an MEI/ME, pay the DAS, DASN and revenue limit' },
        { nome: 'Accounts Payable', desc: 'Pay bills from inside Axioma' },
        { nome: 'Accounts Receivable', desc: 'Collections and receipt settlement' },
        { nome: 'Cash Flow', desc: 'Real balance and cash forecast' },
        { nome: 'P&L', desc: 'Accrual-basis results, month by month' },
        { nome: 'Revenue and Costs', desc: 'Fixed, variable and by category' },
        { nome: 'Accounting', desc: 'General Ledger, Trial Balance and accounting P&L' },
        { nome: 'Tax and Tax Reform', desc: 'Current official rules, with sources' },
        { nome: 'POS', desc: 'Point of sale linked to inventory' },
        { nome: 'Inventory', desc: 'Entries, turnover and ABC curve' },
        { nome: 'Customers and Suppliers', desc: 'Records, history and contracts' },
        { nome: 'Defaults', desc: 'Collection ladder and agreements' },
        { nome: 'Treasury', desc: '7 to 90-day forecast' },
        { nome: 'Debt', desc: 'Loans, interest and installments' },
        { nome: 'Goals and Investments', desc: 'Track objectives and portfolio' },
        { nome: 'Simulations', desc: 'Scenarios without touching real data' },
        { nome: 'Pricing', desc: 'Prices with real cost and tax' },
        { nome: 'Cost Centers', desc: 'Spending by area or project' },
        { nome: 'Import documents', desc: 'E-invoices, statements, PDF and photos read by AI' },
        { nome: 'Open Finance', desc: 'Bank connection via Pluggy' },
        { nome: 'Financial AI', desc: 'Answers with your company’s numbers' },
        { nome: 'Tax AI', desc: 'Taxes and regimes with official rules' },
        { nome: 'Risk Panel', desc: 'Risk score and CFO metrics' },
        { nome: 'Checks and Traceability', desc: 'Every amount checked, from origin to destination' },
        { nome: 'Reports', desc: 'PDF, Excel and CSV ready to share' },
        { nome: 'Team', desc: 'People with hierarchy and permissions' },
        { nome: 'Full manual', desc: 'Every screen explained in 3 languages' },
      ] as { nome: string; desc: string; link?: string }[],
    },
    jose: {
      titulo: 'Nexus and José',
      sub: 'José is Axioma’s economic intelligence. Every day he reads the Brazilian and world economy and explains what it changes for your company, using your numbers.',
      brasilTitulo: 'In Brazil',
      brasil: ['Exchange rate, interest and inflation from the Central Bank', 'Employment and activity from IBGE', 'Fuel prices at the pump (ANP)', 'Tax Reform from the Senate’s official page'],
      mundoTitulo: 'Worldwide',
      mundo: ['Brent oil', 'World growth and inflation', 'Commodities Brazil exports (IMF)', 'Foreign trade'],
      tecTitulo: 'The technology behind it',
      tec: [
        { titulo: 'Automatic radar', desc: 'Detects relevant changes and flags what affects your industry.' },
        { titulo: 'What if...?', desc: 'Change the dollar, Selic, inflation or sales and see the effect on profit and cash.' },
        { titulo: 'Track record', desc: 'Every forecast is checked later, on time. Hits and misses are shown openly.' },
        { titulo: 'Never stops', desc: 'Three intelligence engines and backup sources: if one fails, another takes over.' },
      ],
      nota: 'Only official data and your company’s numbers. Readings are interpretations, not investment advice. Included in the Premium plan.',
      btn: 'Meet Nexus and José',
    },
    clowdbot: {
      badge: '🤖 AXIOMA INTELLIGENCE',
      titulo: 'Your financial manager never sleeps.',
      sub: 'Axioma’s intelligence reads your numbers, cross-checks them with the market (Nexus and José) and tells you what to do — you always decide. Like having a world-class CFO available 24/7.',
      status: 'Neural System Active',
      pensando: ['Analyzing cash flow...', 'Detecting saving opportunity...', 'Generating P&L report...', 'Calculating break-even...', 'Optimizing taxation...'],
    },
    planos: {
      titulo: 'Choose your plan',
      sub: 'Start with 7 days free on any plan. Cancel anytime.',
      popular: 'Most chosen',
      trial: '7 days free',
      mes: '/mo',
    },
    cta: {
      titulo: 'Ready to have a CFO in your company?',
      sub: 'Real numbers, checked and explained, so you decide with confidence.',
      btn: 'Try 7 days free',
      sub2: 'Cancel before the trial ends and pay nothing.',
    },
    footer: '© 2026 axiomaai.com.br — Axioma AI.Tech. All rights reserved.',
  },
  es: {
    login: 'Iniciar Sesión', comecar: 'Empezar Ahora', comecarGratis: 'Empezar Prueba 7 Días',
    semCartao: '7 días gratis. Cancela cuando quieras.',
    nav: { modulos: 'Módulos', planos: 'Planes', sobre: 'Sobre' },
    hero: {
      slogan: 'El Futuro Financiero de Brasil Piensa Solo.',
      sloganSub: 'Un director financiero con inteligencia artificial que revisa cada número de su empresa, avisa antes de que llegue el problema y muestra el camino — en portugués, inglés y español.',
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
      badge: 'TRES IDIOMAS',
      titulo: 'Portugués, inglés y español.',
      sub: 'Cada pantalla, informe, manual y respuesta de la IA en los tres idiomas. Impuestos y obligaciones siguen las reglas de Brasil.',
      idiomas: ['Português', 'English', 'Español'],
      copy: 'Cambie el idioma en cualquier momento, sin perder ningún dato.',
    },
    visao: {
      badge: 'CONCILIACIÓN AUTOMÁTICA',
      titulo: 'Cada número verificado entre los módulos.',
      sub: 'Cada día Axioma verifica si ingresos, cuentas, caja y contabilidad coinciden — y muestra la diferencia en reales cuando algo no cierra.',
      items: ['Conciliación diaria entre módulos', 'Trazabilidad de cada valor, del origen al destino', 'Avisos de vencimientos y riesgos antes de que sean problemas', 'La IA verifica los números que cita con sus datos'],
    },
    mente: {
      badge: 'INTELIGENCIA ARTIFICIAL',
      titulo: 'Un director financiero con IA, siempre disponible.',
      sub: 'Pregunte sobre caja, impuestos, costos o precios: la IA responde con los números de su empresa y las reglas oficiales vigentes. Usted siempre decide.',
    },
    seguranca: {
      badge: 'SEGURIDAD',
      titulo: 'Sus datos protegidos.',
      sub: 'Cada empresa ve solo sus propios datos. Pagos por Stripe, sin que Axioma guarde su tarjeta.',
      items: [
        { titulo: 'Datos separados', desc: 'Cada empresa y cada persona acceden solo a lo suyo.' },
        { titulo: 'Conexión protegida', desc: 'Todo viaja cifrado, del navegador a la base de datos.' },
        { titulo: 'Acceso seguro', desc: 'Login con Google o e-mail, protección anti-robots y equipo con jerarquía.' },
        { titulo: 'LGPD', desc: 'Tratamiento de datos conforme a la Ley General de Protección de Datos de Brasil.' },
      ],
    },
    robots: {
      badge: 'TRABAJA POR USTED',
      titulo: 'Mientras usted cuida el negocio, Axioma sigue los números.',
      sub: 'Avisos de cuentas por vencer, conciliación diaria y alertas de riesgo llegan sin que tenga que pedirlos.',
      items: ['Conciliación diaria entre módulos', 'Aviso de cuentas que vencen en los próximos días', 'Panel de Riesgo con nota y explicación', 'Aprende de sus correcciones de categoría y proveedor'],
    },
    modulos: {
      titulo: 'Todo lo que su empresa necesita en un solo lugar',
      sub: 'Más de 40 módulos integrados, del MEI a la empresa con varios socios.',
      lista: [
        { nome: 'Nexus y José', desc: 'Economía, mercado y noticias cruzados con su empresa', link: '/nexus-jose' },
        { nome: 'MEI completo', desc: 'Abrir MEI/ME, pagar el DAS, DASN y límite de facturación' },
        { nome: 'Cuentas por Pagar', desc: 'Pague cuentas desde dentro de Axioma' },
        { nome: 'Cuentas por Cobrar', desc: 'Cobranza y baja de cobros' },
        { nome: 'Flujo de Caja', desc: 'Saldo real y previsión de caja' },
        { nome: 'Estado de Resultados', desc: 'Resultado por devengo, mes a mes' },
        { nome: 'Ingresos y Costos', desc: 'Fijos, variables y por categoría' },
        { nome: 'Contabilidad', desc: 'Libro Mayor, Balance y Estado de Resultados contable' },
        { nome: 'Fiscal y Reforma Tributaria', desc: 'Reglas oficiales vigentes, con fuente' },
        { nome: 'PDV', desc: 'Punto de venta conectado al inventario' },
        { nome: 'Inventario', desc: 'Entradas, rotación y curva ABC' },
        { nome: 'Clientes y Proveedores', desc: 'Registro, historial y contratos' },
        { nome: 'Morosidad', desc: 'Escalera de cobranza y acuerdos' },
        { nome: 'Tesorería', desc: 'Previsión de 7 a 90 días' },
        { nome: 'Endeudamiento', desc: 'Deudas, intereses y cuotas' },
        { nome: 'Metas e Inversiones', desc: 'Siga objetivos y cartera' },
        { nome: 'Simulaciones', desc: 'Escenarios sin tocar los datos reales' },
        { nome: 'Precios', desc: 'Precio con costo e impuesto reales' },
        { nome: 'Centros de Costo', desc: 'Gastos por área o proyecto' },
        { nome: 'Importar documentos', desc: 'NF-e, extractos, PDF y fotos leídos por IA' },
        { nome: 'Open Finance', desc: 'Conexión bancaria vía Pluggy' },
        { nome: 'IA Financiera', desc: 'Respuestas con los números de la empresa' },
        { nome: 'IA Tributaria', desc: 'Impuestos y regímenes con reglas oficiales' },
        { nome: 'Panel de Riesgo', desc: 'Nota de riesgo y métricas del CFO' },
        { nome: 'Conciliación y Trazabilidad', desc: 'Cada valor verificado, del origen al destino' },
        { nome: 'Informes', desc: 'PDF, Excel y CSV listos para compartir' },
        { nome: 'Equipo', desc: 'Personas con jerarquía y permisos' },
        { nome: 'Manual completo', desc: 'Cada pantalla explicada en 3 idiomas' },
      ] as { nome: string; desc: string; link?: string }[],
    },
    jose: {
      titulo: 'Nexus y José',
      sub: 'José es la inteligencia económica de Axioma. Cada día lee la economía de Brasil y del mundo y explica qué cambia para su empresa, con sus números.',
      brasilTitulo: 'En Brasil',
      brasil: ['Tipo de cambio, tasas e inflación del Banco Central', 'Empleo y actividad del IBGE', 'Combustibles en las estaciones (ANP)', 'Reforma Tributaria por la página oficial del Senado'],
      mundoTitulo: 'En el mundo',
      mundo: ['Petróleo Brent', 'Crecimiento e inflación mundial', 'Materias primas que Brasil exporta (FMI)', 'Comercio exterior'],
      tecTitulo: 'La tecnología detrás',
      tec: [
        { titulo: 'Radar automático', desc: 'Detecta cambios relevantes y marca lo que afecta a su rubro.' },
        { titulo: '¿Y si...?', desc: 'Cambie dólar, Selic, inflación o ventas y vea el efecto en la utilidad y la caja.' },
        { titulo: 'Marcador de aciertos', desc: 'Cada previsión se verifica después, en plazo. Aciertos y errores quedan a la vista.' },
        { titulo: 'Nunca se detiene', desc: 'Tres motores de inteligencia y fuentes de reserva: si uno falla, otro asume.' },
      ],
      nota: 'Solo datos oficiales y los números de su empresa. Las lecturas son interpretaciones, no recomendación de inversión. Incluido en el plan Premium.',
      btn: 'Conozca Nexus y José',
    },
    clowdbot: {
      badge: '🤖 INTELIGENCIA DE AXIOMA',
      titulo: 'Tu gerente financiero nunca duerme.',
      sub: 'La inteligencia de Axioma lee sus números, los cruza con el mercado (Nexus y José) y le avisa qué hacer — usted siempre decide. Como tener un CFO de nivel mundial disponible 24/7.',
      status: 'Sistema Neural Activo',
      pensando: ['Analizando flujo de caja...', 'Detectando oportunidad de ahorro...', 'Generando reporte P&G...', 'Calculando punto de equilibrio...', 'Optimizando tributación...'],
    },
    planos: {
      titulo: 'Elige tu plan',
      sub: 'Empieza con 7 días gratis en cualquier plan. Cancela cuando quieras.',
      popular: 'Más elegido',
      trial: '7 días gratis',
      mes: '/mes',
    },
    cta: {
      titulo: '¿Listo para tener un CFO en su empresa?',
      sub: 'Números reales, verificados y explicados, para decidir con seguridad.',
      btn: 'Probar 7 días gratis',
      sub2: 'Cancele antes del fin de la prueba y no paga nada.',
    },
    footer: '© 2026 axiomaai.com.br — Axioma AI.Tech. Todos los derechos reservados.',
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
// VIDEO FRAME — painel de vídeo premium (16:9, lazy-load)
// ============================================================
function VideoFrame({ src, className = '', children }: { src: string; cor?: string; className?: string; children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoaded(true); setVisible(true)
        videoRef.current?.play().catch(() => {})
      } else {
        setVisible(false)
        videoRef.current?.pause()
      }
    }, { threshold: 0.15, rootMargin: '300px 0px' }) // carrega só quando a pessoa chega perto
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={containerRef} className={`ax-video-frame relative w-full rounded-[20px] overflow-hidden ${className}`}
      style={{
        aspectRatio: '16 / 9',
        border: '1px solid rgba(46,204,155,0.25)',
        background: 'radial-gradient(ellipse at center, #06121f, #020810)',
        boxShadow: '0 30px 80px -30px rgba(46,204,155,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset',
      }}>
      {loaded && (
        <video ref={videoRef} autoPlay loop muted playsInline preload="auto"
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          className="absolute inset-0 w-full h-full object-contain ax-fade-video"
          style={{ zIndex: 1, filter: 'brightness(1.05) contrast(1.06) saturate(1.14)' }}>
          <source src={src} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, background: 'radial-gradient(ellipse at center, transparent 60%, rgba(2,8,16,0.35) 100%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ zIndex: 3, background: 'linear-gradient(90deg, transparent, #2ecc9b, transparent)' }} />
      {children}
    </div>
  )
}

// ============================================================
// BADGE — eyebrow premium reutilizável
// ============================================================
function Badge({ children, claro = false }: { children: React.ReactNode; cor?: string; claro?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
      style={claro ? { background: '#2ecc9b' } : { background: 'rgba(46,204,155,0.08)', border: '1px solid rgba(46,204,155,0.4)' }}>
      <span className="text-xs font-bold tracking-[0.12em]" style={{ color: claro ? '#101b3d' : '#2ecc9b' }}>{children}</span>
    </div>
  )
}

// ============================================================
// CARTÃO — azul-marinho, borda e faixa verde-menta ao passar o mouse (padrão Axioma)
// ============================================================
function NeonBox({ children, className = '', fundo = 'rgba(4,10,22,0.97)' }: { children: React.ReactNode; className?: string; fundo?: string; cor?: string; corB?: string; corC?: string; corD?: string }) {
  return (
    <div className={`ax-plano relative rounded-2xl overflow-hidden h-full ${className}`}
      style={{ background: fundo, border: '1px solid rgba(46,204,155,0.2)' }}>
      {children}
    </div>
  )
}

// ============================================================
// HERO VIDEO — slide único ("Uma Revolução Nascida no Brasil"),
// em loop contínuo (sem áudio, sem rotação de slides)
// ============================================================
function HeroVideos() {
  // O vídeo é 3:2 (1764×1176): aparece INTEIRO na altura da tela, sem corte. Sem cópia nas laterais
  // (parecia uma 2ª tela): as bordas do vídeo se dissolvem no fundo escuro.
  const fonte = <source src="/videos/hero-5.mp4" type="video/mp4" />
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ background: '#020810' }}>
      {/* Caixa no formato do vídeo (3:2) na altura toda; só as bordas laterais se dissolvem */}
      <div className="absolute top-0 bottom-0 left-1/2 md:left-[38%] -translate-x-1/2 h-full aspect-[3/2]"
        style={{ zIndex: 1, WebkitMaskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)', maskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)' }}>
        <video autoPlay loop muted playsInline preload="auto"
          controlsList="nodownload nofullscreen noremoteplayback" disablePictureInPicture disableRemotePlayback
          className="w-full h-full object-cover">
          {fonte}
        </video>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{ zIndex: 2, background: 'linear-gradient(to top, rgba(2,8,16,0.85), transparent)' }} />
    </div>
  )
}

// ============================================================
// TESTE — faixa branco + azul-marinho + verde-menta (referência do Elias, 2026-10-13).
// Se não aprovar, basta apagar este componente e o <SecaoBrancaMentaTeste /> abaixo do topo.
// Cores do tema-tokens.md: branco #ffffff, navy #101b3d, menta #2ecc9b (todo verde = menta padrão, pedido do Elias 2026-10-13)
// ============================================================
const TXT_BM = {
  pt: { t1: 'Gestão Financeira', t2: '& Inteligência que confere tudo', txt: 'O Axioma vai além da contabilidade: lê seus números todos os dias, cruza os módulos e avisa antes do problema chegar. Se a sua empresa cresce, a gente cresce junto.',
    saldo: 'Saldo em caixa', p1: 'Você conhece os ', p2: 'números', p3: ' da sua empresa?', cta: 'Quero conhecer',
    itens: ['Conferência diária', 'Painel de Risco', 'IA Financeira'] },
  en: { t1: 'Financial Management', t2: '& Intelligence that checks everything', txt: 'Axioma goes beyond accounting: it reads your numbers every day, cross-checks every module and warns you before problems arrive. When your company grows, we grow with it.',
    saldo: 'Cash balance', p1: 'Do you know your company’s ', p2: 'numbers', p3: '?', cta: 'Show me',
    itens: ['Daily cross-check', 'Risk Panel', 'Financial AI'] },
  es: { t1: 'Gestión Financiera', t2: '& Inteligencia que lo revisa todo', txt: 'Axioma va más allá de la contabilidad: lee sus números todos los días, cruza los módulos y avisa antes de que llegue el problema. Si su empresa crece, crecemos juntos.',
    saldo: 'Saldo en caja', p1: '¿Conoce los ', p2: 'números', p3: ' de su empresa?', cta: 'Quiero conocer',
    itens: ['Conciliación diaria', 'Panel de Riesgo', 'IA Financiera'] },
}

function SecaoBrancaMentaTeste({ lang, onCta }: { lang: 'pt' | 'en' | 'es'; onCta: () => void }) {
  const x = TXT_BM[lang]
  const NAVY = '#101b3d', MENTA = '#2ecc9b', MENTA_TX = '#2ecc9b'
  const icones = [
    <path key="a" d="M4 17l5-5 4 3 7-8M4 21h16" />,
    <path key="b" d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />,
    <path key="c" d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />,
  ]
  return (
    <section style={{ background: '#ffffff' }}>
      {/* Faixa branca: título + mockup com círculo menta */}
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="ax-display text-3xl md:text-5xl font-black leading-tight mb-5" style={{ color: NAVY }}>
            {x.t1}<br /><span style={{ color: MENTA_TX }}>{x.t2}</span>.
          </h2>
          <p className="text-sm md:text-base font-medium" style={{ color: '#374151', lineHeight: 1.8 }}>{x.txt}</p>
        </div>
        <div className="relative flex justify-center">
          <div className="absolute rounded-full" style={{ width: 280, height: 280, background: MENTA, bottom: -20, right: '18%' }} />
          <div className="relative rounded-3xl p-6 w-[260px]" style={{ background: '#ffffff', border: `6px solid ${NAVY}`, boxShadow: '0 24px 60px rgba(16,27,61,0.25)' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>{x.saldo}</p>
            <p className="text-3xl font-black mb-4" style={{ color: NAVY }}>R$ 41.140</p>
            <div className="flex items-end gap-2 h-28">
              {[40, 55, 35, 70, 60, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: i % 2 ? MENTA : NAVY }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Faixa azul-marinho: pergunta + botão contorno menta */}
      <div className="px-6 py-14 text-center" style={{ background: NAVY }}>
        <p className="ax-display text-2xl md:text-3xl font-black mb-7" style={{ color: '#ffffff' }}>
          {x.p1}<span style={{ color: MENTA }}>{x.p2}</span>{x.p3}
        </p>
        <button onClick={onCta} className="px-7 py-3 rounded-full font-bold text-sm transition-all hover:scale-105"
          style={{ color: '#ffffff', border: `2px solid ${MENTA}`, background: 'transparent' }}>{x.cta}</button>
      </div>
      {/* Faixa branca: 3 destaques com ícone menta */}
      <div className="max-w-5xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
        {x.itens.map((nome, i) => (
          <div key={nome} className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: MENTA }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{icones[i]}</svg>
            </div>
            <p className="text-lg font-black" style={{ color: MENTA_TX }}>{nome}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// LANDING PAGE PRINCIPAL
// ============================================================
export default function LandingPage() {
  const router = useRouter()
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>('pt')
  const t = idiomas[lang]


  const btn = (label: string, onClick: () => void, primary = true, full = false, claro = false) => (
    <button onClick={onClick}
      className={`${full ? 'w-full' : ''} relative px-6 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95 overflow-hidden group`}
      style={primary
        ? { background: '#2ecc9b', color: '#101b3d', boxShadow: '0 4px 24px rgba(46,204,155,0.25)' }
        : claro ? { background: 'transparent', color: '#101b3d', border: '1.5px solid #101b3d' }
        : { background: 'transparent', color: '#9fc4ff', border: '1px solid rgba(106,176,255,0.4)' }}>
      <span className="relative z-10">{label}</span>
      {primary && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
      )}
    </button>
  )

  // Luz verde-menta dos cartões .ax-mod: leva a posição do cursor para --mx/--my do cartão
  const seguirMouse = (e: React.PointerEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.ax-mod')
    if (!card) return
    const r = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${e.clientX - r.left}px`)
    card.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  // Paleta de texto — mais forte e legível
  const cBody = '#cfe0fa'
  const cMuted = '#9ab6e2'
  const cGold = '#F5D27A'

  return (
    <div className={`ax-root ${fonteTitulo.variable} ${fonteTexto.variable}`} style={{ background: '#020810', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-10 py-3"
        style={{ background: 'rgba(2,8,16,0.82)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(106,176,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo-aitech.png" alt="Axioma" style={{ width: 36, height: 36, filter: 'drop-shadow(0 0 15px rgba(106,176,255,0.8))' }} />
          <div>
            <p className="ax-display font-black tracking-[0.3em] text-sm" style={{ color: '#eaf2ff' }}>AXIOMA</p>
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
            style={{ background: '#2ecc9b', color: '#101b3d' }}>{t.comecar}</button>
        </div>
      </nav>

      {/* ============ SEÇÃO 1 — HERO (5 vídeos, inteiros) ============ */}
      {/* Topo no formato do vídeo (16:9) logo abaixo do menu: vídeo inteiro de ponta a ponta, sem corte nem faixa. Celular: preenche a altura. */}
      <section className="relative w-full mt-[60px] h-[calc(100svh-60px)] min-h-[420px] flex flex-col items-center justify-end overflow-hidden">
        <HeroVideos />
        <div className="relative z-10 w-full px-6 md:px-12 pb-24 md:pb-0 md:absolute md:inset-y-0 md:right-0 md:w-auto md:flex md:items-center">
          <div className="max-w-md md:max-w-[min(26rem,30vw)] text-left">
            <p className="ax-display text-2xl md:text-4xl font-black mb-3 leading-[1.18]" style={{ color: '#ffffff', textShadow: '0 2px 12px rgba(2,8,16,0.9)' }}>
              {t.hero.slogan}
            </p>
            <p className="text-sm md:text-base font-medium mb-5" style={{ color: '#cfe0fa', lineHeight: 1.7, textShadow: '0 2px 10px rgba(2,8,16,0.95)' }}>
              {t.hero.sloganSub}
            </p>
            <div className="flex">
              {btn(t.comecarGratis, () => router.push('/cadastro'))}
            </div>
            <p className="text-[10px] md:text-xs mt-3 font-medium" style={{ color: '#bcd6f8', textShadow: '0 2px 8px rgba(2,8,16,0.9)' }}>{t.semCartao}</p>
          </div>
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-1 h-8" style={{ background: 'linear-gradient(to bottom, transparent, #2ecc9b)' }} />
        </div>
      </section>

      <SecaoBrancaMentaTeste lang={lang} onCta={() => router.push('/cadastro')} />

      {/* ============ SEÇÃO 2 — EINSTEIN (vídeo 70 / texto 30) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden" style={{ background: '#101b3d' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-10 items-center">
            <Reveal>
              <Badge cor="#6ab0ff">{t.einstein.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-2 leading-tight"
                style={{ color: '#eaf2ff' }}>
                {t.einstein.titulo}
              </h2>
              <h3 className="ax-display text-lg md:text-2xl font-bold mb-5 leading-tight"
                style={{ color: '#eaf2ff' }}>
                {t.einstein.subTitulo}
              </h3>
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
      <section className="relative py-20 md:py-32 overflow-hidden ax-claro" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10 items-center">
            <Reveal>
              <VideoFrame src="/videos/nucleo.mp4" cor="#a78bfa" />
            </Reveal>
            <Reveal delay={0.12}>
              <Badge claro cor="#a78bfa">{t.platao.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-5 leading-tight"
                style={{ color: '#101b3d' }}>
                {t.platao.titulo}
              </h2>
              <div className="px-4 py-3 rounded-xl mb-5" style={{ background: 'rgba(46,204,155,0.06)', borderLeft: '3px solid #2ecc9b' }}>
                <p className="text-xs md:text-sm italic font-medium" style={{ color: '#374151', lineHeight: 1.6 }}>{t.platao.copy}</p>
              </div>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: '#374151', lineHeight: 1.8 }}>{t.platao.texto}</p>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 4 — DOMÍNIO GLOBAL (vídeo 70 / texto 30) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden" style={{ background: '#101b3d' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10 items-center">
            <Reveal>
              <VideoFrame src="/videos/globo.mp4" cor="#34d399" />
            </Reveal>
            <Reveal delay={0.12}>
              <Badge cor="#34d399">{t.global.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ color: '#eaf2ff' }}>
                {t.global.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.global.sub}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {t.global.idiomas.map((idioma, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={{ background: '#2ecc9b', border: '1px solid #2ecc9b', color: '#ffffff' }}>{idioma}</span>
                ))}
              </div>
              <div className="px-4 py-3 rounded-xl mb-5" style={{ background: '#2ecc9b', border: '1px solid #2ecc9b' }}>
                <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{t.global.copy}</p>
              </div>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 5 — VISÃO CIRÚRGICA (texto 30 / vídeo 70) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden ax-claro" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-10 items-center">
            <Reveal>
              <Badge claro cor="#a78bfa">{t.visao.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ color: '#101b3d' }}>
                {t.visao.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: '#374151', lineHeight: 1.7 }}>{t.visao.sub}</p>
              <div className="space-y-2.5 mb-5">
                {t.visao.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: '#2ecc9b', border: '1px solid #2ecc9b' }}>
                    <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>{item}</span>
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
      <section className="relative py-20 md:py-32 overflow-hidden" style={{ background: '#101b3d' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-10 items-center">
            <Reveal>
              <VideoFrame src="/videos/cerebro.mp4" cor="#6ab0ff" />
            </Reveal>
            <Reveal delay={0.12}>
              <Badge cor="#6ab0ff">{t.mente.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ color: '#eaf2ff' }}>
                {t.mente.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.mente.sub}</p>
              {btn(t.comecar, () => router.push('/cadastro'))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 7 — SEGURANÇA (BANNER largura total) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden ax-claro" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-10">
            <Badge claro cor="#34d399">{t.seguranca.badge}</Badge>
            <h2 className="ax-display text-3xl md:text-5xl font-black mb-4"
              style={{ color: '#101b3d' }}>
              {t.seguranca.titulo}
            </h2>
            <p className="text-sm md:text-lg max-w-2xl mx-auto font-medium" style={{ color: '#374151' }}>{t.seguranca.sub}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mb-12">
              <VideoFrame src="/videos/seguranca.mp4" cor="#34d399" />
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.seguranca.items.map((item, i) => (
              <Reveal key={i} delay={0.06 * i}>
                <NeonBox fundo="#2ecc9b" cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
                  <div className="p-5 text-center">
                    <h3 className="font-bold text-base mb-2" style={{ color: '#ffffff' }}>{item.titulo}</h3>
                    <p className="text-sm font-medium" style={{ color: '#ffffff', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </NeonBox>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 8 — EXÉRCITO DE IA (texto 30 / vídeo 70) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden" style={{ background: '#101b3d' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-10 items-center">
            <Reveal>
              <Badge cor="#fbbf24">{t.robots.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ color: '#eaf2ff' }}>
                {t.robots.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.robots.sub}</p>
              <div className="space-y-2.5 mb-5">
                {t.robots.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: '#2ecc9b', border: '1px solid #2ecc9b' }}>
                    <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>{item}</span>
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
      <section className="relative py-20 md:py-32 ax-claro" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-10">
            <h2 className="ax-display text-3xl md:text-5xl font-black mb-3" style={{ color: '#101b3d' }}>{t.modulos.titulo}</h2>
            <p className="text-sm md:text-lg font-medium" style={{ color: '#4b5563' }}>{t.modulos.sub}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mb-12">
              <VideoFrame src="/videos/dna.mp4" cor="#6ab0ff" />
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
            onPointerMove={seguirMouse}>
            {t.modulos.lista.map((m, i) => (
              <a key={i} href={m.link ?? '/cadastro'} className="ax-mod group relative block rounded-2xl p-6 md:p-7 min-h-[150px]">
                <span className="ax-mod-faixa" aria-hidden="true" />
                <p className="ax-mod-nome font-extrabold text-lg md:text-xl mb-2 leading-snug">{m.nome}</p>
                <p className="text-sm md:text-base font-medium leading-relaxed" style={{ color: '#ffffff' }}>{m.desc}</p>
              </a>
            ))}
          </div>
          <div className="text-center mt-10">
            {btn(t.comecarGratis, () => router.push('/cadastro'))}
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 9b — NEXUS E O JOSÉ (resumo da página /nexus-jose) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden" style={{ background: '#101b3d' }}>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 md:gap-14 items-center mb-12">
            <Reveal className="mx-auto">
              <div className="relative">
                <div className="absolute inset-0 rounded-full" aria-hidden="true"
                  style={{ background: 'radial-gradient(circle, rgba(46,204,155,0.28), transparent 70%)', transform: 'scale(1.35)' }} />
                <div className="relative"><JosephAvatar tamanho={220} /></div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="text-4xl md:text-6xl font-bold mb-5" style={{ fontFamily: cinzel.style.fontFamily, color: '#eaf2ff' }}>{t.jose.titulo}</h2>
              <p className="text-base md:text-xl leading-relaxed mb-8 max-w-2xl" style={{ color: cBody }}>{t.jose.sub}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {([[t.jose.brasilTitulo, t.jose.brasil], [t.jose.mundoTitulo, t.jose.mundo]] as const).map(([tit, itens]) => (
                  <div key={tit}>
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: cinzel.style.fontFamily, color: '#2ecc9b' }}>{tit}</h3>
                    <ul className="space-y-2">
                      {itens.map(it => (
                        <li key={it} className="flex gap-2 text-sm md:text-base" style={{ color: cBody }}>
                          <span aria-hidden="true" style={{ color: '#2ecc9b' }}>✓</span><span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-6" style={{ fontFamily: cinzel.style.fontFamily, color: '#eaf2ff' }}>{t.jose.tecTitulo}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8" onPointerMove={seguirMouse}>
            {t.jose.tec.map(it => (
              <div key={it.titulo} className="ax-mod relative rounded-2xl p-6">
                <span className="ax-mod-faixa" aria-hidden="true" />
                <p className="ax-mod-nome font-extrabold text-lg mb-2">{it.titulo}</p>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: cBody }}>{it.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm mb-6 max-w-3xl" style={{ color: cMuted }}>{t.jose.nota}</p>
          {btn(t.jose.btn, () => router.push('/nexus-jose'))}
        </div>
      </section>

      {/* ============ SEÇÃO 10 — CLOWDBOT (vídeo 70 / texto 30) ============ */}
      <section className="relative py-20 md:py-32 overflow-hidden ax-claro" style={{ background: '#ffffff' }}>
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
              <Badge claro cor="#6ab0ff">{t.clowdbot.badge}</Badge>
              <h2 className="ax-display text-2xl md:text-4xl font-black mb-4 leading-tight"
                style={{ color: '#101b3d' }}>
                {t.clowdbot.titulo}
              </h2>
              <p className="text-xs md:text-sm mb-5 font-medium" style={{ color: '#374151', lineHeight: 1.7 }}>{t.clowdbot.sub}</p>
              <div className="flex flex-wrap gap-3">
                {btn(lang === 'en' ? 'Meet Nexus and José' : lang === 'es' ? 'Conozca Nexus y José' : 'Conheça o Nexus e o José', () => router.push('/nexus-jose'))}
                {btn(t.comecar, () => router.push('/cadastro'), false, false, true)}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SEÇÃO 11 — DESTAQUE ROBÔ IA (banner antes dos planos) ============ */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: '#101b3d' }}>
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <Reveal>
            <Badge>{lang === 'en' ? 'SMART PANEL' : lang === 'es' ? 'PANEL INTELIGENTE' : 'PAINEL INTELIGENTE'}</Badge>
            <h2 className="ax-display text-2xl md:text-4xl font-black mb-6"
              style={{ color: '#eaf2ff' }}>
              {lang === 'en' ? 'Your whole company, in one panel.' : lang === 'es' ? 'Toda su empresa, en un solo panel.' : 'Sua empresa inteira, em um só painel.'}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative rounded-[20px] overflow-hidden mx-auto"
              style={{ border: '1px solid rgba(46,204,155,0.35)', boxShadow: '0 40px 100px -30px rgba(46,204,155,0.3)' }}>
              <img src="/robo-ia.png" alt="Painel IA Axioma" className="w-full h-auto block" />
              <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, #2ecc9b, transparent)', boxShadow: '0 0 18px #2ecc9b' }} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ SEÇÃO 12 — PLANOS 4 NÍVEIS ============ */}
      <section className="relative py-20 md:py-32 ax-claro" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-14">
            <h2 className="ax-display text-3xl md:text-5xl font-black mb-3"
              style={{ color: '#101b3d' }}>
              {t.planos.titulo}
            </h2>
            <p className="text-sm font-medium" style={{ color: '#4b5563' }}>{t.planos.sub}</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-4">
            {ORDEM_PLANOS.map((id, i) => {
              const p = PLANOS[id]
              const destaque = id === 'business'
              return (
              <Reveal key={id} delay={0.07 * i} className="h-full">
                <div className="ax-plano relative h-full rounded-2xl"
                  style={{ background: '#101b3d', border: `1px solid ${destaque ? 'rgba(46,204,155,0.6)' : 'rgba(46,204,155,0.2)'}` }}>
                  {destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap z-10"
                      style={{ background: '#101b3d', color: '#ffffff', border: '1px solid rgba(46,204,155,0.6)' }}>
                      {t.planos.popular}
                    </div>
                  )}
                  <div className="p-5 pt-7 flex flex-col h-full">
                    <h3 className="text-2xl font-bold mb-1 text-center" style={{ color: '#2ecc9b', fontFamily: cinzel.style.fontFamily }}>{p.nome[lang]}</h3>
                    <p className="text-sm text-center mb-3 font-medium" style={{ color: '#ffffff' }}>{PLANO_DESCRICAO[id][lang]}</p>
                    <div className="flex items-end justify-center gap-1 mb-1">
                      <span className="text-3xl xl:text-4xl font-bold whitespace-nowrap" style={{ color: '#ffffff', fontFamily: cinzel.style.fontFamily }}>{reais(p.mensalCentavos, lang)}</span>
                      <span className="text-sm mb-1" style={{ color: '#ffffff' }}>{t.planos.mes}</span>
                    </div>
                    <p className="text-sm text-center mb-3 font-medium" style={{ color: '#ffffff' }}>{lang === 'en' ? `up to ${p.pessoas} ${p.pessoas > 1 ? 'people' : 'person'}` : lang === 'es' ? `hasta ${p.pessoas} persona${p.pessoas > 1 ? 's' : ''}` : `até ${p.pessoas} pessoa${p.pessoas > 1 ? 's' : ''}`}</p>
                    <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: '#2ecc9b', color: '#ffffff' }}>
                      <p className="font-bold mb-1" style={{ color: '#101b3d' }}>{lang === 'en' ? 'AI per month' : lang === 'es' ? 'IA por mes' : 'IA por mês'}</p>
                      <p>{p.ia.openai.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR')} {lang === 'en' ? 'standard AI questions' : lang === 'es' ? 'preguntas IA común' : 'perguntas IA comum'}</p>
                      <p>{p.ia.anthropic} {lang === 'en' ? 'advanced AI questions' : lang === 'es' ? 'preguntas IA avanzada' : 'perguntas IA avançada'}</p>
                      <p>{p.ia.nota} {lang === 'en' ? 'invoices read by AI' : lang === 'es' ? 'facturas leídas por IA' : 'notas lidas pela IA'}</p>
                    </div>
                    <div className="space-y-2 mb-5 flex-1">
                      {PLANO_RECURSOS[id][lang].map((f, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm font-medium" style={{ color: '#ffffff' }}>
                          <span style={{ color: '#2ecc9b' }}>✓</span> <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    {btn(t.comecarGratis, () => router.push('/cadastro'), true, true)}
                  </div>
                </div>
              </Reveal>
              )
            })}
          </div>
          <p className="text-center text-xs mt-8 font-medium" style={{ color: '#4b5563' }}>{t.semCartao}</p>
        </div>
      </section>

      {/* ============ SEÇÃO 13 — CTA FINAL (logo no lugar do foguete) ============ */}
      <section className="relative py-24 md:py-40 overflow-hidden text-center" style={{ background: '#101b3d' }}>
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(46,204,155,0.12) 0%, transparent 60%)', animation: 'pulse-aura 4s ease-in-out infinite alternate' }} />
        </div>
        <div className="absolute inset-0" style={{ background: 'transparent' }} />
        <Reveal className="relative z-10 max-w-4xl mx-auto px-4">
          <img src="/logo-aitech.png" alt="Axioma" className="mx-auto mb-6"
            style={{ width: 96, height: 96, objectFit: 'contain', filter: 'drop-shadow(0 0 24px rgba(46,204,155,0.6))', animation: 'logo-float 4s ease-in-out infinite alternate' }} />
          <h2 className="ax-display text-3xl md:text-6xl font-black mb-4"
            style={{ color: '#eaf2ff' }}>
            {t.cta.titulo}
          </h2>
          <p className="text-sm md:text-xl mb-8 max-w-2xl mx-auto font-medium" style={{ color: cBody, lineHeight: 1.7 }}>{t.cta.sub}</p>
          <button onClick={() => router.push('/cadastro')}
            className="relative px-10 md:px-20 py-5 md:py-7 rounded-2xl font-black text-sm md:text-xl tracking-widest uppercase hover:scale-105 transition-all overflow-hidden group"
            style={{ background: '#2ecc9b', color: '#101b3d', boxShadow: '0 8px 40px rgba(46,204,155,0.3)' }}>
            <span className="relative z-10">{t.cta.btn}</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
          </button>
          <p className="text-sm mt-4 font-medium" style={{ color: cMuted }}>{t.cta.sub2}</p>
          <p className="text-xs mt-2" style={{ color: '#9ab6e2' }}>{t.semCartao}</p>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="text-center py-8 px-4" style={{ borderTop: '1px solid rgba(59,111,212,0.1)', background: '#020810' }}>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 text-xs" style={{ color: '#9ab6e2' }}>
          <a href="/termos" className="hover:text-[#2ecc9b] transition-colors">{lang === 'pt' ? 'Termos de Uso' : lang === 'en' ? 'Terms of Use' : 'Términos de Uso'}</a>
          <span aria-hidden="true">·</span>
          <a href="/privacidade" className="hover:text-[#2ecc9b] transition-colors">{lang === 'pt' ? 'Política de Privacidade' : lang === 'en' ? 'Privacy Policy' : 'Política de Privacidad'}</a>
          <span aria-hidden="true">·</span>
          <a href="/login" className="hover:text-[#2ecc9b] transition-colors">{t.login}</a>
        </nav>
        <p className="text-xs" style={{ color: '#5a7aaa' }}>{t.footer}</p>
      </footer>

      <style jsx global>{`
        .ax-root { font-family: var(--ax-texto), system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
        .ax-root .ax-display { font-family: var(--ax-titulo), sans-serif; letter-spacing: -0.01em; font-weight: 700; }
        .ax-root h1, .ax-root h2, .ax-root h3 { font-family: var(--ax-titulo), sans-serif; line-height: 1.18; padding-bottom: 0.12em; font-weight: 700; letter-spacing: -0.005em; }
        .ax-eyebrow { font-family: var(--ax-titulo), sans-serif; }

        /* Faixas brancas (teste de alternância branco / azul-marinho / verde-menta) */
        .ax-claro .ax-mod { background: #101b3d; border-color: rgba(46,204,155,0.3); box-shadow: 0 14px 34px -18px rgba(16,27,61,0.45); }
        .ax-claro .ax-plano { box-shadow: 0 14px 34px -18px rgba(16,27,61,0.45); }
        .ax-claro .ax-plano:hover { box-shadow: 0 0 40px rgba(46,204,155,0.18), 0 18px 40px -20px rgba(16,27,61,0.3); }

        .ax-tilt { transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s ease; transform-style: preserve-3d; }
        .ax-tilt:hover { transform: perspective(900px) translateY(-8px) rotateX(4deg) rotateY(-4deg) scale(1.02); }

        .ax-video-frame { transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease; }
        .ax-video-frame:hover { transform: translateY(-6px) scale(1.01); }
        .ax-plano { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .ax-plano::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #2ecc9b; border-radius: 16px 16px 0 0; opacity: 0; transition: opacity 0.25s ease; }
        .ax-plano:hover { transform: translateY(-4px); border-color: rgba(46,204,155,0.6) !important; box-shadow: 0 0 50px rgba(46,204,155,0.18), 0 18px 40px -20px rgba(0,0,0,0.6); }
        .ax-plano:hover::before { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .ax-plano, .ax-plano:hover { transform: none; } }

        /* Cartões de módulos: nome verde-menta, luz que segue o mouse e borda que acende onde o cursor está */
        .ax-mod { background: linear-gradient(160deg, rgba(10,30,52,0.95), rgba(4,10,22,0.98)); border: 1px solid rgba(46,204,155,0.22); overflow: hidden; isolation: isolate;
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), border-color 0.35s ease, box-shadow 0.35s ease; }
        .ax-mod::after { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: 0; transition: opacity 0.35s ease;
          background: radial-gradient(360px circle at var(--mx, 50%) var(--my, 0%), rgba(46,204,155,0.18), transparent 65%); }
        .ax-mod::before { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; opacity: 0; transition: opacity 0.35s ease;
          background: radial-gradient(240px circle at var(--mx, 50%) var(--my, 0%), #2ecc9b, transparent 70%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
        .ax-mod-faixa { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #2ecc9b; transform: scaleX(0); transform-origin: left; transition: transform 0.45s cubic-bezier(0.22,1,0.36,1); }
        .ax-mod-nome { color: #2ecc9b; text-shadow: 0 0 18px rgba(46,204,155,0.25); transition: text-shadow 0.35s ease, letter-spacing 0.35s ease; }
        .ax-mod:hover, .ax-mod:focus-visible { transform: translateY(-6px); border-color: rgba(46,204,155,0.55); box-shadow: 0 24px 50px -24px rgba(46,204,155,0.45), 0 0 0 1px rgba(46,204,155,0.08) inset; outline: none; }
        .ax-mod:hover::after, .ax-mod:hover::before, .ax-mod:focus-visible::before { opacity: 1; }
        .ax-mod:hover .ax-mod-faixa, .ax-mod:focus-visible .ax-mod-faixa { transform: scaleX(1); }
        .ax-mod:hover .ax-mod-nome { text-shadow: 0 0 22px rgba(46,204,155,0.55); letter-spacing: 0.01em; }
        @media (prefers-reduced-motion: reduce) { .ax-mod, .ax-mod:hover { transform: none; } }

        .ax-neon {
          color: #2ecc9b;
          background: linear-gradient(100deg, #2ecc9b 20%, #ffffff 50%, #2ecc9b 80%);
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