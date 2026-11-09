# Acompanhamento — Axioma People & HR

Ordem do Elias (08/11/2026): cada etapa concluída vai direto para produção (main) com commit + push.

## Fase 1 — Fundação

| # | Subfase | Situação | Commit | Testes | Pendências |
|---|---|---|---|---|---|
| 1 | Arquitetura + permissões (`rh_permissoes`, `rh_pode`) | Concluída — banco criado em 08/11/2026 com autorização do Elias | 39451b9 | `RH-1-TESTE-PERMISSOES-SQL.sql`: falhas=0 · `TESTE-INVASAO-SQL.sql`: falhas=0 em 141 tabelas | — |
| 2 | Empregador e verbas (S-1000, S-1010) | Concluída — banco criado em 08/11/2026: `rh_empregador`, `rh_rubricas` e Tabelas oficiais 03 (216 linhas, com versões), 08 (18) e 21 (87) | d362d01 | `RH-2-TESTE-EMPREGADOR-RUBRICAS-SQL.sql`: falhas=0 · invasão: falhas=0 em 143 tabelas | Verbas-modelo pré-cadastradas: só com conferência do contador (decisão pendente) |
| 3 | Estabelecimentos e grupo | Concluída — `rh_estabelecimentos` (S-1005, mesma raiz do CNPJ do empregador, ligado a centro de custo), `grupos_empresariais` + `grupo_empresas` (outras raízes), funções `rh_cnpj_valido`/`rh_cpf_valido` | 4920674 | `RH-3-TESTE-ESTABELECIMENTOS-GRUPO-SQL.sql`: falhas=0 · invasão: falhas=0 em 146 tabelas | S-1070 (processos) bloqueia RAT/FAP com processo até existir |
| 4 | Departamentos, cargos (CBO), lotações | Concluída — `rh_lotacoes` (S-1020 + Tabelas oficiais 04/10/12), `rh_departamentos` (árvore sem ciclo), `rh_cargos` (CBO + competências), função genérica `rh_confere_mesma_empresa` | (este commit) | `RH-4-TESTE-ESTRUTURA-LOTACOES-SQL.sql`: falhas=0 · invasão: falhas=0 em 149 tabelas | Lista oficial da CBO (download do site do MTE exige clique — carregar na admissão) |
| 5 | Tipos de vínculo | Concluída dentro da subfase 6 — categorias oficiais (Tabela 01 do eSocial), prazo determinado/experiência/aprendiz com travas da CLT | bc3ae28 | `RH-7-TESTE`: falhas=0 | — |
| 6 | Cadastro de colaboradores + IA do RH | Concluída — `rh_colaboradores`, `rh_colaborador_pessoal`, `rh_contratos`, `rh_remuneracoes` (+ Tabela 01); tela `/rh/colaboradores`; portas da IA `rh_pessoas`/`rh_estrutura`/`rh_salarios` | bc3ae28 + (este commit) | `RH-7-TESTE`: falhas=0 · `check-rh-ia` ok · bateria completa | — |
| 7 | Histórico e documentos | Concluída — `rh_historico` (gatilho, ninguém edita/apaga) + arquivos da admissão no cofre `rh-documentos` | (este commit) | `RH-10-TESTE`: falhas=0 · `RH-11-TESTE`: falhas=0 | — |
| 8 | Importação de funcionários | Concluída — planilha modelo, prévia com erros, lotes de 200 (`rh_importar_colaboradores`), planilha de erros | (este commit) | `RH-9-TESTE`: falhas=0 · `check-rh-importacao` ok | — |
| 9 | Permissões na tela e auditoria | Concluída — liberação por item na aba Acessos do RH; auditoria = histórico da subfase 7 | (este commit) | `RH-6-TESTE` e `RH-11-TESTE` | — |

## Permissões v2 (08/11/2026)

`RH-6-PERMISSOES-V2-SQL.sql` + aba Acessos do RH. Teste `RH-6-TESTE-PERMISSOES-V2-SQL.sql`: falhas=0. Atenção: os testes
RH-1 a RH-4 foram escritos com a regra v1 (Financeiro/Contador viam o RH sem liberação) — o trecho "financeiro lê" deles
não vale mais; a regra atual é testada no RH-6.

## Decisões em aberto (do relatório de pesquisa, seção 6)

**Decididas pelo Elias em 08/11/2026:** contador envia ao governo na v1 (o Axioma prepara); próxima etapa = admissão
preparada para o eSocial (S-2200); currículos de não contratados guardados 12 meses com aceite do candidato; RH liberado
em todos os planos até a definição de preços.

1. Contador envia ao governo na v1 (recomendado) — Fase 2/4 — **DECIDIDO: sim**
2. Ponto: importar arquivo em vez de criar REP-P próprio (recomendado) — Fase 3
3. Grupo: filial com a mesma raiz de CNPJ = estabelecimento; outra raiz = outra empresa ligada (é a regra do eSocial) — Fase 1, subfase 3
4. Link por WhatsApp (tem custo por mensagem) — Fase 2
5. IA de currículo: OpenAI sem crédito — Fase 2
6. Guarda de currículos: 12 meses com consentimento — Fase 2 — **DECIDIDO: sim**
7. Plano: RH liberado até a definição de preços — antes de publicar — **DECIDIDO: sim**

## Painel do RH (08/11/2026)

Tela /rh + porta de IA rh_alertas (mesma função lib/rhPainel.painelRh). Microinterações (BotaoAcao) em Salvar, Importar, Planilha completa, Preencher com dados da Empresa e Perguntar. Manual 50.

## Arquivos da admissão (08/11/2026)

RH-10-ARQUIVOS-ADMISSAO-SQL.sql rodado; teste RH-10-TESTE-ARQUIVOS-SQL.sql: falhas=0. Cofre privado rh-documentos (10 MB, PDF/JPG/PNG/WEBP).

## Histórico e exemplos (08/11/2026)

RH-11 (histórico) + RH-12 (exemplos Ana/Bruno/Carla na Distribuidora Horizonte) rodados; teste RH-11: falhas=0. Conferido no site: Radar com 7 alertas corretos, salários R$ 7.200,00, histórico "Horas por semana: 44 → 40".

## Lista oficial da CBO (08/11/2026)

Arquivo "Estrutura CBO (CSV)" do MTE (cbo.mte.gov.br, arquivos de 10/07/2026; baixado pelo Elias porque o site pede "Não sou um robô").
`RH-13-CBO-SQL.sql` rodado: `cbo_ocupacoes` (2.725) + `cbo_sinonimos` (7.870), só leitura para logados; trava `rh_cargos_cbo_oficial`
(cargo só aceita código da lista). Conferência: 2725 · 7870 · 0 cargos fora da lista. Tela: campo "Ocupação na CBO" com busca por nome
ou código, sem acento, em pt/en/es.

## Admissão preparada para o eSocial — S-2200 (08/11/2026)

Decisões do Elias: contador envia; sindicato na filial com troca no contrato; esquemas XSD oficiais baixados (pacote de 26/10/2026,
`evtAdmissao.xsd` idêntico ao de 23/11/2026). SQL rodados pelo Elias: RH-14 (campos, `rh_esocial_eventos`, trava do contrato),
RH-14B (regra do contrato sem amarrar categoria × natureza, valendo para todos), RH-14C (arquivo só para quem tem dados pessoais
+ salário). Teste RH-14: falhas=0. `check-rh-esocial`: 3 arquivos aceitos pelo XSD oficial (menos a assinatura, que é do contador).
Fica para depois: S-2206 (alteração), S-2299 (desligamento), aprendiz/doméstico/temporário/intermitente, PCD e dependentes,
importação por planilha dos campos novos.

## S-2200 completo (09/11/2026)

Pedido do Elias ("pode criar cadastro de PCD e das categorias que faltam e ficaram de fora, deixe completo"). RH-15: Tabela 07,
`rh_colaborador_pcd` (saúde), `rh_dependentes` (pessoais), imigrante, aprendiz/temporário/local de trabalho no contrato, histórico com
"saude", arquivo exige saúde. RH-16: exemplos na Horizonte (CNPJ 12.345.678/0001-95 fictício, empregador, matriz com sindicato
fictício, Diego/Eduarda/Fábio). Doméstico e temporário só no teste automático (não cabem na Horizonte). Política de Privacidade
3.7 e 12 corrigidas (antes dizia que o Axioma não trata dado sensível nem de criança — o RH trata, por obrigação legal).
Fica para depois: S-2205/S-2206 (alterações), S-2299 (desligamento), importação por planilha dos campos novos.

## Alterações S-2205/S-2206 (09/11/2026)

RH-17 rodado (o Supabase pede confirmação "Potential issue detected" quando o SQL troca regras/gatilhos — era isso que
fazia alguns SQLs não gravarem). Teste RH-17 falhas=0. Próximo: S-1010 (verbas da empresa), cálculo da rescisão e S-2299
(decisão do Elias: o Axioma calcula a rescisão).

## Rescisão e desligamento (09/11/2026)

RH-18 e RH-18B rodados (lotação da Horizonte com terceiros 0000 — a regra do Simples barrou 0115, correto; função das verbas
ajustada ao índice parcial da lixeira). Cálculo testado à mão (6 casos) e pelo exemplo oficial da Receita. 15 S-1010 e 3 S-2299
aceitos pelo XSD oficial. Fora desta versão: rescisão do intermitente, verbas de convenção, pensão alimentícia, estabilidades.

## Auditoria de botões (09/11/2026)

RH-19 rodado (exame agendado com data e clínica; conferido 2 · 1). Rotinas novas: Exames, Documentos, Contratos a vencer,
Central do eSocial, Obrigações. Todo alerta do Painel tem destino; nomes abrem a ficha na parte certa. Manual 51.

## PRÓXIMO (pedido do Elias, 09/11/2026 — depois da auditoria de botões)
Telas próprias de **Admissões** e **Desligamentos**: listas em ordem alfabética, busca por nome/matrícula/CPF, filtros por
período, situação no eSocial e motivo; pensadas para empresa grande (paginação no banco). Cada linha abre a ficha da pessoa.
