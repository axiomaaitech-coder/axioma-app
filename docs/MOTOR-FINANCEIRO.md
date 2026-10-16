# Motor Financeiro do Axioma — Plano 3, Tarefa 1 (2026-10-16)

Estado: **implementado e testado localmente; não publicado** (o Plano 3 proíbe publicar nesta tarefa). Nenhuma migração,
nenhum dado real alterado.

## 1. Diagnóstico anterior à implementação

Verificado no código e no banco (somente leitura) em 16/10/2026:

| # | Achado | Impacto |
|---|---|---|
| D1 | **Três definições de receita/lucro**: (a) resumo da IA (`lib/ia/retratoEmpresa`) = média 12 m só de `receitas` e `custos_variaveis`; (b) tela Relatórios (`lib/relatoriosHelpers.carregarDRE`) = mês só de `receitas`/`custos_variaveis` e custos fixos de hoje; (c) tela DRE (`lib/dreCompetencia`) = competência com contas a receber, PDV, contas a pagar e vigência. | A mesma pergunta pode dar números diferentes conforme a tela. **Decisão do CEO** (seção 8). |
| D2 | A IA não tinha consulta de DRE e uma regra do prompt a mandava dizer que não tinha (corrigido em `fix(ia)` anterior). | Relatórios sem DRE. |
| D3 | `fluxo_caixa` tem status **"confirmado"** (16 lançamentos na empresa de teste: +R$ 17.273,31 / −R$ 350) que o caixa realizado (`lib/caixaSaldo`) **não conta**. | Caixa pode estar subestimado. **Decisão do CEO.** |
| D4 | Receita **pendente** de R$ 110.000 criada a partir de conta a receber (`origem_tabela = contas_receber`). A DRE ignora; o resumo de 12 m pode somar. | Divergência entre telas. |
| D5 | Ferramentas antigas sem período livre ("esta semana" só via 7/30 dias fixos), sem contrato padrão, sem distinguir caixa × competência; `contas_a_receber` ignorava desconto. | Respostas sem critério explícito. |
| D6 | **Não existe tabela de folha de pagamento**. Fontes fiscais existem (`guias_arrecadacao`, `pagamentos_obrigacao`, `mei_obrigacoes`, `empresa_obrigacoes`), mas sem consulta de "impostos do período" pronta. | Folha indisponível; impostos só estimados. |
| D7 | Anthropic sem crédito: 100% das respostas pela OpenAI. | Fora do escopo do código. |

## 2. Arquitetura (antes → depois)

Antes: motor (`lib/ia/motor.ts`) + 9 ferramentas soltas em `lib/ia/ferramentas.ts` + retrato.
Depois (sem segundo motor, reaproveitando `dreCompetencia`, `caixaSaldo`, `iaTributariaHelpers`):

```
pergunta → motor (consulta obrigatória, avisos, assinatura)
         → ferramentas = financeiras (novas) + originais
              lib/financeiro/periodos.ts        motor temporal (puro)
              lib/financeiro/semantica.ts       catálogo de indicadores
              lib/financeiro/calculos.ts        cálculos determinísticos (puros, centavos)
              lib/financeiro/reconciliacao.ts   consistência (só aponta)
              lib/financeiro/contrato.ts        resultado padrão (estado, período, critério, fontes, registros, ref)
              lib/financeiro/ferramentasFinanceiras.ts   leitura com RLS + cálculo + contrato
              lib/ia/ferramentaDre.ts           DRE por competência (mesmo cálculo da tela)
         → IA interpreta (Fato · Cálculo · Interpretação · Risco · Recomendação · Limitação)
```

## 3. Matriz de indicadores e fontes

A definição completa (fonte, fórmula, inclusões, exclusões, regra de data, limitações) está em
`lib/financeiro/semantica.ts` (`INDICADORES`), usada pelas ferramentas. Resumo:

| Indicador | Regime | Fonte | Data | Ferramenta | Cobertura |
|---|---|---|---|---|---|
| Faturamento | competência | receitas + contas a receber + PDV | fato | `faturamento` | completa |
| Receitas lançadas | competência | receitas | data | `receitas_por_mes` | completa (≠ faturamento) |
| Receita recebida | caixa | contas a receber + PDV | recebimento | `movimentos_realizados` | parcial se recebimento sem data |
| A receber aberto/vencido | posição | contas a receber | vencimento × hoje | `titulos` | completa |
| A pagar aberto/vencido | posição | contas a pagar | vencimento × hoje | `titulos` | completa |
| Despesas pagas | caixa | contas a pagar | pagamento | `movimentos_realizados` | parcial se pagamento sem data |
| Despesas | competência | custos variáveis + contas a pagar | fato | `despesas` | completa |
| Custos fixos | competência | custos fixos | vigência | `custos_fixos_mes` | completa |
| Lucro / margem / DRE | competência | base da DRE | competência | `dre` | completa (impostos estimados) |
| Lucro médio (resumo) | estimativa | retrato | 12 m | — | divergente (D1) |
| Caixa realizado | caixa | fluxo de caixa + PDV | ≤ hoje | `resumo_financeiro` | depende de D3 |
| Dívidas | posição | dívidas | hoje | `dividas` | sem histórico |
| Impostos | estimativa | regime + receita | 12 m | `dre` | guia real: não |
| Folha | — | inexistente | — | — | indisponível |
| Receita por cliente | competência | contas a receber + receitas | fato | `receitas_por_cliente` | PDV sem cliente fora |
| Inconsistências | — | 5 tabelas | — | `reconciliacao` | ver seção 5 |

## 4. Fórmulas e regras temporais

- Intervalos fechados [início, fim], no fuso da empresa (`hojeISO(fuso)`); semana = segunda a domingo.
- Períodos: hoje, ontem, esta semana, semana anterior, últimos 7, próximos 7/30, este mês, mês anterior, últimos 30,
  trimestre atual/anterior, ano atual/anterior, últimos 12 meses, personalizado (até 10 anos), tudo.
- Comparação: mês/trimestre/ano/12 m → período anterior equivalente; período em andamento → mesmo trecho do anterior
  (1–16/10 × 1–16/09); demais → mesmo número de dias logo antes. Sem registros no anterior = "sem base" (sem %).
- Somas em centavos inteiros. Cancelados ficam fora. Saldo a receber = valor − desconto − recebido (atualizado com
  multa e juros como a tela). Saldo a pagar = total − pago. Vencido = vencimento < hoje (não depende do texto do status).
- Critério de data sempre explícito no resultado (vencimento, recebimento/pagamento, competência, vigência).

## 5. Ferramentas implementadas

`resumo_financeiro`, `titulos`, `movimentos_realizados`, `faturamento`, `despesas`, `receitas_por_cliente`,
`custos_fixos_mes`, `reconciliacao` (novas) e `dre` — todas com cliente do usuário (RLS), filtro `empresa_id`,
validação de período e contrato padrão. Estados: `verificado`, `parcial`, `indisponivel`, `erro`, `nao_aplicavel`.
Reconciliação classifica em correspondência confirmada / possível correspondência / divergência / informação
insuficiente, com os ids para rastrear; **não corrige nem apaga nada**. As 9 ferramentas originais continuam.

## 6. Testes (resultados reais em 16/10/2026)

`npx tsx scripts/check-financeiro.mts` — 11 blocos, todos passando, cobrindo os itens 1–11, 13–16 e 19 do Plano 3 com
dados sintéticos e resultados calculados à mão (incluindo banco simulado com duas empresas). Itens 12, 17, 18 e 20 já
cobertos por `check-voz-faseD`, `check-voz-faseB` e `check-voz-tempo-real`. Também passaram: voz 0/1/2/B/D, tempo
real, motor, memória, anti-falha, DRE competência, MEI, risco, regras oficiais. TypeScript limpo; build: ver relatório.

## 7. Limitações abertas

- Folha: não existe cadastro. Impostos: só estimativa pelo regime (guia real não consultada).
- Resumo da IA e tela Relatórios ainda usam a definição antiga (D1) até decisão.
- Caixa realizado depende da decisão sobre "confirmado" (D3).
- Comparações não conferem cobertura dia a dia (só "há registros ou não" no período anterior).
- Conferência automática de números ainda só para R$ no texto (datas e % não).
- Testes contra o banco real só no site (ferramentas não foram executadas com a IA real ainda).

## 8. Decisões que dependem do CEO

1. **Definição oficial de faturamento e lucro**: adotar a DRE por competência também no resumo da IA e na tela Relatórios?
   (muda números exibidos nessas telas)
2. **"Confirmado" no Fluxo de Caixa** conta como dinheiro realizado? (muda o caixa)
3. **Receita pendente criada de conta a receber** (R$ 110.000 na empresa de teste): é para existir? Se não, corrigir na origem.
4. Crédito na Anthropic (análises mais profundas).

## 9. Arquivos

Novos: `lib/financeiro/{periodos,contrato,semantica,calculos,reconciliacao,ferramentasFinanceiras}.ts`,
`lib/ia/ferramentaDre.ts`, `scripts/check-financeiro.mts`, `docs/MOTOR-FINANCEIRO.md`.
Alterados: `lib/ia/ferramentas.ts`, `lib/ia/motor.ts` (regras da camada CFO, estado do contrato), `lib/dreCompetencia.ts`
(cliente opcional), `scripts/check-voz-faseD.mts`, `docs/REQUISITOS.md`, manual 34.

## 10. Plano técnico da Tarefa 2 (relatórios executivos)

1. Botão **"Gerar relatório"** no chat e na tela Relatórios: a IA escolhe o modelo (executivo, DRE, contas, inadimplência,
   custos) e chama as ferramentas deste motor; o relatório é montado **a partir dos resultados estruturados** (não do texto da IA).
2. Estrutura: título, período e critério, resumo executivo, tabelas com valores e fontes, gráficos, riscos, recomendações,
   limitações e rodapé com data/hora e referência de cada número.
3. PDF com a marca Axioma (reaproveitar `lib/gerarPdfTabela`) nos 3 idiomas, Compartilhar e histórico curto (regra de guarda
   por poucos dias definida pelo CEO).
4. Testes: cada número do PDF igual ao da ferramenta; relatório parcial marcado; nada de outra empresa.
