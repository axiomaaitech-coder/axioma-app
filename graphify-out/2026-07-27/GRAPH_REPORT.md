# Graph Report - axioma  (2026-07-27)

## Corpus Check
- 113 files · ~423,472 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1472 nodes · 3474 edges · 95 communities (66 shown, 29 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a8a1f22`
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
- 10. LEVANTAMENTO MULTI-TENANT (diagnóstico feito em 2026-07-23, nada foi alterado no banco nem no código)
- ibgeApi.ts
- concentracaoFornecedores
- echarts-for-react
- fast-xml-parser
- xlsx
- page.tsx
- xlsx
- pluggy-sdk

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 80 edges
2. `Fornecedores()` - 75 edges
3. `fBRL()` - 59 edges
4. `🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS` - 53 edges
5. `cfoT()` - 41 edges
6. `gerarPdfTabela()` - 39 edges
7. `DREPage()` - 38 edges
8. `fPct()` - 38 edges
9. `Metas()` - 37 edges
10. `ClientesPage()` - 36 edges

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

## Communities (95 total, 29 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.08
Nodes (45): EmpresaPage(), formatBRL(), formatData(), formatDataHora(), PORTES, supabase, T, atualizarEmpresa() (+37 more)

### Community 1 - "page.tsx"
Cohesion: 0.12
Nodes (32): autodetectarMapeamento(), coletarPorChave(), combinarDataHora(), contarPalavras(), CONTRAPARTE_FALLBACK, DESCRICAO_FALLBACK_OFX, DestinoTabela, detectarDelimitador() (+24 more)

### Community 2 - "page.tsx"
Cohesion: 0.07
Nodes (37): BigBarPanel(), COR, CORES_COMP, CORES_DIST, DashboardPage(), DonutPanel(), fBRL(), supabase (+29 more)

### Community 3 - "page.tsx"
Cohesion: 0.10
Nodes (37): CtxMeta, diasEntre(), DIRECAO_PADRAO, fmtData(), hojeISO(), inicioJanela24m(), inicioRolling12(), mesesNoPeriodo() (+29 more)

### Community 4 - "cfoCore.ts"
Cohesion: 0.05
Nodes (59): fimJanelaFutura(), FluxoCaixa(), inicioJanelaHistorica(), isoHoje(), LancamentoFC, optEntradasSaidas(), supabase, tip (+51 more)

### Community 5 - "gerarPdfTabela"
Cohesion: 0.07
Nodes (49): formatBRL(), IATributariaPage(), supabase, T, tooltipStyle, formatBRL(), MESES, Relatorios() (+41 more)

### Community 6 - "page.tsx"
Cohesion: 0.16
Nodes (21): ConcorrenteRow, DecisaoRow, Precificacao(), ProdutoRow, supabase, WAR_PRESETS, CanvasBox(), calcularImpactoDesconto() (+13 more)

### Community 7 - "ModuloLayout.tsx"
Cohesion: 0.16
Nodes (19): ClientesPage(), optDispersao(), calcularKpisCarteiraExecutivo(), classificarTendencia(), detectarSinaisCliente(), healthScoreCarteira(), montarConselhoExecutivo(), montarNarrativaIVCA() (+11 more)

### Community 8 - "page.tsx"
Cohesion: 0.07
Nodes (32): primeiroRegistroAuditoria(), analisarCausaRaiz(), atualizarPlanoAcao(), AUTOR_NAO_REGISTRADO, BaselineSimulacao, CausaRaizItem, CentralInsights, CentroLeve (+24 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/crypto-js (+11 more)

### Community 11 - "page.tsx"
Cohesion: 0.06
Nodes (32): atualizarContato(), atualizarContrato(), calcularScoreAxiomaFornecedor(), comprasNoPeriodo(), CreditoReformaFornecedor, criarContrato(), criarDocumentoFornecedor(), criarInteracao() (+24 more)

### Community 12 - "page.tsx"
Cohesion: 0.08
Nodes (31): categoriasCustoFixo, categoriasReceita, ContaReceberRow, CustoFixoRow, CustoVarRow, DividaRow, DREPage(), FluxoCaixaRow (+23 more)

### Community 13 - "🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS"
Cohesion: 0.04
Nodes (51): 11. MIGRAÇÃO MULTI-TENANT — arquivo entregue (2026-07-23), 12. EMPRESA PADRÃO AUTOMÁTICA — pré-requisito da tela de aceitar convite (decidido 2026-07-23), 13. PARTE 6 DA MIGRAÇÃO MULTI-TENANT — ajuste de código, COMPLETA (2026-07-23), 1. RESUMO EM UMA FRASE, 2. O ALICERCE (já construído e funcionando), 3-A. Metas (`/metas`) — CONECTADO a dados reais, entregue nesta rodada, 3-AA. Correção — 3 bugs reais de detecção achados na bateria de testes (2026-07-25), 3-AB. Correção — 2 bugs achados na 2ª rodada de teste (destino trocado + regressão no extrato) (2026-07-25) (+43 more)

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
Cohesion: 0.29
Nodes (10): destinoLabel(), destinoPredominante(), DESTINOS, formatBRL(), formatData(), formatDataHora(), HistoricoBlock(), ImportarDocumentosPage() (+2 more)

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
Nodes (22): categorias, CODIGOS_PAISES, ContaPagar, contaVazia, EtapaCadastro, ETAPAS_CADASTRO, formasPagamento, Fornecedor (+14 more)

### Community 23 - "layout.tsx"
Cohesion: 0.22
Nodes (7): geistMono, geistSans, metadata, viewport, PostHogPageView(), PostHogProvider(), LanguageProvider()

### Community 24 - "DashComercial.tsx"
Cohesion: 0.10
Nodes (16): EtapaCadastro, ETAPAS_CADASTRO, FORM_CONTA_VAZIO, FORM_VAZIO, FormCliente, FormConta, inputStyle, labelStyle (+8 more)

### Community 25 - "DashFinanceiro.tsx"
Cohesion: 0.06
Nodes (31): BucketRecebimento, CardEspecialista, CLASSIFICACAO_LABEL, ClassificacaoCliente, ConselhoExecutivo, CriterioScoreAxiomaCliente, EstagioInadimplencia, EventoTimeline (+23 more)

### Community 26 - "page.tsx"
Cohesion: 0.07
Nodes (52): CATEGORIAS_CASO, Inadimplencia(), supabase, FaixaAging, rankingScoreAxiomaCliente(), criarInteracao(), agruparInadimplenciaPorCampo(), AlavancasRecuperacao (+44 more)

### Community 28 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 29 - "page.tsx"
Cohesion: 0.29
Nodes (5): BANCOS_FALLBACK, carregarPluggySDK(), OpenFinancePage(), supabase, textos

### Community 30 - "dependencies"
Cohesion: 0.11
Nodes (19): @anthropic-ai/sdk, framer-motion, @gsap/react, dependencies, @anthropic-ai/sdk, framer-motion, @gsap/react, react (+11 more)

### Community 31 - "page.tsx"
Cohesion: 0.38
Nodes (4): calcularIRPF(), FAIXAS_IRPF, ImpostoRendaMEI(), supabase

### Community 32 - "middleware.ts"
Cohesion: 0.43
Nodes (6): addSecurityHeaders(), checkRateLimit(), config, CONTAS_LIBERADAS, middleware(), rateLimitMap

### Community 34 - "cfoTextos.ts"
Cohesion: 0.06
Nodes (58): formatarValorMeta(), inicioJanela12m(), mesesNoPeriodo(), RegimeSimulado, ResultadoSimulacao, ResultadoTributario, Simulacoes(), supabase (+50 more)

### Community 49 - "Fornecedores"
Cohesion: 0.11
Nodes (20): Agrupador, CentroLeve, ColunaId, COLUNAS, fmt(), Lang, LinhaPlanilha, PlanilhaCentroCusto() (+12 more)

### Community 51 - "fast-xml-parser"
Cohesion: 0.09
Nodes (51): CAT_COR, categorias, CustoFixo, CustosFixos(), supabase, CAT_COR, categorias, CustosVariaveis() (+43 more)

### Community 52 - "framer-motion"
Cohesion: 0.09
Nodes (32): CATEGORIAS, CentroCusto, COLUNAS_PENDENTES_SQL, Conta, ContasReceber(), contaVazia, FORMAS_RECEBIMENTO, PRIORIDADES (+24 more)

### Community 53 - "montarDRE"
Cohesion: 0.07
Nodes (43): EstoquePage(), inputStyle, labelStyle, selectStyle, supabase, UNIDADES, useLeitorCodigoBarras(), atualizarMovimentacao() (+35 more)

### Community 54 - "page.tsx"
Cohesion: 0.40
Nodes (5): agruparPorCampo(), receitaPorCidade(), receitaPorEstado(), receitaPorSegmento(), rotuloNaoInformado()

### Community 55 - "html2canvas"
Cohesion: 0.09
Nodes (29): CATEGORIAS_CONTAS_PAGAR, CATEGORIAS_CUSTOS_FIXOS, CATEGORIAS_CUSTOS_VARIAVEIS, Centro, CentrosCustoPage(), CORES_CENTRO, getCor(), inputStyle (+21 more)

### Community 60 - "ofx-js"
Cohesion: 0.09
Nodes (34): corTipo, inicioJanela24m(), inicioRolling12(), InvestimentoRow, Investimentos(), mesesNoPeriodo(), optBarrasPct(), supabase (+26 more)

### Community 63 - "react"
Cohesion: 0.09
Nodes (25): Lancamento, ClienteSnapshot, ContaRow, Idioma3, ScoreAxiomaCliente, SnapshotCarteira, agruparCarteiraPorCampo(), AlavancasRecebimento (+17 more)

### Community 64 - "recharts"
Cohesion: 0.67
Nodes (3): enviarPerguntaZIA(), montarPromptZIA(), nomeTipoSinal()

### Community 65 - "recharts"
Cohesion: 0.39
Nodes (7): avaliarExpressaoAritmetica(), avaliarFormula(), colunaParaIndice(), expandirRange(), indiceParaColuna(), ObterValorCelula, pareceFormula()

### Community 66 - "stripe"
Cohesion: 0.22
Nodes (5): grupos, Idioma, supabase, TopNav(), carregarEmpresaPorId()

### Community 67 - "centroCustoHelpers.ts"
Cohesion: 0.13
Nodes (15): aplicarRateio(), AuditoriaRow, carregarAuditoriaCentro(), carregarLancamentosOrigem(), carregarOrcamentos(), carregarRateios(), carregarReceitasOrigem(), carregarTodosLancamentosOrigem() (+7 more)

### Community 68 - "page.tsx"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 72 - "@types/three"
Cohesion: 0.50
Nodes (5): buscarCandidatosPorTabela(), detectarPossiveisDuplicatas(), normalizarPadraoChave(), sugerirClassificacoes(), valorBate()

### Community 73 - "xlsx"
Cohesion: 0.08
Nodes (25): Fornecedores(), nomesPaises(), formatarTelefone(), validarCPF(), atualizarDocumentoFornecedor(), atualizarInteracao(), atualizarProduto(), avaliarCreditoReforma() (+17 more)

### Community 77 - "page.tsx"
Cohesion: 0.08
Nodes (11): IAMEIAdvisor(), supabase, PainelMEI(), supabase, PrecificacaoMEI(), supabase, ReformaTributaria(), supabase (+3 more)

### Community 78 - "bcbApi.ts"
Cohesion: 0.25
Nodes (8): 3. O QUE JÁ ESTÁ PRONTO E FUNCIONANDO, Custos Fixos (`/custos-fixos`) — CONECTADO a dados reais, Custos Variáveis (`/custos-variaveis`) — CONECTADO a dados reais, Dashboard principal (`/dashboard`), DRE (`/dre`) — CONECTADO a dados reais, Endividamento (`/endividamento`) — CONECTADO a dados reais, entregue nesta rodada, Fluxo de Caixa (`/fluxo-caixa`) — CONECTADO a dados reais, Receitas (`/receitas`) — CONECTADO a dados reais

### Community 82 - "DashFinanceiro.tsx"
Cohesion: 0.36
Nodes (10): barrasV(), C, D, DashFinanceiro(), fBRL(), fK(), linhaEndiv(), rosca() (+2 more)

### Community 83 - "montarSnapshotsCarteira"
Cohesion: 0.09
Nodes (24): scoreRecebimento(), AlertaCobranca, atualizarCompromisso(), atualizarStatusCompromisso(), CANAIS_REGUA, CardExplicativo, CobrancaCompromisso, criarCompromisso() (+16 more)

### Community 85 - "page.tsx"
Cohesion: 0.33
Nodes (7): identificarOportunidades(), detectarAnomaliasHistoricas(), detectarDesperdicio(), normalizarTexto(), contratosVencendo(), oportunidadesConsolidacao(), precoAcimaMediaInterna()

### Community 86 - "10. LEVANTAMENTO MULTI-TENANT (diagnóstico feito em 2026-07-23, nada foi alterado no banco nem no código)"
Cohesion: 0.33
Nodes (6): 10. LEVANTAMENTO MULTI-TENANT (diagnóstico feito em 2026-07-23, nada foi alterado no banco nem no código), a) Tabelas: só user_id / só empresa_id / os dois, b) Tabelas sem índice em user_id/empresa_id/data, c) Telas que carregam tabela inteira e calculam no navegador (ordenado por risco), d) RLS: `auth.uid()` direto ou com subselect, e) Pooler (Supavisor) ou conexão direta

### Community 87 - "ibgeApi.ts"
Cohesion: 0.29
Nodes (6): buscarEstados(), buscarMunicipios(), EstadoIBGE, FALLBACK_ESTADOS, MunicipioIBGE, ResultadoIBGE

### Community 88 - "concentracaoFornecedores"
Cohesion: 0.50
Nodes (4): concentracaoFornecedores, curvaABC(), diversificacaoFornecedores, gastoPorFornecedor()

### Community 91 - "xlsx"
Cohesion: 0.09
Nodes (41): STATUS_INFO, supabase, T, crypto-js, abrirExcecaoFormatoReforma(), abrirExcecoes(), atualizarPadroesClassificacao(), Builder (+33 more)

## Knowledge Gaps
- **492 isolated node(s):** `CATEGORIAS_CUSTOS_FIXOS`, `CATEGORIAS_CUSTOS_VARIAVEIS`, `CATEGORIAS_CONTAS_PAGAR`, `supabase`, `Centro` (+487 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `gerarPdfTabela()` connect `fast-xml-parser` to `page.tsx`, `page.tsx`, `page.tsx`, `cfoCore.ts`, `gerarPdfTabela`, `page.tsx`, `ModuloLayout.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `DashComercial.tsx`, `page.tsx`, `cfoTextos.ts`, `Fornecedores`, `framer-motion`, `montarDRE`, `html2canvas`, `ofx-js`, `xlsx`, `page.tsx`, `xlsx`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `lucide-react`, `next`, `pluggy-sdk`, `posthog-js`, `page.tsx`, `@supabase/ssr`, `@supabase/supabase-js`, `three`, `DashComercial.tsx`, `page.tsx`, `montarSnapshotsCarteira`, `page.tsx`, `simulacaoMonteCarlo`, `echarts`, `echarts-for-react`, `fast-xml-parser`, `xlsx`, `xlsx`, `pluggy-sdk`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `jspdf` connect `page.tsx` to `fast-xml-parser`, `TopNav.tsx`, `page.tsx`, `dependencies`, `page.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `CATEGORIAS_CUSTOS_FIXOS`, `CATEGORIAS_CUSTOS_VARIAVEIS`, `CATEGORIAS_CONTAS_PAGAR` to the rest of the system?**
  _492 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07597402597402597 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0700354609929078 - nodes in this community are weakly interconnected._