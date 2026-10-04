// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '43 - Nexus - Inteligência Econômica.docx',
  titulo: 'Manual 43 — Nexus e o José',
  subtitulo: 'Inteligência econômica que atravessa toda a empresa',
  info: ['Menu: Nexus  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Nexus acompanha a economia do Brasil e do mundo (câmbio, juros, inflação, petróleo, emprego, notícias) e traduz o que acontece em **impacto para a sua empresa**. Quem faz essa leitura é o **José**, a inteligência do Nexus.' },
    { h2: 'Por que "José"' },
    { p: 'Na história bíblica, José do Egito interpretou os sinais e preparou o país para os sete anos de vacas magras. É a ideia do Nexus: **ler os sinais de hoje para se preparar para amanhã**.' },
    { alerta: 'O José só usa dados oficiais e os números da sua empresa no Axioma: nada é inventado. Leituras são **interpretações, não fatos**, e **não são recomendação de investimento**.' },

    { h1: 'As partes da tela' },
    { h2: 'Indicadores do Brasil' },
    { p: 'Câmbio, juros, inflação, emprego e atividade, de fontes oficiais (Banco Central, IBGE e Banco Central Europeu como reserva), atualizados todo dia. Cada indicador mostra a **confiabilidade do dado** e a data de referência. Quando a fonte principal atrasa, o Axioma usa a reserva e avisa.' },
    { h2: 'Economia mundial' },
    { p: 'Petróleo Brent, crescimento e inflação mundial, **matérias-primas** que o Brasil mais exporta (soja, milho, café, minério, pelo FMI), **combustíveis nos postos** (ANP) e comércio exterior.' },
    { h2: 'Radar Global Axioma' },
    { p: 'Mudanças relevantes nos indicadores, percebidas automaticamente. Os eventos que afetam o seu setor são marcados com **"Mexe com o seu ramo"**. Clique num evento para a **leitura do José**: impacto no Brasil e no mundo, setores afetados, o que muda para uma empresa como a sua, cenários, o que fazer, riscos, oportunidades, confiança da leitura (e por quê) e o que pode mudar o quadro. O botão **Simular este evento na minha empresa** leva ao simulador.' },
    { h2: 'Central Nexus (notícias)' },
    { p: 'Manchetes por canal, inclusive **Reforma Tributária**, com link para a matéria completa e para a página oficial do Senado. Quando a notícia em tempo real não está disponível, a tela avisa que está em modo de demonstração.' },
    { h2: 'Painel executivo do José' },
    { p: 'Resumo diário de tudo o que mudou e o que fazer: **O Mundo**, **Brasil**, **Alertas**, **Riscos**, **Oportunidades**, horizontes de **12 meses, 3, 5 e 10 anos**, **O que você pode não estar vendo**, **O que o José faria**, de onde vieram os dados e os limites da análise. O primeiro do dia leva até 1 minuto e depois fica pronto para todos.' },
    { h2: 'Placar do José' },
    { p: 'O José faz previsões e o Axioma confere depois, no prazo. O placar mostra **acertos** e **erros**, sem esconder nada, e as previsões que ainda aguardam o prazo.' },
    { h2: 'Saúde das fontes' },
    { p: 'Mostra se cada fonte de dados está funcionando, com último sucesso, última falha e confiança. Fonte fora do ar tenta de novo em até 6 horas.' },

    { h1: 'Converse com o José' },
    { p: 'Chat em linguagem natural. A cada pergunta, o José recebe os indicadores oficiais, os eventos do Radar, as leituras já feitas e os números da sua empresa, e responde usando o **motor de inteligência mais avançado do Axioma**. Use **Nova conversa** para recomeçar.' },
    { h1: 'Plano do José para sua empresa' },
    { p: 'Pergunte como a empresa pode estar em um horizonte e o José monta um plano: indicadores atuais (receita, lucro, caixa, fôlego de caixa), **veredito**, onde a empresa está, o que a economia sinaliza, **sobrevivência**, **onde economizar**, **o que cortar**, **como crescer**, **metas de indicadores** e **gatilhos para vigiar**.' },
    { p: 'Os planos ficam salvos em **Meus planos salvos** por **90 dias**. O Axioma avisa antes de apagar; use **Salvar em PDF** para guardar por mais tempo.' },

    { h1: 'E se...? (Minhas Simulações)' },
    { numerada: [
      'Confira **Sua empresa hoje** (média dos últimos 12 meses de receitas, custos, dívidas e caixa).',
      'Em **O que muda na economia**, ajuste dólar, Selic, inflação, petróleo ou queda de vendas.',
      'Em **Quanto isso pega na sua empresa**, informe sua exposição (ex.: quanto do custo é importado).',
      'Escolha o horizonte e clique em **Simular**. O resultado mostra lucro e caixa contra hoje e por quantos meses o caixa dura.',
      'Clique em **O José explica** para entender o resultado, inclusive por que alguma parte não mudou.',
      'Dê um nome e **Salvar simulação**.',
    ] },
    { p: 'Simulações salvas podem ser **favoritadas**, **editadas**, **duplicadas**, **arquivadas** ou **excluídas**. As sem uso há 90 dias (e não favoritas) vão sozinhas para Arquivadas; nada é apagado automaticamente.' },
    { h1: 'Avisos em qualquer tela' },
    { p: 'Quando algo de impacto alto acontece, um aviso discreto aparece no canto enquanto você usa o Axioma. Ligue ou desligue em **Radar Global em qualquer tela**, no bloco "O que o Nexus faz por você".' },
  ],
}

export default doc
