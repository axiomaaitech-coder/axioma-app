# Graph Report - axioma  (2026-07-21)

## Corpus Check
- 94 files · ~324,370 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1102 nodes · 2477 edges · 90 communities (55 shown, 35 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21a66988`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- cfoCore.ts
- gerarPdfTabela
- page.tsx
- ModuloLayout.tsx
- page.tsx
- compilerOptions
- devDependencies
- page.tsx
- page.tsx
- 🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS
- 🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto
- page.tsx
- page.tsx
- useLanguage
- page.tsx
- page.tsx
- LanguageContext.tsx
- page.tsx
- page.tsx
- layout.tsx
- DashComercial.tsx
- DashFinanceiro.tsx
- page.tsx
- TopNav.tsx
- README.md
- page.tsx
- dependencies
- page.tsx
- middleware.ts
- CLAUDE.md
- cfoTextos.ts
- route.ts
- route.ts
- route.ts
- page.tsx
- register
- route.ts
- route.ts
- Fornecedores
- eslint.config.mjs
- fast-xml-parser
- framer-motion
- gsap
- @gsap/react
- html2canvas
- lucide-react
- next
- next.config.ts
- ofx-js
- pluggy-sdk
- posthog-js
- react
- recharts
- @sentry/nextjs
- stripe
- @stripe/stripe-js
- @supabase/auth-helpers-nextjs
- @supabase/ssr
- @supabase/supabase-js
- three
- @types/three
- xlsx
- postcss.config.mjs
- DashComercial.tsx
- page.tsx
- page.tsx
- bcbApi.ts
- page.tsx
- simulacaoMonteCarlo
- DashFinanceiro.tsx
- montarSnapshotsCarteira
- agruparPorCampo
- enviarPerguntaZIA
- echarts
- ibgeApi.ts
- concentracaoFornecedores
- fast-xml-parser

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 78 edges
2. `Fornecedores()` - 52 edges
3. `fBRL()` - 47 edges
4. `cfoT()` - 41 edges
5. `DREPage()` - 37 edges
6. `gerarPdfTabela()` - 37 edges
7. `ClientesPage()` - 36 edges
8. `fPct()` - 36 edges
9. `Metas()` - 35 edges
10. `Endividamento()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/dashboard/page.tsx → lib/LanguageContext.tsx
- `Sidebar()` --calls--> `useLanguage()`  [EXTRACTED]
  components/Sidebar.tsx → lib/LanguageContext.tsx
- `TopNav()` --calls--> `useLanguage()`  [EXTRACTED]
  components/TopNav.tsx → lib/LanguageContext.tsx
- `CentrosCustoPage()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/centros-custo/page.tsx → lib/LanguageContext.tsx
- `ClientesPage()` --calls--> `optBarrasV()`  [EXTRACTED]
  app/(interno)/clientes/page.tsx → lib/cfoCore.ts

## Import Cycles
- None detected.

## Communities (90 total, 35 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.08
Nodes (47): EmpresaPage(), formatBRL(), formatData(), formatDataHora(), PORTES, supabase, T, atualizarEmpresa() (+39 more)

### Community 1 - "page.tsx"
Cohesion: 0.08
Nodes (48): DESTINOS, formatBRL(), formatDataHora(), HistoricoBlock(), ImportarDocumentosPage(), PreviewBlock(), STATUS_INFO, supabase (+40 more)

### Community 2 - "page.tsx"
Cohesion: 0.07
Nodes (37): BigBarPanel(), COR, CORES_COMP, CORES_DIST, DashboardPage(), DonutPanel(), fBRL(), supabase (+29 more)

### Community 3 - "page.tsx"
Cohesion: 0.10
Nodes (37): CtxMeta, diasEntre(), DIRECAO_PADRAO, fmtData(), hojeISO(), inicioJanela24m(), inicioRolling12(), mesesNoPeriodo() (+29 more)

### Community 4 - "cfoCore.ts"
Cohesion: 0.06
Nodes (34): amostraTriangular(), analiseSensibilidade(), BucketLiquidez, BucketSemanal, CapitalOcioso, CenarioQuitacao, ChaveRiscoInvestimento, ClassificacaoMeta (+26 more)

### Community 5 - "gerarPdfTabela"
Cohesion: 0.06
Nodes (50): Centro, CentrosCustoPage(), CORES_CENTRO, getCor(), inputStyle, Lancamento, selectStyle, supabase (+42 more)

### Community 6 - "page.tsx"
Cohesion: 0.09
Nodes (28): categoriasCustoFixo, categoriasReceita, ContaReceberRow, CustoFixoRow, CustoVarRow, DividaRow, DREPage(), FluxoCaixaRow (+20 more)

### Community 8 - "page.tsx"
Cohesion: 0.09
Nodes (34): corTipo, inicioJanela24m(), inicioRolling12(), InvestimentoRow, Investimentos(), mesesNoPeriodo(), optBarrasPct(), supabase (+26 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/crypto-js (+19 more)

### Community 11 - "page.tsx"
Cohesion: 0.07
Nodes (28): calcularScoreAxiomaFornecedor(), ContaPagarRow, criarContrato(), criarProduto(), CriterioScoreAxioma, CurvaABCItem, distribuicaoGeografica(), documentosVencendo() (+20 more)

### Community 12 - "page.tsx"
Cohesion: 0.15
Nodes (23): fimJanelaFutura(), FluxoCaixa(), inicioJanelaHistorica(), isoHoje(), LancamentoFC, optEntradasSaidas(), supabase, tip (+15 more)

### Community 13 - "🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS"
Cohesion: 0.08
Nodes (25): 1. RESUMO EM UMA FRASE, 2. O ALICERCE (já construído e funcionando), 3-A. Metas (`/metas`) — CONECTADO a dados reais, entregue nesta rodada, 3-B. Investimentos (`/investimentos`) — CONECTADO a dados reais, Fase 1 entregue nesta rodada, 3-C. Simulações (`/simulacoes`) — reescrito do zero, entregue nesta rodada, 3-D. Precificação (`/precificacao`) — reescrito do zero, entregue nesta rodada, 3-E. Clientes (`/clientes`) — reescrito do zero, entregue nesta rodada, 3-F. Correção — contrato de `/api/ia-chat` em IA Financeira e IA Tributária (+17 more)

### Community 14 - "🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto"
Cohesion: 0.11
Nodes (17): COMO TRABALHAR NO CLAUDE CODE (fluxo por módulo), 🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto, COORDENADAS, 📋 DEPOIS DOS MÓDULOS FINANCEIROS, 🎨 IDENTIDADE VISUAL, ✅ JÁ CONSTRUÍDO (funcionando), `lib/cfoCore.ts` — cálculos + gráficos reutilizáveis, `lib/cfoTextos.ts` — traduções CFO centralizadas PT/EN/ES (+9 more)

### Community 15 - "page.tsx"
Cohesion: 0.15
Nodes (25): formatBRL(), IATributariaPage(), supabase, T, tooltipStyle, AlertaReforma, calcularAliquotaSimples(), calcularCargaTributaria() (+17 more)

### Community 16 - "page.tsx"
Cohesion: 0.16
Nodes (23): Divida, Endividamento(), inicioJanelaHistorica(), inicioRolling12(), mesesNoPeriodo(), supabase, tipos, calcularSinaisSolvencia() (+15 more)

### Community 17 - "useLanguage"
Cohesion: 0.18
Nodes (10): AtualizarSenha(), supabase, Cadastro(), Planos(), supabase, LoginPage(), RecuperarSenha(), useLanguage() (+2 more)

### Community 18 - "page.tsx"
Cohesion: 0.11
Nodes (31): CAT_COR, categorias, CustoFixo, CustosFixos(), supabase, CAT_COR, categorias, CATEGORIAS_RECORRENTES (+23 more)

### Community 20 - "LanguageContext.tsx"
Cohesion: 0.16
Nodes (9): grupos, Sidebar(), supabase, BANDEIRAS, LanguageContext, LanguageContextType, SeletorIdioma(), Idioma (+1 more)

### Community 21 - "page.tsx"
Cohesion: 0.17
Nodes (4): BG_PALAVRAS, idiomas, Reveal(), useInView()

### Community 22 - "page.tsx"
Cohesion: 0.08
Nodes (20): categorias, ContaPagar, contaVazia, EtapaCadastro, ETAPAS_CADASTRO, formasPagamento, Fornecedor, fornVazio (+12 more)

### Community 23 - "layout.tsx"
Cohesion: 0.22
Nodes (7): geistMono, geistSans, metadata, viewport, PostHogPageView(), PostHogProvider(), LanguageProvider()

### Community 24 - "DashComercial.tsx"
Cohesion: 0.08
Nodes (19): EtapaCadastro, ETAPAS_CADASTRO, FORM_CONTA_VAZIO, FORM_VAZIO, FormCliente, FormConta, inputStyle, labelStyle (+11 more)

### Community 25 - "DashFinanceiro.tsx"
Cohesion: 0.07
Nodes (27): BucketRecebimento, CardEspecialista, CLASSIFICACAO_LABEL, ClassificacaoCliente, ClienteSnapshot, ConselhoExecutivo, EstagioInadimplencia, EventoTimeline (+19 more)

### Community 26 - "page.tsx"
Cohesion: 0.11
Nodes (33): formatarValorMeta(), inicioJanela12m(), mesesNoPeriodo(), RegimeSimulado, ResultadoSimulacao, ResultadoTributario, Simulacoes(), supabase (+25 more)

### Community 27 - "TopNav.tsx"
Cohesion: 0.22
Nodes (4): grupos, Idioma, supabase, TopNav()

### Community 28 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 29 - "page.tsx"
Cohesion: 0.29
Nodes (5): BANCOS_FALLBACK, carregarPluggySDK(), OpenFinancePage(), supabase, textos

### Community 30 - "dependencies"
Cohesion: 0.29
Nodes (7): @anthropic-ai/sdk, fast-xml-parser, dependencies, @anthropic-ai/sdk, fast-xml-parser, react-dom, react-dom

### Community 31 - "page.tsx"
Cohesion: 0.38
Nodes (4): calcularIRPF(), FAIXAS_IRPF, ImpostoRendaMEI(), supabase

### Community 32 - "middleware.ts"
Cohesion: 0.43
Nodes (6): addSecurityHeaders(), checkRateLimit(), config, CONTAS_LIBERADAS, middleware(), rateLimitMap

### Community 34 - "cfoTextos.ts"
Cohesion: 0.08
Nodes (24): ArvoreMeta, BucketVencimento, ElasticidadeEstimada, GatilhoConselho, GatilhoConselhoDivida, GatilhoConselhoInvestimento, GatilhoConselhoMeta, ImpactoDesconto (+16 more)

### Community 49 - "Fornecedores"
Cohesion: 0.09
Nodes (23): Fornecedores(), detectarDesperdicio(), optRadar(), optVelocimetro(), radarRenovacoes(), comprasNoPeriodo(), contratosVencendo(), criarContato() (+15 more)

### Community 51 - "fast-xml-parser"
Cohesion: 0.16
Nodes (22): ConcorrenteRow, DecisaoRow, Precificacao(), ProdutoRow, supabase, WAR_PRESETS, calcularImpactoDesconto(), calcularImpactoPreco() (+14 more)

### Community 52 - "framer-motion"
Cohesion: 0.15
Nodes (19): CAT_COR, categorias, CustosVariaveis(), CustoVariavel, inicioJanelaHistorica(), supabase, compararPeriodosPorCategoria(), ComparativoPeriodo (+11 more)

### Community 76 - "DashComercial.tsx"
Cohesion: 0.36
Nodes (10): barrasV(), C, D, DashComercial(), fBRL(), fK(), linhaMetas(), rosca() (+2 more)

### Community 77 - "page.tsx"
Cohesion: 0.09
Nodes (11): DASObrigacoes(), supabase, FaturamentoMEI(), supabase, PainelMEI(), supabase, PrecificacaoMEI(), supabase (+3 more)

### Community 78 - "page.tsx"
Cohesion: 0.22
Nodes (9): Props, SeletorPeriodo(), Periodo, PeriodoPreset, cfoT(), montarNarrativaCausaRaiz(), montarNarrativaMargem(), montarNarrativaRunway() (+1 more)

### Community 79 - "bcbApi.ts"
Cohesion: 0.40
Nodes (5): agruparPorCampo(), receitaPorCidade(), receitaPorEstado(), receitaPorSegmento(), rotuloNaoInformado()

### Community 81 - "simulacaoMonteCarlo"
Cohesion: 0.18
Nodes (18): ClientesPage(), optDispersao(), calcularKpisCarteiraExecutivo(), classificarTendencia(), healthScoreCarteira(), montarConselhoExecutivo(), montarNarrativaIVCA(), montarNarrativaSinal() (+10 more)

### Community 82 - "DashFinanceiro.tsx"
Cohesion: 0.36
Nodes (10): barrasV(), C, D, DashFinanceiro(), fBRL(), fK(), linhaEndiv(), rosca() (+2 more)

### Community 83 - "montarSnapshotsCarteira"
Cohesion: 0.40
Nodes (5): calcularSaudeCliente(), detectarSinaisCliente(), diffDias(), montarSnapshotsCarteira(), ORDEM_GRAVIDADE_ESTAGIO

### Community 84 - "agruparPorCampo"
Cohesion: 0.40
Nodes (5): calcularIVCA(), clamp(), previsaoFaturamentoCliente(), probabilidadeInadimplenciaConta(), scoreRecebimento()

### Community 85 - "enviarPerguntaZIA"
Cohesion: 0.67
Nodes (3): enviarPerguntaZIA(), montarPromptZIA(), nomeTipoSinal()

### Community 87 - "ibgeApi.ts"
Cohesion: 0.29
Nodes (6): buscarEstados(), buscarMunicipios(), EstadoIBGE, FALLBACK_ESTADOS, MunicipioIBGE, ResultadoIBGE

### Community 88 - "concentracaoFornecedores"
Cohesion: 0.50
Nodes (4): concentracaoFornecedores, curvaABC(), diversificacaoFornecedores, gastoPorFornecedor()

## Knowledge Gaps
- **364 isolated node(s):** `supabase`, `Centro`, `Lancamento`, `CORES_CENTRO`, `inputStyle` (+359 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useLanguage()` connect `useLanguage` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `gerarPdfTabela`, `page.tsx`, `ModuloLayout.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `LanguageContext.tsx`, `page.tsx`, `DashComercial.tsx`, `page.tsx`, `TopNav.tsx`, `page.tsx`, `page.tsx`, `Fornecedores`, `fast-xml-parser`, `framer-motion`, `DashComercial.tsx`, `page.tsx`, `page.tsx`, `simulacaoMonteCarlo`, `DashFinanceiro.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `gerarPdfTabela()` connect `gerarPdfTabela` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `simulacaoMonteCarlo`, `page.tsx`, `Fornecedores`, `framer-motion`, `fast-xml-parser`, `page.tsx`, `DashComercial.tsx`, `page.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `page.tsx`, `devDependencies`, `page.tsx`, `gsap`, `@gsap/react`, `html2canvas`, `lucide-react`, `next`, `ofx-js`, `pluggy-sdk`, `posthog-js`, `react`, `recharts`, `@sentry/nextjs`, `stripe`, `@stripe/stripe-js`, `@supabase/auth-helpers-nextjs`, `@supabase/ssr`, `@supabase/supabase-js`, `three`, `@types/three`, `xlsx`, `page.tsx`, `echarts`, `fast-xml-parser`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `supabase`, `Centro`, `Lancamento` to the rest of the system?**
  _364 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07946127946127945 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07910014513788098 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07439613526570048 - nodes in this community are weakly interconnected._