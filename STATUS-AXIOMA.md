# 🦅 AXIOMA — RELATÓRIO DE ONDE PARAMOS
**Complementa o CONTEXTO-AXIOMA.md. Aqui está o estado exato do projeto e o próximo passo. Leia junto com o CONTEXTO e o comando de papel que já recebeu.**

---

## 1. RESUMO EM UMA FRASE
Estamos transformando cada módulo do Axioma em "CFO de altíssimo nível", em cima de um alicerce reutilizável (`cfoCore` + `cfoTextos`), seguindo o menu Financeiro. Já entregamos o Dashboard principal, Receitas e Custos Fixos. O próximo é **Custos Variáveis**.

---

## 2. O ALICERCE (já construído e funcionando)
Dois arquivos base que todo módulo usa. **Nunca duplicar lógica — sempre importar daqui:**

- **`lib/cfoCore.ts`** — cálculos (MRR, ARR, crescimento MoM, ticket médio, concentração, % recorrente, previsão IA, radar de renovações, detector de desperdício, peso sobre receita) + options ECharts prontas (`optBarrasV`, `optRosca`, `optLinhaPrevisao`, `optLinhaMulti`) + `CORES` + `FONTE_EXEC` (Georgia serif).
- **`lib/cfoTextos.ts`** — traduções CFO PT/EN/ES (`cfoT(lang)`, `textoInsight`) + `canaisCompartilhamento` (WhatsApp/Telegram/Gmail/Outlook/sem mailto).

> Regra de ouro: quando um módulo precisar de um cálculo ou texto novo que outro módulo também usará, adicione ao alicerce, não ao módulo.

---

## 3. O QUE JÁ ESTÁ PRONTO E FUNCIONANDO

### Dashboard principal (`/dashboard`)
Vídeo hero (logo `/logo-aitech.png` sempre visível) → letreiro premium "Dashboard Financeiro" → `components/DashFinanceiro.tsx` → letreiro premium "Dashboard Comercial" → `components/DashComercial.tsx` → cards de módulos.
Cada componente = KPIs + letreiro em loop + **modal único estilo Power BI** (linha no topo + barras verticais + roscas).
**Status dos dados:** DEMO (fictícios, com tag "DEMO"). Conectar ao Supabase na fase de integração — usando `cfoCore`, sem reescrita.

### Receitas (`/receitas`) — CONECTADO a dados reais
Camada CFO: MRR, ARR, crescimento MoM, ticket médio, % recorrente, concentração top 20%. Modal único: barras evolução + rosca categoria + linha previsão IA. Insights automáticos, letreiro, compartilhamento. Cor tema: roxo.

### Custos Fixos (`/custos-fixos`) — CONECTADO a dados reais
Diferenciais que nenhum ERP BR tem: **Radar de Renovações** (avisa contratos perto de renovar, urgência colorida) + **Detector de Desperdício** (duplicados + economia potencial em R$). Coluna nova `data_renovacao` já criada no Supabase. Modal: rosca categoria + barras maiores custos. Cor tema: vermelho/laranja.

---

## 4. PRÓXIMO PASSO IMEDIATO — Custos Variáveis (`/custos-variaveis`)

**Tabela:** `custos_variaveis` (colunas: `id, descricao, valor, data, categoria, user_id`).
**Categorias atuais:** Marketing, Logística, Matéria-prima, Comissões, Embalagens, Outros.
**Cor tema:** laranja/âmbar (não repetir cor dos outros).

**Brecha pesquisada (o que os grandes CFOs calculam e nenhum ERP BR entrega para PME):**
- **Margem de Contribuição** — quanto sobra de cada real depois do custo variável
- **Ponto de Equilíbrio (break-even)** — quanto faturar para não ter prejuízo (puxa Custos Fixos)
- **Margem de Segurança** — quanto a receita pode cair antes do prejuízo
- **Volatilidade dos custos** — detecta oscilação anormal (risco)
- **Alerta de sangria de margem** — custo variável crescendo mais rápido que a receita

> Esses cálculos conectam Custos Variáveis + Custos Fixos + Receitas. Vale avaliar adicionar as funções novas (margem de contribuição, break-even, margem de segurança, volatilidade) ao `cfoCore` para reuso no DRE e no Dashboard depois.

**Estrutura atual do módulo (a manter):** CRUD completo com tabela `custos_variaveis`, modal criar/editar, PDF via `gerarPdfTabela`, CanvasBox azul, KPIs (total no mês, lançamentos, maior custo), i18n `t.custosVariaveis.*` e `t.geral.*`. **Não quebrar nada disso** — adicionar a camada CFO por cima, como foi feito em Receitas e Custos Fixos.

---

## 5. FILA DEPOIS DE CUSTOS VARIÁVEIS (menu Financeiro)
**Fluxo de Caixa** (cor cyan/azul) → **DRE** (verde/teal) → **Endividamento** (rosa/magenta).
Cada um: pesquisar brecha → plano → aprovação do Elias → construir sobre o alicerce → cor própria → git.

Depois: Crescimento (Metas, Investimentos, Simulações, Precificação), Comercial (Clientes, Fornecedores, Contas a Receber, Inadimplência), integração do Dashboard aos dados reais, e o módulo **E-commerce/PDV** (alta prioridade — 2 clientes esperando).

---

## 6. PADRÃO QUE TODO MÓDULO SEGUE (checklist)
1. Botão Compartilhar no topo.
2. KPIs originais mantidos (CanvasBox).
3. Camada CFO (só se `temDados`): KPIs CFO (6 cards) → letreiro loop → painéis especiais do módulo → **modal único** ECharts → insights.
4. Busca/filtro + tabela CRUD (mantidos).
5. Modais criar/editar + Centro de Compartilhamento.
6. Fonte `FONTE_EXEC` nos títulos. Cor de tema própria. Responsivo. i18n completo. Dados reais.
7. Se precisar coluna nova → avisar Elias + SQL `ADD COLUMN IF NOT EXISTS` antes.
8. Fechar com `git add . && git commit && git push`.

---

## 7. COMO O ELIAS TRABALHA
Não é programador. No Claude Code, ele aprova planos e você executa direto nos arquivos. Ele valoriza: honestidade técnica, código limpo sem sobras, qualidade acima de velocidade, e recursos que os concorrentes não têm. Quando ele diz "ok", é para prosseguir. Tom com ele: direto, didático, 🦅, sem enrolação.

**Comece pedindo aprovação do plano de Custos Variáveis (não implemente antes de ele aprovar — é a regra dele).**
