// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '23 - Crescimento - Investimentos.docx',
  titulo: 'Manual 23 — Investimentos',
  subtitulo: 'Centro de Inteligência para Alocação de Capital',
  info: ['Menu: Crescimento → Investimentos  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Organiza as aplicações da empresa (renda fixa, renda variável, cripto, imóveis e outras) e ajuda a decidir **onde colocar o próximo real**: aplicar, quitar dívida, investir na operação ou guardar como reserva. Compara tudo com os indicadores de mercado do Banco Central.' },
    { alerta: 'O Axioma não faz recomendação personalizada de investimento nem executa aplicações. Ele organiza seus dados e mostra comparações e simulações para apoiar a sua decisão.' },

    { h1: 'Botões do cabeçalho' },
    { p: '**Exportar PDF**, **+ Novo Investimento**, **Escuro / Tema Claro** e **Compartilhar**.' },

    { h1: 'As partes da tela' },
    { h2: 'Cards principais' },
    { p: '**Total Investido**, **Melhor Rentabilidade** e quantidade de investimentos.' },
    { h2: 'Radar de Riscos' },
    { p: 'Semáforo com os riscos da carteira: **Concentração por Tipo**, **Concentração por Instituição**, **Liquidez**, **Iliquidez com empresa endividada** e **Volatilidade**.' },
    { h2: 'KPIs CFO' },
    { p: '**Score de Investimento** (Crítico, Atenção, Bom ou Excelente), **Diversificação**, **Liquidez Imediata**, **Rentabilidade Consolidada**, **Caixa Disponível**, **Exposição a Risco**, **Capital Ocioso** e **Patrimônio Total**.' },
    { h2: 'Indicadores de Mercado (Banco Central)' },
    { p: '**Selic**, **CDI**, **IPCA** e **Dólar**, buscados em tempo real do Banco Central. Se a fonte estiver fora do ar, o Axioma usa o último valor guardado e avisa.' },
    { h2: 'Escada de Liquidez' },
    { p: 'Quando o dinheiro aplicado fica disponível: diária, curto prazo, longo prazo ou só no vencimento. Mostra quanto do capital investido se libera nos próximos 12 meses.' },
    { h2: 'Custo de Oportunidade vs Dívida' },
    { p: 'Compara o que os investimentos rendem com o que as dívidas custam. Se a dívida cobra mais juros do que a aplicação rende, quitar a dívida costuma ser o "investimento" mais rentável.' },
    { h2: 'Análise de Investimentos' },
    { p: 'Janela com gráficos, como a **Composição por Tipo**.' },
    { h2: 'Conselho CFO' },
    { p: 'Recomendações automáticas sobre concentração, liquidez, capital parado e dívidas caras.' },

    { h1: 'Capital Allocation Engine' },
    { p: 'Ferramenta para comparar **opções de uso do dinheiro**. Para cada opção informe o **Valor a alocar**, o **Retorno mensal (%)** ou o **Ganho/Economia Mensal Estimado (R$)** e clique em **Adicionar comparação**. Uma das opções pode ser "redução de dívida", que calcula a economia de juros.' },
    { h2: 'Radar de Oportunidades' },
    { p: 'Ordena as opções pelo retorno ajustado ao risco (**Alto**, **Médio** ou **Baixo**). O botão **Usar na simulação** leva a opção para o Simulador Executivo.' },
    { h2: 'Simulador Executivo' },
    { p: 'Aplique choques e veja o efeito: **Receita (%)**, **Custo Fixo (%)**, **Custo Variável (%)**, **Juros da Dívida (pontos, efeito Selic)**, **Aporte** e **Retorno do Aporte**. Clique em **Simular Cenários** para ver quatro cenários (**Conservador**, **Base**, **Otimista**, **Adverso**) com **Lucro Líquido/Mês**, **Saldo projetado em 12 meses** e **Runway crítico** (ou "Sem risco de ruptura").' },

    { h1: 'Passo a passo: cadastrar um investimento' },
    { numerada: [
      'Clique em **+ Novo Investimento**.',
      'Informe descrição, **Valor (R$)**, tipo (Renda Fixa, Renda Variável, Criptomoeda, Imóvel, Outro) e **Data da Aplicação**.',
      'Preencha **Rentabilidade % a.a.**, **Indexador** (ex.: 110% CDI, IPCA+6%, Prefixado), **Instituição**, **Liquidez** e **Vencimento**.',
      'Marque o status (**Ativo** ou **Resgatado**) e clique em **Salvar**.',
    ] },
    { h1: 'Como a inteligência funciona aqui' },
    { p: 'Scores, radar, escada, comparação e simulações são calculados por **regras sobre os seus dados reais e os indicadores oficiais do Banco Central**. Nada é inventado.' },
  ],
}

export default doc
