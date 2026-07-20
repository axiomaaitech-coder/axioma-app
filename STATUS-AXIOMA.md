# 🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS
**Complementa o CONTEXTO-AXIOMA.md. Aqui está o estado exato do projeto e o próximo passo. Leia junto com o CONTEXTO e o comando de papel que já recebeu.**

---

## 1. RESUMO EM UMA FRASE
Estamos transformando cada módulo do Axioma em "CFO de altíssimo nível", em cima de um alicerce reutilizável (`cfoCore` + `cfoTextos`), seguindo o menu Financeiro. **O menu Financeiro inteiro está completo**: Dashboard, Receitas, Custos Fixos, Custos Variáveis, Fluxo de Caixa, DRE e Endividamento. **Metas** e **Investimentos** (menu Crescimento) estão completos — ver seções 3-A e 3-B (Investimentos com as duas fases entregues: núcleo CFO + Capital Allocation Engine/Simulador Executivo). Próximo: Simulações, Precificação, ou pular pro E-commerce/PDV (ver seção 4). Combinado com o Elias: a Claude API entra como a "IA inteligente" real do Axioma só no final, depois de todos os módulos prontos — até lá, a camada "IA"/"Conselho CFO" é lógica determinística baseada em regras (mesmo padrão já usado em todo o app).

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

## 4. PRÓXIMO PASSO
Simulações, Precificação (resto do menu Crescimento) → Clientes, Fornecedores, Contas a Receber, Inadimplência (Comercial) → E-commerce/PDV (alta prioridade — 2 clientes esperando). Perguntar ao Elias a ordem antes de começar.

---

## 5. FILA DEPOIS (menu Crescimento/Comercial)
Resto do Crescimento (Simulações, Precificação), Comercial (Clientes, Fornecedores, Contas a Receber, Inadimplência), integração do Dashboard aos dados reais, módulo **E-commerce/PDV**.

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
