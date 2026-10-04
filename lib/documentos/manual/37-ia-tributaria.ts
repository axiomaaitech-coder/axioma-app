// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '37 - IA Premium - IA Tributária.docx',
  titulo: 'Manual 37 — IA Tributária',
  subtitulo: 'Seu Consultor Fiscal Digital: simulação, economia e compliance',
  info: ['Menu: IA Premium → IA Tributária  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A IA Tributária mostra **quanto a empresa paga de imposto**, **se está no regime mais barato**, **quanto dá para economizar** e **como a Reforma Tributária vai afetar o negócio**. Tem um chat para tirar dúvidas fiscais com os dados reais da empresa.' },

    { h1: 'Regime atual' },
    { p: 'No topo aparece o regime tributário da empresa, com o botão para editar. Para o cálculo do Lucro Presumido ficar exato, confirme a **atividade**: **Serviços** (presunção 32%), **Comércio/Indústria** (8%) ou **Revenda de combustível** (1,6%), e o **ISS do município** (2% a 5%; padrão 5%). Sem confirmação, o Axioma presume Serviços e avisa.' },

    { h1: 'Como a inteligência funciona aqui' },
    { tabela: { colunas: ['Camada', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Cálculos do Axioma', 'Score Fiscal, Simulador de Regime, Carga Tributária, Economia, Reforma e Diagnóstico são **calculados por regras** com as alíquotas vigentes e os seus dados reais.'],
      ['Chat Fiscal (inteligência artificial)', 'Usa o **motor de inteligência mais avançado do Axioma**, com um retrato fiscal da empresa (regime, faturamento, impostos calculados, obrigações) enviado junto com a pergunta. A resposta é conferida antes de aparecer.'],
    ] } },
    { alerta: 'As regras da Reforma Tributária ainda estão em transição. O Axioma sempre informa a premissa e a data usadas em cada cálculo, e atualiza quando a regulamentação mudar.' },

    { h1: 'As abas' },
    { h2: '🛡️ Score Fiscal' },
    { p: 'Nota de adequação fiscal e compliance da empresa, com o que está bom e o que melhorar.' },
    { h2: '💬 Chat Fiscal' },
    { p: 'Pergunte sobre impostos, regime, DAS, notas, obrigações. Exemplos: "vale a pena sair do Simples?", "quanto vou pagar de imposto este mês?". **🗑️ Limpar** apaga o histórico.' },
    { h2: '🏛️ Simulador de Regime' },
    { p: 'Compara **Simples Nacional**, **Lucro Presumido** e **Lucro Real** com os seus dados reais. O mais barato aparece primeiro com a marca **MAIS BARATO**; o atual é marcado como **Atual**; regimes que a empresa não pode usar aparecem como **Inelegível**. Para cada um: imposto por mês e por ano, **alíquota efetiva** e **economia por ano** em relação ao atual.' },
    { h2: '📊 Carga Tributária' },
    { p: 'Quanto da receita vai para impostos e a **composição** (quais impostos).' },
    { h2: '💰 Economia' },
    { p: '**Economia mensal**, **Economia anual**, o **Regime ideal** e as **ações para economizar**.' },
    { h2: '🔔 Reforma 2026' },
    { p: 'Linha do tempo da transição para IBS/CBS (2026 a 2033) e os impactos no seu negócio, classificados como **Positivo**, **Neutro** ou **Atenção**.' },
    { h2: '📋 Diagnóstico' },
    { p: 'Parecer tributário completo, gerado a partir de todos os dados fiscais da empresa.' },
    { h2: '📅 Calendário' },
    { p: 'Atalho para as obrigações, que são geridas em **Empresa → Compliance & Fiscal** e no Calendário de Obrigações do módulo Fiscal.' },

    { h1: 'Compartilhar e exportar' },
    { p: '**📤 Compartilhar** abre o Centro de Compartilhamento e o **PDF Relatório**, útil para levar ao contador.' },
  ],
}

export default doc
