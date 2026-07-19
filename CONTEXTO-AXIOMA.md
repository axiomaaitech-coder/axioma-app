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
7. **Cada módulo com COR DE TEMA DIFERENTE** no dashboard (não repetir): Receitas=roxo, Custos Fixos=vermelho/laranja, Custos Variáveis=laranja/âmbar, Fluxo de Caixa=cyan/azul, DRE=verde/teal, Endividamento=rosa/magenta.
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
- **Alicerce:** `lib/cfoCore.ts`, `lib/cfoTextos.ts`
- **Dashboard principal** (`/dashboard`): vídeo hero (logo `/logo-aitech.png` sempre visível, 460px) → letreiro premium "Dashboard Financeiro" → componente `DashFinanceiro` (KPIs + letreiro loop + modal único: linha Endividamento + barras verticais Custos Fixos/Variáveis + roscas Fluxo/Receita) → letreiro premium "Dashboard Comercial" → componente `DashComercial` (KPIs + letreiro + modal: linha Metas + barras Clientes/Inadimplência + roscas Receber/Investimentos) → cards de módulos. **Componentes:** `components/DashFinanceiro.tsx`, `components/DashComercial.tsx`. DADOS DEMO (fictícios, tag DEMO) — conectar ao Supabase na fase de integração.
- **Receitas** (`/receitas`): CFO completo. KPIs: MRR, ARR, crescimento MoM, ticket médio, % recorrente, concentração top 20%. Modal único: barras evolução + rosca categoria + linha previsão IA. Insights, letreiro, compartilhamento. Tabela `receitas` (descricao, valor, data, categoria, status, user_id). Categorias: Vendas de produtos, Prestação de serviços, Recorrentes, Eventuais, Outras. CONECTADO a dados reais.
- **Custos Fixos** (`/custos-fixos`): CFO completo. Diferencial mundial: **Radar de Renovações** (coluna nova `data_renovacao` — SQL já aplicado) + **Detector de Desperdício** (duplicados + economia potencial). KPIs: total mensal/anual, itens, economia potencial, nº renovações. Modal: rosca categoria + barras maiores custos. Tabela `custos_fixos` (descricao, valor_mensal, dia_vencimento, categoria, data_renovacao, user_id). Categorias: Aluguel/Imóvel, Folha de pagamento, Serviços essenciais, Sistemas e assinaturas, Seguros, Contabilidade, Outros.

## 🔜 PRÓXIMO NA FILA (ordem menu Financeiro)
**Custos Variáveis** (`/custos-variaveis`) — tabela `custos_variaveis`. Diferencial pesquisado a implementar: **Margem de Contribuição, Ponto de Equilíbrio (break-even), Margem de Segurança, Volatilidade dos custos, Alerta de sangria de margem**. Conecta com Custos Fixos (break-even) e Receitas (margem). Cor tema: laranja/âmbar.
Depois: **Fluxo de Caixa → DRE → Endividamento** (cada um com pesquisa de brecha + cor própria).

## 📋 DEPOIS DOS MÓDULOS FINANCEIROS
- Crescimento (Metas, Investimentos, Simulações, Precificação) · Comercial (Clientes, Fornecedores, Contas a Receber, Inadimplência) · Gestão
- **Integração:** conectar Dashboard principal + letreiros aos dados REAIS do Supabase (trocar DEMO). Usar `cfoCore` — zero reescrita, essa é a vantagem do alicerce.
- **Módulo E-commerce/PDV** (alta prioridade — Elias tem 2 clientes esperando): produtos, mercados/lojas, caixa registradora/gaveta. Alicerce já preparado pra suportar.
- Orçamento (Budget) · Fluxo projetado 30/60/90d · Simulador empréstimos/CET · Ativar Pluggy · Multi-tenant · Board Deck · Folha · OKRs

## 🗂️ TABELAS SUPABASE CONHECIDAS
`receitas, custos_fixos, custos_variaveis, contas_pagar, contas_receber, fluxo_caixa, fornecedores, endividamento, importacoes, importacao_linhas, importacao_templates, empresas, empresa_socios, empresa_documentos, empresa_auditoria, empresa_equipe, empresa_obrigacoes, ia_financeira_historico, ia_tributaria_historico, benchmarks_setoriais, simples_nacional_faixas, clientes, metas, investimentos, centros_custo`. **Dívidas = tabela `endividamento` (NÃO `dividas`).**

## 🧩 MÓDULOS ANTIGOS (visual azul `#6ab0ff`, upgrade CFO pendente)
Fluxo de Caixa, DRE, Clientes, Endividamento, Fornecedores, Contas a Receber, Inadimplência, Centros de Custo, Metas, Investimentos, Simulações, Precificação, Planos, MEI (6 submódulos), Importar Documentos. Já em padrão CFO: IA Financeira, IA Tributária, Empresa, Relatórios.

---

## COMO TRABALHAR NO CLAUDE CODE (fluxo por módulo)
1. `/clear` ao começar módulo novo (economiza token).
2. Pesquisar brecha dos concorrentes (o que ninguém tem).
3. Ler a tabela real no Supabase / o `page.tsx` atual antes de reescrever.
4. Construir EM CIMA do alicerce (`cfoCore` + `cfoTextos`), cor de tema própria, fonte `FONTE_EXEC`.
5. Se precisar coluna nova → avisar Elias + gerar SQL `ADD COLUMN IF NOT EXISTS` primeiro.
6. Validar, salvar no arquivo certo, e rodar os 3 comandos git.
7. Manter tudo limpo, responsivo, i18n completo, compartilhamento presente.
