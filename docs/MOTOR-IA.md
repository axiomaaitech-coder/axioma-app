# Motor de Orquestração de IA — Axioma

| Campo | Valor |
|---|---|
| Documento | Especificação técnica e operacional |
| Sistema | Axioma AI.Tech — CFO digital |
| Versão do motor | `motor-ia-1` |
| Status | Fases 1, 2, 3, 5 e 6 concluídas; fases 4 e 7 em andamento |
| Responsável pelo produto | Elias Tavares (CEO) |
| Última atualização | 2026-09-28 |

---

## 1. Objetivo

Dar ao Axioma um único "cérebro" de IA que responde como um diretor financeiro de verdade. O motor:

- lê os números reais da empresa em todos os módulos;
- considera o **setor** da empresa (todos os ramos da CNAE) e a **situação** dela (alertas);
- usa o provedor certo para cada tipo de pergunta, com custo controlado;
- **nunca inventa número**: as contas são do Axioma, e a IA só interpreta.

Regra de negócio definida pelo CEO (2026-09-28): **tarefas de rotina, repetitivas e de baixa complexidade vão para a OpenAI; tarefas complexas vão para a Anthropic**, com uma trava no código para que essa regra não falhe.

## 2. Arquitetura (hierarquia)

```
Tela (IA Financeira, IA Tributária, José, módulos…)
        │  só manda: pergunta + empresa + tela + idioma
        ▼
POST /api/ia/motor  ── login obrigatório · limite 30 pedidos/min · auditoria
        ▼
Nível 0 · RETRATO DA EMPRESA (sem IA)            lib/ia/retratoEmpresa.ts
        números de todos os módulos + setor + alertas da situação
        ▼
Nível 1 · TRIAGEM                                 lib/ia/motor.ts
        regra fixa (grátis) → em dúvida, OpenAI barata classifica
        ▼
Nível 2 · EXECUTOR
        rotina       → OpenAI  gpt-5.6-luna (reserva gpt-4o-mini)
        análise      → Anthropic Claude Sonnet 5.5  (esforço médio)
        estratégica  → Anthropic Claude Opus 5.5    (esforço alto)
        ▼
Nível 3 · CONFERÊNCIA DE NÚMEROS (sem IA)
        todo "R$" citado precisa existir nos dados ou estar marcado como estimativa
        ▼
Resposta para a tela
```

### 2.1 Escalonamento ("uma chama a outra")
- A OpenAI de rotina recebe a instrução de responder `[[ESCALAR]]` quando a pergunta exige análise. Nesse caso, ou quando ela cita um número que não existe nos dados, a pergunta **sobe para a análise** (Claude Sonnet 5.5).
- O nível só **sobe**, nunca desce. Uma tela pode exigir um nível mínimo (`nivelMinimo`), mas nunca rebaixar.

### 2.2 Redes de segurança
1. Anthropic recusa → a própria Anthropic refaz em outro modelo (`fallbacks: "default"`).
2. Anthropic fora do ar → a OpenAI (gpt-4o-mini) responde no lugar.
3. Tudo fora → a rota devolve `resposta: null`, e a tela usa as respostas por regras que já existiam.

## 3. A trava (regra que não falha)
- **Quem chama nunca escolhe provedor nem modelo.** A rota só aceita pergunta, empresa, tela, idioma e histórico.
- O mapa nível → modelo existe em **um único lugar**: `MODELOS` em `lib/ia/motor.ts`.
- A triagem é feita por regras determinísticas testadas (`scripts/check-ia-motor.mts`). A IA só classifica quando a regra fica em dúvida e, se falhar, o padrão é "análise" (o lado seguro).
- Toda IA nova do Axioma deve passar pelo motor, nunca chamar o provedor direto. As telas usam só `perguntarAoAxioma()` (`lib/ia/cliente.ts`); a rota antiga que aceitava provedor/modelo vindo do navegador foi **removida**.
- A tela pode mandar os números e o formato dela (`contexto_tela`), mas nunca escolher a IA.
- **Exceções previstas (já seguem a regra):** análise de evento, painel diário e plano do José rodam no servidor direto na Anthropic (complexas, geradas 1 vez e guardadas); o assistente de cadastro do PDV roda direto na OpenAI (rotina curta). Tarefas curtas de servidor com resposta em JSON (sugestão de produto por código de barras, classificação de itens de nota no PDV) usam `tarefaDeRotina()` do motor — mesmo modelo de rotina; a Groq foi retirada em 2026-09-28 por decisão do Elias.

## 4. Componentes

| Arquivo | Papel |
|---|---|
| `lib/ia/setores.ts` | Catálogo de 40 setores cobrindo as 87 divisões da CNAE 2.3. Cada setor traz o manual (o que pesa no caixa e na margem, riscos, o que medir) e os indicadores do Nexus que mexem com ele. Classifica pelo CNAE; sem CNAE, pelo campo livre "setor" do cadastro. |
| `lib/ia/manuais.ts` | Manuais especialistas por área (caixa, custos, precificação, dívida, tributário, cobrança, estoque, crescimento, vendas, economia). Entram até 3 por pergunta, escolhidos pelas palavras da pergunta e pela tela de origem. |
| `lib/ia/retratoEmpresa.ts` | Retrato único da empresa: receita (média de 12 meses + 6 meses fechados), custos fixos e variáveis pelo nome, imposto pelo regime, juros, lucro, margem, ponto de equilíbrio, caixa, fôlego, dívidas, a receber e a pagar (vencido e próximos 30 dias), inadimplência, concentração no maior cliente, estoque (ruptura, baixo, parado) e obrigações fiscais atrasadas. Gera os **alertas da situação**. |
| `lib/ia/motor.ts` | Triagem, executores, escalonamento, conferência e prompts. |
| `lib/ia/ferramentas.ts` | 8 ferramentas de consulta só de leitura (Claude pede o detalhe; até 4 rodadas, na última é obrigado a responder). Mesmos nomes e esquemas servirão a um servidor MCP do Axioma. Números trazidos por elas contam como dado real na conferência. |
| `app/api/ia/motor/route.ts` | Porta única do motor para as telas. |
| `lib/ia/cliente.ts` | `perguntarAoAxioma()`: a única função que as telas usam para falar com a IA. Falha = `null` → a tela usa as respostas por regras. |
| `scripts/check-ia-motor.mts` | Testes das partes sem IA (rodar: `npx tsx scripts/check-ia-motor.mts`). |

## 5. Segurança e privacidade
- Os dados são lidos **com a sessão do usuário** e a segurança por empresa do banco (RLS). Pedir o retrato de outra empresa devolve 404.
- Auditoria de toda chamada (`nexus_audit_log`, ação `ia.motor`): quem, empresa, tela, nível, provedor, modelo, se escalou, valores não conferidos, setor e quantidade de caracteres enviados. **Nunca o conteúdo.**
- A IA nunca se identifica como Claude, Anthropic, OpenAI ou GPT: ela é "a inteligência do Axioma".
- Limite de 30 pedidos por minuto por IP nas rotas `/api/ia/*`.

## 6. Custos (preços de tabela, set/2026)

| Nível | Modelo | Entrada / saída (US$ por milhão de tokens) |
|---|---|---|
| Rotina | gpt-5.6-luna | tier mais barato da OpenAI |
| Análise | Claude Sonnet 5.5 | 2 / 10 |
| Estratégica | Claude Opus 5.5 | 4 / 20 |

A parte fixa do prompt (regras) e a parte da empresa (retrato, setor e manuais) usam o **cache** da Anthropic: perguntas seguidas da mesma empresa pagam cerca de 10% dessa parte. As regras de triagem e a conferência não custam nada.

## 7. Plano de implementação

| Fase | Entrega | Status |
|---|---|---|
| 1 | Setores (CNAE inteira), manuais por área, retrato da empresa; plano do José usando o retrato | ✅ 2026-09-28 |
| 2 | Triagem, executores, escalonamento, conferência, rota `/api/ia/motor`, auditoria, testes | ✅ 2026-09-28 |
| 3 | 8 ferramentas de consulta (a IA pede o detalhe: contas a pagar/receber, custos, receita mês a mês, avisos de estoque, dívidas, maiores fornecedores e devedores), desenhadas para virar MCP depois | ✅ 2026-09-28 |
| 4 | Aprofundar os manuais por setor e área com exemplos de boa resposta | ⏳ |
| 5 | IA Financeira e IA Tributária ligadas no motor (+ comparação de regimes em pergunta tributária) | ✅ 2026-09-28 — conferido no site |
| 6 | Todas as telas com IA no motor: chat do José, simulações do Nexus, Tesouraria, Contas a Pagar, Centro de Custos, Clientes e os 6 do MEI (DAS, Faturamento, Reforma, Precificação, IR, Advisor). Rota antiga `/api/ia-chat` removida | ✅ 2026-09-28 |
| 7 | Conjunto de perguntas-padrão por setor + painel de custo e qualidade | ⏳ |

Funções que vêm depois e usam o motor como base: **nota fiscal inteligente** (Importar Documentos, fase 2) e **pagar contas por dentro do Axioma** (construído com chave desligada, ligado só na produção). Ver `STATUS-AXIOMA.md`, seção 4-ROTEIRO.

## 8. Histórico de versões

| Data | Versão | Mudança |
|---|---|---|
| 2026-09-28 | motor-ia-1 | Fases 1 e 2: setores, manuais, retrato, triagem, executores, escalonamento, conferência, rota e auditoria. Plano do José passa a usar o retrato e o imposto calculado no servidor (antes vinha do navegador). |
| 2026-09-28 | motor-ia-1 | Fase 5: IA Financeira e IA Tributária usando o motor (conferido no site: resposta com números do retrato, custos pelo nome, alerta principal). Respostas em texto simples (as telas não leem markdown). |
| 2026-09-28 | motor-ia-1 | Fase 3: ferramentas de consulta ligadas ao Claude; rotina (OpenAI, sem ferramentas) passa pra cima quando a pergunta pede lista/detalhe. |
| 2026-09-28 | motor-ia-1 | Fase 6: todas as telas com IA passam pelo motor (José, simulações, Tesouraria, Contas a Pagar, Centro de Custos, Clientes, 6 do MEI); rota antiga removida (trava completa); histórico sem pergunta duplicada. |
