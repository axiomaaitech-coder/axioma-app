// ═══════════════════════════════════════════════════════════════
// CATÁLOGO SEMÂNTICO FINANCEIRO do Axioma (Plano 3, Tarefa 1 — 2026-10-16). Uma definição por indicador,
// usada pelas ferramentas da IA e documentada em docs/MOTOR-FINANCEIRO.md. Regras verificadas no código
// e no banco em 16/10/2026. Onde há mais de uma definição válida (caixa × competência), elas ficam
// SEPARADAS e a resposta diz qual usou. Pontos que dependem de decisão do CEO estão em `decisao`.
// ═══════════════════════════════════════════════════════════════
export type Indicador = {
  id: string; nome: string; definicao: string; fonte: string[]; formula: string; regime: 'caixa' | 'competencia' | 'posicao' | 'estimativa'
  inclui: string; exclui: string; data: string; unidade: 'BRL' | 'PCT' | 'QTD'; limitacoes: string[]; decisao?: string; ferramenta?: string
  modulo: string                 // módulo dono da informação: a fonte oficial é a mesma conta dessa tela
  rota: string | null            // tela do módulo (null = o módulo não existe)
  papeis: readonly string[]      // quem pode ver; o servidor passa a conferir na Etapa 2 (registro de portas)
  indisponivel?: boolean         // o dado não existe no Axioma: a resposta é "não há", nunca uma estimativa
}

// Mesma regra de hoje (RF-IA02, podeUsarIAFinanceira): operador de caixa não vê dado financeiro.
export const PAPEIS_FINANCEIROS = ['dono', 'admin', 'financeiro', 'contabil', 'leitor'] as const

export const INDICADORES: Indicador[] = [
  { id: 'faturamento_competencia', modulo: 'DRE', rota: '/dre', papeis: PAPEIS_FINANCEIROS, nome: 'Faturamento (competência)', regime: 'competencia', unidade: 'BRL', ferramenta: 'faturamento',
    definicao: 'Receita bruta do período pelo mês em que o fato aconteceu (venda, nota, conta lançada), igual à DRE.',
    fonte: ['receitas', 'contas_receber', 'venda (PDV)'], formula: 'Σ receitas digitadas + Σ contas a receber não canceladas (valor − desconto) + Σ vendas do PDV finalizadas, sem contar 2× (lib/dreCompetencia.itensReceita)',
    inclui: 'receitas digitadas; contas a receber pela competência/emissão; PDV finalizado', exclui: 'linhas de receita criadas ao receber uma conta a receber (a conta já conta); vendas canceladas (viram devolução)',
    data: 'receita: data; conta a receber: competência → emissão → vencimento; PDV: dia da venda no fuso', limitacoes: ['receita pendente digitada também entra (é competência, não dinheiro recebido)'] },
  { id: 'receitas_lancadas', modulo: 'Receitas', rota: '/receitas', papeis: PAPEIS_FINANCEIROS, nome: 'Receitas lançadas (tela Receitas)', regime: 'competencia', unidade: 'BRL', ferramenta: 'receitas_por_mes',
    definicao: 'Soma da tabela Receitas por data do lançamento. É a base do resumo de 12 meses e da tela Relatórios.',
    fonte: ['receitas'], formula: 'Σ receitas.valor com data no período', inclui: 'todas as receitas digitadas (recebidas e pendentes)', exclui: 'contas a receber e PDV que não geraram linha em Receitas',
    data: 'receitas.data', limitacoes: ['difere do faturamento por competência quando há contas a receber ou PDV'], decisao: 'Unificar Resumo da IA e tela Relatórios com a DRE por competência?' },
  { id: 'receita_recebida', modulo: 'Contas a Receber', rota: '/contas-receber', papeis: PAPEIS_FINANCEIROS, nome: 'Receita recebida (caixa)', regime: 'caixa', unidade: 'BRL', ferramenta: 'movimentos_realizados',
    definicao: 'Dinheiro que entrou de clientes no período, pela data em que foi recebido.',
    fonte: ['contas_receber (valor_recebido, data_recebimento)', 'venda (PDV pago na hora)'], formula: 'Σ valor_recebido com data_recebimento no período + PDV finalizado não-crédito no dia',
    inclui: 'recebimentos totais e parciais', exclui: 'PDV no crédito (é previsão de repasse)', data: 'data_recebimento', limitacoes: ['recebimento parcial sem data não pode ser datado'] },
  { id: 'contas_receber_aberto', modulo: 'Contas a Receber', rota: '/contas-receber', papeis: PAPEIS_FINANCEIROS, nome: 'Contas a receber em aberto', regime: 'posicao', unidade: 'BRL', ferramenta: 'titulos',
    definicao: 'Quanto clientes ainda devem: saldo = valor − desconto − já recebido, em títulos não cancelados.',
    fonte: ['contas_receber'], formula: 'Σ max(0, valor − desconto − valor_recebido)', inclui: 'pendente, parcial, vencido', exclui: 'cancelado; saldo zero',
    data: 'filtro de período pela data de vencimento', limitacoes: [] },
  { id: 'contas_receber_vencido', modulo: 'Contas Vencidas', rota: '/contas-vencidas', papeis: PAPEIS_FINANCEIROS, nome: 'Contas a receber vencidas (inadimplência)', regime: 'posicao', unidade: 'BRL', ferramenta: 'titulos',
    definicao: 'Saldo em aberto de títulos com vencimento antes de hoje.', fonte: ['contas_receber'], formula: 'Σ saldo em aberto com data_vencimento < hoje',
    inclui: 'qualquer status com saldo > 0', exclui: 'cancelado', data: 'data_vencimento × hoje no fuso da empresa', limitacoes: ['não depende do texto do status (status "vencido" pode estar desatualizado)'] },
  { id: 'contas_pagar_aberto', modulo: 'Contas a Pagar', rota: '/contas-pagar', papeis: PAPEIS_FINANCEIROS, nome: 'Contas a pagar em aberto', regime: 'posicao', unidade: 'BRL', ferramenta: 'titulos',
    definicao: 'Quanto a empresa ainda deve a fornecedores: saldo = valor total − já pago, em títulos não cancelados.',
    fonte: ['contas_pagar'], formula: 'Σ max(0, valor_total − valor_pago)', inclui: 'pendente, parcial, vencido', exclui: 'cancelado; saldo zero', data: 'filtro pela data de vencimento', limitacoes: [] },
  { id: 'contas_pagar_vencido', modulo: 'Contas Vencidas', rota: '/contas-vencidas', papeis: PAPEIS_FINANCEIROS, nome: 'Contas a pagar vencidas', regime: 'posicao', unidade: 'BRL', ferramenta: 'titulos',
    definicao: 'Saldo a pagar com vencimento antes de hoje.', fonte: ['contas_pagar'], formula: 'Σ saldo com data_vencimento < hoje', inclui: 'qualquer status com saldo > 0', exclui: 'cancelado', data: 'data_vencimento × hoje', limitacoes: [] },
  { id: 'despesas_pagas', modulo: 'Contas a Pagar', rota: '/contas-pagar', papeis: PAPEIS_FINANCEIROS, nome: 'Despesas pagas (caixa)', regime: 'caixa', unidade: 'BRL', ferramenta: 'movimentos_realizados',
    definicao: 'Dinheiro que saiu para pagar contas no período, pela data do pagamento.', fonte: ['contas_pagar (valor_pago, data_pagamento)'], formula: 'Σ valor_pago com data_pagamento no período',
    inclui: 'pagamentos totais e parciais', exclui: 'custos digitados sem conta a pagar (estão na competência)', data: 'data_pagamento', limitacoes: ['pagamento parcial sem data não pode ser datado'] },
  { id: 'despesas_competencia', modulo: 'DRE', rota: '/dre', papeis: PAPEIS_FINANCEIROS, nome: 'Despesas (competência)', regime: 'competencia', unidade: 'BRL', ferramenta: 'despesas',
    definicao: 'Custos variáveis e contas a pagar do período pelo mês do fato, por categoria, fornecedor ou lançamento.',
    fonte: ['custos_variaveis', 'contas_pagar'], formula: 'lib/dreCompetencia.itensCusto (sem contar 2×)', inclui: 'custos digitados, custo de nota importada, contas a pagar operacionais',
    exclui: 'conta a pagar de custo fixo, imposto/DAS e nota já lançada; custo criado ao pagar uma conta', data: 'custo: data; conta a pagar: emissão → vencimento', limitacoes: [] },
  { id: 'custos_fixos', modulo: 'Custos Fixos', rota: '/custos-fixos', papeis: PAPEIS_FINANCEIROS, nome: 'Custos fixos (vigentes)', regime: 'competencia', unidade: 'BRL', ferramenta: 'custos',
    definicao: 'Valor mensal dos custos fixos em vigência no mês (início → término); encerrado não pesa; futuro não é presumido.',
    fonte: ['custos_fixos'], formula: 'Σ valor_mensal com data_inicio ≤ mês ≤ data_fim', inclui: 'ativos no mês', exclui: 'encerrados; meses futuros', data: 'data_inicio/data_fim (sem início: data do cadastro)', limitacoes: ['custo sem data de início usa a data do cadastro'] },
  { id: 'lucro_competencia', modulo: 'DRE', rota: '/dre', papeis: PAPEIS_FINANCEIROS, nome: 'Lucro líquido (DRE por competência)', regime: 'competencia', unidade: 'BRL', ferramenta: 'dre',
    definicao: 'Receita bruta − devoluções − impostos estimados − custos variáveis − custos fixos − juros (pagos + estimados).',
    fonte: ['DRE gerencial (lib/dreCompetencia)'], formula: 'igual à tela DRE', inclui: 'tudo da competência', exclui: '—', data: 'competência', limitacoes: ['impostos são estimativa pelo regime, não a guia', 'juros estimados usam o saldo atual das dívidas'] },
  { id: 'lucro_medio_resumo', modulo: 'IA Financeira', rota: '/ia-financeira', papeis: PAPEIS_FINANCEIROS, nome: 'Lucro médio mensal (resumo da IA)', regime: 'estimativa', unidade: 'BRL',
    definicao: 'Média de 12 meses: receitas lançadas − custos variáveis digitados − custos fixos de hoje − imposto − juros, ÷ 12.',
    fonte: ['receitas', 'custos_variaveis', 'custos_fixos', 'dividas'], formula: 'lib/ia/retratoEmpresa', inclui: 'só tabelas digitadas', exclui: 'contas a receber, PDV e contas a pagar',
    data: 'últimos 12 meses', limitacoes: ['é média, não o resultado de um mês', 'difere da DRE por competência'], decisao: 'Trocar pela média da DRE por competência?' },
  { id: 'caixa_realizado', modulo: 'Fluxo de Caixa', rota: '/fluxo-caixa', papeis: PAPEIS_FINANCEIROS, nome: 'Caixa realizado', regime: 'caixa', unidade: 'BRL', ferramenta: 'resumo_financeiro',
    definicao: 'Saldo de lançamentos "realizado" do Fluxo de Caixa até hoje + vendas do PDV pagas na hora. Não é dinheiro livre: não desconta contas a pagar nem reservas.',
    fonte: ['fluxo_caixa (status realizado)', 'venda'], formula: 'lib/caixaSaldo.saldoCaixaRealizado', inclui: 'entradas − saídas realizadas até hoje; PDV não-crédito', exclui: 'lançamentos "confirmado" e "previsto"; PDV no crédito',
    data: 'fluxo_caixa.data ≤ hoje', limitacoes: ['lançamentos com status "confirmado" ficam fora do saldo'], decisao: '"Confirmado" no Fluxo de Caixa é dinheiro realizado? (há R$ 17.273,31 de entradas assim na empresa de teste)' },
  { id: 'dividas', modulo: 'Endividamento', rota: '/endividamento', papeis: PAPEIS_FINANCEIROS, nome: 'Dívidas', regime: 'posicao', unidade: 'BRL', ferramenta: 'dividas',
    definicao: 'Saldo devedor = valor total − pago, com juros ao mês informados.', fonte: ['dividas'], formula: 'Σ max(0, valor_total − valor_pago)', inclui: 'dívidas com saldo', exclui: 'quitadas', data: 'posição de hoje', limitacoes: ['não há histórico de saldo devedor por dia'] },
  { id: 'impostos_estimados', modulo: 'IA Tributária', rota: '/ia-tributaria', papeis: PAPEIS_FINANCEIROS, nome: 'Impostos (estimativa)', regime: 'estimativa', unidade: 'BRL', ferramenta: 'dre',
    definicao: 'Imposto pelo regime e faturamento (mesma função da IA Tributária); MEI = DAS da categoria.', fonte: ['empresas.regime_tributario', 'receitas'], formula: 'lib/iaTributariaHelpers.calcularImpostoRegime',
    inclui: 'regime, anexo do Simples pela atividade', exclui: 'guias reais', data: 'receita de 12 meses', limitacoes: ['não é o valor oficial da guia'] },
  { id: 'folha', modulo: 'RH (não existe)', rota: null, papeis: PAPEIS_FINANCEIROS, indisponivel: true, nome: 'Folha de pagamento', regime: 'competencia', unidade: 'BRL',
    definicao: 'Não existe cadastro de folha no Axioma (verificado no banco em 16/10/2026).', fonte: [], formula: '—', inclui: '—', exclui: '—', data: '—',
    limitacoes: ['indisponível: só aparece se lançada como custo fixo/variável com categoria de folha'] },
  // ─── Central Intelligence, Etapa 1 (2026-11-04). Fontes conferidas no código e no banco nesta data. Sem `ferramenta` = a IA não tem porta. ───
  { id: 'caixa_posicao', modulo: 'Tesouraria', rota: '/tesouraria', papeis: PAPEIS_FINANCEIROS, nome: 'Posição de caixa por conta', regime: 'posicao', unidade: 'BRL', ferramenta: 'caixa_tesouraria',
    definicao: 'Saldo de hoje em cada conta, separado em disponível, aplicado e restrito.', fonte: ['RPC tesouraria_posicao (razão contábil)'], formula: 'Σ saldo das contas por tipo de liquidez (lib/tesourariaHelpers.obterPosicaoCaixa)',
    inclui: 'contas disponíveis, aplicadas e restritas', exclui: 'contas a receber e a pagar em aberto', data: 'posição de hoje', limitacoes: ['vem do razão contábil: pode diferir do caixa realizado do Fluxo de Caixa'] },
  { id: 'caixa_livre', modulo: 'Tesouraria', rota: '/tesouraria', papeis: PAPEIS_FINANCEIROS, nome: 'Caixa livre acima da reserva', regime: 'posicao', unidade: 'BRL', ferramenta: 'caixa_tesouraria',
    definicao: 'Caixa disponível menos a reserva mínima definida pela empresa; nunca fica negativo.', fonte: ['RPC tesouraria_posicao', 'tesouraria_config.reserva_minima'], formula: 'max(0, disponível − reserva mínima)',
    inclui: 'só contas de liquidez disponível', exclui: 'aplicado e restrito', data: 'posição de hoje', limitacoes: ['sem reserva cadastrada, a reserva vale zero'] },
  { id: 'previsao_caixa', modulo: 'Tesouraria', rota: '/tesouraria', papeis: PAPEIS_FINANCEIROS, nome: 'Previsão de caixa (7, 30, 60 e 90 dias)', regime: 'estimativa', unidade: 'BRL', ferramenta: 'caixa_tesouraria',
    definicao: 'Saldo projetado somando entradas e saídas previstas em cada horizonte, em três cenários.', fonte: ['RPC tesouraria_fluxo_projetado'], formula: 'lib/tesourariaHelpers.obterFluxoProjetado (cenários base, otimista e estressado)',
    inclui: 'contas a receber e a pagar previstas', exclui: 'o que não está lançado', data: 'hoje + horizonte', limitacoes: ['é previsão: depende de os clientes pagarem como no histórico'] },
  { id: 'vencidos_promessas', modulo: 'Contas Vencidas', rota: '/contas-vencidas', papeis: PAPEIS_FINANCEIROS, nome: 'Promessas de pagamento', regime: 'posicao', unidade: 'BRL', ferramenta: 'contas_vencidas',
    definicao: 'Promessas de clientes com conta vencida: pendentes, cumpridas e descumpridas.', fonte: ['cobranca_compromissos', 'lib/vencidos (Overdue Intelligence)'], formula: 'lib/vencidos/ferramentaIA.consultarVencidosIA, foco promessas',
    inclui: 'promessas fora da lixeira', exclui: 'promessas excluídas', data: 'data prometida', limitacoes: ['promessa não é dinheiro em caixa'] },
  { id: 'obrigacoes_fiscais_abertas', modulo: 'Fiscal', rota: '/fiscal/obrigacoes', papeis: PAPEIS_FINANCEIROS, nome: 'Obrigações fiscais em aberto', regime: 'posicao', unidade: 'QTD', ferramenta: 'obrigacoes_fiscais',
    definicao: 'Obrigações cadastradas ou geradas para o regime da empresa que ainda não foram resolvidas.', fonte: ['empresa_obrigacoes (RPC fiscal_obrigacoes_proximas)'], formula: 'lib/fiscalHelpers.obterObrigacoesProximas',
    inclui: 'pendente e atrasada', exclui: 'paga, dispensada, enviada e confirmada', data: 'data de vencimento', limitacoes: ['o valor é estimado; só existe o que foi gerado ou cadastrado'] },
  { id: 'guias_fiscais', modulo: 'MEI', rota: '/mei/das', papeis: PAPEIS_FINANCEIROS, nome: 'Guias de DAS registradas', regime: 'posicao', unidade: 'BRL',
    definicao: 'Guias de DAS lidas e guardadas no Axioma, com valor e vencimento da própria guia.', fonte: ['guias_arrecadacao'], formula: 'Σ valor_total', inclui: 'guias registradas', exclui: 'imposto estimado sem guia', data: 'data de vencimento da guia', limitacoes: ['hoje só o fluxo do DAS do MEI grava guias; guia de outro regime não aparece aqui'] },
  { id: 'mei_obrigacoes_abertas', modulo: 'MEI', rota: '/mei/das', papeis: PAPEIS_FINANCEIROS, nome: 'Obrigações do MEI em aberto', regime: 'posicao', unidade: 'QTD', ferramenta: 'obrigacoes_fiscais',
    definicao: 'DAS e demais obrigações do MEI ainda pendentes.', fonte: ['mei_obrigacoes'], formula: 'contagem com status Pendente', inclui: 'status Pendente', exclui: 'status Entregue', data: 'data de vencimento', limitacoes: ['só se aplica a empresa MEI'] },
  { id: 'clientes_ativos', modulo: 'Clientes', rota: '/clientes', papeis: PAPEIS_FINANCEIROS, nome: 'Clientes ativos', regime: 'posicao', unidade: 'QTD', ferramenta: 'cadastros',
    definicao: 'Quantidade de clientes cadastrados com status ativo.', fonte: ['clientes'], formula: 'contagem com status = ativo', inclui: 'status ativo', exclui: 'demais status', data: 'posição de hoje', limitacoes: [] },
  { id: 'clientes_inadimplentes', modulo: 'Inadimplência', rota: '/inadimplencia', papeis: PAPEIS_FINANCEIROS, nome: 'Clientes inadimplentes', regime: 'posicao', unidade: 'QTD', ferramenta: 'cadastros',
    definicao: 'Quantidade de clientes com saldo vencido em contas a receber.', fonte: ['contas_receber'], formula: 'clientes distintos com saldo > 0 e data_vencimento < hoje', inclui: 'títulos com saldo vencido e cliente informado', exclui: 'título sem cliente; cancelado', data: 'data_vencimento × hoje', limitacoes: ['título sem cliente não entra na contagem'] },
  { id: 'fornecedores_ativos', modulo: 'Fornecedores', rota: '/fornecedores', papeis: PAPEIS_FINANCEIROS, nome: 'Fornecedores ativos', regime: 'posicao', unidade: 'QTD', ferramenta: 'cadastros',
    definicao: 'Quantidade de fornecedores cadastrados com status ativo.', fonte: ['fornecedores'], formula: 'contagem com status = ativo', inclui: 'status ativo', exclui: 'demais status', data: 'posição de hoje', limitacoes: [] },
  { id: 'estoque_valor', modulo: 'Estoque', rota: '/estoque', papeis: PAPEIS_FINANCEIROS, nome: 'Valor do estoque', regime: 'posicao', unidade: 'BRL', ferramenta: 'estoque_resumo',
    definicao: 'Saldo disponível vezes o preço médio de cada produto, com a mesma conta da tela Estoque.', fonte: ['vw_estoque_kpis (produtos)'], formula: 'Σ saldo_disponivel × preco_medio (lib/estoqueHelpers.carregarKpisEstoque)', inclui: 'produtos ativos que controlam estoque', exclui: 'produtos inativos; produto que não controla estoque', data: 'posição de hoje', limitacoes: ['depende do preço médio de cada produto'] },
  { id: 'estoque_avisos', modulo: 'Estoque', rota: '/estoque', papeis: PAPEIS_FINANCEIROS, nome: 'Avisos de estoque', regime: 'posicao', unidade: 'QTD', ferramenta: 'estoque_avisos',
    definicao: 'Produtos ativos em ruptura, com estoque baixo, capital parado ou custo subindo.', fonte: ['vw_estoque_avisos'], formula: 'contagem por tipo de aviso', inclui: 'produtos ativos', exclui: 'produtos inativos', data: 'posição de hoje', limitacoes: ['estoque mínimo e máximo dependem do cadastro'] },
  { id: 'funcionarios', modulo: 'RH (não existe)', rota: null, papeis: PAPEIS_FINANCEIROS, indisponivel: true, nome: 'Funcionários', regime: 'posicao', unidade: 'QTD',
    definicao: 'Não existe cadastro de funcionários no Axioma (verificado no banco em 04/11/2026).', fonte: [], formula: '—', inclui: '—', exclui: '—', data: '—', limitacoes: ['indisponível até existir o módulo de RH'] },
  { id: 'fornecedor_deve', modulo: 'Fornecedores', rota: '/fornecedores', papeis: PAPEIS_FINANCEIROS, indisponivel: true, nome: 'Fornecedor que deve à empresa', regime: 'posicao', unidade: 'BRL',
    definicao: 'Não existe registro de crédito a receber de fornecedor no Axioma (verificado no banco em 04/11/2026).', fonte: [], formula: '—', inclui: '—', exclui: '—', data: '—', limitacoes: ['indisponível: o Axioma só registra o que a empresa deve ao fornecedor'] },
]

export const definicao = (id: string) => INDICADORES.find((i) => i.id === id)?.definicao ?? ''
export const indicador = (id: string) => INDICADORES.find((i) => i.id === id)
