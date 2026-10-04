// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '26 - Comercial - Clientes.docx',
  titulo: 'Manual 26 — Clientes',
  subtitulo: 'Cada cliente como ativo financeiro: valor, risco e oportunidade',
  info: ['Menu: Comercial → Clientes  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Clientes vai além de uma agenda de contatos: trata cada cliente como um **ativo financeiro**. Mostra quanto cada um vale, quanto paga em dia, o risco de inadimplência e as oportunidades de vender mais. A tela tem três abas: **📊 Carteira**, **🧬 Cliente** e **💳 Cobranças**.' },

    { h1: 'Aba Carteira' },
    { h2: 'Mapa Executivo da Carteira' },
    { p: '**Valor da Carteira**, **Ticket Médio**, **Inadimplência da Carteira**, **Concentração Top 5** e a **Distribuição por IVCA** (Crítico, Atenção, Saudável, Premium).' },
    { h2: 'Dashboard Executivo da Carteira' },
    { p: '**Clientes Ativos**, **Novos no Mês**, **Clientes Inativos**, **Tempo Médio de Relacionamento**, **Clientes Premium**, **Clientes Estratégicos**, **Clientes em Risco** e **Negligenciados** (clientes bons sem contato há muito tempo).' },
    { h2: 'Radar Executivo' },
    { p: 'Agrupa a carteira por sinal: **Premium**, **Prontos p/ Upsell**, **Em Risco**, **Negligenciados**, **Caixa Recorrente** e **Concentração Alta**. Clique em um grupo para filtrar a lista; **Limpar filtro** volta a mostrar todos.' },
    { h2: 'Mapa de Valor dos Clientes' },
    { p: 'Gráfico de bolhas: valor (IVCA) × segurança. O tamanho da bolha é o ticket médio. Clique numa bolha para abrir o cliente. Precisa de pelo menos 2 clientes com cobranças.' },
    { h2: 'Top listas e receita por região' },
    { p: '**Top 5 — IVCA**, **Top 5 — Valor Cobrado**, **Top 5 — Crescimento** e a **Receita por Segmento, Cidade e Estado** (preencha esses dados no cadastro para o painel ganhar detalhe).' },

    { h1: 'Aba Cliente (Digital Twin)' },
    { p: 'É a "ficha inteligente" de um cliente. Selecione o cliente na Carteira.' },
    { h2: 'IVCA — Índice de Valor do Cliente Axioma' },
    { p: 'Nota de **0 a 1000**, calculada só com dado real: **pontualidade**, **volume**, **recorrência**, **tendência** e **risco**.' },
    { h2: 'Saúde do Cliente' },
    { p: 'Quatro dimensões: **Pagamento**, **Relacionamento**, **Recorrência** e **Comercial**.' },
    { h2: 'Resumo de Compras e Radar de Sinais' },
    { p: '**Última Compra**, **Maior Compra** e **Primeira Compra**. O Radar de Sinais lista oportunidades e riscos detectados automaticamente, **sempre com o motivo**.' },
    { h2: 'Parecer Executivo e Conselho Executivo' },
    { p: 'O Parecer traz **Resumo Executivo**, **Pontos Fortes**, **Pontos Fracos**, **Riscos**, **Oportunidades**, **Sugestão** e **Próximo Passo**. O Conselho mostra a visão de cada especialista sobre o mesmo dado e termina com a **Recomendação Consolidada da ZIA**.' },
    { h2: 'Pergunte à ZIA sobre este cliente' },
    { p: 'ZIA é a assistente de inteligência artificial de Clientes. Você escreve uma pergunta (ex.: "esse cliente merece desconto?") e ela responde **com os dados reais deste cliente**. Como funciona: o Axioma monta uma ficha do cliente (compras, pagamentos, atrasos, IVCA) e um retrato da empresa e envia ao motor de inteligência; a resposta volta em linguagem simples. Se a inteligência estiver indisponível, a ZIA responde por regras e avisa.' },
    { h2: 'Linha do Tempo, Dados Cadastrais e Cobranças' },
    { p: 'Histórico financeiro do cliente, os dados de cadastro e as cobranças dele, com o atalho **Ver Todas as Cobranças**.' },

    { h1: 'Aba Cobranças' },
    { p: 'Lista as cobranças de todos os clientes, com **Detalhes** (parcelas, juros, multa, forma de recebimento) e a ação **Marcar como recebido**.' },

    { h1: 'Passo a passo: cadastrar um cliente' },
    { p: 'Clique em **+ Novo Cliente**. O cadastro é feito em etapas (use **Anterior** e **Próximo**):' },
    { numerada: [
      '**Identificação**: Razão Social, Nome Fantasia, CNPJ/CPF, Inscrição Estadual.',
      '**Contato**: responsável, cargo, telefone, WhatsApp, e-mail, site.',
      '**Endereço**: país, estado e cidade (a lista de cidades carrega sozinha).',
      '**Fiscal**: regime tributário e porte.',
      '**Financeiro**: condição de pagamento, prazo médio e limite de crédito.',
      '**Comercial**: segmento, origem, responsável comercial, classificação (Lead, Cliente, Parceiro, Estratégico, Premium) e data da primeira compra.',
      '**Cobranças**, **Riscos** e **Inteligência IA**: prévias somente leitura, liberadas depois do primeiro histórico.',
      '**Documentos** (links, um por linha) e **Observações**. Clique em **Salvar Cliente**.',
    ] },
    { h1: 'Passo a passo: nova cobrança' },
    { p: 'A janela de cobrança tem as etapas **Básico** (cliente, descrição, valor, vencimento), **Documentação** (contrato, número, categoria, centro de receita, conta contábil), **Pagamento** (banco recebedor, emissão, competência, desconto, valor final, cobrança recorrente e frequência), **Inteligência** (prévia do **Score de Recebimento** e da **Probabilidade de Inadimplência**, calculados por regra) e **Anexo & Observações**.' },
  ],
}

export default doc
