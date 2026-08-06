# Graph Report - axioma  (2026-08-05)

## Corpus Check
- 138 files · ~480,860 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1662 nodes · 4150 edges · 105 communities (77 shown, 28 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3c23304`
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
- page.tsx
- page.tsx
- page.tsx
- page.tsx
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
- page.tsx
- xlsx
- postcss.config.mjs
- DashComercial.tsx
- layout.tsx
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
- LanguageContext.tsx
- xlsx
- page.tsx
- etiquetaHelpers.ts
- pluggy-sdk
- echarts-for-react
- recharts
- @stripe/stripe-js
- route.ts
- echarts
- useLanguage
- ModuloLayout.tsx
- echarts-for-react

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 84 edges
2. `Fornecedores()` - 74 edges
3. `🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS` - 64 edges
4. `fBRL()` - 61 edges
5. `gerarPdfTabela()` - 54 edges
6. `cfoT()` - 43 edges
7. `fPct()` - 38 edges
8. `DREPage()` - 37 edges
9. `obterEmpresaAtiva()` - 37 edges
10. `EstoquePage()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/dashboard/page.tsx → lib/LanguageContext.tsx
- `Planos()` --calls--> `useLanguage()`  [EXTRACTED]
  app/(interno)/planos/page.tsx → lib/LanguageContext.tsx
- `RecuperarSenha()` --calls--> `useLanguage()`  [EXTRACTED]
  app/recuperar-senha/page.tsx → lib/LanguageContext.tsx
- `Sidebar()` --calls--> `useLanguage()`  [EXTRACTED]
  components/Sidebar.tsx → lib/LanguageContext.tsx
- `CentrosCustoPage()` --calls--> `fmt()`  [EXTRACTED]
  app/(interno)/centros-custo/page.tsx → components/PlanilhaCentroCusto.tsx

## Import Cycles
- 3-file cycle: `lib/iaTributariaHelpers.ts -> lib/meiHelpers.ts -> lib/relatoriosHelpers.ts -> lib/iaTributariaHelpers.ts`

## Communities (105 total, 28 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.11
Nodes (26): aceitarConvite(), atualizarEmpresa(), atualizarObrigacao(), atualizarSocio(), calcularComplianceScore(), carregarAuditoria(), carregarDocumentos(), carregarEquipe() (+18 more)

### Community 1 - "page.tsx"
Cohesion: 0.12
Nodes (32): autodetectarMapeamento(), coletarPorChave(), combinarDataHora(), contarPalavras(), CONTRAPARTE_FALLBACK, DESCRICAO_FALLBACK_OFX, DestinoTabela, detectarDelimitador() (+24 more)

### Community 2 - "page.tsx"
Cohesion: 0.07
Nodes (37): BigBarPanel(), COR, CORES_COMP, CORES_DIST, DashboardPage(), DonutPanel(), fBRL(), supabase (+29 more)

### Community 3 - "page.tsx"
Cohesion: 0.10
Nodes (39): CtxMeta, diasEntre(), DIRECAO_PADRAO, fmtData(), formatarValorMeta(), hojeISO(), inicioJanela24m(), inicioRolling12() (+31 more)

### Community 4 - "cfoCore.ts"
Cohesion: 0.06
Nodes (35): amostraTriangular(), analiseSensibilidade(), BucketLiquidez, BucketSemanal, CapitalOcioso, CenarioQuitacao, ChaveRiscoInvestimento, ClassificacaoMeta (+27 more)

### Community 5 - "gerarPdfTabela"
Cohesion: 0.09
Nodes (36): CATEGORIAS, FaturamentoMEI(), FONTE, Receita, supabase, calcularIRPF(), CategoriaMEI, CofreInput (+28 more)

### Community 6 - "page.tsx"
Cohesion: 0.17
Nodes (21): ConcorrenteRow, DecisaoRow, Precificacao(), ProdutoRow, supabase, WAR_PRESETS, calcularImpactoDesconto(), calcularImpactoPreco() (+13 more)

### Community 7 - "ModuloLayout.tsx"
Cohesion: 0.16
Nodes (19): ClientesPage(), optDispersao(), calcularKpisCarteiraExecutivo(), classificarTendencia(), detectarSinaisCliente(), healthScoreCarteira(), montarConselhoExecutivo(), montarNarrativaIVCA() (+11 more)

### Community 8 - "page.tsx"
Cohesion: 0.07
Nodes (31): primeiroRegistroAuditoria(), analisarCausaRaiz(), AUTOR_NAO_REGISTRADO, BaselineSimulacao, CausaRaizItem, CentralInsights, CentroLeve, Complexidade (+23 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/crypto-js (+13 more)

### Community 11 - "page.tsx"
Cohesion: 0.06
Nodes (32): atualizarContato(), atualizarContrato(), calcularScoreAxiomaFornecedor(), comprasNoPeriodo(), CreditoReformaFornecedor, criarContrato(), criarDocumentoFornecedor(), criarInteracao() (+24 more)

### Community 12 - "page.tsx"
Cohesion: 0.08
Nodes (31): categoriasCustoFixo, categoriasReceita, ContaReceberRow, CustoFixoRow, CustoVarRow, DividaRow, DREPage(), FluxoCaixaRow (+23 more)

### Community 13 - "🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS"
Cohesion: 0.03
Nodes (62): 11. MIGRAÇÃO MULTI-TENANT — arquivo entregue (2026-07-23), 12. EMPRESA PADRÃO AUTOMÁTICA — pré-requisito da tela de aceitar convite (decidido 2026-07-23), 13. PARTE 6 DA MIGRAÇÃO MULTI-TENANT — ajuste de código, COMPLETA (2026-07-23), 1. RESUMO EM UMA FRASE, 2. O ALICERCE (já construído e funcionando), 3-A. Metas (`/metas`) — CONECTADO a dados reais, entregue nesta rodada, 3-AA. Correção — 3 bugs reais de detecção achados na bateria de testes (2026-07-25), 3-AB. Correção — 2 bugs achados na 2ª rodada de teste (destino trocado + regressão no extrato) (2026-07-25) (+54 more)

### Community 14 - "🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto"
Cohesion: 0.11
Nodes (18): COMO TRABALHAR NO CLAUDE CODE (fluxo por módulo), 🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto, COORDENADAS, 📋 DEPOIS DOS MÓDULOS FINANCEIROS, 🎨 IDENTIDADE VISUAL, ✅ JÁ CONSTRUÍDO (funcionando), `lib/cfoCore.ts` — cálculos + gráficos reutilizáveis, `lib/cfoTextos.ts` — traduções CFO centralizadas PT/EN/ES (+10 more)

### Community 15 - "page.tsx"
Cohesion: 0.11
Nodes (30): corTipo, inicioJanela24m(), inicioRolling12(), InvestimentoRow, Investimentos(), mesesNoPeriodo(), optBarrasPct(), supabase (+22 more)

### Community 16 - "page.tsx"
Cohesion: 0.15
Nodes (24): Divida, Endividamento(), inicioJanelaHistorica(), inicioRolling12(), mesesNoPeriodo(), supabase, tipos, calcularSinaisSolvencia() (+16 more)

### Community 17 - "useLanguage"
Cohesion: 0.50
Nodes (5): buscarCandidatosPorTabela(), detectarPossiveisDuplicatas(), normalizarPadraoChave(), sugerirClassificacoes(), valorBate()

### Community 18 - "page.tsx"
Cohesion: 0.29
Nodes (10): destinoLabel(), destinoPredominante(), DESTINOS, formatBRL(), formatData(), formatDataHora(), HistoricoBlock(), ImportarDocumentosPage() (+2 more)

### Community 19 - "page.tsx"
Cohesion: 0.29
Nodes (5): BANCOS_FALLBACK, carregarPluggySDK(), OpenFinancePage(), supabase, textos

### Community 20 - "page.tsx"
Cohesion: 0.07
Nodes (49): formatBRL(), IATributariaPage(), supabase, T, tooltipStyle, formatBRL(), MESES, Relatorios() (+41 more)

### Community 21 - "page.tsx"
Cohesion: 0.17
Nodes (4): BG_PALAVRAS, idiomas, Reveal(), useInView()

### Community 22 - "page.tsx"
Cohesion: 0.07
Nodes (22): categorias, CODIGOS_PAISES, ContaPagar, contaVazia, EtapaCadastro, ETAPAS_CADASTRO, formasPagamento, Fornecedor (+14 more)

### Community 23 - "page.tsx"
Cohesion: 0.36
Nodes (10): PainelMEI(), supabase, detectarConsumoReserva(), detectarRetiradaPerigosa(), diasParaDAS(), fluxoMesMEI(), limiteRestante(), projecaoTeto() (+2 more)

### Community 24 - "DashComercial.tsx"
Cohesion: 0.10
Nodes (16): EtapaCadastro, ETAPAS_CADASTRO, FORM_CONTA_VAZIO, FORM_VAZIO, FormCliente, FormConta, inputStyle, labelStyle (+8 more)

### Community 25 - "DashFinanceiro.tsx"
Cohesion: 0.06
Nodes (31): BucketRecebimento, CardEspecialista, CLASSIFICACAO_LABEL, ClassificacaoCliente, ConselhoExecutivo, CriterioScoreAxiomaCliente, EstagioInadimplencia, EventoTimeline (+23 more)

### Community 26 - "page.tsx"
Cohesion: 0.07
Nodes (55): CATEGORIAS_CASO, Inadimplencia(), supabase, fBRL2(), optVelocimetro(), FaixaAging, rankingScoreAxiomaCliente(), agruparInadimplenciaPorCampo() (+47 more)

### Community 27 - "TopNav.tsx"
Cohesion: 0.14
Nodes (25): AtualizarSenha(), supabase, FONTE, IAMEIAdvisor(), supabase, ImpostoRendaMEI(), ReformaTributaria(), supabase (+17 more)

### Community 28 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 29 - "page.tsx"
Cohesion: 0.12
Nodes (14): EmpresaPage(), formatBRL(), formatData(), formatDataHora(), PORTES, supabase, T, formatarTelefone() (+6 more)

### Community 30 - "dependencies"
Cohesion: 0.11
Nodes (19): @anthropic-ai/sdk, echarts, fast-xml-parser, framer-motion, @gsap/react, dependencies, @anthropic-ai/sdk, echarts (+11 more)

### Community 31 - "page.tsx"
Cohesion: 0.14
Nodes (20): FONTE, supabase, CanvasBox(), CentroCompartilhamento(), Props, canaisCompartilhamento(), atualizarDocumentoFiscal(), DocumentoFiscal (+12 more)

### Community 32 - "middleware.ts"
Cohesion: 0.43
Nodes (6): addSecurityHeaders(), checkRateLimit(), config, CONTAS_LIBERADAS, middleware(), rateLimitMap

### Community 34 - "cfoTextos.ts"
Cohesion: 0.06
Nodes (56): inicioJanela12m(), mesesNoPeriodo(), RegimeSimulado, ResultadoSimulacao, ResultadoTributario, Simulacoes(), supabase, ArvoreMeta (+48 more)

### Community 49 - "Fornecedores"
Cohesion: 0.12
Nodes (18): Agrupador, CentroLeve, ColunaId, COLUNAS, fmt(), Lang, LinhaPlanilha, PlanilhaCentroCusto() (+10 more)

### Community 51 - "fast-xml-parser"
Cohesion: 0.10
Nodes (33): CAT_COR, categorias, CustoFixo, CustosFixos(), supabase, CAT_COR, categorias, CATEGORIAS_RECORRENTES (+25 more)

### Community 52 - "framer-motion"
Cohesion: 0.18
Nodes (14): ContasReceber(), agingCarteiraRecebiveis(), calcularKpisRecebimento(), diffDias(), montarSnapshotsCarteira(), nomeCriterioScoreCliente(), scoreMedioCarteiraAxiomaCliente(), filaCobrancaPriorizada() (+6 more)

### Community 53 - "montarDRE"
Cohesion: 0.06
Nodes (32): AlertaReposicao, atualizarMovimentacao(), atualizarProdutosEmLote(), AvisoEstoque, AvisoValidade, CampoPersonalizadoEmpresa, ComposicaoItem, ConsultaEanResposta (+24 more)

### Community 54 - "page.tsx"
Cohesion: 0.40
Nodes (5): agruparPorCampo(), receitaPorCidade(), receitaPorEstado(), receitaPorSegmento(), rotuloNaoInformado()

### Community 55 - "html2canvas"
Cohesion: 0.09
Nodes (29): CATEGORIAS_CONTAS_PAGAR, CATEGORIAS_CUSTOS_FIXOS, CATEGORIAS_CUSTOS_VARIAVEIS, Centro, CentrosCustoPage(), CORES_CENTRO, getCor(), inputStyle (+21 more)

### Community 57 - "lucide-react"
Cohesion: 0.30
Nodes (13): CockpitMEI(), FONTE, Modo, PrecificacaoMEI(), supabase, precoPorDivisor(), custoProprioRateado(), dasMensalPorCategoria() (+5 more)

### Community 60 - "ofx-js"
Cohesion: 0.23
Nodes (13): DASObrigacoes(), FONTE, pad(), supabase, optLinhaMulti(), calcularDividaDASAcumulada(), calcularPenalidadeDASAtraso(), competenciasDASDoAno() (+5 more)

### Community 61 - "pluggy-sdk"
Cohesion: 0.08
Nodes (22): CampoMoeda(), inputStyle, labelStyle, parseMoeda(), selectStyle, supabase, UNIDADES, useLeitorCodigoBarras() (+14 more)

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
Cohesion: 0.14
Nodes (11): BadgeDestaque(), grupos, Sidebar(), supabase, grupos, Idioma, supabase, TopNav() (+3 more)

### Community 67 - "centroCustoHelpers.ts"
Cohesion: 0.13
Nodes (15): aplicarRateio(), AuditoriaRow, carregarAuditoriaCentro(), carregarLancamentosOrigem(), carregarOrcamentos(), carregarRateios(), carregarReceitasOrigem(), carregarTodosLancamentosOrigem() (+7 more)

### Community 68 - "page.tsx"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 72 - "page.tsx"
Cohesion: 0.14
Nodes (15): AVISOS_TXT, MESES, supabase, ItemLetreiro, LetreiroExecutivo(), AvisoCockpit, ChaveAvisoCockpit, InputAvisosCockpitMEI (+7 more)

### Community 73 - "xlsx"
Cohesion: 0.08
Nodes (25): Fornecedores(), nomesPaises(), formatarCPF(), validarCPF(), atualizarDocumentoFornecedor(), atualizarInteracao(), atualizarProduto(), avaliarCreditoReforma() (+17 more)

### Community 76 - "DashComercial.tsx"
Cohesion: 0.33
Nodes (6): COLUNAS_EXCEL(), exportarProdutosCsv(), exportarProdutosExcel(), importarProdutosArquivo(), xlsx, xlsx

### Community 77 - "layout.tsx"
Cohesion: 0.60
Nodes (5): calcularHealthScore(), consultarCNPJ(), formatarCNPJ(), limparCNPJ(), validarCNPJ()

### Community 78 - "bcbApi.ts"
Cohesion: 0.25
Nodes (8): 3. O QUE JÁ ESTÁ PRONTO E FUNCIONANDO, Custos Fixos (`/custos-fixos`) — CONECTADO a dados reais, Custos Variáveis (`/custos-variaveis`) — CONECTADO a dados reais, Dashboard principal (`/dashboard`), DRE (`/dre`) — CONECTADO a dados reais, Endividamento (`/endividamento`) — CONECTADO a dados reais, entregue nesta rodada, Fluxo de Caixa (`/fluxo-caixa`) — CONECTADO a dados reais, Receitas (`/receitas`) — CONECTADO a dados reais

### Community 80 - "page.tsx"
Cohesion: 0.10
Nodes (41): CAT_COR, categorias, CustosVariaveis(), CustoVariavel, inicioJanelaHistorica(), supabase, fimJanelaFutura(), FluxoCaixa() (+33 more)

### Community 82 - "DashFinanceiro.tsx"
Cohesion: 0.50
Nodes (3): Props, Periodo, PeriodoPreset

### Community 83 - "montarSnapshotsCarteira"
Cohesion: 0.08
Nodes (37): CATEGORIAS, CentroCusto, COLUNAS_PENDENTES_SQL, Conta, contaVazia, FORMAS_RECEBIMENTO, PRIORIDADES, supabase (+29 more)

### Community 85 - "page.tsx"
Cohesion: 0.08
Nodes (25): EstoquePage(), moeda(), margemReal(), adicionarCampoPersonalizado(), buscarProdutoPorCodigo(), calcularAlertasReposicao(), carregarAvisosEstoque(), carregarAvisosValidade() (+17 more)

### Community 86 - "10. LEVANTAMENTO MULTI-TENANT (diagnóstico feito em 2026-07-23, nada foi alterado no banco nem no código)"
Cohesion: 0.33
Nodes (6): 10. LEVANTAMENTO MULTI-TENANT (diagnóstico feito em 2026-07-23, nada foi alterado no banco nem no código), a) Tabelas: só user_id / só empresa_id / os dois, b) Tabelas sem índice em user_id/empresa_id/data, c) Telas que carregam tabela inteira e calculam no navegador (ordenado por risco), d) RLS: `auth.uid()` direto ou com subselect, e) Pooler (Supavisor) ou conexão direta

### Community 87 - "ibgeApi.ts"
Cohesion: 0.29
Nodes (6): buscarEstados(), buscarMunicipios(), EstadoIBGE, FALLBACK_ESTADOS, MunicipioIBGE, ResultadoIBGE

### Community 88 - "concentracaoFornecedores"
Cohesion: 0.50
Nodes (4): concentracaoFornecedores, curvaABC(), diversificacaoFornecedores, gastoPorFornecedor()

### Community 90 - "fast-xml-parser"
Cohesion: 0.17
Nodes (15): C(), CampoNicho, CAMPOS_CONDICIONAIS_POR_SEGMENTO, DICIONARIO_SEGMENTOS, extrairTermoChave(), NA(), normalizarTexto(), registrarAprendizadoCategoria() (+7 more)

### Community 91 - "xlsx"
Cohesion: 0.09
Nodes (41): STATUS_INFO, supabase, T, crypto-js, abrirExcecaoFormatoReforma(), abrirExcecoes(), atualizarPadroesClassificacao(), Builder (+33 more)

### Community 92 - "LanguageContext.tsx"
Cohesion: 0.05
Nodes (43): Cadastro(), AceitarConvite(), Estado, PAPEL_LABEL, Planos(), supabase, geistMono, geistSans (+35 more)

### Community 94 - "page.tsx"
Cohesion: 0.33
Nodes (7): identificarOportunidades(), detectarAnomaliasHistoricas(), detectarDesperdicio(), normalizarTexto(), contratosVencendo(), oportunidadesConsolidacao(), precoAcimaMediaInterna()

### Community 95 - "etiquetaHelpers.ts"
Cohesion: 0.40
Nodes (4): gerarEtiquetasPDF(), ProdutoParaEtiqueta, qrcode, qrcode

### Community 97 - "echarts-for-react"
Cohesion: 0.33
Nodes (6): calcularIVCA(), calcularSaudeCliente(), calcularScoreAxiomaCliente(), clamp(), previsaoFaturamentoCliente(), probabilidadeInadimplenciaConta()

### Community 101 - "echarts"
Cohesion: 0.67
Nodes (3): consultarCEP(), DadosCEP, formatarCEP()

## Knowledge Gaps
- **550 isolated node(s):** `CATEGORIAS_CUSTOS_FIXOS`, `CATEGORIAS_CUSTOS_VARIAVEIS`, `CATEGORIAS_CONTAS_PAGAR`, `supabase`, `Centro` (+545 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useLanguage()` connect `TopNav.tsx` to `page.tsx`, `page.tsx`, `gerarPdfTabela`, `page.tsx`, `ModuloLayout.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `DashComercial.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `cfoTextos.ts`, `fast-xml-parser`, `framer-motion`, `html2canvas`, `lucide-react`, `ofx-js`, `pluggy-sdk`, `stripe`, `page.tsx`, `xlsx`, `page.tsx`, `montarSnapshotsCarteira`, `page.tsx`, `xlsx`, `LanguageContext.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `TopNav.tsx`, `next`, `posthog-js`, `page.tsx`, `@supabase/ssr`, `@supabase/supabase-js`, `three`, `DashComercial.tsx`, `montarSnapshotsCarteira`, `simulacaoMonteCarlo`, `echarts`, `echarts-for-react`, `xlsx`, `xlsx`, `etiquetaHelpers.ts`, `pluggy-sdk`, `recharts`, `@stripe/stripe-js`, `useLanguage`, `echarts-for-react`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `jspdf` connect `TopNav.tsx` to `gerarPdfTabela`, `page.tsx`, `lucide-react`, `ofx-js`, `dependencies`, `etiquetaHelpers.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `CATEGORIAS_CUSTOS_FIXOS`, `CATEGORIAS_CUSTOS_VARIAVEIS`, `CATEGORIAS_CONTAS_PAGAR` to the rest of the system?**
  _550 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0700354609929078 - nodes in this community are weakly interconnected._