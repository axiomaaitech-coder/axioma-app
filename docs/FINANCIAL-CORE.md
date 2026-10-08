# AXIOMA — FINANCIAL INTELLIGENCE CORE

Documento vivo. Parte 1 (fundação) e Parte 2 (inteligência). Escrito em 2026-10-08
a partir da auditoria do repositório. Regra: **reaproveitar o que existe, nunca criar
estrutura paralela** (`_v2`, `_new`).

---

## 1. AUDITORIA — O QUE JÁ EXISTE

| Etapa do pipeline | Já existe no Axioma | Onde |
|---|---|---|
| RECEIVE / STORE | Importar Documentos (XML NF-e, OFX, CSV/XLSX, PDF, foto); upload no bucket; Documentos Fiscais (arquivo por ano) | `app/(interno)/importar-documentos`, `lib/importarHelpers.ts`, `documentos_fiscais` |
| HASH / idempotência | hash do arquivo (`importacoes.hash_arquivo`) e hash por linha (`importacao_linhas.hash_linha`); NF-e do PDV única por chave (`estoque_nfe_importadas`) | `buscarImportacaoPorHash`, `marcarDuplicatasPorLinha` |
| EXTRACT | parser XML NF-e com parcelas (`cobr/dup`) e pagamentos (`detPag`); visão de IA para PDF/foto | `lib/importarParsers.ts`, `/api/importar/ler-nota` |
| NORMALIZE | datas/valores BR, CNPJ só dígitos, texto sem acento (`normalizarTexto`, `normalizarPadraoChave`) | `cfoCore.ts`, `importarParsers.ts` |
| ENTITY RESOLUTION | fornecedor por CNPJ e cadastro a partir da NF-e (com "sim" do humano) | `buscarFornecedorPorCnpj`, `criarFornecedorDaNfe` (`pdvNfeHelpers.ts`) |
| CLASSIFY | destino por linha (compra × venda pelo CNPJ), categoria por aprendizado da empresa, itens classificados por IA | `importacao_padroes_classificacao`, `/api/importar/classificar-itens` |
| MATCH (3 vias) | NF-e × pedido × recebimento | `matchEngineHelpers.ts`, `match_resultado` |
| RECONCILE | extrato Open Finance × receitas/custos (conciliado/pendente/atípico) | `conciliacaoHelpers.ts`, `of_transacoes` |
| FINANCIAL EVENT (canônico) | `eventos_negocio` (fato imutável: AP_CREATED, AP_PAID, AR_RECEIVED, SALE_CREATED, MANUAL_ENTRY_RECORDED…) | `eventFabricHelpers.ts`, `contabilidadeConsumidor.ts` |
| DISTRIBUTE | Motor de Rastreabilidade: cada movimentação leva o dinheiro a Contabilidade, Fluxo, DRE gerencial, Inadimplência, com status por destino e Guardião que refaz | `lib/rastreio/motor.ts`, `rastreio_movimentacao/destino` |
| LEDGER | partidas dobradas (`lancamento_contabil` + partidas), Razão, Balancete | `contabilidadeConsumidor.ts` |
| AUDIT | trigger de auditoria em Contas a Pagar; `nexus_audit_log` p/ toda chamada de IA (sem conteúdo); timeline de importação | `contas_pagar_auditoria`, `nexusAuditoria.ts` |
| REVIEW (humano) | caixa de supervisão do Importar; fila de exceções; aprovação por alçada em Contas a Pagar | `importacao_excecoes`, `contas_pagar_aprovacao` |
| Multi-tenant | `empresa_id` em tudo + RLS por `empresas_do_usuario()` | todas as tabelas |

**Mapeamento para o modelo canônico da especificação (sem tabela nova):**

| Conceito | No Axioma |
|---|---|
| Document | `importacoes` (+ `documentos_fiscais`, `estoque_nfe_importadas` para NF-e com itens) |
| FinancialObligation / Receivable | `contas_pagar` / `contas_receber` (1 linha por parcela) |
| Parcela | a própria linha, ligada à mesma nota por `chave_acesso`/`numero_nota` + "parcela i/n" |
| Payment / Settlement | `rastreio_movimentacao` tipo `ap_pagamento`/`ar_recebimento` (cada pagamento parcial é um rastro com valor) + `valor_pago`/`status` na conta |
| FinancialEvent | `eventos_negocio` |
| Distribuição | `rastreio_destino` |
| Proveniência | `payload` do evento/rastro (`origem_modulo`, documento, método, confiança) |

## 2. GAP ANALYSIS

| Situação | Item |
|---|---|
| **Incorreto** | Checagem de duplicata de Contas a Pagar (RPC `ap_detectar_duplicata`) ignorava forma de pagamento e chave da nota e marcava parcelas da mesma nota como duplicata → **corrigido (Motor Antiduplicidade)** |
| **Incorreto** | Importar não gravava `forma_pagamento` nem `chave_acesso` na conta (a baixa automática da nota à vista saía como "Outros") → **corrigido** |
| **Incorreto** | NF-e de **venda parcelada** gera a receita na data da venda E as parcelas a receber; quando a parcela é recebida o motor lança a receita de novo → **receita contada 2 vezes na DRE gerencial** |
| **Duplicado** | 3 detectores de duplicata diferentes (Contas a Pagar, Importar, manual) → unificados no Motor Antiduplicidade (o manual migra junto com a Fase A) |
| **Incompleto** | Pagamento que chega (extrato, comprovante) não acha a conta em aberto para dar baixa — vira lançamento solto |
| **Incompleto** | Fornecedor sem CNPJ (PDF/foto) não é reconhecido pelo nome ("ABC LTDA" × "ABC LTDA.") |
| **Incompleto** | Extrato importado não separa transferência entre contas, aporte, empréstimo, aplicação/resgate de receita/custo |
| **Incompleto** | Proveniência: conta nascida de nota não guarda arquivo/método/confiança no evento |
| **Incompleto** | Banco não impede a mesma parcela da mesma NF-e duas vezes (só o código impede) |
| **Ok, manter** | Event fabric, rastreio, contabilidade, match 3 vias, conciliação, auditoria, RLS |

## 3. ARQUITETURA (PARTE 1)

```
DOCUMENTO (Importar / Contas a Pagar / PDV / Open Finance / manual)
  → INGESTÃO      importacoes + hash do arquivo (idempotência nível 1)
  → EXTRAÇÃO      parser por formato (regra) | visão de IA (PDF/foto)
  → NORMALIZAÇÃO  datas, valores, CNPJ, forma de pagamento (normalizarForma), parcela
  → ENTIDADES     fornecedor/cliente: CNPJ → nome normalizado → humano
  → CLASSIFICAÇÃO destino, natureza (receita × aporte × empréstimo × transferência), categoria
  → RECONCILIAÇÃO Motor Antiduplicidade (é a mesma conta?) + Motor de Baixa (é pagamento de conta aberta?)
                  regra → IA (só dúvida) → humano; confiança em toda decisão
  → EVENTO        criarContaPagar/Receber, darBaixa/registrarRecebimento → eventos_negocio
  → DISTRIBUIÇÃO  Motor de Rastreabilidade → Contabilidade, Fluxo, DRE, Inadimplência, Fornecedor
  → AUDITORIA     trigger + timeline + nexus_audit_log + proveniência no evento
```

Confiança: `alta ≥ 0,9` decide sozinho · `média 0,6–0,9` IA confere · `baixa` pergunta ao humano.
Documento é DADO: todo prompt que recebe texto de documento/usuário tem a trava contra instrução embutida.

## 4. PLANO DA PARTE 1 (commits pequenos)

| # | Entrega | Arquivos | Banco | Risco / rollback |
|---|---|---|---|---|
| 1.1 | Motor Antiduplicidade (regra → IA → humano) — **feito** | `lib/motorDuplicidade.ts`, `/api/ia/duplicidade`, Contas a Pagar, Importar | nenhum | reverter o commit volta à RPC antiga |
| 1.2 | Venda parcelada sem receita em dobro | `lib/importarParsers.ts` | nenhum | reverter commit |
| 1.3 | Motor de Baixa: pagamento que chega dá baixa na conta aberta (total, parcial, com juros), com estados MATCHED/POSSIBLE/UNMATCHED | `lib/motorDuplicidade.ts`, Importar | nenhum | baixa errada se estorna em Contas a Pagar (rastro refaz tudo) |
| 1.4 | Fornecedor pelo nome quando não há CNPJ | `lib/pdvNfeHelpers.ts`, Importar | nenhum | só sugere; humano confirma |
| 1.5 | Natureza no extrato (transferência/aporte/empréstimo/aplicação ≠ receita/custo) | `lib/importarParsers.ts`, `lib/importarHelpers.ts` | nenhum | só classifica; humano vê e muda |
| 1.6 | Proveniência no evento de nascimento | `contasPagarHelpers.ts`, `recebimentoHelpers.ts`, Importar | nenhum | só acrescenta dados |
| 1.7 | Trava no banco: mesma parcela da mesma NF-e uma vez só | SQL para o Elias | índice único parcial | `drop index` |
| 1.8 | Suíte de testes de inteligência (casos sintéticos) | `scripts/teste-financial-core.ts` | nenhum | — |

## 5. PARTE 2 — PLANO (executar depois da Parte 1)

Reaproveita: `cfoCore` (previsão, ruptura de caixa, cenários, anomalias), Tesouraria (forecast 7/30/60/90 e cenários), Simulações, Nexus/José (impacto externo), Contador (alertas por evidência), Motor de IA (`lib/ia/motor.ts`).

| # | Entrega |
|---|---|
| 2.1 | Orquestração: todo evento novo passa pelo rastro (fechar portas que faltam: MEI, Dívidas, Custos Variáveis, Fluxo — Fase A) |
| 2.2 | Memória financeira por empresa: retrato da empresa (`lib/ia/retratoEmpresa.ts`) + aprendizado por correção do usuário (já existe para categoria; estender a fornecedor/destino/natureza) |
| 2.3 | Alertas proativos no formato O QUÊ / POR QUÊ / IMPACTO / GRAVIDADE / CONFIANÇA / AÇÃO, unificando Contador, Tesouraria e Contas a Pagar |
| 2.4 | Variance (real × orçado × previsto) com investigação por conta/fornecedor/categoria (Metas + DRE) |
| 2.5 | Cenários "e se" isolados (nunca tocam dado real) ligando Simulações + Tesouraria + Nexus |
| 2.6 | Risk engine com explicação por score (liquidez, crédito, fornecedor, concentração, margem) |
| 2.7 | Fato × inferência × previsão × cenário marcados na interface e nas respostas da IA |
| 2.8 | Observabilidade do motor: taxa de reconciliação, revisões manuais, correções, custo de IA (painel de auditoria de IA já existe) |
