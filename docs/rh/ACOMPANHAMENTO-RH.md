# Acompanhamento — Axioma People & HR

Ramo: `feat/rh-fundacao` · Publicação no site: só com o "pode" do Elias.

## Fase 1 — Fundação

| # | Subfase | Situação | Commit | Testes | Pendências |
|---|---|---|---|---|---|
| 1 | Arquitetura + permissões (`rh_permissoes`, `rh_pode`) | Concluída — banco criado em 08/11/2026 com autorização do Elias | (este commit) | `RH-1-TESTE-PERMISSOES-SQL.sql`: falhas=0 · `TESTE-INVASAO-SQL.sql`: falhas=0 em 141 tabelas | — |
| 2 | Empregador e verbas (S-1000, S-1010) | não iniciada | | | |
| 3 | Estabelecimentos e grupo | não iniciada | | | |
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
