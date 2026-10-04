// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '09 - MEI - Imposto de Renda.docx',
  titulo: 'Manual 09 — Imposto de Renda MEI',
  subtitulo: 'Calcule e planeje o IRPF com dados reais e guarde seus comprovantes',
  info: ['Menu: MEI → Imposto de Renda  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Ajuda o dono do MEI a saber **se precisa declarar o Imposto de Renda da pessoa física**, **quanto deve pagar** e a **organizar os comprovantes** do ano em um lugar seguro.' },
    { nota: 'Os cálculos seguem a tabela progressiva do IRPF e as regras de isenção do MEI vigentes no ano indicado na tela.' },

    { h1: 'As partes da tela' },
    { h2: 'Situação da declaração' },
    { p: 'Um selo diz se a sua **Declaração é OBRIGATÓRIA** ou **não obrigatória**, com base na sua renda.' },
    { h2: 'Cards principais' },
    { p: '**IRPF estimado/ano** e **alíquota efetiva**.' },
    { h2: 'Resumo IRPF MEI (calculadora)' },
    { tabela: { colunas: ['Linha', 'O que é'], larguras: [3200, 5826], linhas: [
      ['Receita Bruta MEI', 'Faturamento do ano, vindo do módulo Faturamento.'],
      ['Parcela Isenta MEI', 'A parte do lucro do MEI que é isenta, conforme a atividade.'],
      ['Renda Tributável', 'O que entra no cálculo do imposto.'],
      ['Outra renda mensal (salário, aluguel etc.)', 'Campo para você informar outras rendas, que somam no cálculo.'],
    ] } },
    { h2: 'Análise Executiva Axioma' },
    { p: 'Botão **Analisar**: a IA explica a sua situação de IRPF e o que fazer.' },
    { h2: 'Tabela Progressiva IRPF' },
    { p: 'Mostra as faixas do imposto e destaca em qual você está.' },
    { h2: 'Checklist Declaração IRPF MEI' },
    { p: 'Lista clicável para marcar o que já foi feito, com contador de "itens concluídos":' },
    { lista: ['CNPJ MEI ativo e em dia com DAS', 'DASN-SIMEI declarada (receita bruta anual)', 'Comprovante de rendimentos MEI separado', 'Recibos e notas fiscais do ano organizados', 'Informes de outras fontes de renda (se houver)', 'Programa IRPF da Receita Federal instalado'] },
    { p: 'O botão **Acessar Receita Federal** abre o site oficial.' },
    { h2: 'Documentos Fiscais' },
    { p: 'Um arquivo privado (só você vê) para guardar comprovantes por ano.' },
    { numerada: [
      'Clique em **Escolher arquivo** (PDF ou imagem, até 10 MB).',
      'Escolha o **Tipo de documento**: Comprovante de Despesa, Recibo, Informe de Rendimento, Nota Fiscal, DAS Pago ou Outro.',
      'Escreva uma **Descrição** (opcional) e clique em **Enviar**.',
    ] },
    { p: 'Na lista, filtre por **Ano** e por **tipo**. Em cada documento: **Visualizar**, **Editar** (tipo e descrição) ou **Excluir**. A lista tem páginas. O quadro "Você já subiu o que o IRPF precisa?" mostra o que ainda falta.' },
    { alerta: 'Arquivos acima de 10 MB ou em formato diferente de PDF/imagem são recusados, com aviso na tela.' },
    { h2: 'Botões do cabeçalho' },
    { p: '**Exportar PDF** (gera o resumo do IRPF), **Compartilhar** e **Escuro / Tema Claro**.' },
  ],
}

export default doc
