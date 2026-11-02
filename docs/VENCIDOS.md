# Axioma Overdue Intelligence — Fase 1 (Data Core e motor)

Pedido do Elias em 2026-11-02 (modelo "AXIOMA OVERDUE INTELLIGENCE"). A Fase 1 é a fundação; ela ainda não tem tela nova.

## Auditoria (antes de mexer)

- **Origem dos títulos:** `contas_receber` e `contas_pagar`, com segurança por empresa (`empresas_do_usuario_operacional`). Continuam sendo a única origem: não existe um segundo cadastro de contas.
- **O que já existia e foi reaproveitado:**
  - régua de cobrança (`cobranca_regua_etapas`);
  - contatos (`cobranca_interacoes`);
  - promessas e acordos (`cobranca_compromissos`);
  - nota do cliente e snapshot (`clienteIntelHelpers`);
  - Inadimplência (`inadimplenciaHelpers`: alertas, curva ABC, provisão na DRE);
  - Tesouraria (posição, reserva mínima, capital de giro);
  - saldo e dias das telas (`lib/financeiro/calculos` e `periodos`).
- **Duplicidades encontradas:**
  - a tabela `inadimplencia` tem 1 registro no banco inteiro e só a tela de Clientes a lê. É um segundo cadastro de atraso. Não foi apagada (regra: não eliminar histórico); fica para decidir com o Elias;
  - aging com faixas fixas;
  - "mudança de comportamento" com regra própria;
  - "conta em aberto" com regra própria.

  As três últimas foram **unificadas no motor** (veja abaixo).
- **Defeitos corrigidos junto:**
  - o aging de Contas a Receber e de Inadimplência contava conta **cancelada** como vencida;
  - o alerta de cliente piorando não disparava quando o atraso passava de 25 dias;
  - a posição de caixa da Tesouraria devolvia zero em silêncio quando a leitura falhava (agora tenta de novo e marca `falhou`).

## Arquitetura (a mais simples que cobre o pedido)

| Conceito do pedido | Onde fica |
|---|---|
| Caso de inadimplência; causa (fato x inferência); disputa (contestado x incontroverso); criticidade do fornecedor; relação B2B/B2C | `vencido_caso`: um por título, receber **ou** pagar, sem duplicar |
| Eventos, histórico de cobrança, negociações, recomendações, resultados | `vencido_evento`: só se acrescenta (sem update/delete) e tem chave de idempotência |
| Promessas, acordos | `cobranca_compromissos` (reuso) + `canal`, `renegociada_de`, `recebido_na_promessa` |
| Histórico de comunicação | `cobranca_interacoes` (reuso) |
| Faixas de aging e parâmetros legais por empresa | `vencido_config` |
| Previsões (previsto x realizado) | `vencido_previsao`: uma foto por dia e por horizonte, com o saldo de cada título |
| Scores, DNA, aging, previsão, simulação, impacto, próxima ação | **calculados na hora** (`lib/vencidos/motor.ts`), sem tabela: sempre atualizados e explicáveis |

**Trava no banco** (`docs/sql/VENCIDOS-FASE1-SQL.sql`):
- um caso nunca aponta para título de outra empresa;
- aprovar ou recusar negociação exige dono, sócio ou admin, e a IA ou o sistema nunca aprovam;
- o histórico não pode ser alterado nem apagado.

## Regras de cálculo

- **Valores:** em centavos inteiros. **Saldo:** a mesma regra das telas (valor − desconto − recebido). Pagamento parcial e estorno aparecem pelo saldo.
- **Aging:** faixas configuráveis (padrão 1–7, 8–15, 16–30, 31–45, 46–60, 61–90, 91–120, 121–180, 181–360, 360+), mais concentração (maior devedor e HHI). A migração entre faixas é reconstruída pela data, sem foto extra.
- **Encargos:** o contrato vem primeiro. Regras legais, conferidas no planalto.gov.br em 2026-11-02:
  - sem índice no contrato, a atualização é pelo IPCA (CC art. 389);
  - sem juros no contrato, vale a taxa legal = Selic − IPCA, mínimo zero (CC art. 406, Lei 14.905/2024);
  - consumidor (B2C): multa de no máximo 2% (CDC art. 52 § 1º);
  - entre empresas (B2B): multa até o valor da obrigação (CC art. 412);
  - Lei de Usura: não vale entre pessoas jurídicas (Lei 14.905/2024 art. 3º); em B2C o sistema só avisa.

  A taxa legal usa a Selic meta (série 432) − IPCA (série 433) do Nexus. É uma **aproximação declarada**: a taxa oficial usa a Selic efetiva.
- **DNA financeiro:** compara os últimos 6 meses com o período anterior. Conta piora quando o atraso ou o prazo de pagamento sobe 5 dias **e** 30%. Com menos de 4 títulos quitados, não tira conclusão categórica. Cada conclusão vem marcada como fato ou inferência.
- **Scores (0–1000) com fatores visíveis:**
  - *Risco de não receber:* separado da *prioridade de cobrança*. A prioridade valoriza o que ainda dá para recuperar; risco extremo vai para análise especializada.
  - *Prioridade de fornecedor:* considera criticidade, risco de interrupção, custo financeiro e caixa, não só valor ou antiguidade.
- **Promessa:** nunca é caixa. Só conta como cumprida pelo que entrou **depois** dela.
- **Disputa:** o valor contestado sai da cobrança e da previsão. Nada é liquidado ou apagado.
- **Negociação:** o simulador mostra total, valor presente, probabilidade, caixa em 30/60/90 dias e parcelas que fecham no centavo. Toda concessão precisa de aprovação.
- **Previsão para 7/15/30/60/90 dias:** heurística v1 declarada (`METODO_PREVISAO`), com confiança e limitações; nunca é caixa. O realizado é medido pela queda do saldo de cada título da foto do dia.
- **Simulador de recuperação (pct, prazo):** usa caixa, reserva, vencidos e a vencer da Tesouraria. Sempre vem marcado `simulacao: true` e não grava nada.
- **Orquestrador:** escolhe uma próxima ação e explica por quê, levando em conta disputa, causa, promessa, risco, DNA, régua e caixa. Nunca executa nada.

## Testes

- `npx tsx scripts/check-vencidos.mts` cobre: integral, parcial, estorno, desconto, duplicidade, empresas diferentes, limites de faixa (incluindo 29/02), disputa, juros, multa B2C/B2B, taxa legal negativa, IPCA, promessas (cumprida, parcial, vencida, renegociada), DNA (30 → 48 dias), scores, negociação (centavos), previsão, precisão, simulador, impacto, orquestrador, determinismo e as funções unificadas.
- Permissões e empresas diferentes no banco são garantidas pelas travas do SQL e conferidas no banco depois de rodar.

## Pendente (Fase 2 em diante)

- Tela (camada visual) e automação (envio pela régua).
- Sugestão de causa pela IA (hoje é por regra, marcada como inferência).
- Calibrar a previsão com o histórico de precisão.
- Integração com DRE, Fiscal, CRM, Vendas e Compras além da Tesouraria.
- Taxa legal oficial do BCB.
- Decidir o destino da tabela `inadimplencia`.
