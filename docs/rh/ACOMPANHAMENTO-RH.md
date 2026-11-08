# Acompanhamento — Axioma People & HR

Ramo: `feat/rh-fundacao` (enviado ao GitHub a cada etapa, autorizado em 08/11/2026) · Juntar à versão principal (site): avisar o Elias antes.

## Fase 1 — Fundação

| # | Subfase | Situação | Commit | Testes | Pendências |
|---|---|---|---|---|---|
| 1 | Arquitetura + permissões (`rh_permissoes`, `rh_pode`) | Concluída — banco criado em 08/11/2026 com autorização do Elias | 39451b9 | `RH-1-TESTE-PERMISSOES-SQL.sql`: falhas=0 · `TESTE-INVASAO-SQL.sql`: falhas=0 em 141 tabelas | — |
| 2 | Empregador e verbas (S-1000, S-1010) | Concluída — banco criado em 08/11/2026: `rh_empregador`, `rh_rubricas` e Tabelas oficiais 03 (216 linhas, com versões), 08 (18) e 21 (87) | d362d01 | `RH-2-TESTE-EMPREGADOR-RUBRICAS-SQL.sql`: falhas=0 · invasão: falhas=0 em 143 tabelas | Verbas-modelo pré-cadastradas: só com conferência do contador (decisão pendente) |
| 3 | Estabelecimentos e grupo | Concluída — `rh_estabelecimentos` (S-1005, mesma raiz do CNPJ do empregador, ligado a centro de custo), `grupos_empresariais` + `grupo_empresas` (outras raízes), funções `rh_cnpj_valido`/`rh_cpf_valido` | (este commit) | `RH-3-TESTE-ESTABELECIMENTOS-GRUPO-SQL.sql`: falhas=0 · invasão: falhas=0 em 146 tabelas | S-1070 (processos) bloqueia RAT/FAP com processo até existir |
| 4 | Departamentos, cargos (CBO), lotações | não iniciada | | | |
| 5 | Tipos de vínculo | não iniciada | | | |
| 6 | Cadastro de colaboradores | não iniciada | | | |
| 7 | Histórico e documentos | não iniciada | | | |
| 8 | Importação de funcionários | não iniciada | | | |
| 9 | Permissões na tela e auditoria | não iniciada | | | |

## Decisões em aberto (do relatório de pesquisa, seção 6)

1. Contador envia ao governo na v1 (recomendado) — Fase 2/4
2. Ponto: importar arquivo em vez de criar REP-P próprio (recomendado) — Fase 3
3. Grupo: filial com a mesma raiz de CNPJ = estabelecimento; outra raiz = outra empresa ligada (é a regra do eSocial) — Fase 1, subfase 3
4. Link por WhatsApp (tem custo por mensagem) — Fase 2
5. IA de currículo: OpenAI sem crédito — Fase 2
6. Guarda de currículos: 12 meses com consentimento — Fase 2
7. Plano: RH liberado até a definição de preços — antes de publicar
