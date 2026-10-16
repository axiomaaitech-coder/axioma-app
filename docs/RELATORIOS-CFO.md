# Relatórios executivos CFO — Plano 3, Tarefa 2 (2026-10-16)

Estado: **implementado e testado localmente; não publicado** (publicação só com autorização do fundador). Nenhuma migração,
nenhum dado real alterado, nenhuma dependência nova.

## 1. Diagnóstico da Tarefa 1 (antes de implementar)

| Item | Estado |
|---|---|
| Motor temporal, contrato, cálculos em centavos, reconciliação, 8 ferramentas + DRE | implementado e validado (`check-financeiro`) |
| DRE por competência (mesmo cálculo da tela DRE) | implementado e validado; impostos = estimativa pelo regime |
| Resumo da IA e tela Relatórios antiga com a definição antiga de lucro (D1) | implementado parcialmente — **decisão do fundador** |
| Caixa realizado sem os lançamentos "confirmado" do Fluxo (D3) | bloqueado por decisão do fundador |
| Folha de pagamento | pendente — não existe cadastro |
| Impostos apurados (guia oficial) | parcial — obrigações e guias cadastradas existem; valor é estimativa |
| Metas × realizado | pendente — tabela `metas` existe, sem regra de comparação definida |
| Relatórios/PDF antigos | tela Relatórios (5 abas pela conta antiga) + `lib/gerarPdfTabela` (tabela simples) |

Correção feita na auditoria: a ferramenta `resumo_financeiro` lia as dívidas **sem filtrar a empresa** (quem tem duas
empresas via a soma das duas, pela RLS). Agora filtra por `empresa_id`.

## 2. Arquitetura

```
tela Relatórios ─┐                       ┌─ executarFerramentaFinanceira (Tarefa 1)
José / chats ────┼─ gerarRelatorio() ────┼─ consultarDRE (mesmo cálculo da tela DRE)
PDF (navegador) ─┘   lib/financeiro/     ├─ saldoCaixaRealizado (Fluxo de Caixa + PDV)
                     relatorios.ts       └─ leituras com RLS + empresa_id (dívidas, obrigações, guias, PDV, turnos)
                          │
                    estrutura `Relatorio` (relatorioTipos.ts) → tela (RelatorioCFO.tsx), PDF (relatorioPdf.ts),
                                                               IA (ferramenta `relatorio`, relatorioParaIA)
```

Nenhum dos três consumidores recalcula números: a tela e o PDF só formatam (`relatorioTextos.ts`, as mesmas funções);
a IA recebe o resumo da mesma estrutura.

## 3. Relatórios implementados

| Tipo | Conteúdo | Fontes |
|---|---|---|
| executivo | faturamento e despesas (competência, com comparação), lucro e margem (DRE), recebido/pago (caixa), caixa realizado, a receber/pagar abertos e vencidos, dívidas, maiores clientes e despesas | faturamento, despesas, movimentos, resumo, receita por cliente, DRE |
| dre | linhas da DRE com % da receita e comparação, receitas e custos por categoria | DRE |
| fluxo_caixa | recebido de clientes/PDV, pago, saldo do período, saldo de caixa inicial/final, próximos 30 dias e projeção simples (estimativa) | movimentos, resumo, títulos 30 dias, caixa realizado |
| contas_receber / contas_pagar | aberto, vencido, % vencido, faixas de atraso, maiores saldos, vencendo no período, liquidado no período | títulos + leitura para as faixas |
| receitas | série (dia/semana/mês), devoluções, receitas digitadas × faturamento, por cliente, por categoria | faturamento, receita por cliente, DRE |
| despesas | por categoria e fornecedor, custos fixos do período e ativos no mês, despesas sobre a receita | despesas, custos fixos, DRE |
| endividamento | saldo, juros mensais estimados, compromissos totais, dívida em meses de faturamento, lista de dívidas | dívidas (RLS), resumo, faturamento 12 m |
| tributario | obrigações do período (estimado × pago), vencidas sem pagamento, guias, imposto estimado da DRE | obrigações, obrigações MEI, guias, DRE |
| pdv | vendas concluídas, ticket médio, descontos, canceladas, por forma de pagamento, sangrias, diferenças de fechamento | venda, turnos, movimentações de caixa |
| conciliacao | contagem por classe e lista de pontos (só aponta) | reconciliação |

Dimensões sem dado real **não** aparecem (produto/serviço na receita, folha, metas).

## 4. Indicadores e regras

Definições e fórmulas: `lib/financeiro/semantica.ts` e `docs/MOTOR-FINANCEIRO.md` §3–4. Regras novas da Tarefa 2:

- Faixas de atraso: dias depois do vencimento (mesma conta de `saldoReceber`); a vencer, 1–30, 31–60, 61–90, > 90.
- Variação: `comparar()` — sem registros no anterior = sem %; percentual sobre o valor absoluto do anterior.
- Projeção 30 dias = caixa realizado + a receber que vence em 30 dias − a pagar que vence em 30 dias (**estimativa**;
  não inclui vencidos, PDV futuro, custos fixos sem conta a pagar nem impostos sem guia).
- Juros mensais das dívidas = saldo × taxa mensal cadastrada (estimativa sobre o saldo de hoje).
- Diferença de caixa do PDV = valor contado − valor esperado no fechamento do turno.
- Obrigação vencida = vencimento antes de hoje, sem pagamento registrado e status não quitado.
- Achados (riscos) por regras fixas: prejuízo, margem < 5%, vencidos a receber (alta se ≥ 30% do aberto), vencidos a
  pagar, descasamento em 30 dias, saiu mais do que entrou, cliente com ≥ 40% da receita, faturamento −10%, despesas
  +15%, dívida ≥ 6 meses de faturamento, obrigações vencidas, diferença de caixa, cancelamentos ≥ 10%, duplicidade
  confirmada, divergências. Cada um com evidência numérica, tipo (fato/cálculo/interpretação), prioridade e confiança.
- DRE: o Axioma separa custos **variáveis × fixos**, não CPV × despesas operacionais; por isso lucro bruto e despesas
  operacionais não aparecem separados e IRPJ/CSLL não são apurados à parte. O relatório declara isso.

## 5. SQL e migrações

Nenhuma. Tudo usa tabelas e políticas existentes.

## 6. PDF

`lib/financeiro/relatorioPdf.ts` com o jsPDF já instalado (o mesmo de `lib/gerarPdfTabela`). A4, cabeçalho com marca,
empresa e CNPJ; capa com período, comparação, data/hora no fuso da empresa e situação dos dados; resumo; indicadores com
classe; tabelas com cabeçalho repetido na quebra de página e linhas que crescem (nada cortado); riscos e recomendações;
limitações; fontes, metodologia e referências; rodapé "Página i/N" e aviso de relatório gerencial. Negativos em vermelho.
Montado **no navegador** a partir do relatório que a rota autorizada devolveu: nenhum arquivo é guardado no servidor e
não existe link público. Falha ao montar = aviso na tela com "Tentar de novo".

## 7. José e voz

Ferramenta `relatorio` no motor (`lib/ia/ferramentas.ts` → `relatorioParaIA`): a IA recebe resumo, indicadores,
tabelas (8 linhas), achados e limitações **da mesma estrutura**; o motor guarda o pedido e a rota devolve
`relatorio`; ChatInteligencia (Relatórios, Contas a Pagar), IA Financeira e José mostram **Abrir relatório e PDF**, que
abre o painel já preenchido. A cobrança continua a do motor (uma por pergunta); a rota de relatórios não cobra IA. A
conversa ao vivo usa o mesmo motor. Voz e tom não foram alterados.

## 8. Testes (resultados reais em 16/10/2026)

`npx tsx scripts/check-relatorios.mts` — todos passando, cobrindo os itens 1–22 da Tarefa 2 com dados sintéticos e
contas feitas à mão (banco simulado com três empresas). PDF conferido visualmente (pt e en). Também passaram os demais
testes do projeto, TypeScript e lint dos arquivos novos; build: ver relatório de entrega.

## 9. Segurança

Login obrigatório (401), empresa decidida pela RLS (alheia = 404), operador = 403, leitura falha = 503, sem chave de
serviço, toda leitura com `empresa_id`, auditoria `relatorio.gerar` só com tipo, período, estado e contagens.

## 10. Pendências

- Filtros por cliente, fornecedor e categoria dentro do relatório (hoje aparecem como quebras/tabelas, não como filtro).
- Gráficos no PDF; metas × realizado; mesmo período do ano anterior como opção de comparação.
- Folha de pagamento (não há cadastro) e impostos apurados oficialmente.
- Decisões D1–D4 do `docs/MOTOR-FINANCEIRO.md` (§8), que mudam números exibidos.
- Teste no site com login real e com conta de operador.
