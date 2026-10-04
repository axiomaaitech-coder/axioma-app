// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '05 - MEI - DAS e Obrigações.docx',
  titulo: 'Manual 05 — DAS & Obrigações',
  subtitulo: 'Central de Obrigações — o calendário fiscal do MEI',
  info: ['Menu: MEI → DAS & Obrigações  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Esta tela organiza **todas as obrigações fiscais do MEI**: o DAS mensal, a declaração anual (DASN-SIMEI) e o Imposto de Renda da pessoa física. Ela mostra o que está em dia, o que está atrasado, quanto custa o atraso e ajuda a simular um parcelamento.' },

    { h1: 'As partes da tela' },
    { h2: 'Cards resumo' },
    { p: 'Mostram o valor do DAS, a situação (Em dia ou Atrasado) e a dívida atualizada, quando houver.' },

    { h2: 'Mapa de Consequências — DAS em Atraso' },
    { p: 'Só aparece quando existe DAS vencido e não pago. Mostra:' },
    { lista: [
      '**Dívida atualizada hoje** e quantos **dias em atraso** tem a competência mais antiga.',
      'Os dois cards de destaque: **Dívida atualizada hoje** e **Fase de risco**.',
      'Uma **linha do tempo** com os marcos: Vencimento → 61 dias (multa chega no teto de 20%) → 12 meses (CNPJ Inapto) → 24 meses (Dívida Ativa da União), com o "Hoje" marcado.',
      'A **bola de neve**: "Se não pagar, sua dívida vira..." projetando o valor futuro.',
      'O aviso de que o DAS em atraso suspende a contribuição: você perde tempo de aposentadoria e auxílio-doença no período.',
    ] },
    { nota: 'Os valores são uma estimativa pelas regras vigentes (multa de 0,33% ao dia até 20%, mais juros Selic). Não substituem o extrato oficial da Receita Federal.' },

    { h2: 'Simulador de Parcelamento (PGMEI)' },
    { p: 'Aparece quando há atraso. Arraste a barra **Número de parcelas** para ver o **Valor de cada parcela**. Avisos importantes:' },
    { lista: ['A 1ª parcela precisa ser paga para ativar o acordo.', '3 parcelas atrasadas cancelam o acordo e a dívida volta inteira, com juros.'] },
    { p: 'O botão **Abrir Portal do Simples Nacional (PGMEI)** leva ao site oficial para fazer o parcelamento.' },

    { h2: 'Análise Executiva Axioma' },
    { p: 'O botão **Analisar** pede à inteligência do Axioma uma explicação da sua situação de DAS e obrigações, com prioridades. Sem IA disponível, aparece uma análise por regras.' },

    { h2: 'Central de Obrigações' },
    { p: 'Lista as três obrigações do MEI, cada uma com prazo, status e botões:' },
    { tabela: { colunas: ['Obrigação', 'Prazo', 'O que você pode fazer'], larguras: [2400, 2600, 4026], linhas: [
      ['DAS mensal', 'Todo dia 20 (ou o dia configurado)', 'Ver o valor; ✏️ editar o valor do DAS (✓ salva, ✕ cancela); mudar o status (Pendente, Entregue, Atrasado) pelo lápis do status.'],
      ['DASN-SIMEI (Declaração Anual de Faturamento)', 'Até 31 de maio de cada ano', 'Mudar o status: Pendente, Entregue ou Atrasado.'],
      ['IRPF MEI', 'Até o prazo anual da Receita (normalmente 30 de abril/maio)', 'Mudar o status: Não obrigatório, Pendente ou Entregue. A tela avisa se a sua renda está acima do limite de isenção.'],
    ] } },
    { p: 'Cada obrigação mostra quantos dias faltam ou quantos dias está em atraso.' },

    { h2: 'Histórico do Ano' },
    { p: 'Grade com cada mês (competência) do ano e a situação do DAS. É a mesma lista usada no cálculo da dívida. Se ainda não há competência vencida, aparece "Ainda não há competência de DAS vencida este ano."' },

    { h2: 'Calculadora DASN-SIMEI' },
    { p: 'Mostra a **Receita Bruta** do ano e a **Categoria**, que são os números pedidos na declaração anual, e tem o botão **Abrir Portal DASN-SIMEI** para entregar a declaração no site oficial.' },

    { h1: 'Passo a passo: depois de pagar o DAS' },
    { numerada: ['Na Central de Obrigações, clique no lápis do status do DAS.', 'Escolha **Entregue**.', 'Pronto: aparece "Obrigação atualizada." e o score de saúde do MEI melhora.'] },
  ],
}

export default doc
