# Axioma Central Intelligence — Etapa 0: auditoria e plano (2026-11-03)

Pedido do Elias ("AXIOMA CENTRAL INTELLIGENCE"). Regra do pedido: auditar, apresentar o plano e só construir depois da aprovação.

## Conclusão da auditoria

**Boa parte da arquitetura pedida já existe com outros nomes.** O plano é **evoluir o motor de IA atual (`lib/ia/motor.ts`)**, sem criar uma segunda camada. Criar outra camada duplicaria as regras e iria contra a regra 2 do pedido ("não recriar o que existe").

| Componente pedido | O que já existe no Axioma | Falta |
|---|---|---|
| Central Orchestrator | `perguntarAoMotor`: triagem (regra → IA), escolha OpenAI/Anthropic/Gemini, retrato da empresa, conferência dos números | — |
| Intent Engine / Query Planner | Triagem por regra/IA (`triagemPorRegra`, `triagemPorIA`); o modelo escolhe **só** ferramentas de uma lista fixa (`FERRAMENTAS`); nome desconhecido não executa | plano explícito registrado na auditoria |
| Module Access Gateway / Tool Router | 20 ferramentas: `ferramentasFinanceiras` (resumo_financeiro, titulos, movimentos_realizados, faturamento, despesas, receitas_por_cliente, custos_fixos_mes, reconciliacao) + `ferramentas.ts` (contas_a_pagar/receber, custos, receitas_por_mes, estoque_avisos, dividas, maiores_fornecedores, dre, maiores_devedores, relatorio, contas_vencidas) | **registro de portas** (porta → módulo → indicadores → papéis); portas de Tesouraria, Fiscal e Cadastros |
| Enterprise Data Catalog / Data Dictionary | `lib/financeiro/semantica.ts`: 16 indicadores com definição, fonte, fórmula, inclui/exclui, critério de data e limitações | módulo dono e papel exigido; indicadores de caixa, previsão, vencidos, fiscal, estoque e cadastros |
| Padrão universal de resposta | `lib/financeiro/contrato.ts` (`ResultadoFinanceiro`: indicador, estado verificado/parcial/indisponível/erro, período, critério, fontes, registros, limitações, ref) | horário da consulta (`consultado_em`); ferramentas antigas fora do contrato |
| Consolidation / Validation | `reconciliacao` (compara fontes), `conferirNumeros` (R$ citado que não existe é marcado), centavos inteiros, motor de vencidos | **nível de confiabilidade da resposta** (completo/parcial/inconsistente/indisponível) |
| Execution Engine | rodadas limitadas (4 consultas, 8 chamadas), pedidos iguais lidos 1×, chamadas da mesma rodada em paralelo, retentativa (`comRetentativa`), reserva de provedores | timeout por porta, disjuntor (porta que falha seguido é pulada), cache curto por empresa |
| Report Engine | `lib/financeiro/relatorios.ts`: 11 relatórios (executivo, DRE, fluxo de caixa, receber, pagar, receitas, despesas, endividamento, tributário, PDV, conciliação) + PDF | relatório de vencidos; confiabilidade no relatório |
| Permissões / tenant | RLS por empresa (`empresas_do_usuario_operacional`); empresa e papel lidos no servidor pela sessão (nunca do modelo); `podeUsarIAFinanceira` por papel | papel por porta |
| Auditoria | `nexus_audit_log`: toda chamada ao motor (tela, nível, provedor, consultas com nome/ok/erro/tempo, números não conferidos), sem o conteúdo | plano e confiabilidade no registro |
| Overdue Intelligence | ferramenta `contas_vencidas` (2026-11-02) sobre o motor de vencidos | — |

### Agentes de IA

- **Passam pelo motor central (`/api/ia/motor`):** IA Financeira, IA Tributária, MEI Advisor, Relatórios, Contas a Pagar, Importar, conversa por voz.
- **José/Nexus:** usa `jsonDoJose`, só com dados do mundo (economia e notícias). Não lê dados da empresa e está correto assim.
- **Ajuda do cadastro do PDV:** `lib/axiomaChat.ts` chama a OpenAI direto, sem dados financeiros. Não precisa de porta.
- **Nenhum agente roda SQL livre nem acessa tabela fora das ferramentas.**

### Fonte oficial de cada informação (amostra; o catálogo completo entra na Etapa 1)

| Informação | Fonte oficial | Situação |
|---|---|---|
| A receber / a pagar | `contas_receber` / `contas_pagar` | ✅ |
| Vencidos, inadimplentes, promessas | Overdue Intelligence (`lib/vencidos`) | ✅ |
| Faturamento (competência) | receitas + contas_receber + venda (PDV), sem contar duas vezes (`dreCompetencia`) | ✅ |
| Lucro / DRE | `consultarDRE` (mesma regra da tela DRE) | ✅ |
| Posição de caixa / previsão 30–90 | Tesouraria (`tesouraria_posicao`, `tesouraria_fluxo_projetado`) | ⚠️ sem porta para a IA |
| Obrigações fiscais | `empresa_obrigacoes`, `guias_arrecadacao`, `mei_obrigacoes` | ⚠️ sem porta |
| Quantos clientes/fornecedores | `clientes`, `fornecedores` | ⚠️ sem porta (a IA não sabe contar cadastros) |
| Valor de estoque | `produtos` / `estoque_lotes` (`carregarKpisEstoque`) | ⚠️ só avisos |
| **Funcionários / folha** | **não existe módulo de RH no Axioma** (nenhuma tabela) | ❌ resposta honesta: "indisponível" |
| Fornecedor que deve à empresa | não existe registro próprio | ❌ "indisponível" |

## Plano (cada etapa: teste → commit → envio → conferência no Chrome)

1. **Catálogo empresarial.** Ampliar `semantica.ts` com módulo dono, papel exigido e os indicadores que faltam. RH e "fornecedor que deve" ficam marcados como indisponíveis. Acrescentar `consultado_em` ao contrato.
2. **Registro de portas e controle de acesso.** Mapa porta → módulo → papéis; o servidor confere o papel da sessão em cada porta. Timeout por porta, disjuntor, cache curto por empresa (invalidado quando dados mudam) e confiabilidade da resposta (completo/parcial/inconsistente/indisponível) no retorno e na auditoria.
3. **Portas novas:** Tesouraria (caixa, reserva, previsão 30/60/90), Fiscal (obrigações pendentes), Cadastros (clientes e fornecedores ativos, inadimplentes), Estoque (valor e capital parado). Todas reaproveitando as funções das telas.
4. **Relatórios:** relatório de vencidos; confiabilidade e horário de cada fonte no PDF.
5. **Agentes:** cada tela usa só as portas da sua finalidade (ex.: IA Tributária não abre a porta de clientes).
6. **Testes:** os 12 cenários do pedido. O cenário 1 (RH) responde "indisponível — o Axioma não tem cadastro de funcionários".

## Decisões do Elias

- **RH:** criar um módulo de RH (funcionários e folha) é um módulo novo e grande, fora desta arquitetura. Até lá, a IA responde que não há dado.
- **Relatórios em segundo plano:** os relatórios de hoje saem em segundos; fila em segundo plano só se algum relatório passar de ~30 s.
