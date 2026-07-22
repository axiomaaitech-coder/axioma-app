# 🦅 CONTEXTO-AXIOMA.md — Documento-Mestre do Projeto
**Cole/deixe este arquivo na raiz `C:\axioma`. No Claude Code, comece pedindo: "Leia CONTEXTO-AXIOMA.md e assuma o papel de Lucas". Ele carrega tudo e continua de onde paramos.**

---

## QUEM É QUEM
- **Elias Tavares** — CEO, fundador. NÃO é programador. Comunicação direta, alta exigência de qualidade/velocidade. Quando diz "ok", é pra prosseguir sem perguntar.
- **Lucas** — persona do assistente: engenheiro de software sênior + arquiteto + designer do Axioma. Tom: direto, didático, emoji 🦅, instruções numeradas.

## O QUE É O AXIOMA
SaaS de inteligência financeira/contábil — um **"CFO Digital"** para PMEs brasileiras. Meta: ser o CFO SaaS mais avançado do Brasil e chamar atenção mundial, superando Conta Azul, Omie, Senior, SAP, Oracle, QuickBooks — com IA e recursos que os concorrentes (nacionais e mundiais) não têm ou cobram caro.

## STACK
- Next.js 14 (App Router) + TypeScript + TailwindCSS
- Supabase (`createBrowserClient` de `@supabase/ssr`) — Postgres + Auth + Storage, RLS
- Vercel · Stripe (teste) · Pluggy (Open Finance, conectado, ativação pendente)
- **Gráficos: Apache ECharts** (`echarts` + `echarts-for-react`) — JÁ INSTALADO
- Framer Motion · Lucide React
- **Proibido:** Recharts (em migração p/ ECharts nos módulos novos), Chart.js, Three.js, GSAP, jsPDF, html2canvas, Power BI (é serviço Azure, não npm)

## COORDENADAS
- Local: `C:\axioma`
- Módulos: `C:\axioma\app\(interno)\NOME\page.tsx`
- Componentes: `C:\axioma\components\NOME.tsx`
- Helpers/libs: `C:\axioma\lib\NOME.ts`
- GitHub: `axiomaaitech-coder/axioma-app` · Vercel: `axioma-app.vercel.app`
- Supabase: `rrqdikfozvnhbyjklgft.supabase.co`
- **Rota `(interno)` NÃO aparece na URL** → usar `/receitas`, nunca `/(interno)/receitas` (bug 404 real)
- Caminhos com parênteses → aspas no terminal: `start code "C:\axioma\app\(interno)\receitas\page.tsx"`

---

## 🔩 O ALICERCE (base reutilizável — o coração do projeto)
Dois arquivos que TODOS os módulos e o Dashboard usam. Sempre construir módulos EM CIMA deles, nunca duplicar lógica:

### `lib/cfoCore.ts` — cálculos + gráficos reutilizáveis
Funções: `fBRL`, `fBRL2`, `fK`, `fPct`, `mesesPorLang`, `serieMensal`, `serieRolling`, `crescimentoMoM`, `ticketMedio`, `concentracao`, `percentualRecorrente`, `mrrArr`, `porCategoria`, `preverProximosMeses` (previsão IA: média móvel + tendência), `gerarInsights`, `radarRenovacoes` (detecta contratos perto de renovar, urgência vencido/critico/proximo/futuro), `detectarDesperdicio` (acha custos duplicados + economia potencial), `pesoSobreReceita`.
Options ECharts prontas: `optBarrasV` (barras verticais gradiente + valor no topo), `optRosca` (rosca aro grosso, total no centro), `optLinhaPrevisao`, `optLinhaMulti`.
Constantes: `CORES` (paleta alto luxo), `FONTE_EXEC` / `FONTE_EXEC_TITULO` (Georgia serif — usar em TODO título/letreiro).

### `lib/cfoTextos.ts` — traduções CFO centralizadas PT/EN/ES
`cfoT(lang)` retorna os textos. `textoInsight(lang, chave)`. `canaisCompartilhamento(texto, assunto)` (WhatsApp/Telegram/Gmail/Outlook — SEM "Email Padrão"/mailto). Editar aqui = muda em todos os módulos.

---

## 📐 REGRAS INEGOCIÁVEIS
1. **i18n PT/EN/ES em tudo.** Módulos usam `useLanguage()` (de `lib/LanguageContext`) para textos próprios (`t.receitas.*`, `t.geral.*`) + `cfoT(lang)` para a camada CFO. Nunca hardcoded num idioma só. Manter as traduções externas existentes, adicionar só o que faltar.
2. **Zero mock em produção.** Dados reais do Supabase por `user_id`. Exceção: gráficos DEMO do Dashboard principal (têm tag "DEMO" visível) até a fase de integração.
3. **Zero carnaval visual.** Nada de partículas, 3D, texto piscando.
4. **Código sempre completo e LIMPO** — sem sobra de código antigo (causa bugs). No Claude Code ele edita direto no arquivo.
5. **Git junto:** ao fim de cada entrega, rodar `git add . && git commit -m "..." && git push origin main`.
6. **Fonte executiva premium (Georgia serif, `FONTE_EXEC`) em todos os títulos/letreiros/KPIs** — padrão do Dashboard.
7. **Cada módulo com COR DE TEMA DIFERENTE** no dashboard (não repetir): Receitas=roxo, Custos Fixos=vermelho/laranja, Custos Variáveis=laranja/âmbar, Fluxo de Caixa=cyan/azul, DRE=verde/teal, Endividamento=rosa/magenta, Metas=roxo/dourado, Investimentos=azul-royal/dourado, Simulações=índigo/prata, Precificação=amarelo/dourado, Contas a Receber=esmeralda/teal profundo + dourado champagne (detalhes finos).
8. **SQL sempre `ADD COLUMN IF NOT EXISTS`** + RLS `auth.uid() = user_id`. Nunca CHECK constraint em status/tipo sem confirmar valores (erro 400 → checar `pg_constraint`). Avisar Elias e mandar o SQL ANTES de assumir coluna nova.
9. **Supabase:** sempre `createBrowserClient` de `@supabase/ssr`.
10. **Nunca mudar estrutura existente sem instrução.**
11. **Centro de Compartilhamento em todo módulo:** WhatsApp, Telegram, Gmail (`mail.google.com/mail/?view=cm`), Outlook (`outlook.live.com/owa`), Copiar, PDF. Botão "Compartilhar" visível.
12. **Responsivo** desktop/tablet/mobile (grids `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`, textos `text-sm md:text-lg`).
13. UTF-8 sempre. PDF via `lib/gerarPdfTabela.ts` (botão vermelho `#dc2626`).
14. **Todo módulo novo começa com pesquisa de concorrentes** (Conta Azul, Omie, Senior, SAP, Oracle + líderes mundiais) e implementa o que eles NÃO têm.
15. Honestidade técnica: se algo não é viável do jeito pedido, explicar e propor alternativa real.

## 🎨 IDENTIDADE VISUAL
- Fundo módulos antigos: CanvasBox azul `#6ab0ff`, fundo `#020810` (MANTER — não refazer cores dos módulos antigos)
- Dashboard/camada CFO: fundo gradiente `#06031a`→`#020810`; cards glass `linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))`, borda `rgba(99,102,241,0.13)`
- Paleta CORES: ouro `#d4af37`, roxo `#8b5cf6`, cyan `#06b6d4`, verde `#10b981`, vermelho `#ef4444`, laranja `#f97316`, rosa `#ec4899`, azul `#3b82f6`, teal `#14b8a6`, amarelo `#eab308` (cada + variante clara `C`)
- Gráficos: cada categoria cor viva distinta (nunca tudo azul). Barras verticais grossas c/ gradiente + valor no topo. Roscas aro grosso + total no centro. Letreiro em loop (marquee CSS 30-32s, pausa no hover, fonte Georgia).

## 🏗️ PADRÃO DE MÓDULO CFO (estrutura que todo módulo segue)
1. Botão Compartilhar (topo direito)
2. KPIs originais (mantidos, CanvasBox)
3. **Camada CFO** (só aparece se `temDados`):
   - Linha de KPIs CFO (6 cards) com métricas que concorrentes não têm
   - Letreiro em loop com os números
   - Painéis especiais do módulo (ex: Radar de Renovações em Custos Fixos)
   - **MODAL ÚNICO** de análise (estilo Power BI): título com barra glow + gráficos ECharts dentro (linha no topo full-width + grid 2×2 de barras verticais/roscas). Cada gráfico é sub-card com título + tag DEMO/dados + "Ver módulo →"
   - Insights inteligentes (alertas + positivos automáticos)
4. Busca/filtro
5. Tabela CRUD (mantida)
6. Modal criar/editar + Centro de Compartilhamento

---

## ✅ JÁ CONSTRUÍDO (funcionando)
- **Alicerce:** `lib/cfoCore.ts`, `lib/cfoTextos.ts` — inclui agora o núcleo completo de DRE (`montarDRE`, `decomporVariacaoLucro`, `ponteLucroCaixa`, `semaforoSaude`, `runwayCritico`, `gerarConselhoCFO`, `projetarDRE`, gráfico waterfall `optCascata`), de Endividamento, o núcleo de Metas (`calcularRitmoMeta`, `progressoEsperado`, `projetarFechamentoMeta`, `detectarMetaIrreal`, `semaforoMeta`, `marcoAlcancado`, `conectarMetas`, `gerarConselhoMeta`, `ritmoHistoricoMedio`), o núcleo de Investimentos (`rentabilidadeLiquidaAnual` com IR regressivo, `detectarCustoOportunidade`, `escadaLiquidezInvestimentos`, `detectarCapitalOcioso`, `calcularScoreInvestimento`, `calcularRadarRiscoInvestimento`, `gerarConselhoInvestimento`, `compararAlocacoes`, `simularCenariosExecutivos` — motor de 4 cenários nomeados, compartilhado com Simulações) e agora o núcleo de Simulações (`analiseSensibilidade`, `simulacaoMonteCarlo`, `gerarChoquePreset`, `receitaPctParaMultiplicarLucro`) e o núcleo de Precificação (`calcularImpactoPreco`, `calcularImpactoDesconto`, `estimarElasticidade`, `detectarOportunidadesPrecificacao`, `calcularIPPA`). Novo `lib/bcbApi.ts` — indicadores macro reais (Selic/CDI/IPCA/dólar) via API pública do Banco Central (SGS), sem chave.
- **Dashboard principal** (`/dashboard`): vídeo hero (logo `/logo-aitech.png` sempre visível, 460px) → letreiro premium "Dashboard Financeiro" → componente `DashFinanceiro` (KPIs + letreiro loop + modal único: linha Endividamento + barras verticais Custos Fixos/Variáveis + roscas Fluxo/Receita) → letreiro premium "Dashboard Comercial" → componente `DashComercial` (KPIs + letreiro + modal: linha Metas + barras Clientes/Inadimplência + roscas Receber/Investimentos) → cards de módulos. **Componentes:** `components/DashFinanceiro.tsx`, `components/DashComercial.tsx`. DADOS DEMO (fictícios, tag DEMO) — conectar ao Supabase na fase de integração.
- **Receitas** (`/receitas`): CFO completo. KPIs: MRR, ARR, crescimento MoM, ticket médio, % recorrente, concentração top 20%. Modal único: barras evolução + rosca categoria + linha previsão IA. Insights, letreiro, compartilhamento. Tabela `receitas` (descricao, valor, data, categoria, status, user_id). Categorias: Vendas de produtos, Prestação de serviços, Recorrentes, Eventuais, Outras. CONECTADO a dados reais.
- **Custos Fixos** (`/custos-fixos`): CFO completo. Diferencial mundial: **Radar de Renovações** (coluna nova `data_renovacao` — SQL já aplicado) + **Detector de Desperdício** (duplicados + economia potencial). KPIs: total mensal/anual, itens, economia potencial, nº renovações. Modal: rosca categoria + barras maiores custos. Tabela `custos_fixos` (descricao, valor_mensal, dia_vencimento, categoria, data_renovacao, user_id). Categorias: Aluguel/Imóvel, Folha de pagamento, Serviços essenciais, Sistemas e assinaturas, Seguros, Contabilidade, Outros.
- **Custos Variáveis** (`/custos-variaveis`): CFO completo. Margem de Contribuição, Ponto de Equilíbrio, Margem de Segurança, Volatilidade, comparativo entre períodos por categoria, anomalias históricas/price creep, sugestões acionáveis, projeção. Tabela `custos_variaveis`. Cor tema: laranja/âmbar.
- **Fluxo de Caixa** (`/fluxo-caixa`): CFO completo. Visão semanal rolante de 13 semanas (padrão Agicap/Float), detector de ruptura de caixa com data exata, cenários otimista/pessimista baseados no desvio histórico real, auto-população de previstos cruzando Contas a Receber/Pagar/Custos Fixos/Dívidas (leitura, nunca escreve). Tabela `fluxo_caixa`. Cor tema: cyan/azul.
- **DRE** (`/dre`): **Diagnóstico, não relatório estático.** Cascata completa com Análise Vertical/Horizontal por linha + waterfall, decomposição de causa raiz da variação do lucro, Ponte Lucro×Caixa (lucrativo no papel vs consumo de caixa real), Semáforo de Saúde + Runway até situação crítica, Conselho CFO acionável (ação + motivo + impacto em R$), projeção 3 meses, e **Histórico consultável** (tabela `dre_historico`, snapshot automático que congela ao fechar o período). Cor tema: verde/teal. Imposto calculado pelo regime tributário real da empresa (reaproveita `calcularImpostoRegime` da IA Tributária) — mesmo cálculo usado no Relatórios.
- **Endividamento** (`/endividamento`): **Sistema de sobrevivência, não lista de dívidas.** Escada de Vencimentos (cronograma 24 meses, detector de "muro" ancorado no EBITDA mensal médio real), Método Avalanche (ranking por taxa de juro), 5 indicadores de solvência com semáforo (Cobertura de Juros, Dívida/EBITDA, Dívida/Receita, Comprometimento Mensal, Fluxo de Caixa/Dívida), Simulador de Refinanciamento interativo, Runway da Dívida, Conselho CFO, Projeção de Quitação (ritmo atual vs avalanche). Cor tema: rosa/magenta. Tabela `dividas` — nenhuma coluna nova precisou.
- **Metas** (`/metas`): **O antídoto contra meta vaga e "set and forget".** 8 tipos vinculados a dado real (faturamento, lucro, margem, redução de custo, redução de dívida, caixa, ticket médio, nº de clientes ativos líquido) — progresso 100% automático, nunca digitado. Valor Inicial visível/editável (pré-preenchido ao vivo), Direção (aumentar/reduzir) como trava de segurança contra erro de digitação, Responsável e Descrição/Estratégia opcionais. Ritmo Necessário vs Atual, barra Progresso Real × Esperado, Detector de Meta Irreal (fácil/impossível/realista vs ritmo histórico real), Projeção de Fechamento com alerta antecipado, Árvore de Dependência entre Metas, Conselho CFO, marcos 25/50/75/100% com celebração executiva, status `concluida` automático, `arquivada` manual. Cor tema: roxo/violeta + dourado nas conquistas. Tabela `metas` + colunas novas `tipo_meta`, `valor_inicial`, `data_inicio`, `direcao`, `responsavel`, `descricao`.
- **Investimentos** (`/investimentos`): **completo (Fase 1 + Fase 2), entregue nesta rodada.** **Centro de Inteligência para Alocação de Capital, não lista de aplicações.** Diferencial mundial: **Custo de Oportunidade vs Dívida** — compara a rentabilidade líquida real (IR regressivo automático) de cada aplicação líquida com a taxa da dívida mais cara ativa e recomenda resgatar-e-quitar quando compensa (nenhum ERP nacional ou tesouraria global faz essa ponte). Escada de Liquidez, Radar de Riscos (concentração por tipo/instituição, liquidez, dívida/EBITDA, volatilidade renda variável/cripto), Score de Investimento 0-1000, Detector de Capital Ocioso, Conselho CFO, indicadores macro REAIS (Selic/CDI/IPCA/dólar) via API pública do Banco Central. **Fase 2:** Capital Allocation Engine (compara CDB/Tesouro/Fundos/Debêntures vs expansão/equipamento/marketing/contratação/automação/redução de dívida contra o custo de capital real da empresa) rankeada no Radar de Oportunidades, e Simulador Executivo (4 cenários conservador/base/otimista/adverso — Selic/receita/custos/aporte de capital — reaproveitando o núcleo do DRE, funciona como "digital twin" sem duplicar lógica). Cor tema: azul-royal/dourado. Tabela `investimentos` + colunas novas `data_vencimento`, `indexador`, `instituicao`, `liquidez`, `status`.
- **Simulações** (`/simulacoes`): **reescrito do zero, entregue nesta rodada — Centro de Simulação Estratégica.** Antes era uma calculadora isolada de 3 campos sem dado real; agora generaliza o motor de 4 cenários de Investimentos (`simularCenariosExecutivos`, sem duplicar) e o estende. Ponto de Partida automático (dados reais de Receitas/Custos/Dívidas/Fluxo de Caixa/Empresa), Objetivos Rápidos por botão (Dobrar Faturamento, Triplicar Lucro, Reduzir Custos, Melhorar Fluxo de Caixa, Reduzir Custo da Dívida) e presets de Crise/Expansão, 6 cenários, **Análise de Sensibilidade** (rankeia qual driver mais decide o resultado, câmbio incluso como driver opcional), **Simulação Monte Carlo** (2000 iterações, distribuição triangular sobre os próprios limites otimista/adverso do usuário — nenhum concorrente de porte PME tem isso nativo), **Simulação Tributária integrada** (Simples/Presumido/Real dentro do mesmo cenário, reaproveita `calcularImpostoRegime`), e Conselho Executivo determinístico (resumo/riscos/oportunidades/premissas/limitações/nível de confiança/plano de ação, com nota de transparência sobre não usar LLM ainda). Cenários efêmeros, sem tabela nova. Cor tema: índigo profundo + prata. M&A/franquias/internacionalização e chat em linguagem natural livre ficaram fora de escopo (backlog — o segundo depende da integração futura da Claude API).
- **Precificação** (`/precificacao`): **reescrito do zero, entregue nesta rodada — Centro de Engenharia de Valor.** Antes era uma calculadora de markup de 1 tela. Agora: **IPPA — Índice de Poder de Precificação Axioma** (0-1000, explica sempre qual componente puxa a nota pra baixo — margem, dependência de desconto, concentração de receita, estabilidade, competitividade), **Motor de Precificação por Valor** (qualquer preço candidato recalcula receita/margem/lucro/EBITDA/tributo em cima do DRE real, reaproveitando `montarDRE`), **Engenharia de Descontos** (limite máximo saudável antes de zerar margem), **Radar de Oportunidades** (produtos que destroem margem/subprecificados/sobreprecificados/premium/sustentam caixa), **Elasticidade honesta** (só calcula com ≥3 mudanças de preço reais, senão avisa "dados insuficientes" em vez de inventar), **Inteligência Competitiva** (cadastro manual de concorrentes — scraping ficou fora do escopo por decisão consciente, risco jurídico), **War Room** (reaproveita 100% o motor de Simulações com 11 presets de cenário de guerra), **Painel de Especialistas** por regra (5 cards — CFO/Tributário/Comercial/Risco/Analista — com nota de transparência de que não é IA generativa ainda) e **Memória Estratégica** (toda mudança de preço logada automaticamente, resultado real preenchível depois). Cor tema: amarelo/dourado. ROI/Payback/capital de giro/estoque/capacidade operacional/valuation por múltiplo/LTV/CAC/Churn/bundles ficaram fora — exigem módulos que o Axioma ainda não tem (Estoque/PDV, custo de aquisição de cliente). Tabela `precificacao` estendida + tabelas novas `concorrentes` e `decisoes_precificacao` (SQL em `STATUS-AXIOMA.md` seção 3-D).

- **Contas a Receber** (`/contas-receber`): **COMPLETO — 3 de 3 fases entregues. Centro de Inteligência Financeira de Recebimentos.** Reaproveita 100% `lib/clienteIntelHelpers.ts` (Clientes) como base — nada duplicado. Três arquivos próprios em cadeia: `clienteIntelHelpers.ts` (Score Axioma do Cliente 0-1000 + 17 KPIs + Aging, Fase 1) → `cobrancaHelpers.ts` (histórico de contato/negociação, promessas/acordos, fila priorizada, régua de cobrança configurável sem disparo real, 10 alertas preditivos incl. "cliente começando a atrasar", IA Explicativa por regra + probabilidade de recebimento %, Fase 2) → `previsaoRecebimentoHelpers.ts` (Previsão de Caixa multi-horizonte 7-365 dias classificada por confiança, Simulador Executivo com 5 alavancas e 4 cenários reaproveitando `montarDRE`, Antecipação de Recebíveis, Impacto do Split Payment/Reforma 2026-2027, painéis analíticos — heatmap, curva ABC, evolução, concentração, segmento/estado/cidade —, Fase 3). Modal corrigido com `createPortal`. Cor tema: esmeralda/teal profundo + dourado champagne em detalhes finos. Tabela `contas_receber` + 3 tabelas novas (`cobranca_interacoes`, `cobranca_compromissos`, `cobranca_regua_etapas`) — SQL já rodado pelo Elias (`STATUS-AXIOMA.md` seções 3-J/3-K). Deferido conscientemente: ligar o Dashboard Principal aos dados reais (iniciativa própria, toca todos os módulos) e o gancho de Precificação (`sugestaoCondicaoPagamento`, comentado, não ativado). Relatório final completo em `STATUS-AXIOMA.md` seção 3-L.

## 🔜 PRÓXIMO NA FILA
Fornecedores (já em padrão CFO) e Inadimplência ainda no padrão CRUD antigo → E-commerce/PDV (alta prioridade — 2 clientes esperando). Perguntar ao Elias a ordem antes de começar. Ver `STATUS-AXIOMA.md` seção 3-L e 4.

## 📋 DEPOIS DOS MÓDULOS FINANCEIROS
- Crescimento (Metas, Investimentos, Simulações, Precificação) · Comercial (Clientes, Fornecedores, Contas a Receber, Inadimplência) · Gestão
- **Integração:** conectar Dashboard principal + letreiros aos dados REAIS do Supabase (trocar DEMO). Usar `cfoCore` — zero reescrita, essa é a vantagem do alicerce.
- **Módulo E-commerce/PDV** (alta prioridade — Elias tem 2 clientes esperando): produtos, mercados/lojas, caixa registradora/gaveta. Alicerce já preparado pra suportar.
- Orçamento (Budget) · Fluxo projetado 30/60/90d · Simulador empréstimos/CET · Ativar Pluggy · Multi-tenant · Board Deck · Folha · OKRs

## 🗂️ TABELAS SUPABASE CONHECIDAS
`receitas, custos_fixos, custos_variaveis, contas_pagar, contas_receber, fluxo_caixa, fornecedores, dividas, importacoes, importacao_linhas, importacao_templates, empresas, empresa_socios, empresa_documentos, empresa_auditoria, empresa_equipe, empresa_obrigacoes, ia_financeira_historico, ia_tributaria_historico, benchmarks_setoriais, simples_nacional_faixas, clientes, metas, investimentos, centros_custo, dre_historico, precificacao, concorrentes, decisoes_precificacao`. **Dívidas = tabela `dividas` (NÃO `endividamento` — essa é órfã, schema diferente, nunca alimentada pela UI, corrigido no commit f421c93).** `concorrentes` e `decisoes_precificacao` são novas (Precificação, ver `STATUS-AXIOMA.md` seção 3-D) — cadastro manual de concorrentes e log de decisões de preço.

## 🧩 MÓDULOS ANTIGOS (visual azul `#6ab0ff`, upgrade CFO pendente)
Inadimplência, Centros de Custo, Planos, MEI (6 submódulos), Importar Documentos. Já em padrão CFO: IA Financeira, IA Tributária, Empresa, Relatórios, Fluxo de Caixa, DRE, Endividamento, Metas, Investimentos, Simulações, Precificação, Clientes, Fornecedores, Contas a Receber (Fase 1 de 3).

---

## COMO TRABALHAR NO CLAUDE CODE (fluxo por módulo)
1. `/clear` ao começar módulo novo (economiza token).
2. Pesquisar brecha dos concorrentes (o que ninguém tem).
3. Ler a tabela real no Supabase / o `page.tsx` atual antes de reescrever.
4. Construir EM CIMA do alicerce (`cfoCore` + `cfoTextos`), cor de tema própria, fonte `FONTE_EXEC`.
5. Se precisar coluna nova → avisar Elias + gerar SQL `ADD COLUMN IF NOT EXISTS` primeiro.
6. Validar, salvar no arquivo certo, e rodar os 3 comandos git.
7. Manter tudo limpo, responsivo, i18n completo, compartilhamento presente.
