# Graph Report - axioma  (2026-07-20)

## Corpus Check
- 91 files · ~283,534 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 912 nodes · 1989 edges · 81 communities (44 shown, 37 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8c272cb`
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
- page.tsx
- route.ts
- route.ts
- route.ts
- page.tsx
- register
- route.ts
- route.ts
- echarts-for-react
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
- bcbApi.ts
- page.tsx
- page.tsx
- page.tsx
- page.tsx

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 78 edges
2. `fBRL()` - 43 edges
3. `DREPage()` - 37 edges
4. `gerarPdfTabela()` - 37 edges
5. `Metas()` - 35 edges
6. `cfoT()` - 34 edges
7. `Endividamento()` - 31 edges
8. `fPct()` - 31 edges
9. `CustosVariaveis()` - 30 edges
10. `Investimentos()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/dashboard/page.tsx → lib/LanguageContext.tsx
- `TopNav()` --calls--> `useLanguage()`  [EXTRACTED]
  components/TopNav.tsx → lib/LanguageContext.tsx
- `CentrosCustoPage()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/centros-custo/page.tsx → lib/LanguageContext.tsx
- `ClientesPage()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/clientes/page.tsx → lib/LanguageContext.tsx
- `ContasReceber()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/contas-receber/page.tsx → lib/LanguageContext.tsx

## Import Cycles
- None detected.

## Communities (81 total, 37 thin omitted)

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
Nodes (37): CtxMeta, diasEntre(), DIRECAO_PADRAO, fmtData(), formatarValorMeta(), hojeISO(), inicioJanela24m(), inicioRolling12() (+29 more)

### Community 4 - "cfoCore.ts"
Cohesion: 0.06
Nodes (43): amostraTriangular(), analiseSensibilidade(), BucketLiquidez, BucketSemanal, CapitalOcioso, CenarioQuitacao, ChaveRiscoInvestimento, ClassificacaoMeta (+35 more)

### Community 5 - "gerarPdfTabela"
Cohesion: 0.06
Nodes (41): Centro, CentrosCustoPage(), CORES_CENTRO, getCor(), inputStyle, Lancamento, selectStyle, supabase (+33 more)

### Community 6 - "page.tsx"
Cohesion: 0.09
Nodes (30): categoriasCustoFixo, categoriasReceita, ContaReceberRow, CustoFixoRow, CustoVarRow, DividaRow, DREPage(), FluxoCaixaRow (+22 more)

### Community 7 - "ModuloLayout.tsx"
Cohesion: 0.15
Nodes (6): IAMEIAdvisor(), supabase, PrecificacaoMEI(), supabase, jspdf, jspdf

### Community 8 - "page.tsx"
Cohesion: 0.10
Nodes (30): corTipo, inicioJanela24m(), inicioRolling12(), InvestimentoRow, Investimentos(), mesesNoPeriodo(), optBarrasPct(), supabase (+22 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/crypto-js (+19 more)

### Community 11 - "page.tsx"
Cohesion: 0.15
Nodes (25): formatBRL(), IATributariaPage(), supabase, T, tooltipStyle, AlertaReforma, calcularAliquotaSimples(), calcularCargaTributaria() (+17 more)

### Community 12 - "page.tsx"
Cohesion: 0.15
Nodes (20): CAT_COR, categorias, CustosVariaveis(), CustoVariavel, inicioJanelaHistorica(), supabase, Props, SeletorPeriodo() (+12 more)

### Community 13 - "🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS"
Cohesion: 0.10
Nodes (19): 1. RESUMO EM UMA FRASE, 2. O ALICERCE (já construído e funcionando), 3-A. Metas (`/metas`) — CONECTADO a dados reais, entregue nesta rodada, 3-B. Investimentos (`/investimentos`) — CONECTADO a dados reais, Fase 1 entregue nesta rodada, 3-C. Simulações (`/simulacoes`) — reescrito do zero, entregue nesta rodada, 3. O QUE JÁ ESTÁ PRONTO E FUNCIONANDO, 4. PRÓXIMO PASSO, 5. FILA DEPOIS (menu Crescimento/Comercial) (+11 more)

### Community 14 - "🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto"
Cohesion: 0.11
Nodes (17): COMO TRABALHAR NO CLAUDE CODE (fluxo por módulo), 🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto, COORDENADAS, 📋 DEPOIS DOS MÓDULOS FINANCEIROS, 🎨 IDENTIDADE VISUAL, ✅ JÁ CONSTRUÍDO (funcionando), `lib/cfoCore.ts` — cálculos + gráficos reutilizáveis, `lib/cfoTextos.ts` — traduções CFO centralizadas PT/EN/ES (+9 more)

### Community 15 - "page.tsx"
Cohesion: 0.14
Nodes (24): fimJanelaFutura(), FluxoCaixa(), inicioJanelaHistorica(), isoHoje(), LancamentoFC, optEntradasSaidas(), supabase, tip (+16 more)

### Community 16 - "page.tsx"
Cohesion: 0.15
Nodes (24): Divida, Endividamento(), inicioJanelaHistorica(), inicioRolling12(), mesesNoPeriodo(), supabase, tipos, calcularSinaisSolvencia() (+16 more)

### Community 17 - "useLanguage"
Cohesion: 0.16
Nodes (11): AtualizarSenha(), supabase, Planos(), supabase, RecuperarSenha(), grupos, Sidebar(), supabase (+3 more)

### Community 18 - "page.tsx"
Cohesion: 0.11
Nodes (35): CAT_COR, categorias, CustoFixo, CustosFixos(), supabase, CAT_COR, categorias, CATEGORIAS_RECORRENTES (+27 more)

### Community 19 - "page.tsx"
Cohesion: 0.14
Nodes (24): formatBRL(), MESES, Relatorios(), supabase, T, tooltipStyle, calcularScoreCFO(), carregarDistribuicaoCustos() (+16 more)

### Community 20 - "LanguageContext.tsx"
Cohesion: 0.24
Nodes (5): BANDEIRAS, LanguageContext, LanguageContextType, Idioma, Traducoes

### Community 21 - "page.tsx"
Cohesion: 0.17
Nodes (4): BG_PALAVRAS, idiomas, Reveal(), useInView()

### Community 22 - "page.tsx"
Cohesion: 0.13
Nodes (23): inicioJanela12m(), mesesNoPeriodo(), RegimeSimulado, ResultadoSimulacao, ResultadoTributario, Simulacoes(), supabase, ChoqueSimulador (+15 more)

### Community 23 - "layout.tsx"
Cohesion: 0.22
Nodes (7): geistMono, geistSans, metadata, viewport, PostHogPageView(), PostHogProvider(), LanguageProvider()

### Community 24 - "DashComercial.tsx"
Cohesion: 0.36
Nodes (10): barrasV(), C, D, DashComercial(), fBRL(), fK(), linhaMetas(), rosca() (+2 more)

### Community 25 - "DashFinanceiro.tsx"
Cohesion: 0.36
Nodes (10): barrasV(), C, D, DashFinanceiro(), fBRL(), fK(), linhaEndiv(), rosca() (+2 more)

### Community 26 - "page.tsx"
Cohesion: 0.10
Nodes (22): ArvoreMeta, BucketVencimento, GatilhoConselho, GatilhoConselhoDivida, GatilhoConselhoInvestimento, GatilhoConselhoMeta, OportunidadeResgate, TipoMeta (+14 more)

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
Nodes (7): @anthropic-ai/sdk, echarts, dependencies, @anthropic-ai/sdk, echarts, react-dom, react-dom

### Community 31 - "page.tsx"
Cohesion: 0.38
Nodes (4): calcularIRPF(), FAIXAS_IRPF, ImpostoRendaMEI(), supabase

### Community 32 - "middleware.ts"
Cohesion: 0.43
Nodes (6): addSecurityHeaders(), checkRateLimit(), config, CONTAS_LIBERADAS, middleware(), rateLimitMap

### Community 34 - "page.tsx"
Cohesion: 0.60
Nodes (3): Cadastro(), LoginPage(), createClient()

### Community 76 - "bcbApi.ts"
Cohesion: 0.47
Nodes (5): acumular12Meses(), buscarIndicadoresMacro(), buscarUltimosValores(), FALLBACK, IndicadoresMacro

## Knowledge Gaps
- **294 isolated node(s):** `supabase`, `Centro`, `Lancamento`, `CORES_CENTRO`, `inputStyle` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useLanguage()` connect `useLanguage` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `gerarPdfTabela`, `page.tsx`, `ModuloLayout.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `LanguageContext.tsx`, `page.tsx`, `DashComercial.tsx`, `DashFinanceiro.tsx`, `TopNav.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `gerarPdfTabela()` connect `gerarPdfTabela` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `ModuloLayout.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `page.tsx`, `ModuloLayout.tsx`, `devDependencies`, `echarts-for-react`, `fast-xml-parser`, `framer-motion`, `gsap`, `@gsap/react`, `html2canvas`, `lucide-react`, `next`, `ofx-js`, `pluggy-sdk`, `posthog-js`, `react`, `recharts`, `@sentry/nextjs`, `stripe`, `@stripe/stripe-js`, `@supabase/auth-helpers-nextjs`, `@supabase/ssr`, `@supabase/supabase-js`, `three`, `@types/three`, `xlsx`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **What connects `supabase`, `Centro`, `Lancamento` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07946127946127945 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07910014513788098 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07439613526570048 - nodes in this community are weakly interconnected._