# Graph Report - axioma  (2026-07-23)

## Corpus Check
- 107 files · ~392,968 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1359 nodes · 3232 edges · 90 communities (60 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36c1a55c`
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
- montarDRE
- page.tsx
- html2canvas
- lucide-react
- next
- next.config.ts
- ofx-js
- pluggy-sdk
- posthog-js
- react
- recharts
- recharts
- stripe
- centroCustoHelpers.ts
- page.tsx
- @supabase/ssr
- @supabase/supabase-js
- three
- @types/three
- xlsx
- postcss.config.mjs
- DashComercial.tsx
- page.tsx
- bcbApi.ts
- montarSnapshotsCarteira
- page.tsx
- simulacaoMonteCarlo
- DashFinanceiro.tsx
- montarSnapshotsCarteira
- echarts
- page.tsx
- ibgeApi.ts
- concentracaoFornecedores
- echarts-for-react
- fast-xml-parser

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 78 edges
2. `Fornecedores()` - 75 edges
3. `fBRL()` - 57 edges
4. `cfoT()` - 41 edges
5. `fPct()` - 38 edges
6. `gerarPdfTabela()` - 38 edges
7. `DREPage()` - 37 edges
8. `ClientesPage()` - 36 edges
9. `Metas()` - 36 edges
10. `🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS` - 36 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/dashboard/page.tsx → lib/LanguageContext.tsx
- `Sidebar()` --calls--> `useLanguage()`  [EXTRACTED]
  components/Sidebar.tsx → lib/LanguageContext.tsx
- `CentrosCustoPage()` --calls--> `fmt()`  [EXTRACTED]
  app/(interno)/centros-custo/page.tsx → components/PlanilhaCentroCusto.tsx
- `CentrosCustoPage()` --calls--> `orcamentoDoPeriodo()`  [EXTRACTED]
  app/(interno)/centros-custo/page.tsx → lib/centroCustoHelpers.ts
- `CentrosCustoPage()` --calls--> `analisarCausaRaiz()`  [EXTRACTED]
  app/(interno)/centros-custo/page.tsx → lib/centroCustoInteligenciaHelpers.ts

## Import Cycles
- None detected.

## Communities (90 total, 30 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.06
Nodes (51): EmpresaPage(), formatBRL(), formatData(), formatDataHora(), PORTES, supabase, T, grupos (+43 more)

### Community 1 - "page.tsx"
Cohesion: 0.08
Nodes (48): DESTINOS, formatBRL(), formatDataHora(), HistoricoBlock(), ImportarDocumentosPage(), PreviewBlock(), STATUS_INFO, supabase (+40 more)

### Community 2 - "page.tsx"
Cohesion: 0.07
Nodes (37): BigBarPanel(), COR, CORES_COMP, CORES_DIST, DashboardPage(), DonutPanel(), fBRL(), supabase (+29 more)

### Community 3 - "page.tsx"
Cohesion: 0.10
Nodes (39): CtxMeta, diasEntre(), DIRECAO_PADRAO, fmtData(), formatarValorMeta(), hojeISO(), inicioJanela24m(), inicioRolling12() (+31 more)

### Community 4 - "cfoCore.ts"
Cohesion: 0.05
Nodes (66): corTipo, inicioJanela24m(), inicioRolling12(), InvestimentoRow, Investimentos(), mesesNoPeriodo(), optBarrasPct(), supabase (+58 more)

### Community 5 - "gerarPdfTabela"
Cohesion: 0.07
Nodes (49): formatBRL(), IATributariaPage(), supabase, T, tooltipStyle, formatBRL(), MESES, Relatorios() (+41 more)

### Community 6 - "page.tsx"
Cohesion: 0.09
Nodes (52): CAT_COR, categorias, CustoFixo, CustosFixos(), supabase, CAT_COR, categorias, CustosVariaveis() (+44 more)

### Community 7 - "ModuloLayout.tsx"
Cohesion: 0.16
Nodes (19): ClientesPage(), optDispersao(), calcularKpisCarteiraExecutivo(), classificarTendencia(), detectarSinaisCliente(), healthScoreCarteira(), montarConselhoExecutivo(), montarNarrativaIVCA() (+11 more)

### Community 8 - "page.tsx"
Cohesion: 0.07
Nodes (32): primeiroRegistroAuditoria(), analisarCausaRaiz(), AUTOR_NAO_REGISTRADO, CausaRaizItem, CentralInsights, CentroLeve, Complexidade, COMPLEXIDADE_TIPO (+24 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/crypto-js (+11 more)

### Community 11 - "page.tsx"
Cohesion: 0.06
Nodes (33): atualizarDocumentoFornecedor(), atualizarInteracao(), avaliarCreditoReforma(), calcularScoreAxiomaFornecedor(), CreditoReformaFornecedor, criarDocumentoFornecedor(), criarInteracao(), CriterioScoreAxioma (+25 more)

### Community 12 - "page.tsx"
Cohesion: 0.08
Nodes (34): categoriasCustoFixo, categoriasReceita, ContaReceberRow, CustoFixoRow, CustoVarRow, DividaRow, DREPage(), FluxoCaixaRow (+26 more)

### Community 13 - "🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS"
Cohesion: 0.04
Nodes (48): 10. LEVANTAMENTO MULTI-TENANT (diagnóstico feito em 2026-07-23, nada foi alterado no banco nem no código), 11. MIGRAÇÃO MULTI-TENANT — arquivo entregue (2026-07-23), 12. EMPRESA PADRÃO AUTOMÁTICA — pré-requisito da tela de aceitar convite (decidido 2026-07-23), 1. RESUMO EM UMA FRASE, 2. O ALICERCE (já construído e funcionando), 3-A. Metas (`/metas`) — CONECTADO a dados reais, entregue nesta rodada, 3-B. Investimentos (`/investimentos`) — CONECTADO a dados reais, Fase 1 entregue nesta rodada, 3-C. Simulações (`/simulacoes`) — reescrito do zero, entregue nesta rodada (+40 more)

### Community 14 - "🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto"
Cohesion: 0.11
Nodes (18): COMO TRABALHAR NO CLAUDE CODE (fluxo por módulo), 🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto, COORDENADAS, 📋 DEPOIS DOS MÓDULOS FINANCEIROS, 🎨 IDENTIDADE VISUAL, ✅ JÁ CONSTRUÍDO (funcionando), `lib/cfoCore.ts` — cálculos + gráficos reutilizáveis, `lib/cfoTextos.ts` — traduções CFO centralizadas PT/EN/ES (+10 more)

### Community 15 - "page.tsx"
Cohesion: 0.36
Nodes (10): barrasV(), C, D, DashComercial(), fBRL(), fK(), linhaMetas(), rosca() (+2 more)

### Community 16 - "page.tsx"
Cohesion: 0.16
Nodes (23): Divida, Endividamento(), inicioJanelaHistorica(), inicioRolling12(), mesesNoPeriodo(), supabase, tipos, calcularSinaisSolvencia() (+15 more)

### Community 17 - "useLanguage"
Cohesion: 0.18
Nodes (10): AtualizarSenha(), supabase, Cadastro(), Planos(), supabase, LoginPage(), RecuperarSenha(), useLanguage() (+2 more)

### Community 18 - "page.tsx"
Cohesion: 0.14
Nodes (23): fimJanelaFutura(), FluxoCaixa(), inicioJanelaHistorica(), isoHoje(), LancamentoFC, optEntradasSaidas(), supabase, tip (+15 more)

### Community 19 - "page.tsx"
Cohesion: 0.33
Nodes (6): calcularIVCA(), calcularSaudeCliente(), calcularScoreAxiomaCliente(), clamp(), previsaoFaturamentoCliente(), probabilidadeInadimplenciaConta()

### Community 20 - "LanguageContext.tsx"
Cohesion: 0.16
Nodes (9): grupos, Sidebar(), supabase, BANDEIRAS, LanguageContext, LanguageContextType, SeletorIdioma(), Idioma (+1 more)

### Community 21 - "page.tsx"
Cohesion: 0.17
Nodes (4): BG_PALAVRAS, idiomas, Reveal(), useInView()

### Community 22 - "page.tsx"
Cohesion: 0.07
Nodes (23): categorias, CODIGOS_PAISES, ContaPagar, contaVazia, EtapaCadastro, ETAPAS_CADASTRO, formasPagamento, Fornecedor (+15 more)

### Community 23 - "layout.tsx"
Cohesion: 0.22
Nodes (7): geistMono, geistSans, metadata, viewport, PostHogPageView(), PostHogProvider(), LanguageProvider()

### Community 24 - "DashComercial.tsx"
Cohesion: 0.10
Nodes (16): EtapaCadastro, ETAPAS_CADASTRO, FORM_CONTA_VAZIO, FORM_VAZIO, FormCliente, FormConta, inputStyle, labelStyle (+8 more)

### Community 25 - "DashFinanceiro.tsx"
Cohesion: 0.06
Nodes (32): BucketRecebimento, CardEspecialista, CLASSIFICACAO_LABEL, ClassificacaoCliente, ConselhoExecutivo, CriterioScoreAxiomaCliente, EstagioInadimplencia, EventoTimeline (+24 more)

### Community 26 - "page.tsx"
Cohesion: 0.07
Nodes (50): CATEGORIAS_CASO, Inadimplencia(), supabase, optVelocimetro(), criarInteracao(), agruparInadimplenciaPorCampo(), AlavancasRecuperacao, atualizarProvisaoNaDRE() (+42 more)

### Community 28 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 29 - "page.tsx"
Cohesion: 0.29
Nodes (5): BANCOS_FALLBACK, carregarPluggySDK(), OpenFinancePage(), supabase, textos

### Community 30 - "dependencies"
Cohesion: 0.11
Nodes (19): @anthropic-ai/sdk, echarts, framer-motion, @gsap/react, dependencies, @anthropic-ai/sdk, echarts, framer-motion (+11 more)

### Community 31 - "page.tsx"
Cohesion: 0.38
Nodes (4): calcularIRPF(), FAIXAS_IRPF, ImpostoRendaMEI(), supabase

### Community 32 - "middleware.ts"
Cohesion: 0.43
Nodes (6): addSecurityHeaders(), checkRateLimit(), config, CONTAS_LIBERADAS, middleware(), rateLimitMap

### Community 34 - "cfoTextos.ts"
Cohesion: 0.06
Nodes (53): inicioJanela12m(), mesesNoPeriodo(), RegimeSimulado, ResultadoSimulacao, ResultadoTributario, Simulacoes(), supabase, acumular12Meses() (+45 more)

### Community 49 - "Fornecedores"
Cohesion: 0.11
Nodes (20): Agrupador, CentroLeve, ColunaId, COLUNAS, fmt(), Lang, LinhaPlanilha, PlanilhaCentroCusto() (+12 more)

### Community 51 - "fast-xml-parser"
Cohesion: 0.17
Nodes (20): ConcorrenteRow, DecisaoRow, Precificacao(), ProdutoRow, supabase, WAR_PRESETS, calcularImpactoDesconto(), calcularImpactoPreco() (+12 more)

### Community 52 - "framer-motion"
Cohesion: 0.09
Nodes (31): CATEGORIAS, CentroCusto, COLUNAS_PENDENTES_SQL, Conta, ContasReceber(), contaVazia, FORMAS_RECEBIMENTO, PRIORIDADES (+23 more)

### Community 53 - "montarDRE"
Cohesion: 0.67
Nodes (3): montarDRE(), simularImpactoProvisaoNaDRE(), simularCenariosRecebimento()

### Community 54 - "page.tsx"
Cohesion: 0.40
Nodes (5): agruparPorCampo(), receitaPorCidade(), receitaPorEstado(), receitaPorSegmento(), rotuloNaoInformado()

### Community 55 - "html2canvas"
Cohesion: 0.09
Nodes (29): CATEGORIAS_CONTAS_PAGAR, CATEGORIAS_CUSTOS_FIXOS, CATEGORIAS_CUSTOS_VARIAVEIS, Centro, CentrosCustoPage(), CORES_CENTRO, getCor(), inputStyle (+21 more)

### Community 63 - "react"
Cohesion: 0.09
Nodes (25): Lancamento, ClienteSnapshot, ContaRow, Idioma3, ScoreAxiomaCliente, SnapshotCarteira, agruparCarteiraPorCampo(), AlavancasRecebimento (+17 more)

### Community 64 - "recharts"
Cohesion: 0.67
Nodes (3): enviarPerguntaZIA(), montarPromptZIA(), nomeTipoSinal()

### Community 65 - "recharts"
Cohesion: 0.39
Nodes (7): avaliarExpressaoAritmetica(), avaliarFormula(), colunaParaIndice(), expandirRange(), indiceParaColuna(), ObterValorCelula, pareceFormula()

### Community 67 - "centroCustoHelpers.ts"
Cohesion: 0.13
Nodes (15): aplicarRateio(), AuditoriaRow, carregarAuditoriaCentro(), carregarLancamentosOrigem(), carregarOrcamentos(), carregarRateios(), carregarReceitasOrigem(), carregarTodosLancamentosOrigem() (+7 more)

### Community 68 - "page.tsx"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 77 - "page.tsx"
Cohesion: 0.10
Nodes (9): DASObrigacoes(), supabase, IAMEIAdvisor(), supabase, PainelMEI(), supabase, ModuloLayoutProps, jspdf (+1 more)

### Community 79 - "montarSnapshotsCarteira"
Cohesion: 0.08
Nodes (25): Fornecedores(), radarRenovacoes(), simularCenariosExecutivos(), formatarCPF(), validarCPF(), atualizarContato(), atualizarContrato(), atualizarProduto() (+17 more)

### Community 82 - "DashFinanceiro.tsx"
Cohesion: 0.36
Nodes (10): barrasV(), C, D, DashFinanceiro(), fBRL(), fK(), linhaEndiv(), rosca() (+2 more)

### Community 83 - "montarSnapshotsCarteira"
Cohesion: 0.09
Nodes (24): scoreRecebimento(), AlertaCobranca, atualizarCompromisso(), atualizarStatusCompromisso(), CANAIS_REGUA, CardExplicativo, CobrancaCompromisso, CobrancaInteracao (+16 more)

### Community 84 - "echarts"
Cohesion: 0.33
Nodes (7): identificarOportunidades(), detectarAnomaliasHistoricas(), detectarDesperdicio(), normalizarTexto(), contratosVencendo(), oportunidadesConsolidacao(), precoAcimaMediaInterna()

### Community 87 - "ibgeApi.ts"
Cohesion: 0.29
Nodes (6): buscarEstados(), buscarMunicipios(), EstadoIBGE, FALLBACK_ESTADOS, MunicipioIBGE, ResultadoIBGE

### Community 88 - "concentracaoFornecedores"
Cohesion: 0.50
Nodes (4): concentracaoFornecedores, curvaABC(), diversificacaoFornecedores, gastoPorFornecedor()

## Knowledge Gaps
- **454 isolated node(s):** `CATEGORIAS_CUSTOS_FIXOS`, `CATEGORIAS_CUSTOS_VARIAVEIS`, `CATEGORIAS_CONTAS_PAGAR`, `supabase`, `Centro` (+449 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `gerarPdfTabela()` connect `page.tsx` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `cfoCore.ts`, `gerarPdfTabela`, `ModuloLayout.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `DashComercial.tsx`, `page.tsx`, `cfoTextos.ts`, `Fornecedores`, `fast-xml-parser`, `framer-motion`, `html2canvas`, `page.tsx`, `montarSnapshotsCarteira`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `page.tsx`, `lucide-react`, `next`, `ofx-js`, `pluggy-sdk`, `posthog-js`, `stripe`, `page.tsx`, `@supabase/ssr`, `@supabase/supabase-js`, `three`, `@types/three`, `xlsx`, `page.tsx`, `page.tsx`, `simulacaoMonteCarlo`, `page.tsx`, `echarts-for-react`, `fast-xml-parser`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `useLanguage()` connect `useLanguage` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `cfoCore.ts`, `gerarPdfTabela`, `page.tsx`, `ModuloLayout.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `LanguageContext.tsx`, `page.tsx`, `DashComercial.tsx`, `page.tsx`, `TopNav.tsx`, `page.tsx`, `page.tsx`, `cfoTextos.ts`, `fast-xml-parser`, `framer-motion`, `html2canvas`, `DashComercial.tsx`, `page.tsx`, `bcbApi.ts`, `montarSnapshotsCarteira`, `DashFinanceiro.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `CATEGORIAS_CUSTOS_FIXOS`, `CATEGORIAS_CUSTOS_VARIAVEIS`, `CATEGORIAS_CONTAS_PAGAR` to the rest of the system?**
  _454 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07910014513788098 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07439613526570048 - nodes in this community are weakly interconnected._