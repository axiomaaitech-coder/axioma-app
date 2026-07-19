# 🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS
**Complementa o CONTEXTO-AXIOMA.md. Aqui está o estado exato do projeto e o próximo passo. Leia junto com o CONTEXTO e o comando de papel que já recebeu.**

---

## 1. RESUMO EM UMA FRASE
Estamos transformando cada módulo do Axioma em "CFO de altíssimo nível", em cima de um alicerce reutilizável (`cfoCore` + `cfoTextos`), seguindo o menu Financeiro. Já entregamos Dashboard principal, Receitas, Custos Fixos, Custos Variáveis, Fluxo de Caixa e DRE. O próximo é **Endividamento**.

---

## 2. O ALICERCE (já construído e funcionando)
Dois arquivos base que todo módulo usa. **Nunca duplicar lógica — sempre importar daqui:**

- **`lib/cfoCore.ts`** — cálculos (MRR, ARR, crescimento MoM, ticket médio, concentração, % recorrente, previsão IA, radar de renovações, detector de desperdício, peso sobre receita, margem de contribuição/break-even/margem de segurança/volatilidade, comparativo entre períodos, anomalias históricas/price creep, série semanal rolante, detector de ruptura de caixa, projeção de saldo com cenários, recorrência mensal projetada) + **DRE completo** (`montarDRE`, `decomporVariacaoLucro`, `ponteLucroCaixa`, `calcularSinaisSaude`/`semaforoSaude`, `runwayCritico`, `gerarConselhoCFO`, `projetarDRE`) + options ECharts prontas (`optBarrasV`, `optRosca`, `optLinhaPrevisao`, `optLinhaMulti`, `optCascata` waterfall) + `CORES` + `FONTE_EXEC` (Georgia serif).
- **`lib/cfoTextos.ts`** — traduções CFO PT/EN/ES (`cfoT(lang)`, `textoInsight`) + narrativas automáticas (variação, margem, ruptura de caixa, causa raiz, ponte lucro×caixa, runway, conselho CFO) + `canaisCompartilhamento` (WhatsApp/Telegram/Gmail/Outlook/sem mailto).

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

### DRE (`/dre`) — CONECTADO a dados reais, entregue nesta rodada
**Não é um relatório estático — é um diagnóstico.** Cascata completa (Receita Bruta → Margem de Contribuição → EBITDA → Lucro Líquido) com Análise Vertical (% sobre receita líquida) e Horizontal (vs período anterior) linha a linha, gráfico waterfall. **Decomposição de causa raiz** da variação do lucro (aponta qual fator puxou o resultado antes de sugerir corte). **Ponte Lucro × Caixa** (detecta empresa lucrativa no papel mas que consome caixa, com causa provável: recebíveis parados ou amortização de dívida). **Semáforo de Saúde** (margem líquida, EBITDA em queda, peso de custo fixo vs benchmark setorial, concentração de clientes) + **Runway** até situação crítica. **Conselho CFO acionável** (2-4 recomendações com ação + motivo + impacto em R$, nunca genérico). Projeção 3 meses. **Histórico consultável** — tabela nova `dre_historico`, snapshot automático que congela pra sempre assim que o período fecha. Cor tema verde/teal.
Bug real corrigido no caminho: imposto calculado com % fixo chutado em vez do regime tributário real da empresa (já calculado pela IA Tributária, nunca reaproveitado) — corrigido no DRE e também no Relatórios, que tinha o mesmo chute e mostrava lucro líquido diferente do DRE pro mesmo período.

---

## 4. PRÓXIMO PASSO IMEDIATO — Endividamento (`/endividamento`)

**Tabela:** `dividas` (id, descricao, tipo, valor_total, valor_pago, parcelas, vencimento, taxa_juros, user_id).
**Cor tema:** rosa/magenta.

Pesquisar brecha dos concorrentes antes de codificar (protocolo padrão). Candidatos a investigar: custo médio ponderado de capital, simulador de quitação antecipada vs investir a diferença, alerta de concentração de dívida com poucos credores, cruzamento com o EBITDA do DRE (endividamento/EBITDA é métrica clássica de risco que nenhum ERP BR pra PME mostra).

---

## 5. FILA DEPOIS DE ENDIVIDAMENTO (menu Financeiro)
Depois: Crescimento (Metas, Investimentos, Simulações, Precificação), Comercial (Clientes, Fornecedores, Contas a Receber, Inadimplência), integração do Dashboard aos dados reais, e o módulo **E-commerce/PDV** (alta prioridade — 2 clientes esperando).

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
Não é programador. No Claude Code, ele aprova planos e você executa direto nos arquivos. Ele valoriza: honestidade técnica, código limpo sem sobras, qualidade acima de velocidade, e recursos que os concorrentes não têm. Quando ele diz "ok", é para prosseguir. Tom com ele: direto, didático, 🦅, sem enrolação.

**Comece pedindo aprovação do plano de Endividamento (não implemente antes de ele aprovar — é a regra dele).**
