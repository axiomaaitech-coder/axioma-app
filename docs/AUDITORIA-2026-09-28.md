# Auditoria de Código e Segurança — Axioma

| Campo | Valor |
|---|---|
| Data | 2026-09-28 |
| Escopo | Código inteiro (app, lib, components, rotas de API, middleware), histórico do git e dependências |
| Pedido por | Elias Tavares (CEO) |
| Resultado | 7 falhas corrigidas, 32 falhas conhecidas em pacotes zeradas, código morto removido, 3 bugs de funcionamento corrigidos |

---

## 1. Chaves e segredos

| Verificação | Resultado |
|---|---|
| Chave no código atual (Anthropic, OpenAI, Stripe, Supabase service_role, AWS, GitHub, Groq) | Nenhuma encontrada |
| Chave em **todo o histórico** do git | Nenhuma encontrada |
| Arquivo `.env` com segredo já enviado ao git | Nunca (só `.env.example`, sem valores) |
| Chave secreta lida em código de navegador (`"use client"`) | Nenhuma |
| Pasta do projeto inteira (inclui arquivos fora do git) | Só `.env.local`, com a chave **pública** do Supabase (papel `anon`, feita para o navegador; os dados são protegidos pela RLS) |

As chaves secretas (service_role do Supabase, OpenAI, Anthropic, Stripe, Pluggy, Groq, Cosmos, R2) existem **somente** nas variáveis de ambiente protegidas da Vercel.

## 2. Falhas de segurança corrigidas

| # | Onde | Falha | Correção |
|---|---|---|---|
| S1 | `app/api/pluggy/webhook` | Aceitava qualquer chamada e gravava com a chave-mestra (service_role): qualquer pessoa podia criar ou alterar conexões bancárias | Só age sobre conexões que já existem; status e transações vêm da API da Pluggy; senha opcional no endereço (`PLUGGY_WEBHOOK_SECRET`) |
| S2 | `app/api/stripe/create-checkout` | Sem login e com o `userId` vindo do navegador: dava para ligar uma assinatura a outra conta e, ao cancelar, **desativar o plano da vítima** | Exige login; identidade e e-mail vêm da sessão |
| S3 | `middleware.ts` | Lista de telas protegidas escrita à mão: **PDV, Estoque e Equipe** abriam sem login e sem plano | Protegido por padrão; só páginas públicas, auth, planos, convite, API e arquivos estáticos ficam abertos. Conferido no site: 307 sem login |
| S4 | `app/auth/callback` | Redirecionamento aberto: `next=//site` ou `https://site` levava o usuário para fora depois do login | Aceita só caminho interno |
| S5 | `app/api/pluggy/connectors` | Sem login, gastava a nossa autenticação na Pluggy | Exige login |
| S6 | Rotas da Pluggy | Devolviam a mensagem interna de erro para quem chamou | Mensagem genérica; detalhe só no Sentry |
| S7 | `app/sentry-example-page` e `app/api/sentry-example-api` | Página e rota de teste esquecidas no ar | Removidas |

Verificado sem problema: rotas do Nexus e de produto (login + validação de entrada), webhook do Stripe (confere assinatura), coleta do Nexus (senha do cron), nenhum HTML inserido sem filtro.

## 3. Dependências (pacotes)

- Antes: **32 falhas conhecidas** (3 críticas, 10 altas, 18 moderadas, 1 baixa).
- Depois: **0**.
- Ações: `npm audit fix` (sem troca de versão principal), Next.js 16.1.6 → **16.3.6**, `xlsx` 0.18.5 → **0.20.3**. O `xlsx` corrigido não é publicado no npm; foi instalado direto do fabricante (cdn.sheetjs.com). Leitura e gravação de planilha foram testadas depois da troca.
- Deploy com as versões novas conferido no site.

## 4. Bugs de funcionamento corrigidos

| # | Onde | Defeito | Correção |
|---|---|---|---|
| B1 | IA Financeira → Plano de Ação | As anomalias detectadas eram recebidas e **ignoradas**; o plano nunca incluía o que a aba Anomalias já tinha achado | Alertas graves viram ação (até 2), sem repetir o que o plano já cobre |
| B2 | Relatórios → KPI Endividamento | Falha ao ler as dívidas mostrava **0% (saudável)** | Mostra "—" e registra no Sentry |
| B3 | Receitas (gráficos) e PDV (calculadora) | Componentes criados dentro da tela eram recriados a cada atualização (gráfico piscando, botão perdendo foco) | Viraram funções de desenho |
| B4 | Cadastro de produto | `Math.random()` rodava a cada desenho da tela | `useId()` do React |
| B5 | Nexus → saúde das fontes | Falha ao gravar o status era ignorada | Registra no log |

## 5. Código morto removido

- Arquivos sem uso: `components/Sidebar.tsx`, `components/SidebarWrapper.tsx`, `lib/supabase/server.ts`.
- 13 funções e tipos sem uso, entre eles os prompts antigos da IA Financeira e da IA Tributária (substituídos pelo motor de IA) e `carregarEmpresa` (de antes do multi-tenant: ignorava o convidado e seria perigoso se voltasse a ser usada).
- Cerca de 45 imports e variáveis sem uso e 4 anotações de lint obsoletas.
- Análise: dos 216 arquivos de código, 213 são alcançados por alguma página ou rota.

## 6. Itens avaliados e mantidos de propósito

- **27 avisos de "variável usada antes de declarada"**: é o padrão `useEffect(() => carregar())` com a função declarada logo abaixo. Funciona corretamente (o efeito roda depois da montagem); mudar significaria mexer em 25 telas sem ganho.
- **539 avisos de tipo `any`**: falta de tipagem, não defeito. Reduzir aos poucos quando cada módulo for mexido.
- **Variáveis sem uso intencionais**: campos retirados antes de gravar (estoque), parâmetros que a função precisa aceitar e captura de erro.
- **Erros "engolidos" intencionais**: vídeo, tela cheia, área de transferência, preferências no navegador e IA com resposta por regras como reserva.

## 7. Pendências com dono

| # | Item | Dono |
|---|---|---|
| A1 | Cadastrar `PLUGGY_WEBHOOK_SECRET` na Vercel e registrar o webhook da Pluggy com `?token=` — obrigatório antes da produção | Elias (etapa F) |
| A2 | ~~Groq como 3ª IA~~ — **resolvido 2026-09-28**: Elias decidiu trocar pela OpenAI; as 2 rotas de produto usam `tarefaDeRotina()` do motor. `GROQ_API_KEY` pode ser apagada da Vercel | ✅ |
| A3 | 8 políticas RLS no formato antigo (lista P4 do STATUS) — SQL para rodar no Supabase | Claude prepara, Elias roda |
| A4 | Segurança do banco (RLS) só pode ser auditada com acesso ao SQL/painel do Supabase | Elias libera acesso ou roda o SQL de conferência |

## 8. Como repetir esta auditoria

1. `npm audit --omit=dev` (pacotes).
2. `npx eslint app lib components` (bugs de lógica: regras `react-hooks/*`, `no-unused-vars`).
3. Varredura de chaves no código e no histórico (padrões `sk-ant-`, `sk-`, `sk_live_`, `whsec_`, JWT `service_role`).
4. Conferir `auth.getUser()` em toda rota nova de `app/api`.
5. Conferir que a rota não usa dado do corpo para decidir **quem** é o usuário.
