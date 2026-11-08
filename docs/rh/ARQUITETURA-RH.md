# Axioma People & HR — Arquitetura

Fonte das decisões: especificação "AXIOMA PEOPLE & HR INTELLIGENCE", checklist de 23 partes e o relatório
de pesquisa de 07/11/2026. Ramo de trabalho: `feat/rh-fundacao`. Nada vai para `main` sem o "pode" do Elias.

## Princípios

1. **Um dono para cada dado.** RH é dono de pessoas e vínculos. Financeiro é dono das contas. Tesouraria é dona dos pagamentos.
   Contabilidade é dona dos lançamentos. IA Tributária é dona do cálculo do imposto. O RH nunca grava no domínio dos outros.
   Ele entrega por contrato, com um código único, então a mesma folha nunca vira duas contas.
2. **Multi-empresa desde a primeira tabela.** Toda tabela tem `empresa_id`, RLS com `empresas_do_usuario_operacional()`,
   índice começando por `empresa_id` e entra no teste de invasão (`docs/sql/TESTE-INVASAO-SQL.sql`).
3. **Histórico nunca se apaga.** Alterações de contrato e salário viram linha nova com data de vigência.
   Exclusão segue a regra do Axioma: aviso, motivo e senha de supervisor (`ConfirmarExclusao`).
4. **Lei em tabela, não no código.** Percentual, teto, prazo e faixa ficam numa tabela de regras com fonte, vigência, versão
   e situação. Regra nova nunca muda mês fechado.
5. **IA não calcula dinheiro nem decide.** Cálculos são funções determinísticas com teste. A IA lê pela porta
   "Pessoas" da Central Intelligence, respeitando `rh_pode()`, e toda decisão sobre pessoa é humana e registrada.
6. **eSocial: "preparado" não é "enviado".** Situações: rascunho → preparado → enviado → aceito (com protocolo) ou recusado (com motivo).
   Na primeira versão quem envia é o contador.

## Permissões (v2 — regra do Elias, 08/11/2026; substitui a da subfase 1)

Função única `rh_pode(empresa, ação)` com `ver`, `editar`, `pessoais`, `salario`, `saude` e `gerir`. Proprietário, CEO,
Sócio e Admin (`equipe_nivel <= 4`, a hierarquia da Equipe) têm tudo e são os únicos que liberam. Os demais papéis não veem
NADA do RH até serem liberados item por item em `rh_permissoes` (tela: aba **Acessos do RH**). Ninguém libera para si;
`concedido_por` é gravado pelo banco. A tabela abaixo é da v1 e fica só como histórico.

| Papel | ver | editar | salário | saúde |
|---|---|---|---|---|
| dono | ✔ | ✔ | ✔ | ✔ |
| admin | ✔ | ✔ | ✔ | só se o dono liberar |
| financeiro | ✔ | se liberado | ✔ | se o dono liberar |
| contabil | ✔ | se liberado | ✔ | se o dono liberar |
| leitor / operador | se liberado | se liberado | se liberado | se o dono liberar |

O admin não muda a própria linha e não libera saúde para ninguém. Assim ninguém se autoconcede dado sensível
(LGPD, art. 11).

## Modelo de dados planejado (Fase 1)

| Subfase | Tabelas |
|---|---|
| 1 Permissões | `rh_permissoes` + função `rh_pode` |
| 2 Empregador | `rh_empregador` (S-1000, uma linha por período de validade) e `rh_rubricas` (S-1010). Regras do leiaute viram travas no banco. Tabelas oficiais `esocial_tab03/08/21` são lidas por todos e copiadas do leiaute S-1.3 (NT 07/2026, rev. 20/10/2026). A Tabela 03 tem versões: a natureza da verba é conferida contra a versão que vale no mês. |
| 3 Estabelecimentos | `rh_estabelecimentos` (S-1005; filial com o mesmo CNPJ raiz). Outra raiz de CNPJ = outra empresa do Axioma, ligada como grupo. |
| 4 Estrutura | `rh_departamentos`, `rh_cargos` (com CBO e competências), `rh_lotacoes` (S-1020). O vínculo com `centros_custo` já existe. |
| 5 Vínculos | tipo de vínculo no contrato: CLT (indeterminado, experiência, determinado, intermitente, temporário, aprendiz), estágio, autônomo, pró-labore, empregado do MEI |
| 6 Colaboradores | `rh_colaboradores` (pessoa), `rh_contratos` (vínculo, um ou mais por pessoa), `rh_dependentes` |
| 7 Histórico e documentos | `rh_contrato_historico` (salário, cargo, jornada com vigência), `rh_documentos` (área de arquivos própria, com prazo de guarda por tipo) |
| 8 Importação | importação por planilha, com conferência antes de salvar; marca de "já enviado ao eSocial pelo contador" |
| 9 Auditoria | gatilho que registra mudanças em `empresa_auditoria`, que já existe; leitura de dado sensível registrada |

Colunas de salário e saúde ficam em tabelas próprias. Assim a RLS de `salario` e `saude` é aplicada por tabela,
sem depender de a tela esconder o campo.

## Contratos com outros módulos

| De → para | O que passa | Quando |
|---|---|---|
| RH → Centros de Custo | quantidade de ativos por centro (somente leitura) | Fase 1 |
| RH → Central Intelligence | porta "Pessoas": totais e listas, filtrados por `rh_pode` | Fase 1 (inicial) |
| RH → IA Tributária | folha dos últimos 12 meses para o fator R | Fase 4 |
| RH → Financeiro | contas da folha (salários, FGTS, INSS, IR, benefícios) com código único | Fase 4 |
| Tesouraria → RH | pagamento feito, para marcar o salário como pago | Fase 4 |
| RH → Contabilidade | provisão de férias e 13º | Fase 4 |

## Testes

- `docs/sql/RH-1-TESTE-PERMISSOES-SQL.sql`: matriz de papéis e tentativas de autoconcessão.
- `docs/sql/TESTE-INVASAO-SQL.sql`: inclui as tabelas novas automaticamente.
- Volume-alvo: 10 mil colaboradores por empresa. Listas paginadas e totais calculados no banco.
