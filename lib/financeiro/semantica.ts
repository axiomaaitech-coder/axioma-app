// ═══════════════════════════════════════════════════════════════
// CATÁLOGO SEMÂNTICO FINANCEIRO do Axioma (Plano 3, Tarefa 1 — 2026-10-16). Uma definição por indicador,
// usada pelas ferramentas da IA e documentada em docs/MOTOR-FINANCEIRO.md. Regras verificadas no código
// e no banco em 16/10/2026. Onde há mais de uma definição válida (caixa × competência), elas ficam
// SEPARADAS e a resposta diz qual usou. Pontos que dependem de decisão do CEO estão em `decisao`.
// ═══════════════════════════════════════════════════════════════
export type Indicador = {
  id: string; nome: string; definicao: string; fonte: string[]; formula: string; regime: 'caixa' | 'competencia' | 'posicao' | 'estimativa'
  inclui: string; exclui: string; data: string; unidade: 'BRL' | 'PCT' | 'QTD'; limitacoes: string[]; decisao?: string; ferramenta?: string
}

export const INDICADORES: Indicador[] = [
  { id: 'faturamento_competencia', nome: 'Faturamento (competência)', regime: 'competencia', unidade: 'BRL', ferramenta: 'faturamento',
    definicao: 'Receita bruta do período pelo mês em que o fato aconteceu (venda, nota, conta lançada), igual à DRE.',
    fonte: ['receitas', 'contas_receber', 'venda (PDV)'], formula: 'Σ receitas digitadas + Σ contas a receber não canceladas (valor − desconto) + Σ vendas do PDV finalizadas, sem contar 2× (lib/dreCompetencia.itensReceita)',
    inclui: 'receitas digitadas; contas a receber pela competência/emissão; PDV finalizado', exclui: 'linhas de receita criadas ao receber uma conta a receber (a conta já conta); vendas canceladas (viram devolução)',
    data: 'receita: data; conta a receber: competência → emissão → vencimento; PDV: dia da venda no fuso', limitacoes: ['receita pendente digitada também entra (é competência, não dinheiro recebido)'] },
  { id: 'receitas_lancadas', nome: 'Receitas lançadas (tela Receitas)', regime: 'competencia', unidade: 'BRL', ferramenta: 'receitas_por_mes',
    definicao: 'Soma da tabela Receitas por data do lançamento. É a base do resumo de 12 meses e da tela Relatórios.',
    fonte: ['receitas'], formula: 'Σ receitas.valor com data no período', inclui: 'todas as receitas digitadas (recebidas e pendentes)', exclui: 'contas a receber e PDV que não geraram linha em Receitas',
    data: 'receitas.data', limitacoes: ['difere do faturamento por competência quando há contas a receber ou PDV'], decisao: 'Unificar Resumo da IA e tela Relatórios com a DRE por competência?' },
  { id: 'receita_recebida', nome: 'Receita recebida (caixa)', regime: 'caixa', unidade: 'BRL', ferramenta: 'movimentos_realizados',
    definicao: 'Dinheiro que entrou de clientes no período, pela data em que foi recebido.',
    fonte: ['contas_receber (valor_recebido, data_recebimento)', 'venda (PDV pago na hora)'], formula: 'Σ valor_recebido com data_recebimento no período + PDV finalizado não-crédito no dia',
    inclui: 'recebimentos totais e parciais', exclui: 'PDV no crédito (é previsão de repasse)', data: 'data_recebimento', limitacoes: ['recebimento parcial sem data não pode ser datado'] },
  { id: 'contas_receber_aberto', nome: 'Contas a receber em aberto', regime: 'posicao', unidade: 'BRL', ferramenta: 'titulos',
    definicao: 'Quanto clientes ainda devem: saldo = valor − desconto − já recebido, em títulos não cancelados.',
    fonte: ['contas_receber'], formula: 'Σ max(0, valor − desconto − valor_recebido)', inclui: 'pendente, parcial, vencido', exclui: 'cancelado; saldo zero',
    data: 'filtro de período pela data de vencimento', limitacoes: [] },
  { id: 'contas_receber_vencido', nome: 'Contas a receber vencidas (inadimplência)', regime: 'posicao', unidade: 'BRL', ferramenta: 'titulos',
    definicao: 'Saldo em aberto de títulos com vencimento antes de hoje.', fonte: ['contas_receber'], formula: 'Σ saldo em aberto com data_vencimento < hoje',
    inclui: 'qualquer status com saldo > 0', exclui: 'cancelado', data: 'data_vencimento × hoje no fuso da empresa', limitacoes: ['não depende do texto do status (status "vencido" pode estar desatualizado)'] },
  { id: 'contas_pagar_aberto', nome: 'Contas a pagar em aberto', regime: 'posicao', unidade: 'BRL', ferramenta: 'titulos',
    definicao: 'Quanto a empresa ainda deve a fornecedores: saldo = valor total − já pago, em títulos não cancelados.',
    fonte: ['contas_pagar'], formula: 'Σ max(0, valor_total − valor_pago)', inclui: 'pendente, parcial, vencido', exclui: 'cancelado; saldo zero', data: 'filtro pela data de vencimento', limitacoes: [] },
  { id: 'contas_pagar_vencido', nome: 'Contas a pagar vencidas', regime: 'posicao', unidade: 'BRL', ferramenta: 'titulos',
    definicao: 'Saldo a pagar com vencimento antes de hoje.', fonte: ['contas_pagar'], formula: 'Σ saldo com data_vencimento < hoje', inclui: 'qualquer status com saldo > 0', exclui: 'cancelado', data: 'data_vencimento × hoje', limitacoes: [] },
  { id: 'despesas_pagas', nome: 'Despesas pagas (caixa)', regime: 'caixa', unidade: 'BRL', ferramenta: 'movimentos_realizados',
    definicao: 'Dinheiro que saiu para pagar contas no período, pela data do pagamento.', fonte: ['contas_pagar (valor_pago, data_pagamento)'], formula: 'Σ valor_pago com data_pagamento no período',
    inclui: 'pagamentos totais e parciais', exclui: 'custos digitados sem conta a pagar (estão na competência)', data: 'data_pagamento', limitacoes: ['pagamento parcial sem data não pode ser datado'] },
  { id: 'despesas_competencia', nome: 'Despesas (competência)', regime: 'competencia', unidade: 'BRL', ferramenta: 'despesas',
    definicao: 'Custos variáveis e contas a pagar do período pelo mês do fato, por categoria, fornecedor ou lançamento.',
    fonte: ['custos_variaveis', 'contas_pagar'], formula: 'lib/dreCompetencia.itensCusto (sem contar 2×)', inclui: 'custos digitados, custo de nota importada, contas a pagar operacionais',
    exclui: 'conta a pagar de custo fixo, imposto/DAS e nota já lançada; custo criado ao pagar uma conta', data: 'custo: data; conta a pagar: emissão → vencimento', limitacoes: [] },
  { id: 'custos_fixos', nome: 'Custos fixos (vigentes)', regime: 'competencia', unidade: 'BRL', ferramenta: 'custos',
    definicao: 'Valor mensal dos custos fixos em vigência no mês (início → término); encerrado não pesa; futuro não é presumido.',
    fonte: ['custos_fixos'], formula: 'Σ valor_mensal com data_inicio ≤ mês ≤ data_fim', inclui: 'ativos no mês', exclui: 'encerrados; meses futuros', data: 'data_inicio/data_fim (sem início: data do cadastro)', limitacoes: ['custo sem data de início usa a data do cadastro'] },
  { id: 'lucro_competencia', nome: 'Lucro líquido (DRE por competência)', regime: 'competencia', unidade: 'BRL', ferramenta: 'dre',
    definicao: 'Receita bruta − devoluções − impostos estimados − custos variáveis − custos fixos − juros (pagos + estimados).',
    fonte: ['DRE gerencial (lib/dreCompetencia)'], formula: 'igual à tela DRE', inclui: 'tudo da competência', exclui: '—', data: 'competência', limitacoes: ['impostos são estimativa pelo regime, não a guia', 'juros estimados usam o saldo atual das dívidas'] },
  { id: 'lucro_medio_resumo', nome: 'Lucro médio mensal (resumo da IA)', regime: 'estimativa', unidade: 'BRL',
    definicao: 'Média de 12 meses: receitas lançadas − custos variáveis digitados − custos fixos de hoje − imposto − juros, ÷ 12.',
    fonte: ['receitas', 'custos_variaveis', 'custos_fixos', 'dividas'], formula: 'lib/ia/retratoEmpresa', inclui: 'só tabelas digitadas', exclui: 'contas a receber, PDV e contas a pagar',
    data: 'últimos 12 meses', limitacoes: ['é média, não o resultado de um mês', 'difere da DRE por competência'], decisao: 'Trocar pela média da DRE por competência?' },
  { id: 'caixa_realizado', nome: 'Caixa realizado', regime: 'caixa', unidade: 'BRL', ferramenta: 'resumo_financeiro',
    definicao: 'Saldo de lançamentos "realizado" do Fluxo de Caixa até hoje + vendas do PDV pagas na hora. Não é dinheiro livre: não desconta contas a pagar nem reservas.',
    fonte: ['fluxo_caixa (status realizado)', 'venda'], formula: 'lib/caixaSaldo.saldoCaixaRealizado', inclui: 'entradas − saídas realizadas até hoje; PDV não-crédito', exclui: 'lançamentos "confirmado" e "previsto"; PDV no crédito',
    data: 'fluxo_caixa.data ≤ hoje', limitacoes: ['lançamentos com status "confirmado" ficam fora do saldo'], decisao: '"Confirmado" no Fluxo de Caixa é dinheiro realizado? (há R$ 17.273,31 de entradas assim na empresa de teste)' },
  { id: 'dividas', nome: 'Dívidas', regime: 'posicao', unidade: 'BRL', ferramenta: 'dividas',
    definicao: 'Saldo devedor = valor total − pago, com juros ao mês informados.', fonte: ['dividas'], formula: 'Σ max(0, valor_total − valor_pago)', inclui: 'dívidas com saldo', exclui: 'quitadas', data: 'posição de hoje', limitacoes: ['não há histórico de saldo devedor por dia'] },
  { id: 'impostos_estimados', nome: 'Impostos (estimativa)', regime: 'estimativa', unidade: 'BRL', ferramenta: 'dre',
    definicao: 'Imposto pelo regime e faturamento (mesma função da IA Tributária); MEI = DAS da categoria.', fonte: ['empresas.regime_tributario', 'receitas'], formula: 'lib/iaTributariaHelpers.calcularImpostoRegime',
    inclui: 'regime, anexo do Simples pela atividade', exclui: 'guias reais', data: 'receita de 12 meses', limitacoes: ['não é o valor oficial da guia'] },
  { id: 'folha', nome: 'Folha de pagamento', regime: 'competencia', unidade: 'BRL',
    definicao: 'Não existe cadastro de folha no Axioma (verificado no banco em 16/10/2026).', fonte: [], formula: '—', inclui: '—', exclui: '—', data: '—',
    limitacoes: ['indisponível: só aparece se lançada como custo fixo/variável com categoria de folha'] },
]

export const definicao = (id: string) => INDICADORES.find((i) => i.id === id)?.definicao ?? ''
