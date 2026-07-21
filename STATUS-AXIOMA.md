# 🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS
**Complementa o CONTEXTO-AXIOMA.md. Aqui está o estado exato do projeto e o próximo passo. Leia junto com o CONTEXTO e o comando de papel que já recebeu.**

---

## 1. RESUMO EM UMA FRASE
Estamos transformando cada módulo do Axioma em "CFO de altíssimo nível", em cima de um alicerce reutilizável (`cfoCore` + `cfoTextos`), seguindo o menu Financeiro. **O menu Financeiro inteiro está completo**: Dashboard, Receitas, Custos Fixos, Custos Variáveis, Fluxo de Caixa, DRE e Endividamento. **O menu Crescimento inteiro está completo**: Metas, Investimentos, Simulações e agora **Precificação** — ver seções 3-A a 3-D (Precificação é o novo "Centro de Engenharia de Valor": IPPA — Índice de Poder de Precificação —, Motor de Precificação por Valor, Radar de Oportunidades, Engenharia de Descontos, Elasticidade honesta, Inteligência Competitiva manual, War Room, Painel de Especialistas por regra e Memória Estratégica). Próximo: Comercial (Clientes, Fornecedores, Contas a Receber, Inadimplência) ou E-commerce/PDV (ver seção 4).

**IA real (Claude API) — correção de rota:** ao investigar a implementação de Precificação, descobrimos que a infraestrutura da IA real **já está pronta no código** (`@anthropic-ai/sdk` instalado, rota server-side `app/api/ia-chat/route.ts` funcional, já integrada com fallback gracioso em IA Financeira e IA Tributária, CSP e rate limit já configurados em `middleware.ts`) — isso corrige o que este documento registrava antes ("Claude API só no final"). **Decisão do Elias (rodada atual): por enquanto seguimos SEM ativar a `ANTHROPIC_API_KEY`.** IA Financeira e IA Tributária continuam rodando em modo por regras (fallback já existente, funciona normalmente) até ele ativar billing na conta Anthropic. Quando ativar, é só colar a chave em `.env.local`/Vercel e atualizar o modelo (a rota hoje usa `claude-sonnet-4-20250514`, desatualizado) — não é trabalho de implementação, é ativação. Até lá, todo módulo novo continua com a camada "IA"/"Conselho CFO" em lógica determinística baseada em regras, mesmo padrão já usado em todo o app.

---

## 2. O ALICERCE (já construído e funcionando)
Dois arquivos base que todo módulo usa. **Nunca duplicar lógica — sempre importar daqui:**

- **`lib/cfoCore.ts`** — cálculos (MRR, ARR, crescimento MoM, ticket médio, concentração, % recorrente, previsão IA, radar de renovações, detector de desperdício, peso sobre receita, margem de contribuição/break-even/margem de segurança/volatilidade, comparativo entre períodos, anomalias históricas/price creep, série semanal rolante, detector de ruptura de caixa, projeção de saldo com cenários, recorrência mensal projetada) + **núcleo de DRE** (`montarDRE`, `decomporVariacaoLucro`, `ponteLucroCaixa`, `calcularSinaisSaude`/`semaforoSaude`, `runwayCritico`, `gerarConselhoCFO`, `projetarDRE`) + **núcleo de Endividamento** (`escadaVencimentos`, `ordenarAvalanche`, `coberturaJuros`, `dividaEbitda`, `dividaReceita`, `comprometimentoMensal`, `fluxoCaixaSobreDivida`, `calcularSinaisSolvencia`, `simularRefinanciamento`, `projetarQuitacao`, `runwayDivida`, `gerarConselhoDivida`) + options ECharts prontas (`optBarrasV` com suporte a cor por barra, `optRosca`, `optLinhaPrevisao`, `optLinhaMulti`, `optCascata` waterfall) + `CORES` + `FONTE_EXEC` (Georgia serif).
- **`lib/cfoTextos.ts`** — traduções CFO PT/EN/ES (`cfoT(lang)`, `textoInsight`) + narrativas automáticas (variação, margem, ruptura de caixa, causa raiz, ponte lucro×caixa, runway do DRE, conselho CFO, muro de vencimentos, runway da dívida, conselho de dívida) + `canaisCompartilhamento` (WhatsApp/Telegram/Gmail/Outlook/sem mailto).

> Regra de ouro: quando um módulo precisar de um cálculo ou texto novo que outro módulo também usará, adicione ao alicerce, não ao módulo.

---

## 3. O QUE JÁ ESTÁ PRONTO E FUNCIONANDO

### Dashboard principal (`/dashboard`)
Vídeo hero (logo `/logo-aitech.png` sempre visível) → letreiro premium "Dashboard Financeiro" → `components/DashFinanceiro.tsx` → letreiro premium "Dashboard Comercial" → `components/DashComercial.tsx` → cards de módulos.
**Status dos dados:** DEMO (fictícios, com tag "DEMO"). Conectar ao Supabase na fase de integração — usando `cfoCore`, sem reescrita.

### Receitas (`/receitas`) — CONECTADO a dados reais
MRR, ARR, crescimento MoM, ticket médio, % recorrente, concentração top 20%. Modal único: barras evolução + rosca categoria + linha previsão IA.

### Custos Fixos (`/custos-fixos`) — CONECTADO a dados reais
Radar de Renovações + Detector de Desperdício (duplicados + economia potencial).

### Custos Variáveis (`/custos-variaveis`) — CONECTADO a dados reais
Margem de Contribuição, Ponto de Equilíbrio, Margem de Segurança, Volatilidade, comparativo entre períodos por categoria, anomalias históricas/price creep, sugestões acionáveis, projeção.

### Fluxo de Caixa (`/fluxo-caixa`) — CONECTADO a dados reais
Visão semanal rolante de 13 semanas, detector de ruptura de caixa com data exata, cenários otimista/pessimista baseados no desvio histórico real, auto-população de previstos cruzando Contas a Receber/Pagar/Custos Fixos/Dívidas (leitura, nunca escreve).

### DRE (`/dre`) — CONECTADO a dados reais
**Não é um relatório estático — é um diagnóstico.** Cascata completa (Receita Bruta → Margem de Contribuição → EBITDA → Lucro Líquido) com Análise Vertical/Horizontal linha a linha, gráfico waterfall. Decomposição de causa raiz da variação do lucro. Ponte Lucro × Caixa. Semáforo de Saúde + Runway. Conselho CFO acionável. Projeção 3 meses. Histórico consultável (tabela `dre_historico`, snapshot que congela ao fechar o período). Cor verde/teal.
Bug real corrigido: imposto calculado com % fixo chutado em vez do regime tributário real — corrigido no DRE e no Relatórios (mesmo chute, lucro líquido divergente pro mesmo período).

### Endividamento (`/endividamento`) — CONECTADO a dados reais, entregue nesta rodada
**Sistema de sobrevivência, não lista de dívidas.** Escada de Vencimentos (cronograma projetado 24 meses, detector de "muro" ancorado na capacidade real de pagamento). Método Avalanche (ranking por taxa de juro real, tag "cara", "quitar primeiro"). 5 indicadores de solvência com semáforo: Cobertura de Juros, Dívida/EBITDA (reaproveita `montarDRE`), Dívida/Receita, Comprometimento Mensal, Fluxo de Caixa/Dívida. Simulador de Refinanciamento interativo. Runway da Dívida. Conselho CFO amarrado a gatilhos reais. Projeção de Quitação (ritmo atual vs avalanche). Cor rosa/magenta.
Tabela usada: **`dividas`** (não `endividamento` — essa é órfã, ver seção 8). Nenhuma coluna/tabela nova precisou ser criada — tudo derivado do schema existente cruzado com Receitas/Custos/Fluxo de Caixa/Empresas.

---

## 3-A. Metas (`/metas`) — CONECTADO a dados reais, entregue nesta rodada
**O antídoto contra meta vaga, sem dono e "set and forget"** — não é mais uma lista onde `valor_atual` era digitado à mão. Toda meta é vinculada a um dos 8 tipos ligados a dado real (`faturamento, lucro, margem, reducao_custo, reducao_divida, caixa, ticket_medio, num_clientes`) e o progresso é **calculado ao vivo** cruzando Receitas/Custos Fixos+Variáveis/Dívidas/Fluxo de Caixa/Clientes (leitura, nunca escreve nessas tabelas) — e gravado de volta em `metas.valor_atual` a cada carregamento, pra qualquer outro módulo (Dashboard/Relatórios/IA Financeira) que um dia ler dessa tabela já achar o valor certo, sem duplicar a lógica (lição do bug dívidas/endividamento).

Entregue: Ritmo Necessário vs Ritmo Atual, barra Progresso Real × Esperado, Detector de Meta Irreal (fácil/impossível/realista comparando com o ritmo histórico real da empresa via `ritmoHistoricoMedio`, novo em `cfoCore.ts`), Projeção de Fechamento com alerta antecipado, Árvore de Dependência entre Metas (ex: meta de Lucro em risco porque Faturamento ou Redução de Custo dela está vermelha), Tradução em Dinheiro + Conselho CFO acionável, marcos 25/50/75/100% com celebração executiva (sem carnaval), status `concluida` promovido automaticamente ao bater 100%, `arquivada` como ação manual pra encerrar sem apagar histórico. Cor tema: roxo/violeta `#8b5cf6` + dourado `#d4af37` nas conquistas.

Pesquisa que embasou o desenho: nem Conta Azul/Omie nem ferramentas globais de OKR (Lattice, Profit.co, Align) puxam progresso automaticamente das transações reais. Pra "nº de clientes" especificamente, o padrão de mercado sério (ChartMogul/Baremetrics) é contar **clientes ativos líquidos** (descontando churn), não "novos clientes brutos" — decisão tomada assim de propósito pra fechar a mesma brecha de goal-gaming que esse módulo existe pra evitar.

**Schema (SQL já aplicado pelo Elias no Supabase):**
```sql
ALTER TABLE metas
  ADD COLUMN IF NOT EXISTS tipo_meta text,
  ADD COLUMN IF NOT EXISTS valor_inicial numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_inicio date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS direcao text,
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS descricao text;
```
`tipo_meta` é travado depois de criada a meta (define de onde o progresso é lido). Metas antigas (tipo receita/economia/investimento/reducao, sem `tipo_meta`) continuam visíveis com aviso pra reclassificar — não foram migradas automaticamente porque "investimento" não tem correspondente real nos 8 tipos novos.

**Rodada 2 (mesmo dia):** Elias pediu 3 campos no modal — atendido:
- **Valor Inicial**: já era calculado automaticamente desde a v1, mas ficava invisível. Agora aparece no modal, pré-preenchido ao vivo com o valor real do módulo vinculado, editável.
- **Direção (aumentar/reduzir)**: a matemática de ritmo/progresso já era direção-agnóstica (sinal da diferença `valor_meta − valor_inicial` já resolvia isso) — o campo novo não é correção de cálculo, é **trava de segurança**: `validarDirecaoMeta` (novo em `cfoCore.ts`) avisa se a direção escolhida contradiz os valores digitados (ex: erro de digitação no alvo).
- **Responsável**: campo novo, opcional. Pesquisa (Lattice/Profit.co) confirma: metas com dono único têm 26% mais conclusão.
- **Descrição/Estratégia**: campo novo opcional, fecha "objetivo + métrica + valor + prazo + como".
- **Alerta de ritmo configurável — deixado de fora**, por decisão consciente: pesquisa mostrou que as ferramentas líderes (Profit.co, Lattice) fazem esse alerta automático via IA/threshold interno, não configurado pelo usuário — exatamente o que o semáforo verde/amarelo/vermelho já faz sem exigir setup manual.

**Bug crítico corrigido:** salvar/editar meta engolia erro do Supabase silenciosamente — fechava o modal como se tivesse salvo mesmo quando o INSERT/UPDATE falhava (RLS ou constraint), perdendo os dados digitados. Agora `salvar()` mostra o erro real na tela e **mantém o modal aberto com os dados preenchidos** em caso de falha — nada mais some. Hipótese mais provável do bug relatado: CHECK constraint antiga em `metas.status` rejeitando os novos valores (`ativa`/`arquivada`) — SQL defensivo pra remover essa trava (se existir) foi passado ao Elias.

**Verificação feita:** `tsc --noEmit` limpo (as duas rodadas) e `next build` da v1 compilou com sucesso (incluindo `metas/page.tsx`, `cfoCore.ts`, `cfoTextos.ts`) — o build só falhou depois disso, num ponto sem relação (rota `/api/stripe/webhook`, pré-existente, falta chave da Stripe no `.env.local` local). **Não testado no navegador com login real** — sem ferramenta de browser disponível nesta sessão e sem credencial (decisão consciente de não usar login/senha real em chat). Elias está testando manualmente.

## 3-B. Investimentos (`/investimentos`) — CONECTADO a dados reais, Fase 1 entregue nesta rodada
**Centro de Inteligência para Alocação de Capital — não uma lista de aplicações financeiras.** O módulo antigo era um CRUD simples (nome/valor/tipo/data/rentabilidade digitada à mão, zero camada CFO). Pesquisa que embasou o desenho: Omie só controla a movimentação entre "conta corrente" e "conta aplicação" sem calcular rentabilidade real; Conta Azul não tem módulo de investimentos; as ferramentas globais de tesouraria (Rho, Slash, Brex) otimizam onde a empresa guarda o caixa, mas nenhuma cruza isso com a própria dívida da empresa.

**Diferencial mundial:** Custo de Oportunidade vs Dívida — `detectarCustoOportunidade` (novo em `cfoCore.ts`) compara a rentabilidade líquida real de cada investimento de liquidez rápida (IR regressivo automático por prazo decorrido, Lei 11.033/2004, via `rentabilidadeLiquidaAnual`) com a taxa da dívida mais cara ativa (reaproveita `dividas`) e recomenda resgatar-e-quitar quando compensa, com a economia mensal estimada em R$. Nenhum ERP nacional ou plataforma global de tesouraria faz essa ponte hoje.

Entregue: Escada de Liquidez (`escadaLiquidezInvestimentos` — quando cada aplicação libera capital, 12 meses), Radar de Riscos (concentração por tipo, concentração por instituição, liquidez, Dívida/EBITDA reaproveitando `montarDRE`+`dividaEbitda`, volatilidade renda variável/cripto), Score de Investimento 0-1000 (`calcularScoreInvestimento` — diversificação, liquidez, rentabilidade vs CDI real, caixa, eficiência), Detector de Capital Ocioso (`detectarCapitalOcioso` — caixa acima de uma reserva operacional saudável de 2 meses), Conselho CFO acionável, Indicadores de Mercado REAIS — Selic/CDI/IPCA acumulado 12m/dólar PTAX via API pública do Banco Central (SGS, sem chave, sem custo — novo `lib/bcbApi.ts`), com fallback fixo se a API cair. Modal único (Power BI style): Composição por Tipo + Composição por Instituição + Radar de Risco + Score Breakdown. Cor tema: azul-royal + dourado.

**Schema (SQL enviado ao Elias — rodar no Supabase antes de testar o módulo):**
```sql
ALTER TABLE investimentos
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS indexador text,
  ADD COLUMN IF NOT EXISTS instituicao text,
  ADD COLUMN IF NOT EXISTS liquidez text DEFAULT 'no_vencimento',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';
```

**Decisões técnicas honestas (comunicadas ao Elias antes de codar):**
- "Caixa disponível" vem do mesmo cálculo do Fluxo de Caixa (entradas−saídas realizadas), não do saldo bancário do Open Finance — o Pluggy hoje só persiste transações (`of_transacoes`), não saldo de conta.
- Nenhuma chamada a LLM real — a camada "Conselho CFO" é determinística (mesmo padrão de `gerarConselhoDivida`/`gerarConselhoMeta`), porque a Claude API só entra como IA real do Axioma na etapa final do projeto (decisão do Elias).
- Pluggy e Stripe seguem em modo de teste — nenhuma função de ativação real foi tocada neste módulo.

**Fase 2 (entregue, mesma rodada — Elias aprovou e já rodou o SQL):** Capital Allocation Engine (`compararAlocacoes`, novo em `cfoCore.ts`) — usuário adiciona opções de uso do capital (CDB/Tesouro/Fundos/Debêntures com taxa conhecida, ou Expansão/Equipamento/Marketing/Contratação/Automação com ganho mensal estimado pelo próprio usuário — o sistema não inventa ROI de marketing sozinho, é decisão de negócio) e a engine rankeia tudo contra o custo de capital real da empresa (taxa da dívida mais cara ativa, ou CDI se não houver dívida) no **Radar de Oportunidades**, com payback e nível de risco por categoria. Simulador Executivo (`simularCenariosExecutivos`) gera 4 cenários nomeados (conservador/base/otimista/adverso) a partir de choques que o próprio usuário digita (Δ receita, Δ custo fixo, Δ custo variável, pontos de juros — efeito Selic —, aporte de capital e retorno mensal esperado desse aporte) e mostra lucro líquido mensal, saldo de caixa projetado em 12 meses e runway crítico se o cenário se mantiver. Reaproveita 100% o núcleo do DRE (`montarDRE`) já existente — na prática, os 4 itens do brief original do Elias (Allocation Engine, Simulador, Radar de Oportunidades, "Digital Twin Financeiro") colapsaram numa única engine de simulação, não 4 sistemas separados. Botão "Simular este cenário" no Radar de Oportunidades pré-preenche o Simulador com a opção escolhida, fechando o loop decisão → simulação. As opções de alocação são efêmeras (estado local da sessão, não persistidas — é uma ferramenta de simulação, não um cadastro).

**Verificação feita:** `tsc --noEmit` limpo e `next build` compilou com sucesso nas duas rodadas (Fase 1 e Fase 2, incluindo `investimentos/page.tsx`, `cfoCore.ts`, `cfoTextos.ts`, `bcbApi.ts`) — o build só parou depois disso, em pontos pré-existentes e sem relação (`/api/pluggy/webhook` e `/api/stripe/create-checkout`, faltam chaves no `.env.local` local — Pluggy e Stripe seguem em modo teste por decisão do Elias). Não testado no navegador com login real nesta sessão.

## 3-C. Simulações (`/simulacoes`) — reescrito do zero, entregue nesta rodada
**Centro de Simulação Estratégica — antes era uma calculadora isolada de 3 campos (lucro/ponto de equilíbrio/crescimento composto), sem tabela no banco, sem nenhum dado real.** Pesquisa que embasou o desenho (Workday Adaptive Planning, Anaplan, Pigment, Planful, Vena, Oracle EPM, SAP Analytics Cloud, Dynamics 365, NetSuite P&B, IBM TM1): confirmou que Monte Carlo não é nativo em praticamente nenhuma ferramenta de porte PME (é add-on caro ou depende de consultoria), que o modelo de planejamento nessas plataformas vive desconectado do realizado (recarrega por ETL), e que nenhuma ferramenta global ou nacional simula os 3 regimes tributários brasileiros dentro do próprio cenário financeiro projetado.

**Generalizou, não duplicou:** o motor de 4 cenários nomeados (`simularCenariosExecutivos`, criado na Fase 2 de Investimentos) virou a base compartilhada — Investimentos continua funcionando sem alteração, Simulações reaproveita a mesma função.

Entregue: **Ponto de Partida automático** (receita/custo fixo/custo variável/dívida/caixa/regime tributário puxados ao vivo de Receitas, Custos Fixos, Custos Variáveis, Dívidas, Fluxo de Caixa e Empresa — leitura, nunca escreve), **Objetivos Rápidos** por botão (Dobrar Faturamento, Triplicar Lucro — resolve o Δ% de receita necessário via `receitaPctParaMultiplicarLucro`, novo em `cfoCore.ts` —, Reduzir Custos e Reduzir Custo da Dívida com alvo digitado pelo usuário, Melhorar Fluxo de Caixa) e presets de **Crise**/**Expansão** (`gerarChoquePreset`, novo em `cfoCore.ts` — heurísticas de mercado documentadas, sempre editáveis antes de simular), **6 cenários** (conservador/base/otimista/adverso + crise/expansão via preset), **Análise de Sensibilidade** (`analiseSensibilidade`, novo em `cfoCore.ts` — varia cada driver isoladamente incluindo câmbio opcional via exposição cambial declarada pelo usuário, rankeia por impacto no lucro líquido), **Simulação Monte Carlo** (`simulacaoMonteCarlo`, novo em `cfoCore.ts` — 2000 iterações com distribuição triangular usando os próprios limites otimista/adverso como bordas, sem estatística inventada; produz probabilidade de lucro positivo, probabilidade de ruptura de caixa, faixas P10/P50/P90), **Simulação Tributária integrada** (compara Simples Nacional/Presumido/Real dentro do mesmo cenário simulado, reaproveitando `calcularImpostoRegime` já existente em `iaTributariaHelpers.ts`), e **Conselho Executivo determinístico** (resumo, riscos, oportunidades, premissas usadas, limitações, nível de confiança, plano de ação — com nota de transparência explícita na tela: "nenhum texto aqui foi gerado por um modelo de linguagem", já antecipando a integração futura da Claude API). Cenários são efêmeros (estado de sessão, sem tabela nova, sem SQL). Cor tema: índigo profundo + prata (nova, nenhum módulo usava ainda).

**Decisão consciente registrada no plano aprovado pelo Elias:** o briefing original pedia "IA conversa naturalmente" / "a IA monta o cenário sozinha" — isso contradiz a decisão já tomada de que a Claude API só entra como IA real do Axioma no final do projeto. Resolvido com presets determinísticos por botão (mesmo resultado prático pro usuário, sem LLM). M&A/fusões/franquias/internacionalização ficaram fora de escopo (exigem módulo de valuation que não existe ainda) — registrado como backlog explícito.

**Verificação feita:** `tsc --noEmit` limpo no projeto inteiro. Não testado no navegador com login real nesta sessão.

## 3-D. Precificação (`/precificacao`) — reescrito do zero, entregue nesta rodada
**Centro de Engenharia de Valor — antes era uma calculadora de markup de 1 tela (custo/(1−margem−impostos−despesas)), tabela `precificacao` com 4 campos, sem histórico, sem concorrente, sem ligação com nenhum outro módulo.** Briefing original pedia um "Executive Board" com 9 especialistas virtuais + IA conversacional livre ("Copiloto Executivo") + rastreamento automático de concorrentes + valuation completo. Pesquisa de mercado (Pricefx, Vendavo, PROS, Zilliant, Competera, Omnia, ProfitWell/Simon-Kucher) confirmou 3 coisas antes de codar: (1) nenhuma ferramenta do setor — nem as de US$100k+/ano — tem "war room" multiagente de IA nem um "pricing power score" pronto; (2) elasticidade real em qualquer ferramenta exige milhares de transações históricas por SKU, PME não tem isso no dia 1; (3) rastreamento automático de concorrentes é frágil mesmo pras líderes de mercado (matching de produto falha) e carrega risco jurídico de scraping.

**3 decisões técnicas apresentadas ao Elias antes de codar, aprovadas para seguir com a recomendação:**
1. **Painel de Especialistas por regra agora, Copiloto/Executive Board real de IA depois** — mesma lógica já usada em todo o app; a Claude API segue desativada por decisão do Elias (ver seção 1).
2. **Cadastro manual de concorrentes**, não scraping — scraping fica de fora do escopo até uma decisão e aprovação própria, separada.
3. **Elasticidade honestamente condicionada** — só calcula com ≥3 mudanças de preço reais registradas pro mesmo produto; abaixo disso, mostra "dados insuficientes" em vez de inventar uma curva.

Entregue: **IPPA — Índice de Poder de Precificação Axioma** (0-1000, `calcularIPPA` novo em `cfoCore.ts` — margem vs. referência saudável, dependência de desconto, concentração de receita por produto, estabilidade de receita, competitividade vs. concorrente cadastrado; sempre explica qual componente está puxando a nota pra baixo), **Motor de Precificação por Valor** (`calcularImpactoPreco` — qualquer preço candidato recalcula receita/margem/lucro líquido/EBITDA/tributo em cima do DRE real da empresa, reaproveitando `montarDRE`/`margemContribuicao`), **Engenharia de Descontos** (`calcularImpactoDesconto` — mostra o limite máximo saudável de desconto antes de conceder qualquer um), **Radar de Oportunidades** (`detectarOportunidadesPrecificacao` — produtos que destroem margem, subprecificados, sobreprecificados vs. concorrente, premium, que sustentam o caixa), **Elasticidade honesta** (`estimarElasticidade`), **Inteligência Competitiva** (cadastro manual de concorrentes por produto, tabela nova `concorrentes`), **War Room** (reaproveita 100% o motor de Simulações — `simularCenariosExecutivos` — com 11 presets de cenário: concorrente reduz/aumenta preço, inflação, Selic, câmbio, crise, mudança tributária, novo concorrente, explosão de demanda, queda nas vendas, mudança de fornecedores), **Painel de Especialistas** (5 cards — CFO, Tributário, Comercial/Pricing, Risco, Analista Financeiro — cada um com dado real e nota de transparência de que é regra, não IA generativa) e **Memória Estratégica** (tabela nova `decisoes_precificacao` — toda mudança de preço aplicada via Motor de Precificação é logada automaticamente com preço anterior/novo, e o resultado real pode ser preenchido depois direto na lista, fechando o loop "decisão → resultado → aprendizado"). Cor tema: amarelo + dourado (nova).

**Excluído conscientemente, não esquecido:** ROI/Payback, capital de giro, necessidade de estoque, capacidade operacional e valuation por múltiplo/DCF (o Axioma não tem módulo de Estoque/PDV nem dados de valuation ainda); LTV/CAC/Churn no IPPA (exige custo de aquisição de cliente, que não existe no schema); bundles/cross-sell/upsell/reposicionamento no Radar (exige dados de item por pedido, só existirão com o módulo E-commerce/PDV).

**Schema (SQL a rodar no Supabase antes de testar — enviado ao Elias):**
```sql
ALTER TABLE precificacao
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS unidades_vendidas_mes numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';

CREATE TABLE IF NOT EXISTS concorrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  produto_id uuid references precificacao(id) on delete cascade,
  nome_concorrente text not null,
  preco numeric not null,
  posicionamento text,
  created_at timestamptz default now()
);
alter table concorrentes enable row level security;
create policy "concorrentes_select" on concorrentes for select using (auth.uid() = user_id);
create policy "concorrentes_insert" on concorrentes for insert with check (auth.uid() = user_id);
create policy "concorrentes_update" on concorrentes for update using (auth.uid() = user_id);
create policy "concorrentes_delete" on concorrentes for delete using (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS decisoes_precificacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  produto_id uuid references precificacao(id) on delete cascade,
  preco_anterior numeric,
  preco_novo numeric,
  motivo text,
  unidades_no_momento numeric,
  resultado_esperado text,
  resultado_real text,
  created_at timestamptz default now()
);
alter table decisoes_precificacao enable row level security;
create policy "decisoes_precificacao_select" on decisoes_precificacao for select using (auth.uid() = user_id);
create policy "decisoes_precificacao_insert" on decisoes_precificacao for insert with check (auth.uid() = user_id);
create policy "decisoes_precificacao_update" on decisoes_precificacao for update using (auth.uid() = user_id);
create policy "decisoes_precificacao_delete" on decisoes_precificacao for delete using (auth.uid() = user_id);
```

**Verificação feita:** `tsc --noEmit` limpo no projeto inteiro (exit 0). Não testado no navegador com login real nesta sessão — e não pode ser testado de ponta a ponta até o SQL acima rodar no Supabase.

## 3-E. Clientes (`/clientes`) — reescrito do zero, entregue nesta rodada
**Centro de Inteligência Estratégica de Clientes — antes era um CRUD de 2 abas (cadastro + cobrança básica sobre `contas_receber`), duplicando de forma simplificada o que os módulos Contas a Receber e Inadimplência já fazem melhor.** Briefing original ("ordem executiva") pedia Digital Twin completo com LTV, CAC, margem por cliente, produtos adquiridos, Executive Board com 9 especialistas de IA e motor de IA conversacional livre. Pesquisa no schema real antes de codar mostrou que **`receitas` não tem `cliente_id`** — não existe vínculo venda→cliente hoje, então margem/LTV real/CAC/produtos adquiridos são matematicamente impossíveis de calcular com dado real (mesmo tipo de restrição já documentado em Precificação, seção 3-D). Descoberta nova: existe uma tabela própria `inadimplencia` (régua de cobrança: estágio, dias de atraso, valor recuperado, forma/data de último contato) que não era usada pelo módulo Clientes antigo.

**Decisão tomada (mesma linha de Precificação, sem precisar reconfirmar com o Elias — já é o padrão do app):** IA determinística agora (mesmo padrão de `cfoTextos`/IPPA/Score360), pronta para virar IA real assim que a `ANTHROPIC_API_KEY` for ativada — ver seção 1. LTV/CAC/margem/produtos ficam fora da tela, não fingidos; o schema é preparado (ver SQL abaixo) para acender sozinhos quando a Elias vincular receita a cliente.

Entregue, tudo em `lib/clienteIntelHelpers.ts` (novo) + `optDispersao` novo em `cfoCore.ts`: **IVCA — Índice de Valor do Cliente Axioma** (`calcularIVCA`, 0-1000, mesma forma do IPPA — pontualidade, volume/ticket, recorrência, tendência, risco de inadimplência, sempre explicando o maior freio), **Saúde do Cliente** (`calcularSaudeCliente` — 4 gauges: pagamento, relacionamento, recorrência, comercial), **Radar de Sinais** (`detectarSinaisCliente` — cliente premium, pronto para upsell, em risco, negligenciado, gera caixa recorrente, concentração alta na carteira — mesmo padrão cascata de `detectarOportunidadesPrecificacao`), **Conselho Executivo do Cliente** (`montarConselhoExecutivo` — 6 cards de especialista relabeling dado real + recomendação consolidada, mesmo formato do Painel de Especialistas de Precificação), **Pergunte à ZIA** (`enviarPerguntaZIA` — tenta `/api/ia-chat` real, cai em `respostaZIAPorRegras` se a chave estiver desativada; **corrige o contrato da chamada** — a rota espera `{mensagem, historico, contexto}`, e IA Financeira/IA Tributária hoje mandam `{prompt, mensagens}` e por isso nunca acertam a rota mesmo com chave ativa; não mexi nesses dois módulos, só registrando o bug aqui), **Linha do Tempo Financeira** (`montarTimelineCliente` — 100% dado real de `contas_receber`+`inadimplencia`) e **Mapa de Valor da Carteira** (scatter IVCA × Segurança via `optDispersao`, na aba nova "Carteira" que virou a tela padrão do módulo — resumo executivo com valor total, ticket médio, inadimplência e concentração top-5, antes da aba "Cliente" (Digital Twin) e "Cobranças" (o antigo CRUD de contas, preservado).

**Excluído conscientemente, não esquecido:** LTV real/CAC/margem/produtos adquiridos (sem tabela de vendas — é o módulo E-commerce/PDV, seção 5); Simulador de Decisões completo por cliente (motor já existe — `simularCenariosExecutivos` do War Room — Fase 2, quando `receitas.cliente_id` tiver dado suficiente); integração cruzada com Dashboard/DRE/Metas/Score Axioma (Fase 2, risco de quebrar módulos em produção fazendo tudo de uma vez).

**Schema — SQL já rodado pelo Elias no Supabase:**
```sql
alter table receitas add column if not exists cliente_id uuid references clientes(id);
```
Coluna existe, mas fica sem efeito até alguma receita ser vinculada — nenhuma tela escrevia nela ainda.

**Complemento na mesma rodada — Receitas (`/receitas`) ganhou o campo "Cliente" (opcional):** modal de nova/editar receita agora tem um seletor de cliente (`novo.cliente_id`, carregado de `clientes` junto com as receitas em `carregarReceitas`); ao salvar, grava `cliente_id` em `receitas`; linhas da tabela mostram um badge "👤 Nome" quando vinculada. É o único ponto de escrita nesse campo hoje — é o que começa a popular o dado real que o IVCA (seção 3-E) precisa pra acender LTV/margem por cliente. `tsc --noEmit` limpo depois dessa mudança também.

**Verificação feita:** `tsc --noEmit` limpo no projeto inteiro (exit 0). `next build` compilou com sucesso (`✓ Compiled successfully`) — o build só falhou depois disso, num ponto sem relação (rota `/api/stripe/create-checkout`, pré-existente, falta chave da Stripe no `.env.local` local, mesmo padrão já visto em Metas/Precificação). Não testado no navegador com login real — sem credencial (decisão consciente de não usar login/senha real em chat, mesma prática já registrada na seção 3-A). Dev server (`npm run dev`) deixado rodando em `localhost:3000` para o Elias testar `/clientes` e `/receitas` manualmente.

## 3-F. Correção — contrato de `/api/ia-chat` em IA Financeira e IA Tributária
Bug identificado ao construir a ZIA de Clientes (seção 3-E) e corrigido a pedido do Elias: `app/api/ia-chat/route.ts` espera `{ mensagem, historico, contexto }`, mas `ia-financeira/page.tsx` e `ia-tributaria/page.tsx` mandavam `{ prompt, mensagens }` — nomes de campo errados, então `request.json()` nunca achava `mensagem`, a rota respondia 400 e o front sempre caía no fallback de regras (`respostaPorRegras`/`respostaTributariaPorRegras`), **mesmo com `ANTHROPIC_API_KEY` seguisse ativa**. Corrigido nas duas telas: `mensagem` agora recebe o prompt completo já montado (`montarPromptCFO`/`montarPromptTributario`, que já embutem dado real + pergunta do usuário — comportamento preservado), `historico` recebe o mesmo array de mensagens anteriores de antes. Escopo mínimo: só os dois `fetch()`, nada na rota nem na lógica de regras. Efeito prático hoje: nenhum, porque a chave segue desativada por decisão do Elias (seção 1) — mas no dia em que ele ativar, IA Financeira e IA Tributária passam a usar Claude de verdade sem precisar de mais nenhuma mudança de código. `tsc --noEmit` limpo depois da correção.

## 3-G. Metas ligado ao alicerce de Clientes — dedupe de "clientes ativos líquidos"
Metas (tipo de meta `num_clientes`) e o snapshot da carteira em Clientes (seção 3-E) calculavam a mesma coisa — "quantos clientes com `status = 'ativo'`" — cada um com seu próprio filtro inline. Extraído para `contarClientesAtivos(clientes, ateISO?)` em `lib/clienteIntelHelpers.ts`, única fonte de verdade agora: sem `ateISO` conta o estado atual (usado por `montarSnapshotsCarteira`, carteira de Clientes), com `ateISO` conta "ativos até aquela data" (usado por `valorMetrica` em `metas/page.tsx`, que precisa de ponto no tempo arbitrário pra série histórica/detector de meta irreal). Mesmo resultado de antes, zero mudança de comportamento — só parou de duplicar o filtro em dois arquivos. `tsc --noEmit` limpo.

## 4. PRÓXIMO PASSO
Fornecedores, Contas a Receber e Inadimplência ainda no padrão CRUD antigo (Clientes já saiu, seção 3-E) → E-commerce/PDV (alta prioridade — 2 clientes esperando). Perguntar ao Elias a ordem antes de começar.

---

## 5. FILA DEPOIS (Comercial)
Comercial (Clientes, Fornecedores, Contas a Receber, Inadimplência), integração do Dashboard aos dados reais, módulo **E-commerce/PDV**.

---

## 6. PADRÃO QUE TODO MÓDULO SEGUE (checklist)
1. Botão Compartilhar no topo.
2. KPIs originais mantidos (CanvasBox).
3. Camada CFO (só se `temDados`): KPIs CFO (6 cards) → letreiro loop → painéis especiais do módulo → **modal único** ECharts → insights.
4. Busca/filtro + tabela CRUD (mantidos).
5. Modais criar/editar + Centro de Compartilhamento.
6. Fonte `FONTE_EXEC` nos títulos. Cor de tema própria. Responsivo. i18n completo. Dados reais.
7. Se precisar coluna/tabela nova → avisar Elias + SQL antes.
8. Fechar com `git add . && git commit && git push`.

---

## 7. COMO O ELIAS TRABALHA
Não é programador. No Claude Code, ele aprova planos e você executa direto nos arquivos. Ele valoriza: honestidade técnica, código limpo sem sobras, qualidade acima de velocidade, e recursos que os concorrentes não têm. Quando ele diz "ok"/"pode continuar", é para prosseguir. Tom com ele: direto, didático, 🦅, sem enrolação. Se um pedido dele contradizer o que o código real mostra (ex: nome de tabela errado), aponte a contradição e explique — não obedeça cegamente algo que reintroduziria um bug já corrigido.

## 8. ARMADILHA CONHECIDA — dívidas vs endividamento
A tabela real, populada e usada por Endividamento/DRE/Fluxo de Caixa/Relatórios é **`dividas`**. A tabela `endividamento` é órfã (schema diferente, nunca alimentada pela UI) — bug identificado e corrigido no commit `f421c93`. Se qualquer instrução futura mencionar "tabela endividamento", é quase certo um engano — confirme antes de agir.

**Pergunte ao Elias qual das duas frentes da seção 4 ele quer primeiro (não implemente antes dele decidir — é a regra dele).**
